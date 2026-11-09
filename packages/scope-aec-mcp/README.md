# @scope-bid/scope-aec-mcp

> Preview of Scope's open-source MCP server for AEC subcontractor procurement.

Listed in Anthropic's official MCP Registry at `bid.scope/aec`.

[Live demo](https://scope.bid) | [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) | [Platform](https://scope.bid)

## Install

```bash
npm install @scope-bid/scope-aec-mcp
```

Or connect via the official MCP Registry:

```
bid.scope/aec
```

## How it works

This package is the open-source SDK layer. The platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, and the platform answers.

## Tools

AEC is in preview. Neither this package nor the HTTP endpoint has live dispatch or award yet.

This package runs over stdio and serves:

- `scope_aec_status` - preview status
- `scope_aec_categories` - the planned AEC categories
- `scope_aec_join_waitlist` - register interest from inside your AI
- `scope_reschedule_project` - move the date of an awarded work order that is not yet delivered (needs `SCOPE_API_TOKEN`)

The HTTP endpoint at `https://scope.bid/api/mcp/aec` serves a different set: `scope_aec_status`, `scope_aec_join_waitlist`, `scope_list_aec_categories`, `scope_list_aec_vendors`, `scope_dispatch_subcontractor`, `scope_award_subcontractor`, `scope_verify_prequal`, `scope_check_bonding`, `scope_pull_safety_record` and `scope_briefing`.

- In demo mode these tools answer with fictional sample data. Nothing is dispatched or awarded, and a demo waitlist entry is not saved.
- For a signed-in firm, only `scope_briefing` returns live data (a briefing on the firm's matters). The other tools return a preview notice.

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
- npm: https://www.npmjs.com/package/@scope-bid/scope-aec-mcp
- GitHub org: https://github.com/scope-bid
- Press: https://scope.bid/press

## Built by

Jack Gillen. [@scope-bid](https://github.com/scope-bid) on GitHub. jack@scope.bid.
