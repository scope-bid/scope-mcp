# Dockerfile for @scope-bid/scope-aec-mcp (HTTP gateway mode).
#
# See packages/scope-mcp/Dockerfile for the canonical reference. This
# file is identical except for the package name being built. Build
# from the repo root:
#
#   docker build -f packages/scope-aec-mcp/Dockerfile -t scopebid/scope-aec-mcp:dev .

FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/mcp-core/package.json ./packages/mcp-core/
COPY packages/scope-mcp/package.json ./packages/scope-mcp/
COPY packages/scope-claims-mcp/package.json ./packages/scope-claims-mcp/
COPY packages/scope-aec-mcp/package.json ./packages/scope-aec-mcp/
RUN npm ci

COPY packages/mcp-core ./packages/mcp-core
COPY packages/scope-aec-mcp ./packages/scope-aec-mcp
RUN npm run build --workspace=@scope-bid/mcp-core
RUN npm run build --workspace=@scope-bid/scope-aec-mcp

FROM node:20-alpine AS production
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=build /repo/packages/scope-aec-mcp/package.json ./
COPY --from=build /repo/packages/scope-aec-mcp/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/mcp-core/dist ./node_modules/@scope-bid/mcp-core/dist
COPY --from=build /repo/packages/mcp-core/package.json ./node_modules/@scope-bid/mcp-core/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
USER node
CMD ["node", "dist/server.js", "serve"]
