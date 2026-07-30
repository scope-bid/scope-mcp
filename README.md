# @scope-bid/scope-mcp

**Hire your next vendor through your AI.**

Model Context Protocol servers for Scope.bid vendor dispatch across legal, insurance claims, and AEC services.

[scope.bid](https://scope.bid) | [MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) | [npm](https://www.npmjs.com/org/scope-bid) | [Plugin marketplace](https://github.com/scope-bid/scope-platform)

---

## What this is

Three Model Context Protocol servers that let AI assistants dispatch vendor requests to credentialed human vendors and receive bids back inside ten minutes.

- `@scope-bid/scope-mcp` - legal vertical (court reporters, IMEs, records, experts, e-discovery, translation, mediators, trial graphics, foreign-jurisdiction counsel, more)
- `@scope-bid/scope-claims-mcp` - insurance claims (IMEs, surveillance, peer review, voc rehab, life-care plans, defense medical record review)
- `@scope-bid/scope-aec-mcp` - AEC (subcontractor prequal, bonding, safety records, dispatch)

Scope.bid is the first vertical-services MCP platform on Anthropic's official Model Context Protocol Registry. Three namespaces are claimed under DNS-verified `bid.scope/*` (legal, claims, AEC). Two are reserved (healthcare, pharma).

**Scope.bid is not affiliated with scope-bid.com**, an unrelated laboratory equipment auction platform.

## Install

```bash
npm install -g @scope-bid/scope-mcp
npm install -g @scope-bid/scope-claims-mcp
npm install -g @scope-bid/scope-aec-mcp
```

For most clients you do not need to install globally. Use `npx -y @scope-bid/scope-mcp` directly from your MCP client config.

## Configure (Claude Desktop, Claude Code, Cursor)

```json
{
  "mcpServers": {
    "scope-legal": {
      "command": "npx",
      "args": ["-y", "@scope-bid/scope-mcp"],
      "env": {
        "SCOPE_API_TOKEN": "your-token-here"
      }
    },
    "scope-claims": {
      "command": "npx",
      "args": ["-y", "@scope-bid/scope-claims-mcp"],
      "env": {
        "SCOPE_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

For read-only demo usage the token is optional.

## Or use HTTP transport (no install)

```json
{
  "mcpServers": {
    "scope-legal": {
      "type": "http",
      "url": "https://scope.bid/api/mcp/legal",
      "headers": { "Authorization": "Bearer your-token-here" }
    }
  }
}
```

HTTP endpoints:
- https://scope.bid/api/mcp/legal
- https://scope.bid/api/mcp/claims
- https://scope.bid/api/mcp/aec

## Tools

**Legal** (`bid.scope/legal`):
- `scope_dispatch_matter` - send a matter to vendors and get live quotes
- `scope_briefing` - daily briefing across all open matters
- `scope_get_matter`, `scope_list_matters`, `scope_list_categories`, `scope_list_vendors`, `scope_list_roster`
- `scope_set_vendor_tier`, `scope_remove_from_roster`, `scope_award_matter`
- `scope_roster_audit`, `scope_vendor_health`, `scope_spend_rollup`, `scope_credential_alerts`
- `swp_clarify`, `swp_accept`, `swp_reject`, `swp_session_status` - Scope Work Protocol tools for existing negotiation sessions (the session-opening tools were retired at the rate-card cutover and are no longer served)

**Claims** (`bid.scope/claims`): IME routing, surveillance coordination, defense medical record review, life-care planning, voc rehab routing, roster audit, credential alerts.

**AEC** (`bid.scope/aec`): subcontractor dispatch, prequalification, bonding capacity, safety record pulls, AEC vendor listing.

## Environment variables

- `SCOPE_API_BASE` - override the default API base. Defaults to `https://scope.bid`.
- `SCOPE_API_TOKEN` - bearer token for write operations.
- `SCOPE_ORG_SLUG` - pin reads and writes to a specific buyer organization. Useful for multi-tenant deployments.

## Plugin marketplace alternative

If you want bundled slash commands and skills along with the MCP server registration, install the plugin marketplace instead:

```
/plugin marketplace add github.com/scope-bid/scope-platform
/plugin install scope-legal
```

## Evals

Five canonical scenarios protect against regressions in MCP tool behavior.

Run locally against mocks:

```bash
npm run eval
```

Run against the live Anthropic API with MCP tools attached:

```bash
npm run eval:live
```

Add a new scenario any time a tool or skill ships that creates a new failure mode. Fixtures live in `tests/evals/fixtures/`, mocked tool responses in `tests/evals/mocks/`, runner in `tests/evals/runner.ts`. CI runs the mocked harness on every PR via `.github/workflows/eval.yml`.

## Version bumps

When updating package.json version in any package directory, also update the matching server.json version. CI auto-syncs as a safety net but committed files should stay aligned for repo hygiene and local-publish testing.

## Company

Scope Bid, Inc. is a Delaware C-corp founded May 2026 by Jack Gillen. San Diego, CA. Patent pending.

LinkedIn: https://www.linkedin.com/company/scope-bid/
