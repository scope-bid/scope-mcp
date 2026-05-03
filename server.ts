#!/usr/bin/env node
/**
 * Scope MCP server
 *
 * Exposes Scope's matter-dispatch and verified-reputation primitives as MCP
 * tools so any Claude-compatible AI workflow can dispatch litigation work to
 * legal-services vendors without writing per-vendor connectors.
 *
 * Tools shipped in V1:
 *   - scope_list_categories      List service categories (court reporting,
 *                                records retrieval, social media evidence,
 *                                eDiscovery, experts, etc.)
 *   - scope_list_vendors         List verified vendors, optionally filtered
 *                                by category. Returns the verified-reputation
 *                                snapshot for each.
 *   - scope_dispatch_matter      Post a new scope (sealed-bid request) to
 *                                the marketplace.
 *   - scope_get_matter           Look up a scope's status, bids, and award.
 *   - scope_list_matters         List matters in flight for the calling org.
 *
 * Transport: stdio (Claude Desktop, Claude Cowork local).
 *
 * Configuration: env vars
 *   SCOPE_API_BASE   default https://scope-bid.vercel.app
 *   SCOPE_API_TOKEN  required for write operations (dispatch_matter)
 *   SCOPE_ORG_SLUG   optional, scopes some reads to a specific buyer org
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------

const API_BASE = process.env.SCOPE_API_BASE ?? "https://scope-bid.vercel.app";
const API_TOKEN = process.env.SCOPE_API_TOKEN ?? "";
const ORG_SLUG = process.env.SCOPE_ORG_SLUG ?? "";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (API_TOKEN) h["Authorization"] = `Bearer ${API_TOKEN}`;
  return h;
}

async function api<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scope API ${method} ${path} -> ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// ----------------------------------------------------------------------------
// Tool schemas
// ----------------------------------------------------------------------------

const ListCategoriesInput = z.object({}).strict();

const ListVendorsInput = z
  .object({
    category_slug: z
      .string()
      .optional()
      .describe(
        "Service category slug to filter by (e.g. 'court-reporting', 'records-retrieval', 'social-media-evidence', 'ediscovery-managed-document-review'). Omit for all categories.",
      ),
    jurisdiction: z
      .string()
      .optional()
      .describe(
        "Federal district or state code to filter vendors who serve that jurisdiction (e.g. 'E.D. Pa.', 'CA').",
      ),
    limit: z.number().int().min(1).max(50).optional().default(20),
  })
  .strict();

const DispatchMatterInput = z
  .object({
    title: z.string().describe("Short matter title"),
    matter_type: z
      .string()
      .describe(
        "Matter type slug (e.g. 'plaintiff-personal-injury', 'mass-tort-mdl', 'insurance-defense-product-liability').",
      ),
    service_category: z
      .string()
      .describe(
        "Service category slug. Use scope_list_categories to discover valid values.",
      ),
    jurisdictions: z
      .array(z.string())
      .optional()
      .describe("Federal districts or state codes the work touches."),
    description: z
      .string()
      .describe(
        "Plain-English description of the work. Vendors see an anonymized version - firm and party names are redacted before bid.",
      ),
    must_haves: z
      .array(z.string())
      .optional()
      .describe("Required vendor capabilities or credentials."),
    budget_min: z.number().optional().describe("Budget floor in USD."),
    budget_max: z.number().optional().describe("Budget ceiling in USD."),
    target_kickoff: z
      .string()
      .optional()
      .describe(
        "When work should start. Plain English ('within 2 weeks') or ISO date.",
      ),
    bid_window_minutes: z
      .number()
      .int()
      .min(30)
      .max(60 * 24 * 7)
      .optional()
      .default(60 * 24 * 4)
      .describe(
        "How long bids stay open. Default 4 days. Set lower (30-120) for urgent dispatches like CAT-event records retrieval.",
      ),
  })
  .strict();

const GetMatterInput = z
  .object({
    matter_id: z
      .string()
      .describe(
        "Either the display id (e.g. 'SC-2041') or the UUID. Display id is preferred and is what humans see in the UI.",
      ),
  })
  .strict();

const ListMattersInput = z
  .object({
    status: z
      .enum(["open", "awarded", "in_progress", "completed", "all"])
      .optional()
      .default("all"),
    limit: z.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

// ----------------------------------------------------------------------------
// Tool registration
// ----------------------------------------------------------------------------

const TOOLS: Tool[] = [
  {
    name: "scope_list_categories",
    description:
      "List the legal-services categories Scope can dispatch matters to. Each category has a slug, human label, and an indicator of whether vendors expose REST APIs (api_native) or are reached through Scope's ops-backed adapters (ops_backed).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "scope_list_vendors",
    description:
      "List Scope-verified vendors. Each result includes verified-reputation metrics (on-time %, budget variance, rework rate, completed matters, satisfaction) and credentialing summary. Vendor names are returned only for verified callers; anonymous callers get anonymized labels.",
    inputSchema: {
      type: "object",
      properties: {
        category_slug: {
          type: "string",
          description:
            "Service category slug to filter by (e.g. 'court-reporting'). Omit for all.",
        },
        jurisdiction: {
          type: "string",
          description: "Federal district or state code.",
        },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "scope_dispatch_matter",
    description:
      "Post a new sealed-bid matter to Scope. Returns the matter id and status. Vendors in the matching category are notified; bids close after bid_window_minutes (default 4 days). Requires SCOPE_API_TOKEN. Use this when an AI workflow needs to engage a vendor on behalf of a firm - for example when a deposition notice arrives, when records retrieval is needed, or when a social media preservation request is triggered.",
    inputSchema: {
      type: "object",
      required: ["title", "matter_type", "service_category", "description"],
      properties: {
        title: { type: "string" },
        matter_type: { type: "string" },
        service_category: { type: "string" },
        jurisdictions: { type: "array", items: { type: "string" } },
        description: { type: "string" },
        must_haves: { type: "array", items: { type: "string" } },
        budget_min: { type: "number" },
        budget_max: { type: "number" },
        target_kickoff: { type: "string" },
        bid_window_minutes: {
          type: "integer",
          minimum: 30,
          maximum: 10080,
          default: 5760,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "scope_get_matter",
    description:
      "Look up a matter by its display id (e.g. SC-2041) or UUID. Returns scope details, bids received, award status, and any deliverables. For sealed matters, vendor names are anonymized in returned bids until the matter is awarded.",
    inputSchema: {
      type: "object",
      required: ["matter_id"],
      properties: {
        matter_id: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "scope_list_matters",
    description:
      "List matters in flight for the calling buyer organization. Useful for status sweeps and pipeline reporting from inside an AI workflow.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "awarded", "in_progress", "completed", "all"],
          default: "all",
        },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      additionalProperties: false,
    },
  },
];

// ----------------------------------------------------------------------------
// Tool implementations
// ----------------------------------------------------------------------------

async function listCategories() {
  // Hits the public industries endpoint which exposes service categories.
  const data = await api<{ categories: unknown[] }>("GET", "/api/industries/legal/categories");
  return data;
}

async function listVendors(args: z.infer<typeof ListVendorsInput>) {
  const params = new URLSearchParams();
  if (args.category_slug) params.set("category", args.category_slug);
  if (args.jurisdiction) params.set("jurisdiction", args.jurisdiction);
  if (args.limit) params.set("limit", String(args.limit));
  const qs = params.toString();
  return api<unknown>("GET", `/api/vendors${qs ? `?${qs}` : ""}`);
}

async function dispatchMatter(args: z.infer<typeof DispatchMatterInput>) {
  return api<unknown>("POST", "/api/scopes", {
    title: args.title,
    matter_type: args.matter_type,
    service_category: args.service_category,
    jurisdictions: args.jurisdictions ?? [],
    description: args.description,
    must_haves: args.must_haves ?? [],
    budget_min: args.budget_min,
    budget_max: args.budget_max,
    target_kickoff: args.target_kickoff,
    bid_window_minutes: args.bid_window_minutes,
    org_slug: ORG_SLUG || undefined,
  });
}

async function getMatter(args: z.infer<typeof GetMatterInput>) {
  return api<unknown>("GET", `/api/scopes/${encodeURIComponent(args.matter_id)}`);
}

async function listMatters(args: z.infer<typeof ListMattersInput>) {
  const params = new URLSearchParams();
  if (args.status && args.status !== "all") params.set("status", args.status);
  if (args.limit) params.set("limit", String(args.limit));
  const qs = params.toString();
  return api<unknown>("GET", `/api/scopes${qs ? `?${qs}` : ""}`);
}

// ----------------------------------------------------------------------------
// MCP wiring
// ----------------------------------------------------------------------------

const server = new Server(
  {
    name: "scope-bid",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: rawArgs } = req.params;
  try {
    let result: unknown;
    switch (name) {
      case "scope_list_categories":
        ListCategoriesInput.parse(rawArgs ?? {});
        result = await listCategories();
        break;
      case "scope_list_vendors":
        result = await listVendors(ListVendorsInput.parse(rawArgs ?? {}));
        break;
      case "scope_dispatch_matter":
        if (!API_TOKEN) {
          throw new Error(
            "scope_dispatch_matter requires SCOPE_API_TOKEN env var. Set it in your MCP server config.",
          );
        }
        result = await dispatchMatter(DispatchMatterInput.parse(rawArgs ?? {}));
        break;
      case "scope_get_matter":
        result = await getMatter(GetMatterInput.parse(rawArgs ?? {}));
        break;
      case "scope_list_matters":
        result = await listMatters(ListMattersInput.parse(rawArgs ?? {}));
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${msg}` }],
      isError: true,
    };
  }
});

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio transport blocks until the parent process closes the pipe.
  process.stderr.write(
    `[scope-mcp] connected. base=${API_BASE} org=${ORG_SLUG || "(none)"} auth=${API_TOKEN ? "present" : "missing"}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`[scope-mcp] fatal: ${String(err)}\n`);
  process.exit(1);
});
