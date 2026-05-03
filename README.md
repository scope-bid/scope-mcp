# Scope MCP - vertical-services MCP servers

> The first vertical-services Model Context Protocol implementation. One shared core, three per-vertical wrappers (legal live, claims and AEC in preview), all under the `@scope-bid` npm scope.

## Why this exists

[Anthropic launched the Claude Legal Plugin in February 2026](https://claude.com/plugins/legal). Major firms (Freshfields globally, LexisNexis as a partner) deployed AI legal assistants firmwide. Those tools generate content - contract review, NDA triage, drafting. **They cannot dispatch real-world work to real-world vendors.** They have no hands.

Scope is the layer that gives them hands. This monorepo houses the Model Context Protocol servers that connect any MCP-compatible AI workflow (Claude Desktop, Claude Code, Cursor, Claude Cowork, etc.) to Scope's vendor network.

## The vertical-MCP pattern

Each vertical gets its own npm package, MCP registry listing, and brand surface. They share a core library so the dispatch primitive is identical across verticals:

| Vertical | Package | Status | Launch |
|---|---|---|---|
| Legal services | [`@scope-bid/scope-mcp`](https://www.npmjs.com/package/@scope-bid/scope-mcp) | Live | May 2026 |
| Insurance claims | [`@scope-bid/scope-claims-mcp`](https://www.npmjs.com/package/@scope-bid/scope-claims-mcp) | Preview | Q3 2026 |
| AEC / construction | [`@scope-bid/scope-aec-mcp`](https://www.npmjs.com/package/@scope-bid/scope-aec-mcp) | Preview | 2027 |

Shared core: [`@scope-bid/mcp-core`](https://www.npmjs.com/package/@scope-bid/mcp-core).

## Repo layout

```
packages/
├── mcp-core/             Shared library: server framework, REST client, core tools
├── scope-mcp/            Legal services (live)
├── scope-claims-mcp/     Insurance claims (preview)
└── scope-aec-mcp/        AEC subcontractor procurement (preview)
```

## Install (any vertical)

Same 8-line config across the family:

```json
{
  "mcpServers": {
    "scope": {
      "command": "npx",
      "args": ["-y", "@scope-bid/scope-mcp"],
      "env": { "SCOPE_API_TOKEN": "scope_pk_..." }
    }
  }
}
```

Swap the package name (`scope-mcp` → `scope-claims-mcp` → `scope-aec-mcp`) for the other verticals.

## Development

```bash
npm install
npm run build  # builds all packages via npm workspaces
```

Each package has its own `package.json`, `tsconfig.json`, and `server.json` (for MCP registry).

## License

MIT
