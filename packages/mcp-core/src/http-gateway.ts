// http-gateway.ts
//
// Shared HTTP transport for the per-vertical MCP packages. Turns a
// ScopeServerInstance (already populated with tools by the per-vertical
// entry point) into a stateless HTTP gateway that:
//
//   - POST /mcp/v1/tools/call    execute a tool call
//   - GET  /mcp/v1/tools         list available tools
//   - GET  /health               liveness probe (returns 200 + version)
//   - GET  /ready                readiness probe (200 after first
//                                successful upstream call)
//   - GET  /metrics              Prometheus-format metrics
//
// Architecture:
//
// The gateway is a thin proxy. Inbound HTTP requests carry a Bearer
// token that must match SCOPE_API_TOKEN (single-tenant deployment;
// the firm runs one gateway with one token). The gateway forwards
// the tool call to scope.bid/api/mcp/{vertical} using the same
// token. No state is kept beyond in-process counters for /metrics.
//
// Operational hooks:
//   - audit logging  (JSON line per tool call to stdout)
//   - SIGTERM        (graceful drain with 30s timeout)
//   - SIGHUP         (reload SCOPE_API_TOKEN from env without restart)
//
// Voice canon: ASCII hyphens only.

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import type { ScopeServerInstance } from "./server.js";

export interface HttpGatewayConfig {
  /** Server instance with tools already registered. */
  server: ScopeServerInstance;
  /** Vertical slug. Used for /metrics labels and upstream URL routing. */
  vertical: "legal" | "claims" | "aec";
  /** Package version string for the /health response. */
  version: string;
  /** Default 8080. Override via PORT env. */
  port?: number;
}

interface Metrics {
  toolCallsTotal: number;
  toolCallsByTool: Record<string, number>;
  errorsByStatus: Record<string, number>;
  latencyBuckets: number[]; // ms, sorted on read for percentile calc
  upstreamReady: boolean; // flips to true after first successful upstream call
}

function newMetrics(): Metrics {
  return {
    toolCallsTotal: 0,
    toolCallsByTool: {},
    errorsByStatus: {},
    latencyBuckets: [],
    upstreamReady: false,
  };
}

function recordLatency(m: Metrics, ms: number): void {
  // Cap the ring at 10k samples so memory doesn't grow unbounded for
  // a long-running gateway. We compute percentiles from the ring on
  // every /metrics scrape - cheap at this size.
  m.latencyBuckets.push(ms);
  if (m.latencyBuckets.length > 10_000) m.latencyBuckets.shift();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length),
  );
  return sorted[idx];
}

