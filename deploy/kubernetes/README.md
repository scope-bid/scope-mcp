# Scope MCP gateway on Kubernetes

Production-shape deployment with 2 replicas, rolling updates, and readiness gating. Fits cleanly into any cluster (EKS, GKE, AKS, on-prem k8s).

## Prerequisites

- `kubectl` configured against your target cluster
- A `SCOPE_API_TOKEN` issued by Scope at enterprise onboarding

## Deploy

```bash
# Replace REPLACE_ME with your token, then apply.
sed -i.bak "s/REPLACE_ME/$SCOPE_API_TOKEN/" manifest.yaml
kubectl apply -f manifest.yaml
```

## Verify

```bash
kubectl -n scope-gateway get pods
kubectl -n scope-gateway port-forward svc/scope-legal-gateway 8080:8080 &
curl http://localhost:8080/health
```

## Rotate the token

```bash
# Update the secret, then SIGHUP the pods - no rolling restart needed.
kubectl -n scope-gateway create secret generic scope-api-token \
  --from-literal=SCOPE_API_TOKEN=<new-token> \
  --dry-run=client -o yaml | kubectl apply -f -

# Trigger SIGHUP in each pod to pick up the new env without restart.
# (For a rolling restart instead, use `kubectl rollout restart`.)
kubectl -n scope-gateway exec -it deploy/scope-legal-gateway -- kill -HUP 1
```

## Resource sizing

The manifest defaults to the Small profile (250m CPU / 256 MB memory request, 500m / 512 MB limit) per replica. Adjust `resources` in the Deployment for higher volume:

| Volume | CPU request | Memory request | CPU limit | Memory limit |
|---|---|---|---|---|
| Small (under 100/day) | 250m | 256Mi | 500m | 512Mi |
| Medium (100-1,000/day) | 500m | 512Mi | 1000m | 1Gi |
| Large (1,000+/day) | 1000m | 1Gi | 2000m | 2Gi |

## Other verticals

Duplicate the Deployment + Service blocks and swap the image:

- `scopebid/scope-claims-mcp:1.0.0`
- `scopebid/scope-aec-mcp:1.0.0`

## Network policies

The gateway makes a single outbound HTTPS connection to `scope.bid` (443/tcp). If your cluster runs a deny-all egress NetworkPolicy, add an allow rule for `scope.bid`. No inbound traffic from outside the cluster is required.
