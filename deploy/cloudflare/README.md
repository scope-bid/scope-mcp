# Scope MCP gateway on Cloudflare

Two deploy paths on Cloudflare depending on your network posture:

1. **Cloudflare Workers** (serverless, recommended for most): the gateway runs at Cloudflare's edge, the firm reaches it via a workers.dev subdomain or custom domain. Lowest ops overhead, no perimeter container.
2. **Cloudflare Tunnel + Workers Sandbox** (preserves perimeter): the gateway runs inside your network and Cloudflare Tunnel exposes it without inbound firewall rules. Use this when the gateway must demonstrably live inside your perimeter for compliance.

Most firms with strict network controls will want option 2.

## Prerequisites

- Cloudflare account with Workers (or Workers Sandbox for option 2)
- `wrangler` CLI installed: `npm install -g wrangler`
- A `SCOPE_API_TOKEN` from the MCP API tokens section of your Scope settings (https://scope.bid/settings)

## Option 1: Workers deploy

```bash
# Inject the token into Workers secrets.
wrangler secret put SCOPE_API_TOKEN

# Publish.
wrangler deploy
```

The `wrangler.toml` in this directory configures the gateway to serve on your Workers route.

## Option 2: Workers Sandbox + Cloudflare Tunnel

```bash
# Build the gateway image from the repo root (it is not published to a public registry).
docker build -f packages/scope-mcp/Dockerfile -t scopebid/scope-mcp:1.0.0 .

# Run the gateway container inside your network.
docker run -d --name scope-gateway \
  -p 8080:8080 \
  -e SCOPE_API_TOKEN=$SCOPE_API_TOKEN \
  scopebid/scope-mcp:1.0.0

# Set up a Cloudflare Tunnel to expose it without an inbound firewall rule.
cloudflared tunnel create scope-gateway
cloudflared tunnel route dns scope-gateway gateway.your-firm.com
cloudflared tunnel run --url http://localhost:8080 scope-gateway
```

Your AI assistant talks to `https://gateway.your-firm.com`, which Cloudflare Tunnel routes to the in-perimeter container over a reverse outbound connection. No inbound firewall rules.

## Verify

```bash
curl https://gateway.your-firm.com/health
```

## Notes

- Workers runtime requires the gateway code to fit Cloudflare's Workers limits. The Node.js HTTP server in `@scope-bid/scope-mcp serve` needs a small wrapper to run as a Worker. This repo does not include that wrapper, so option 1 needs one before `wrangler deploy` will serve requests.
- For tight integration with Anthropic Managed Agents tunnels, see `/docs/enterprise/self-hosted-mcp` on scope.bid.
