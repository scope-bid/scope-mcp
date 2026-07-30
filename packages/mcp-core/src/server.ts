// Server framework: builds an MCP server with stdio transport, brand
// envelope, and tool-registration helpers. Per-vertical packages call
// createScopeServer() with their config, then register their own tools
// on top.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ScopeApiClient } from "./api-client.js";
import { annotateTool } from "./tool-annotations.js";
import { registerCoreTools } from "./tools.js";
import type {
  RegisteredTool,
  ScopeServerConfig,
  ToolHandler,
} from "./types.js";

export type ScopeServerInstance = {
  /** Add a vertical-specific tool. Call before start(). */
  registerTool: (definition: Tool, handler: ToolHandler) => void;
  /** Connect stdio transport and start handling requests. */
  start: () => Promise<void>;
  /** REST client; vertical packages can use it directly if needed. */
  api: ScopeApiClient;
  /** List registered tool definitions. Used by the HTTP gateway. */
  listTools: () => Tool[];
  /** Execute a tool by name. Used by the HTTP gateway transport. */
  callTool: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
};

export function createScopeServer(config: ScopeServerConfig): ScopeServerInstance {
  const api = new ScopeApiClient(config);
  const tools: RegisteredTool[] = [];

  // Single registration choke point: directory-required annotations
  // (title + readOnlyHint/destructiveHint) merge onto every definition
  // here, so per-vertical packages inherit them without code changes.
  // The locked v1.0.4 descriptions are never modified.
  function registerTool(definition: Tool, handler: ToolHandler) {
    tools.push({ definition: annotateTool(definition), handler });
  }

  // Register the cross-vertical core tools by default
  if (config.includeCoreTools !== false) {
    for (const t of registerCoreTools(api)) {
      tools.push({ definition: annotateTool(t.definition), handler: t.handler });
    }
  }

  // Instructions travel on initialize so a client knows the two facts
  // that govern every tool here before it calls one: nothing commits the
  // firm to payment without a person at the firm approving it, and a
  // demo token returns labeled sample data. Mirrors the HTTP transport's
  // initialize instructions so npm and HTTP tell the same story.
  const token = process.env.SCOPE_API_TOKEN ?? "";
  const demoMode = !token || token.startsWith("scope_pk_demo");
  const instructions = [
    demoMode
      ? "This Scope connection is running without a firm API token, so tools that read return representative sample data labeled as such, and nothing here dispatches real work, engages a professional, or moves money."
      : "This Scope connection uses the firm's API token.",
    "APPROVAL FLOOR: a dispatch or award requested through these tools never commits the firm to payment by itself. It parks as a pending approval and a person at the firm must approve it before any money is committed. No firm setting, threshold or policy removes that floor.",
    "PAYMENT: awards settle as a Stripe invoice issued to the firm when the matter completes. No card is captured and no payment method is collected inside this conversation.",
  ].join(" ");

  const server = new Server(
    {
      name: config.serverName,
      version: config.serverVersion,
    },
    {
      capabilities: { tools: {} },
      instructions,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: rawArgs } = req.params;
    const found = tools.find((t) => t.definition.name === name);
    if (!found) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      const result = await found.handler(
        (rawArgs as Record<string, unknown> | undefined) ?? {},
      );
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

  async function start() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write(
      `[${config.serverName}] connected. vertical=${config.vertical} ` +
        `version=${config.serverVersion} ` +
        `auth=${api.hasAuth() ? "present" : "missing"} ` +
        `org=${api.getOrgSlug() || "(none)"}\n`,
    );
  }

  function listTools(): Tool[] {
    return tools.map((t) => t.definition);
  }

  async function callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const found = tools.find((t) => t.definition.name === name);
    if (!found) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return await found.handler(args);
  }

  return { registerTool, start, api, listTools, callTool };
}
