# @scope-bid/scope-mcp

> Scope's MCP server for **legal services**. Dispatch litigation work to verified vendors (court reporters, records firms, expert witnesses, more) from Claude, Cursor, Harvey, Eve, or any MCP-compatible AI workflow.

The first vertical-services MCP server published anywhere. v0.2.0 is the namespace migration from the original release at [`@jackgillen15-dev/scope-mcp`](https://www.npmjs.com/package/@jackgillen15-dev/scope-mcp) - now under the official `@scope-bid` org with a shared core.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-2025--11--25-blue)](https://modelcontextprotocol.io/)

## Tools

Inherits 5 cross-vertical core tools from `@scope-bid/mcp-core`:

- `scope_list_categories` - service categories in legal
- `scope_list_vendors` - verified vendors with reputation
- `scope_dispatch_matter` - post a sealed-bid matter
- `scope_get_matter` - look up matter status
- `scope_list_matters` - in-flight matters for your org

Plus 2 legal-specific convenience tools:

- `scope_book_deposition` - structured depo booking, wraps dispatch with court-reporting category + 24h bid window
- `scope_request_records` - structured records-retrieval request, wraps dispatch with records-retrieval category + 48h bid window

## Install

```json
{
  "mcpServers": {
    "scope": {
      "command": "npx",
      "args": ["-y", "@scope-bid/scope-mcp"],
      "env": {
        "SCOPE_API_TOKEN": "scope_pk_paste_yours_here"
      }
    }
  }
}
```

Generate `SCOPE_API_TOKEN` at [scope-bid.vercel.app/settings](https://scope-bid.vercel.app/settings).

## Other verticals

Same install pattern across Scope's vertical-MCP family:

- `@scope-bid/scope-mcp` - legal (this package, live)
- `@scope-bid/scope-claims-mcp` - insurance claims (preview, V2 Q3 2026)
- `@scope-bid/scope-aec-mcp` - architecture/engineering/construction (preview, V3 2027)

## License

MIT
