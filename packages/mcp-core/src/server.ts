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
};

export function createScopeServer(config: ScopeServerConfig): ScopeServerInstance {
  const api = new ScopeApiClient(config);
  const tools: RegisteredTool[] = [];

  function registerTool(definition: Tool, handler: ToolHandler) {
    tools.push({ definition, handler });
  }

  // Register the cross-vertical core tools by default
  if (config.includeCoreTools !== false) {
    for (const t of registerCoreTools(api)) {
      tools.push(t);
    }
  }

  const server = new Server(
    {
      name: config.serverName,
      version: config.serverVersion,
    },
    {
      capabilities: { tools: {} },
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

  return { registerTool, start, api };
}
