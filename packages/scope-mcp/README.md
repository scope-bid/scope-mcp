# @scope-bid/scope-mcp

> Open source MCP server for legal vendor procurement. Lets any MCP-compatible AI assistant (Claude, ChatGPT, Microsoft Copilot, Cursor, Cowork) dispatch legal vendors and return live anonymized quotes.

First vertical-services MCP server published to Anthropic's official MCP Registry. Live since 2026-05-03 at `bid.scope/legal`.

[Live demo](https://scope.bid) · [MCP Registry listing](https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope) · [Platform](https://scope.bid)

## What it does

A lawyer or paralegal types into their AI:

> "I need a court reporter for the Sarah Chen deposition on June 15 at our Oakland office. Plaintiff PI matter."

Scope dispatches the request to integrated vendors across the category. Anonymized quotes come back in seconds. The buyer awards one. The vendor accepts, mobilizes, delivers. All inside the same AI conversation.

Losing vendors see the anonymized winning bid amount, their delta, and the timeline gap if applicable. The winning vendor's identity is not disclosed.

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

This package is the open-source SDK layer. The marketplace platform is hosted at scope.bid (same pattern as Stripe SDKs talking to api.stripe.com). You connect the MCP server, your AI calls it, the platform handles vendor dispatch, the anonymized auction, payment via Stripe Connect, and the audit trail.

The buyer (firm or in-house counsel) pays zero platform fees. Vendors compete on price for each dispatch. Scope's revenue is a take rate on awarded matters, paid by the awarded vendor.

## Configuration

Most users connect this MCP server via their AI client's MCP configuration. No API key is required for the AI provider (you use the AI you already pay for). Scope manages its own marketplace authentication.

See the [scope.bid install guide](https://scope.bid/install) for the exact configuration steps for Claude, Cowork, ChatGPT, Microsoft Copilot, and Cursor.

## Status

Production. Live since 2026-05-03 on the official Anthropic MCP Registry. Stripe Connect for payments. Anonymized auction with post-award feedback to losing vendors.

## License

License decision pending strategic review. Currently MIT per the published v1.0.1 release; see LICENSE.

## Links

- Website: https://scope.bid
- MCP Registry: https://registry.modelcontextprotocol.io/v0/servers?search=bid.scope
- npm: https://www.npmjs.com/package/@scope-bid/scope-mcp
- GitHub org: https://github.com/scope-bid
- Press: https://scope.bid/press

## Built by

Jack Gillen. [@scope-bid](https://github.com/scope-bid) on GitHub. jack@scope.bid.
