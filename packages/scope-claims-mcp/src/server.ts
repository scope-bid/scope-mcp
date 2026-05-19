#!/usr/bin/env node
//
// @scope-bid/scope-claims-mcp - Scope's MCP server for insurance claims-side
// vendor procurement.
//
// PREVIEW STATUS - V2 launches Q3 2026.
//
// This package reserves the npm namespace and the MCP registry listing for
// Scope's V2 vertical (claims-side vendors: IMEs, IA firms, surveillance,
// vocational experts, life-care planners, defense panel counsel). It ships
// with three minimal tools:
//
//   - scope_claims_status:        what's planned, what's not yet live
//   - scope_claims_categories:    the V2 service categories
//   - scope_claims_join_waitlist: vendors and carriers can register
//                                  interest from inside any AI workflow
//
// When V2 launches, this package upgrades to v1.0.0 with the full
// dispatch/get/list tool set inherited from @scope-bid/mcp-core.

import { createScopeServer, startHttpGateway } from "@scope-bid/mcp-core";
import { z } from "zod";

const SERVER_VERSION = "0.1.0";

const server = createScopeServer({
  vertical: "claims",
  serverName: "scope-claims-mcp",
  serverVersion: SERVER_VERSION,
  // Don't inherit core tools yet - the claims backend isn't live
  includeCoreTools: false,
});

// ----------------------------------------------------------------------------
// Status tool - tells callers what's live and what's coming
// ----------------------------------------------------------------------------

server.registerTool(
  {
    name: "scope_claims_status",
    description:
      "Returns the status and roadmap for Scope's claims-side vendor procurement (V2). Useful for AI workflows that want to know whether IME / IA / surveillance dispatch is live yet.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async () => ({
    vertical: "claims",
    status: "preview",
    expected_launch: "Q3 2026",
    headline:
      "Scope's vertical-MCP plumbing layer for insurance claims-side vendor procurement. Buyer: carrier claim ops + corporate risk managers. Vendors: IMEs, IA firms, surveillance, vocational experts, life-care planners, defense panel counsel.",
    v1_categories_planned: [
      "independent-medical-exam",
      "independent-adjuster",
      "surveillance",
      "vocational-expert",
      "life-care-planner",
      "subrogation-recovery",
    ],
    join_waitlist:
      "Use scope_claims_join_waitlist or sign up at scope-bid.vercel.app/founding-vendors",
    learn_more: "https://scope-bid.vercel.app/mcp/claims",
  }),
);

// ----------------------------------------------------------------------------
// Categories tool - vertical-aware list (no API call, hard-coded for preview)
// ----------------------------------------------------------------------------

server.registerTool(
  {
    name: "scope_claims_categories",
    description:
      "List planned V2 service categories for Scope's claims-side vendor dispatch. These are the categories vendors can register for in the founding cohort.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async () => ({
    categories: [
      {
        slug: "independent-medical-exam",
        label: "Independent Medical Examination (IME)",
        api_status: "ops_backed",
      },
      {
        slug: "independent-adjuster",
        label: "Independent Adjuster (IA) - field, desk, CAT",
        api_status: "ops_backed",
      },
      {
        slug: "surveillance",
        label: "Surveillance investigations",
        api_status: "ops_backed",
      },
      {
        slug: "vocational-expert",
        label: "Vocational experts (work capacity, return-to-work)",
        api_status: "ops_backed",
      },
      {
        slug: "life-care-planner",
        label: "Life-care planners (catastrophic injury / future care cost)",
        api_status: "ops_backed",
      },
      {
        slug: "subrogation-recovery",
        label: "Subrogation recovery specialists",
        api_status: "ops_backed",
      },
    ],
    note: "V2 launches Q3 2026. Until then, this server returns category metadata only - no live dispatch yet.",
  }),
);

// ----------------------------------------------------------------------------
// Waitlist tool - actually useful, captures lead from inside an AI session
// ----------------------------------------------------------------------------

const JoinWaitlistInput = z.object({
  email: z.string().email(),
  role: z.enum(["vendor", "carrier", "tpa", "in-house", "other"]),
  organization: z.string().optional(),
  category_interest: z.string().optional(),
  notes: z.string().optional(),
});

server.registerTool(
  {
    name: "scope_claims_join_waitlist",
    description:
      "Register interest in Scope's V2 (insurance claims). For vendors who want to be in the founding cohort, or carriers / TPAs / corporate risk teams who want early access. Captured to the Scope waitlist.",
    inputSchema: {
      type: "object",
      required: ["email", "role"],
      properties: {
        email: { type: "string", format: "email" },
        role: {
          type: "string",
          enum: ["vendor", "carrier", "tpa", "in-house", "other"],
        },
        organization: { type: "string" },
        category_interest: {
          type: "string",
          description:
            "One of: independent-medical-exam, independent-adjuster, surveillance, vocational-expert, life-care-planner, subrogation-recovery",
        },
        notes: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async (rawArgs) => {
    const args = JoinWaitlistInput.parse(rawArgs);
    return server.api.post("/api/waitlist", {
      email: args.email,
      feature: "scope-claims-v2",
      metadata: {
        role: args.role,
        organization: args.organization,
        category_interest: args.category_interest,
        notes: args.notes,
        source: "mcp-claims-server",
      },
    });
  },
);

// ----------------------------------------------------------------------------
// Start
// ----------------------------------------------------------------------------
//
//   npx @scope-bid/scope-claims-mcp           -> stdio (existing)
//   npx @scope-bid/scope-claims-mcp serve     -> HTTP gateway (added v1.0)

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
    vertical: "claims",
    version: SERVER_VERSION,
    port: portArg,
  });
} else {
  server.start().catch((err: unknown) => {
    process.stderr.write(`[scope-claims-mcp] fatal: ${String(err)}\n`);
    process.exit(1);
  });
}
