# Scope MCP gateway on Vercel

Serverless deploy on Vercel. The gateway runs as a Vercel Function. Good for firms already on Vercel for adjacent infrastructure.

## Prerequisites

- Vercel account + `vercel` CLI installed: `npm install -g vercel`
- A `SCOPE_API_TOKEN` issued by Scope

## Deploy

```bash
# From the repo root.
vercel link
vercel env add SCOPE_API_TOKEN production
# Paste the token when prompted.
vercel deploy --prod
```

The CLI prints the deployed URL. That URL is your gateway endpoint.

## Verify

```bash
curl https://<your-gateway-url>.vercel.app/health
```

## Rotate the token

```bash
vercel env rm SCOPE_API_TOKEN production
vercel env add SCOPE_API_TOKEN production
vercel deploy --prod
```

## Notes

- Vercel Functions have a 60-second timeout for hobby and 5-minute timeout for Pro/Enterprise. The gateway's tool calls typically complete in under 1 second, but if a downstream Scope call hits a long bid window, ensure your Vercel plan supports the right duration.
- For strict perimeter compliance, use the Docker Compose or Kubernetes template instead (gateway runs inside your own network).
