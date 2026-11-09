# Scope MCP gateway on Docker Compose

The simplest self-hosted deploy. Runs the Scope MCP gateway as a long-lived container built from this repo.

## Prerequisites

- Docker Engine 24+
- A `SCOPE_API_TOKEN` from the MCP API tokens section of your Scope settings (https://scope.bid/settings)

## Build the image

The gateway image is not published to a public registry. Build it from the repo root; the tag below is the one `docker-compose.yml` expects:

```bash
docker build -f packages/scope-mcp/Dockerfile -t scopebid/scope-mcp:1.0.0 .
```

## Deploy

```bash
export SCOPE_API_TOKEN=<your-token>
docker compose -f docker-compose.yml up -d
```

## Verify

```bash
curl http://localhost:8080/health
# -> {"status":"ok","vertical":"legal","version":"1.0.0",...}

curl -H "Authorization: Bearer $SCOPE_API_TOKEN" http://localhost:8080/mcp/v1/tools
# -> {"tools":[ ... ]}
```

## Rotate the token

```bash
# Update the env, then SIGHUP the container - no restart, no downtime.
docker compose exec scope-legal-gateway sh -c 'kill -HUP 1'
```

## Resource sizing

The defaults in `docker-compose.yml` fit the Small profile (under 100 dispatches/day). For higher volume bump `deploy.resources.limits`:

| Volume | CPU | Memory |
|---|---|---|
| Small (under 100/day) | 0.25 vCPU | 256 MB |
| Medium (100-1,000/day) | 0.5 vCPU | 512 MB |
| Large (1,000+/day) | 1 vCPU | 1 GB |

## Other verticals

For the claims or AEC preview servers, build the corresponding image from the repo root and set it as the `image` in `docker-compose.yml`:

```bash
docker build -f packages/scope-claims-mcp/Dockerfile -t scopebid/scope-claims-mcp:1.0.0 .
docker build -f packages/scope-aec-mcp/Dockerfile -t scopebid/scope-aec-mcp:1.0.0 .
```

Each runs on the same port and accepts the same env.

## Observability

- Logs: `docker compose logs -f scope-legal-gateway` (structured JSON per call)
- Metrics: `curl http://localhost:8080/metrics` (Prometheus format)
- Health: `curl http://localhost:8080/health`
- Readiness: `curl http://localhost:8080/ready`
