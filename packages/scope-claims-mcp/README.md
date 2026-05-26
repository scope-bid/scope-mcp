# @scope-bid/scope-claims-mcp

> Open source MCP server for claims-side vendor procurement. Lets any MCP-compatible AI assistant (Claude, ChatGPT, Microsoft Copilot, Cursor, Cowork) dispatch claims vendors and return live anonymized quotes.

Second of three vertical-services MCP servers from Scope. Listed in Anthropic's official MCP Registry at `bid.scope/claims`.

[Live demo](https://scope.bid) · [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) · [Platform](https://scope.bid)

## What it does

A claims adjuster or defense paralegal types into their AI:

> "I need an IME panel examiner for claimant John Doe in Phoenix, June 15."

Scope dispatches the request to integrated vendors across the category. Anonymized quotes come back in seconds. The buyer awards one. The vendor accepts, schedules the exam, delivers the report. All inside the same AI conversation.

Losing vendors see the anonymized winning bid amount, their delta, and the timeline gap if applicable. The winning vendor's identity is not disclosed.

## Categories supported

IME (independent medical exams), records retrieval, surveillance, vocational rehabilitation, life-care planning, defense medical record review.

Categories not yet API-integrated are routed to verified partner vendors with a 24-hour confirmation SLA. HIPAA BAA required per vendor at claims-onboarding.

## Install

```bash
npm install @scope-bid/scope-claims-mcp
```

Or connect via the official MCP Registry:

```
bid.scope/claims
```

## How it works

This package is the open-source SDK layer. The marketplace platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, the platform handles vendor dispatch, the anonymized auction, payment via Stripe Connect, and the audit trail.

The buyer (carrier or defense firm) pays zero platform fees. Vendors compete on price for each dispatch. Scope's revenue is a take rate on awarded matters, paid by the awarded vendor.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own marketplace authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

Preview. V2 production launch Q3 2026. Status / waitlist tools live; write tools (dispatch, award, payout) ship as part of the V2 production cutover. HIPAA BAA infrastructure required for full production.

## License

License decision pending strategic review. Currently MIT per the published v1.0.1 release; see LICENSE.

## Links

- Website: https://scope.bid
- MCP Registry: https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope
- npm: https://www.npmjs.com/package/@scope-bid/scope-claims-mcp
- GitHub org: https://github.com/scope-bid
- Press: https://scope.bid/press

## Built by

Jack Gillen. [@scope-bid](https://github.com/scope-bid) on GitHub. jack@scope.bid.
