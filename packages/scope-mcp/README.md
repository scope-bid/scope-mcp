# @scope-bid/scope-mcp

> Open source MCP server for legal vendor procurement. Lets any MCP-compatible AI assistant (Claude, ChatGPT, Microsoft Copilot, Cursor, Cowork) dispatch legal vendors and return live anonymized quotes.

First vertical-services MCP server published to Anthropic's official MCP Registry. Live since 2026-05-03 at `bid.scope/legal`.

[Live demo](https://scope.bid) · [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) · [Platform](https://scope.bid)

## What it does

A lawyer or paralegal types into their AI:

> "I need a court reporter for the Sarah Chen deposition on June 15 at our Oakland office. Plaintiff PI matter."

Scope returns the standing rate-card prices of credentialed professionals in the category, under their own names, in seconds. A person at the firm approves before anything commits - an agent-requested dispatch parks as a pending approval, and no firm setting removes that step. Once approved, the professional accepts, mobilizes, delivers. All inside the same AI conversation.

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

This package is the open-source SDK layer. The platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, the platform handles dispatch at published rate-card prices, human approval on every commitment, payment via Stripe Connect, and the audit trail.

The buyer (firm or in-house counsel) pays zero platform fees. Professionals publish their own prices - the same price no matter who is asking. Scope's revenue is a flat 10 percent on completed work, paid by the professional.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own marketplace authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

In limited release. On the official Anthropic MCP Registry since 2026-05-03; the whole loop runs in demo today, and real dispatches are opening to design partner firms. Stripe Connect for payments. Rate-card pricing with human approval on every commitment.

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
