# @scope-bid/scope-claims-mcp

> Scope's MCP server for **insurance claims-side vendor procurement**. **Preview** - V2 launches Q3 2026.

Reserves the npm namespace and the MCP registry listing for Scope's V2 vertical: claims-side vendors (IMEs, IA firms, surveillance, vocational experts, life-care planners, defense panel counsel) sold to carrier claim ops + corporate risk managers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Preview-orange)](https://scope-bid.vercel.app/mcp/claims)

## Current tools (preview)

- `scope_claims_status` - returns roadmap, expected launch, planned categories
- `scope_claims_categories` - list of V2 service categories (IMEs, IA, surveillance, vocational, life-care, subrogation)
- `scope_claims_join_waitlist` - register interest from inside any AI workflow

## Install (preview)

```json
{
  "mcpServers": {
    "scope-claims": {
      "command": "npx",
      "args": ["-y", "@scope-bid/scope-claims-mcp"]
    }
  }
}
```

No token required for the preview tools. Full dispatch tools land at v1.0.0 when V2 ships.

## Roadmap

- **v0.1.0** (now) - preview: status, categories, waitlist
- **v1.0.0** (Q3 2026) - full dispatch with `scope_dispatch_ime`, `scope_dispatch_ia`, `scope_dispatch_surveillance`, plus inherited core tools
- **Sister packages**: `@scope-bid/scope-mcp` (legal, live), `@scope-bid/scope-aec-mcp` (AEC, preview)

## License

MIT
