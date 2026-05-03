# @scope-bid/scope-aec-mcp

> Scope's MCP server for **AEC subcontractor vendor procurement**. **Preview** - V3 launches 2027.

Reserves the npm namespace and the MCP registry listing for Scope's V3 vertical: the cross-platform plumbing layer for general contractor subcontractor procurement. Connects BuildingConnected (bid management), TradeTapp + ISN/Avetta (pre-qualification), Procore (project management), and myCOI (insurance tracking) - the layer that doesn't exist between them today.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Preview-orange)](https://scope-bid.vercel.app/mcp/aec)

## Current tools (preview)

- `scope_aec_status` - returns roadmap, expected launch, planned categories
- `scope_aec_categories` - list of V3 service categories (subcontractor prequal, specialty trade bids, COI tracking, safety compliance, performance bonds)
- `scope_aec_join_waitlist` - register interest from inside any AI workflow

## Install (preview)

```json
{
  "mcpServers": {
    "scope-aec": {
      "command": "npx",
      "args": ["-y", "@scope-bid/scope-aec-mcp"]
    }
  }
}
```

No token required for preview tools. Full dispatch tools land at v1.0.0 when V3 ships.

## Roadmap

- **v0.1.0** (now) - preview: status, categories, waitlist
- **v1.0.0** (2027) - full GC-side subcontractor dispatch with cross-platform integration into Procore + BuildingConnected + ISN/Avetta + myCOI
- **Sister packages**: `@scope-bid/scope-mcp` (legal, live), `@scope-bid/scope-claims-mcp` (claims, preview)

## License

MIT
