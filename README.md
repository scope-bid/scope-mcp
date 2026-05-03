# Scope MCP Server

> **The Model Context Protocol server for Scope** - dispatch litigation work to legal-services vendors from Claude, Harvey, Eve, or any MCP-compatible AI workflow. The first vertical-services MCP for legal.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Version](https://img.shields.io/badge/MCP-2025--11--25-blue)](https://modelcontextprotocol.io/)

## What is Scope?

Scope is the dispatch and verified-reputation layer between law firms and the litigation vendors who do the work - court reporters, records retrieval firms, expert witnesses, process servers, mediators, eDiscovery providers. Half of these vendors expose APIs. The other half take phone calls and PDF emails. Scope unifies both, and exposes the result through this MCP server so any AI legal workflow can dispatch work natively.

Learn more: [scope-bid.vercel.app](https://scope-bid.vercel.app)

## What this server does

Once connected to Claude Desktop, Claude Code, Cursor, Claude Cowork, or any other MCP-compatible client, your AI assistant gains **five tools** for dispatching and tracking real-world legal-services work:

| Tool | Purpose |
|---|---|
| `scope_list_categories` | List Scope's service categories (court reporting, records retrieval, social media evidence, expert witness, etc.) and which are API-native vs ops-backed |
| `scope_list_vendors` | List verified vendors with verified-reputation snapshots (on-time %, budget variance, rework rate, completed matters, satisfaction) |
| `scope_dispatch_matter` | Post a sealed-bid matter to the network. Vendors are notified; bids close after the configured window |
| `scope_get_matter` | Look up a matter by display id (e.g. SC-2041) or UUID. Returns scope details, bids, award status |
| `scope_list_matters` | List matters in flight for the calling buyer organization |

## Example: dispatching a deposition from Claude

```
You: A deposition notice just came in for Smith v. Acme. Witness John Doe,
     scheduled for May 15 in San Diego, video and real-time required.
     Send this out to court reporters with verified track records in CA.

Claude (calls scope_dispatch_matter):
  title: "Deposition - John Doe - Smith v. Acme"
  service_category: "court-reporting"
  jurisdictions: ["CA"]
  description: "Witness deposition. Date: May 15. Location: San Diego.
                Video and real-time required. ~4 hours expected."
  bid_window_minutes: 60

Scope returns:
  matter_id: "SC-2089"
  status: "open"
  vendors_notified: 7
  bid_window_closes: "2026-05-04T17:30:00Z"

You: When the bids come in, summarize them with their reputation scores.

Claude (60 min later, calls scope_get_matter):
  ...4 sealed bids, names hidden until award, reputation snapshots side-by-side.
```

## Install

### Prerequisites

- Node.js 18 or newer
- A Scope account (sign up at [scope-bid.vercel.app/signup](https://scope-bid.vercel.app/signup))
- An MCP-compatible client - Claude Desktop, Claude Code, Cursor, or any client speaking [MCP 2025-11-25](https://modelcontextprotocol.io/specification)

### Build from source

```bash
git clone https://github.com/scope-bid/scope-mcp.git
cd scope-mcp
npm install
npm run build
```

This produces `dist/server.js`.

### Configure in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "scope": {
      "command": "node",
      "args": ["/absolute/path/to/scope-mcp/dist/server.js"],
      "env": {
        "SCOPE_API_BASE": "https://scope-bid.vercel.app",
        "SCOPE_API_TOKEN": "your-token-from-scope-bid",
        "SCOPE_ORG_SLUG": "your-org-slug"
      }
    }
  }
}
```

Restart Claude Desktop. The Scope tools should appear when you click the tools icon.

### Configure in Claude Code

Add an `.mcp.json` to your project root:

```json
{
  "mcpServers": {
    "scope": {
      "command": "node",
      "args": ["/absolute/path/to/scope-mcp/dist/server.js"],
      "env": {
        "SCOPE_API_BASE": "https://scope-bid.vercel.app",
        "SCOPE_API_TOKEN": "your-token-from-scope-bid"
      }
    }
  }
}
```

### Configure in Cursor

Cursor reads MCP servers from the same `.mcp.json` format. Add the file to your workspace root and restart Cursor.

## Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SCOPE_API_BASE` | No | `https://scope-bid.vercel.app` | Override for self-hosted Scope deployments |
| `SCOPE_API_TOKEN` | For write tools | - | Bearer token. Required for `scope_dispatch_matter`. Read-only tools work without it on demo matters. Generate at [scope-bid.vercel.app/settings](https://scope-bid.vercel.app/settings) |
| `SCOPE_ORG_SLUG` | No | - | Pin reads/writes to a specific buyer organization. Useful for multi-tenant deployments where one Scope account represents multiple firms |

## Roadmap

V1 ships these five tools. Coming next:

- `scope_get_vendor_reputation` - deep dive on a single vendor's verified track record
- `scope_award_matter` - award a matter to a chosen bidder
- `scope_attach_deliverable` - upload a transcript, record set, or report against a matter
- `scope_record_completion` - close out a matter (vendor-side) and trigger reputation recompute

Plus per-category specialized tools as Scope's V1 categories expand:

- `scope_book_deposition` (court reporting)
- `scope_request_records` (records retrieval)
- `scope_preserve_social_media` (social media evidence)
- `scope_retain_expert` (expert witnesses)

## Why MCP for legal services?

Anthropic shipped the Model Context Protocol in late 2024, and the Claude Legal Plugin in February 2026. The plugin handles content generation - contract review, NDA triage, drafting briefs. **It cannot dispatch real work to real vendors.** That's the gap this server fills.

The first vertical-services MCP for legal services is genuinely first-mover. As of May 2026, no MCP server has been published for any vertical-services industry (legal, AEC, healthcare, claims). Scope-as-MCP-for-legal is the opening shot.

## Development

```bash
npm run dev    # tsx hot-reload
npm run build  # compile to dist/
npm run start  # run compiled server
```

The server uses `stdio` transport (the default for local MCP clients). For remote/HTTP transport, see the [MCP HTTP transport spec](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http) - support coming in a future release.

## Contributing

This is a young project. Bug reports, feature requests, and PRs welcome. For larger changes, please open an issue first to discuss what you'd like to change.

## License

MIT - see [LICENSE](LICENSE).

## Contact

Built by [Jack Gillen](https://www.linkedin.com/in/jackgillen) for [Scope](https://scope-bid.vercel.app).

For Scope-account questions: [jack@scope.bid](mailto:jack@scope.bid)
For MCP server bugs: open a [GitHub issue](https://github.com/scope-bid/scope-mcp/issues).

---

**The work speaks.**
