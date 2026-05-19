# Scope MCP gateway on Daytona

Daytona runs the gateway as a sandbox workspace, designed to plug into Anthropic Managed Agents tunnels.

## Prerequisites

- Daytona account + `daytona` CLI configured against your tenant
- A `SCOPE_API_TOKEN` issued by Scope

## Deploy

```bash
# Create the secret.
daytona secret create scope-api-token --from-literal=token=$SCOPE_API_TOKEN

# Apply the workspace snapshot.
daytona snapshot apply snapshot.yaml
```

## Verify

```bash
daytona workspace exec scope-mcp-gateway -- wget -qO- http://localhost:8080/health
```

## Connect to an Anthropic Managed Agent

Daytona workspaces expose an outbound tunnel endpoint. Use that endpoint URL when configuring your Anthropic Managed Agent's MCP server connection. The agent calls the workspace; the workspace forwards to scope.bid; bids return down the same path. No inbound firewall rules required on your side.

## Rotate the token

```bash
daytona secret update scope-api-token --from-literal=token=<new-token>
daytona workspace exec scope-mcp-gateway -- kill -HUP 1
```

## Resource sizing

Adjust `spec.resources` in `snapshot.yaml`:

| Volume | CPU | Memory |
|---|---|---|
| Small (under 100/day) | 0.25 | 256Mi |
| Medium (100-1,000/day) | 0.5 | 512Mi |
| Large (1,000+/day) | 1.0 | 1Gi |
