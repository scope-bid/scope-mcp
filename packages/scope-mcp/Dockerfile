# Dockerfile for @scope-bid/scope-mcp (HTTP gateway mode).
#
# Build context MUST be the repo root so the workspace dependency on
# @scope-bid/mcp-core resolves through the monorepo install:
#
#   cd /path/to/scope-mcp
#   docker build -f packages/scope-mcp/Dockerfile -t scopebid/scope-mcp:dev .
#
# Runtime config via env:
#   SCOPE_API_BASE   default https://scope.bid
#   SCOPE_API_TOKEN  required - inbound bearer must match this
#   SCOPE_ORG_SLUG   optional - pin to a specific buyer org
#   PORT             default 8080
#
# Inbound auth: clients present Authorization: Bearer <SCOPE_API_TOKEN>.
# Outbound: the gateway forwards the same token to scope.bid.

FROM node:20-alpine AS build
WORKDIR /repo

# Install root + workspace deps with the package-lock pinned.
COPY package.json package-lock.json ./
COPY packages/mcp-core/package.json ./packages/mcp-core/
COPY packages/scope-mcp/package.json ./packages/scope-mcp/
COPY packages/scope-claims-mcp/package.json ./packages/scope-claims-mcp/
COPY packages/scope-aec-mcp/package.json ./packages/scope-aec-mcp/
RUN npm ci

# Copy sources and build mcp-core first (per-vertical packages depend on it).
COPY packages/mcp-core ./packages/mcp-core
COPY packages/scope-mcp ./packages/scope-mcp
RUN npm run build --workspace=@scope-bid/mcp-core
RUN npm run build --workspace=@scope-bid/scope-mcp

FROM node:20-alpine AS production
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

# Production image carries the per-package dist + its node_modules tree.
# We copy from the repo root because the workspace install puts the
# linked mcp-core under packages/mcp-core/dist.
COPY --from=build /repo/packages/scope-mcp/package.json ./
COPY --from=build /repo/packages/scope-mcp/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/mcp-core/dist ./node_modules/@scope-bid/mcp-core/dist
COPY --from=build /repo/packages/mcp-core/package.json ./node_modules/@scope-bid/mcp-core/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
USER node
CMD ["node", "dist/server.js", "serve"]
