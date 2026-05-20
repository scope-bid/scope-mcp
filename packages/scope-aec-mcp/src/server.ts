#!/usr/bin/env node
//
// @scope-bid/scope-aec-mcp - Scope's MCP server for AEC subcontractor
// vendor procurement.
//
// PREVIEW STATUS - V3 launches 2027.
//
// AEC = Architecture, Engineering, Construction. The plumbing layer for GC
// subcontractor procurement, where the existing market has bid-management
// (BuildingConnected), pre-qualification (ISN/Avetta/TradeTapp), and
// project management (Procore) as separate silos with no connection layer
// between them.
//
// Three preview tools - status, categories, waitlist - reserve the npm
// namespace and the MCP registry listing. Full dispatch tools land at
// v1.0.0 when V3 ships.

import { createScopeServer, startHttpGateway } from "@scope-bid/mcp-core";
import { z } from "zod";

const SERVER_VERSION = "1.0.0";

const server = createScopeServer({
  vertical: "aec",
  serverName: "scope-aec-mcp",
  serverVersion: SERVER_VERSION,
  includeCoreTools: false,
});

server.registerTool(
  {
    name: "scope_aec_status",
    description:
      "Returns the status and roadmap for Scope's AEC subcontractor procurement plumbing layer (V3). Useful for AI workflows that want to know whether GC subcontractor dispatch is live yet.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async () => ({
    vertical: "aec",
    status: "preview",
    expected_launch: "2027",
    headline:
      "Scope's vertical-MCP plumbing layer for AEC subcontractor procurement. Connects BuildingConnected, TradeTapp, ISN/Avetta, Procore, and myCOI - the cross-platform layer that doesn't exist today. Buyer: GC procurement / risk officer. Vendors: subcontractors and specialty trades.",
    v1_categories_planned: [
      "subcontractor-prequal",
      "specialty-trade-bid",
      "insurance-coi-tracking",
      "safety-compliance",
      "performance-bond-issuance",
    ],
    join_waitlist:
      "Use scope_aec_join_waitlist or sign up at scope-bid.vercel.app/founding-vendors",
    learn_more: "https://scope-bid.vercel.app/mcp/aec",
  }),
);

server.registerTool(
  {
    name: "scope_aec_categories",
    description:
      "List planned V3 service categories for Scope's AEC subcontractor procurement. These are the categories vendors and GCs can register for in the founding cohort.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async () => ({
    categories: [
      {
        slug: "subcontractor-prequal",
        label: "Subcontractor pre-qualification (cross-platform)",
        api_status: "ops_backed",
      },
      {
        slug: "specialty-trade-bid",
        label: "Specialty trade bid management (electrical, MEP, structural, etc.)",
        api_status: "mixed",
      },
      {
        slug: "insurance-coi-tracking",
        label: "Insurance certificate tracking (cross-vendor)",
        api_status: "api_native",
      },
      {
        slug: "safety-compliance",
        label: "Safety + compliance (RAVS, OSHA, project-specific)",
        api_status: "ops_backed",
      },
      {
        slug: "performance-bond-issuance",
        label: "Performance bond / surety issuance",
        api_status: "ops_backed",
      },
    ],
    note: "V3 launches 2027. Until then, this server returns category metadata only - no live dispatch yet. Pricing model in AEC is GC-side subscription, not per-sub like compliance-platform incumbents.",
  }),
);

const JoinWaitlistInput = z.object({
  email: z.string().email(),
  role: z.enum(["gc", "subcontractor", "developer", "owner", "lender", "other"]),
  organization: z.string().optional(),
  category_interest: z.string().optional(),
  notes: z.string().optional(),
});

server.registerTool(
  {
    name: "scope_aec_join_waitlist",
    description:
      "Register interest in Scope's V3 (AEC subcontractor procurement). For GCs, subcontractors, developers, or lenders who want early access to the cross-platform plumbing layer.",
    inputSchema: {
      type: "object",
      required: ["email", "role"],
      properties: {
        email: { type: "string", format: "email" },
        role: {
          type: "string",
          enum: ["gc", "subcontractor", "developer", "owner", "lender", "other"],
        },
        organization: { type: "string" },
        category_interest: { type: "string" },
        notes: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async (rawArgs) => {
    const args = JoinWaitlistInput.parse(rawArgs);
    return server.api.post("/api/waitlist", {
      email: args.email,
      feature: "scope-aec-v3",
      metadata: {
        role: args.role,
        organization: args.organization,
        category_interest: args.category_interest,
        notes: args.notes,
        source: "mcp-aec-server",
      },
    });
  },
);

//   npx @scope-bid/scope-aec-mcp           -> stdio (existing)
//   npx @scope-bid/scope-aec-mcp serve     -> HTTP gateway (added v1.0)

const cliArgs = process.argv.slice(2);
const subcommand = cliArgs[0];

if (subcommand === "serve") {
  const portFlagIdx = cliArgs.indexOf("--port");
  const portArg =
    portFlagIdx >= 0 && cliArgs[portFlagIdx + 1]
      ? Number(cliArgs[portFlagIdx + 1])
      : undefined;
  startHttpGateway({
    server,
    vertical: "aec",
    version: SERVER_VERSION,
    port: portArg,
  });
} else {
  server.start().catch((err: unknown) => {
    process.stderr.write(`[scope-aec-mcp] fatal: ${String(err)}\n`);
    process.exit(1);
  });
}