function maskToken(token: string): string {
  if (!token) return "(none)";
  if (token.length <= 4) return "****";
  return `****${token.slice(-4)}`;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      // Hard cap inbound body at 256 KB. The biggest tool calls in
      // scope.bid's surface (matter intake, dispatch description) sit
      // well under this.
      if (data.length > 256 * 1024) {
        reject(new Error("payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function jsonResponse(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function textResponse(
  res: ServerResponse,
  status: number,
  body: string,
  contentType = "text/plain; charset=utf-8",
): void {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

/**
 * Start the HTTP gateway. Returns the close function for graceful
 * shutdown. The default export from each per-vertical "serve" entry
 * point calls this with its own ScopeServerInstance.
 */
export function startHttpGateway(config: HttpGatewayConfig): () => Promise<void> {
  const { server, vertical, version } = config;
  const port = config.port ?? Number(process.env.PORT ?? 8080);
  const metrics = newMetrics();

  // Track in-flight requests so SIGTERM can drain cleanly.
  let inflight = 0;
  let shuttingDown = false;
  // Token is read at boot from the env. SIGHUP reloads it without a
  // restart so secrets can rotate in production without downtime.
  let currentToken = process.env.SCOPE_API_TOKEN ?? "";

  process.on("SIGHUP", () => {
    const next = process.env.SCOPE_API_TOKEN ?? "";
    if (next !== currentToken) {
      log("info", "token rotation on SIGHUP", { token: maskToken(next) });
      currentToken = next;
    }
  });

  function log(
    level: "info" | "warn" | "error",
    msg: string,
    extra: Record<string, unknown> = {},
  ): void {
    // Structured JSON to stdout. Customer's log aggregator scrapes
    // stdout (Datadog, Splunk, Cloudflare Logs, etc.).
    process.stdout.write(
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        msg,
        vertical,
        version,
        ...extra,
      }) + "\n",
    );
  }

  function requireAuth(req: IncomingMessage): { ok: boolean; reason?: string } {
    const auth = req.headers["authorization"];
    if (typeof auth !== "string" || !auth.startsWith("Bearer ")) {
      return { ok: false, reason: "missing bearer" };
    }
    const presented = auth.slice("Bearer ".length).trim();
    if (!currentToken) {
      return { ok: false, reason: "gateway has no SCOPE_API_TOKEN configured" };
    }
    if (presented !== currentToken) {
      return { ok: false, reason: "token mismatch" };
    }
    return { ok: true };
  }

  async function handleToolCall(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const startedAt = Date.now();
    let toolName = "unknown";

    const authCheck = requireAuth(req);
    if (!authCheck.ok) {
      log("warn", "auth failed", { reason: authCheck.reason });
      jsonResponse(res, 401, { error: authCheck.reason ?? "unauthorized" });
      return;
    }

    try {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      toolName = parsed.name ?? "unknown";

      // Find the matching tool on the server instance and execute via
      // the same handler the stdio transport uses. This is the
      // "stateless proxy" - the actual upstream HTTP call to
      // scope.bid happens inside the tool handler's ScopeApiClient.
      const result = await server.callTool(toolName, parsed.arguments ?? {});
      const latency = Date.now() - startedAt;

      metrics.toolCallsTotal += 1;
      metrics.toolCallsByTool[toolName] =
        (metrics.toolCallsByTool[toolName] ?? 0) + 1;
      recordLatency(metrics, latency);
      metrics.upstreamReady = true;

      log("info", "tool_call", {
        tool: toolName,
        token_suffix: maskToken(currentToken).slice(-4),
        upstream_status: 200,
        latency_ms: latency,
      });

      jsonResponse(res, 200, result);
    } catch (err) {
      const latency = Date.now() - startedAt;
      const statusMatch =
        err instanceof Error ? /\b(\d{3})\b/.exec(err.message) : null;
      const statusKey = statusMatch?.[1] ?? "5xx";
      metrics.errorsByStatus[statusKey] =
        (metrics.errorsByStatus[statusKey] ?? 0) + 1;
      recordLatency(metrics, latency);

      log("error", "tool_call_failed", {
        tool: toolName,
        upstream_status: statusKey,
        latency_ms: latency,
        error: err instanceof Error ? err.message : String(err),
      });

      // Preserve 429 + Retry-After semantics if the upstream returned
      // one. Surface to the calling agent verbatim so it can back off.
      const isRateLimit =
        err instanceof Error && /\b429\b/.test(err.message);
      if (isRateLimit) {
        res.writeHead(429, {
          "Content-Type": "application/json",
          "Retry-After": "60",
        });
        res.end(
          JSON.stringify({
            error: "rate limited by upstream",
            retry_after_seconds: 60,
          }),
        );
        return;
      }

      jsonResponse(res, 502, {
        error: err instanceof Error ? err.message : "upstream error",
      });
    }
  }

  function handleListTools(res: ServerResponse): void {
    jsonResponse(res, 200, { tools: server.listTools() });
  }

  function handleHealth(res: ServerResponse): void {
    jsonResponse(res, 200, {
      status: "ok",
      vertical,
      version,
      uptime_seconds: Math.floor(process.uptime()),
    });
  }

  function handleReady(res: ServerResponse): void {
    if (metrics.upstreamReady) {
      jsonResponse(res, 200, { status: "ready" });
    } else {
      jsonResponse(res, 503, {
        status: "not_ready",
        reason: "no successful upstream call yet",
      });
    }
  }

  function handleMetrics(res: ServerResponse): void {
    const sorted = [...metrics.latencyBuckets].sort((a, b) => a - b);
    const p50 = percentile(sorted, 50);
    const p95 = percentile(sorted, 95);
    const p99 = percentile(sorted, 99);

    const lines: string[] = [];
    lines.push(`# HELP scope_gateway_tool_calls_total Total tool calls received`);
    lines.push(`# TYPE scope_gateway_tool_calls_total counter`);
    lines.push(
      `scope_gateway_tool_calls_total{vertical="${vertical}"} ${metrics.toolCallsTotal}`,
    );
    for (const [tool, count] of Object.entries(metrics.toolCallsByTool)) {
      lines.push(
        `scope_gateway_tool_calls_by_tool{vertical="${vertical}",tool="${tool}"} ${count}`,
      );
    }

    lines.push(`# HELP scope_gateway_errors_total Errors bucketed by upstream status`);
    lines.push(`# TYPE scope_gateway_errors_total counter`);
    for (const [status, count] of Object.entries(metrics.errorsByStatus)) {
      lines.push(
        `scope_gateway_errors_total{vertical="${vertical}",status="${status}"} ${count}`,
      );
    }

    lines.push(`# HELP scope_gateway_latency_ms Tool call latency in milliseconds`);
    lines.push(`# TYPE scope_gateway_latency_ms summary`);
    lines.push(
      `scope_gateway_latency_ms{vertical="${vertical}",quantile="0.5"} ${p50}`,
    );
    lines.push(
      `scope_gateway_latency_ms{vertical="${vertical}",quantile="0.95"} ${p95}`,
    );
    lines.push(
      `scope_gateway_latency_ms{vertical="${vertical}",quantile="0.99"} ${p99}`,
    );

    textResponse(res, 200, lines.join("\n") + "\n", "text/plain; version=0.0.4");
  }

  const httpServer = createServer(async (req, res) => {
    if (shuttingDown) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "shutting down" }));
      return;
    }
    inflight += 1;
    try {
      const url = req.url ?? "/";
      const method = req.method ?? "GET";

      if (method === "POST" && url === "/mcp/v1/tools/call") {
        await handleToolCall(req, res);
      } else if (method === "GET" && url === "/mcp/v1/tools") {
        // Auth on list-tools too so we don't leak the tool inventory
        // to unauthenticated callers.
        const authCheck = requireAuth(req);
        if (!authCheck.ok) {
          jsonResponse(res, 401, { error: authCheck.reason ?? "unauthorized" });
        } else {
          handleListTools(res);
        }
      } else if (method === "GET" && url === "/health") {
        handleHealth(res);
      } else if (method === "GET" && url === "/ready") {
        handleReady(res);
      } else if (method === "GET" && url === "/metrics") {
        handleMetrics(res);
      } else {
        jsonResponse(res, 404, { error: "not found", path: url });
      }
    } finally {
      inflight -= 1;
    }
  });

  httpServer.listen(port, () => {
    log("info", "http_gateway_started", { port, vertical });
  });

  // SIGTERM: stop accepting new requests, drain in-flight, exit.
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    log("info", "shutdown_initiated", { inflight });

    // Stop accepting new connections.
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });

    // Wait up to 30 seconds for in-flight requests to drain.
    const drainStart = Date.now();
    while (inflight > 0 && Date.now() - drainStart < 30_000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    log("info", "shutdown_complete", {
      remaining_inflight: inflight,
      drained_ms: Date.now() - drainStart,
    });
  };

  process.on("SIGTERM", () => {
    shutdown().then(() => process.exit(0));
  });

  return shutdown;
}
