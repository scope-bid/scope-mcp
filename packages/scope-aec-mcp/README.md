# @scope-bid/scope-aec-mcp

> Open source MCP server for construction subcontractor procurement. Lets any MCP-compatible AI assistant (Claude, ChatGPT, Microsoft Copilot, Cursor, Cowork) engage AEC subcontractors at published prices, with a person on the GC side approving before anything commits.

Third of three vertical-services MCP servers from Scope. Listed in Anthropic's official MCP Registry at `bid.scope/aec`.

[Live demo](https://scope.bid) · [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) · [Platform](https://scope.bid)

## What it does

A general contractor or estimator types into their AI:

> "I need a concrete sub for the Houston warehouse project, 50k sf, June start."

Scope returns qualified subcontractors across the trade with prequal, bonding, safety and mobilize fields, at published prices, in seconds. A person on the GC side approves before anything commits. Once approved, the sub accepts, mobilizes, delivers. All inside the same AI conversation.

## Categories supported

Subcontractor dispatch (every trade), subcontractor prequalification (cross-platform: ISN, Avetta, TradeTapp, Veriforce), bonding capacity verification, certificate-of-insurance validation, OSHA / EMR safety record pull.

Categories not yet API-integrated are routed to verified partner subs with a 24-hour confirmation SLA.

## Install

```bash
npm install @scope-bid/scope-aec-mcp
```

Or connect via the official MCP Registry:

```
bid.scope/aec
```

## How it works

This package is the open-source SDK layer. The marketplace platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, the platform handles sub dispatch at published prices, human approval on every commitment, payment, and the audit trail.

The buyer (GC) pays a per-dispatch fee or a percentage of awarded contract value (industry-standard AEC pricing). Subs pay zero take rate. The pricing model matches AEC procurement convention rather than forcing the legal-vertical model onto construction.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own marketplace authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

Preview. V3 production launch 2027. Status / waitlist tools live; write tools (dispatch, award, payout) ship as part of the V3 production cutover. Cross-platform integrations with ISN, Avetta, TradeTapp, Veriforce, BuildingConnected, Procore on the roadmap.

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
