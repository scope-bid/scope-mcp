# @scope-bid/scope-claims-mcp

> Open source MCP server for claims-side professional procurement. Lets any MCP-compatible AI assistant (Claude, ChatGPT, Microsoft Copilot, Cursor, Cowork) engage claims professionals at published rate-card prices.

Second of three vertical-services MCP servers from Scope. Listed in Anthropic's official MCP Registry at `bid.scope/claims`.

[Live demo](https://scope.bid) · [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) · [Platform](https://scope.bid)

## What it does

A claims adjuster or defense paralegal types into their AI:

> "I need an IME panel examiner for claimant John Doe in Phoenix, June 15."

Scope returns the standing rate-card prices of credentialed professionals in the category, under their own names, in seconds. The professional accepts, schedules the exam, delivers the report. All inside the same AI conversation.

## Categories supported

IME (independent medical exams), records retrieval, surveillance, vocational rehabilitation, life-care planning, defense medical record review.

HIPAA BAA required per professional at claims onboarding.

## Install

```bash
npm install @scope-bid/scope-claims-mcp
```

Or connect via the official MCP Registry:

```
bid.scope/claims
```

## How it works

This package is the open-source SDK layer. The platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, the platform handles dispatch at published rate-card prices, payment via Stripe Connect, and the audit trail.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own platform authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

Preview. V2 production launch Q3 2026. Status / waitlist tools live; write tools (dispatch, award, payout) ship as part of the V2 production cutover. HIPAA BAA infrastructure required for full production.

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
