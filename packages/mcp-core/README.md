# @scope-bid/mcp-core

> Shared core for Scope's vertical Model Context Protocol servers.

This package is **not used directly**. It's a dependency of every per-vertical Scope MCP server:

- [`@scope-bid/scope-mcp`](https://www.npmjs.com/package/@scope-bid/scope-mcp) - legal services (live)
- [`@scope-bid/scope-claims-mcp`](https://www.npmjs.com/package/@scope-bid/scope-claims-mcp) - insurance claims (preview)
- [`@scope-bid/scope-aec-mcp`](https://www.npmjs.com/package/@scope-bid/scope-aec-mcp) - architecture / engineering / construction (preview)

## What it does

- **`createScopeServer(config)`** - builds an MCP server with stdio transport, brand envelope, tool registration, and the auth/REST plumbing pre-wired.
- **`ScopeApiClient`** - typed REST client for the Scope backend.
- **`registerCoreTools(api)`** - returns the cross-vertical tools every vertical inherits: `scope_list_categories`, `scope_list_vendors`, `scope_dispatch_matter`, `scope_get_matter`, `scope_list_matters`.

Per-vertical packages import `createScopeServer`, optionally inherit the core tools, and layer their own tools on top.

## Usage in a vertical package

```typescript
import { createScopeServer } from "@scope-bid/mcp-core";

const server = createScopeServer({
  vertical: "legal",
  serverName: "scope-mcp-legal",
  serverVersion: "0.2.0",
});

// Register vertical-specific tools
server.registerTool(
  {
    name: "scope_book_deposition",
    description: "Book a deposition...",
    inputSchema: { ... },
  },
  async (args) => server.api.post("/api/depositions", args),
);

await server.start();
```

## License

MIT
