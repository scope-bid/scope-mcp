# @scope-bid/scope-claims-mcp

> Preview of Scope's open-source MCP server for claims-side professional procurement.

Listed in Anthropic's official MCP Registry at `bid.scope/claims`.

[Live demo](https://scope.bid) | [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) | [Platform](https://scope.bid)

## Install

```bash
npm install @scope-bid/scope-claims-mcp
```

Or connect via the official MCP Registry:

```
bid.scope/claims
```

## How it works

This package is the open-source SDK layer. The platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, and the platform answers.

## Tools

Claims is in preview. Neither this package nor the HTTP endpoint has live dispatch or award yet.

This package runs over stdio and serves:

- `scope_claims_status` - preview status
- `scope_claims_categories` - the planned claims categories
- `scope_claims_join_waitlist` - register interest from inside your AI
- `scope_reschedule_project` - move the date of an awarded work order that is not yet delivered (needs `SCOPE_API_TOKEN`)

The HTTP endpoint at `https://scope.bid/api/mcp/claims` serves a different set:

- `scope_claims_status` and `scope_claims_join_waitlist`
- for a signed-in firm, `scope_briefing` (a briefing on the firm's matters)
- for a signed-in firm, read-only reporting tools: `scope_roster_audit`, `scope_spend_rollup`, `scope_vendor_health`, `scope_credential_alerts`, `scope_get_dispatch_routing_state` and `scope_market_rate_compare`
- for a signed-in firm, the deliverable tools: `scope_list_deliverables_for_scope`, `scope_get_deliverable`, `scope_search_deliverables`, and `scope_send_deliverable`, which sends an existing deliverable to the recipients you name
- `scope_conflict_log` is listed but not available yet. It returns an empty result and is not a conflict check.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own platform authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

Preview. No live dispatch or award yet. See [Tools](#tools) for what this package and the HTTP endpoint serve today.

## License

Apache License 2.0. See LICENSE for the full text.

## Links

- Website: https://scope.bid
- MCP Registry: https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope
- npm: https://www.npmjs.com/package/@scope-bid/scope-claims-mcp
- GitHub org: https://github.com/scope-bid
- Press: https://scope.bid/press

## Built by

Jack Gillen. [@scope-bid](https://github.com/scope-bid) on GitHub. jack@scope.bid.
