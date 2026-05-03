// @scope-bid/mcp-core
//
// Shared library that every Scope vertical MCP server depends on. Exposes:
//   - createScopeServer:  builds an MCP server with stdio transport, brand
//                         envelope, and the auth/API plumbing pre-wired
//   - ScopeApiClient:     REST client for the Scope backend (handles
//                         Bearer token auth, base URL config, error
//                         normalization)
//   - registerCoreTools:  registers the cross-vertical tools that every
//                         vertical MCP server inherits (list_categories,
//                         list_vendors, dispatch_matter, get_matter,
//                         list_matters)
//
// Per-vertical packages (scope-mcp, scope-claims-mcp, scope-aec-mcp) import
// this and layer on their own vertical-specific tools.

export { createScopeServer } from "./server.js";
export { ScopeApiClient } from "./api-client.js";
export { registerCoreTools } from "./tools.js";
export type {
  ScopeServerConfig,
  ScopeApiConfig,
  ToolHandler,
  CoreToolName,
} from "./types.js";
