# @scope-bid/scope-mcp

> Open source MCP server for legal vendor procurement. Lets any MCP-compatible AI assistant (Claude, ChatGPT, Microsoft Copilot, Cursor, Cowork) engage legal professionals at their published rate-card prices. An award waits for a person at the firm to approve it unless the firm has set up a pre-authorization that covers it, in which case it commits within that pre-authorization's limits.

First vertical-services MCP server published to Anthropic's official MCP Registry. Live since 2026-05-03 at `bid.scope/legal`.

[Live demo](https://scope.bid) · [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) · [Platform](https://scope.bid)

## What it does

A lawyer or paralegal types into their AI:

> "I need a court reporter for the Sarah Chen deposition on June 15 at our Oakland office. Plaintiff PI matter."

Scope returns the standing rate-card prices of credentialed professionals in the category, under their own names, in seconds. A dispatch waits for a person at the firm to approve it unless a pre-authorization the firm has set up covers it, in which case it commits within that pre-authorization's limits. Once approved, the professional accepts, mobilizes, delivers. All inside the same AI conversation.

## Categories supported

Process serving, court reporting, records retrieval, expert witnesses, IMEs, e-discovery, translation, mediators, trial graphics, deposition videography, court interpreters, legal staffing, ADR / arbitration coordinators, foreign-jurisdiction counsel.

Categories not yet API-integrated are routed to verified partner vendors with a 24-hour confirmation SLA.

## Install

```bash
npm install @scope-bid/scope-mcp
```

Or connect via the official MCP Registry:

```
bid.scope/legal
```

## How it works

This package is the open-source SDK layer. The platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, the platform handles dispatch at published rate-card prices, approval by a person at the firm on every commitment a pre-authorization does not cover, payment via Stripe Connect, and the audit trail.

The buyer (firm or in-house counsel) pays zero platform fees. Professionals publish their own prices - the same price no matter who is asking. Scope's revenue is a flat 10 percent on completed work, paid by the professional.

## What this package's tools cover

This package runs over stdio and carries its own, smaller tool set: matter dispatch (with quote-only pricing and adverse parties for the conflict gate), matter reads, the matter message thread, deposition booking, records requests and rescheduling. It has no award tool: to award a matter to a professional the firm picked, use the firm's Scope account or the HTTP transport at `https://scope.bid/api/mcp/legal`. Adverse parties are read when a new matter is created; a re-dispatch with `matter_id` does not take them.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own marketplace authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

In limited release. On the official Anthropic MCP Registry since 2026-05-03; the whole loop runs in demo today, and real dispatches are opening to design partner firms. Stripe Connect for payments. Rate-card pricing; a person at the firm approves every commitment a pre-authorization does not cover.

## License

Apache License 2.0. See LICENSE for the full text.

## Links

- Website: https://scope.bid
- MCP Registry: https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope
- npm: https://www.npmjs.com/package/@scope-bid/scope-mcp
- GitHub org: https://github.com/scope-bid
- Press: https://scope.bid/press

## Built by

Jack Gillen. [@scope-bid](https://github.com/scope-bid) on GitHub. jack@scope.bid.
