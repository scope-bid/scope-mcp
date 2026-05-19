# Scope MCP gateway on Modal

Serverless deploy on Modal. The gateway runs as a Modal web server, scales to zero when idle, warms back on first request.

## Prerequisites

- Modal account + `modal` CLI installed: `pip install modal`
- A `SCOPE_API_TOKEN` issued by Scope

## Deploy

```bash
# Create the secret holding your gateway token.
modal secret create scope-api-token SCOPE_API_TOKEN=<your-token>

# Deploy the app.
modal deploy app.py
```

The CLI prints the deployed URL. That URL is your gateway endpoint.

## Verify

```bash
curl https://<your-gateway-url>/health
```

## Resource sizing

The `app.py` defaults to 0.5 vCPU / 512 MB. Bump `cpu` and `memory` in the `@app.function` decorator for higher volume.

## Rotate the token

```bash
modal secret create scope-api-token SCOPE_API_TOKEN=<new-token>
modal deploy app.py  # picks up the new secret on next cold start
```

For zero-downtime rotation use SIGHUP via a Modal exec into the running container.

## Other verticals

Swap `@scope-bid/scope-mcp` in `app.py` for:

- `@scope-bid/scope-claims-mcp`
- `@scope-bid/scope-aec-mcp`
