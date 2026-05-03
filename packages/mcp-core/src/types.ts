// Shared types for @scope-bid/mcp-core

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export type ScopeApiConfig = {
  /** Base URL of the Scope backend. Defaults to https://scope-bid.vercel.app */
  apiBase?: string;
  /** Bearer token for write operations. Required for dispatch_matter and other writes. */
  apiToken?: string;
  /** Optional org slug to scope reads/writes to a specific buyer organization. */
  orgSlug?: string;
};

export type ScopeServerConfig = ScopeApiConfig & {
  /** The vertical this server represents - "legal", "claims", "aec", etc. */
  vertical: string;
  /** Display name shown in MCP client tool lists - "Scope (Legal)", "Scope (Claims)", etc. */
  serverName: string;
  /** Server version, typically read from package.json. */
  serverVersion: string;
  /**
   * Whether to register the cross-vertical core tools (list_categories,
   * list_vendors, dispatch_matter, get_matter, list_matters). Defaults to
   * true. Placeholder/preview servers may want to skip this.
   */
  includeCoreTools?: boolean;
};

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export type CoreToolName =
  | "scope_list_categories"
  | "scope_list_vendors"
  | "scope_dispatch_matter"
  | "scope_get_matter"
  | "scope_list_matters";

export type RegisteredTool = {
  definition: Tool;
  handler: ToolHandler;
};
