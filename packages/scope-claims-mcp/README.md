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

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own platform authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

Preview. This package serves status, categories, waitlist and reschedule tools. Dispatch is not available yet.

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
