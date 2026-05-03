// Cross-vertical core tools. Every vertical MCP server inherits these by
// default (unless config.includeCoreTools is false).
//
// These are vertical-AGNOSTIC - they work whether the vertical is legal,
// claims, AEC, or any future expansion. Vertical-specific tools (book
// deposition, dispatch IME, request prequal) live in the per-vertical
// packages.

import { z } from "zod";
import { ScopeApiClient } from "./api-client.js";
import type { RegisteredTool } from "./types.js";

const ListCategoriesInput = z.object({}).strict();

const ListVendorsInput = z
  .object({
    category_slug: z
      .string()
      .optional()
      .describe(
        "Service category slug to filter by (varies per vertical). Omit for all.",
      ),
    jurisdiction: z
      .string()
      .optional()
      .describe("Federal district or state code where applicable."),
    limit: z.number().int().min(1).max(50).optional().default(20),
  })
  .strict();

const DispatchMatterInput = z
  .object({
    title: z.string(),
    matter_type: z.string(),
    service_category: z.string(),
    jurisdictions: z.array(z.string()).optional(),
    description: z.string(),
    must_haves: z.array(z.string()).optional(),
    budget_min: z.number().optional(),
    budget_max: z.number().optional(),
    target_kickoff: z.string().optional(),
    bid_window_minutes: z
      .number()
      .int()
      .min(30)
      .max(60 * 24 * 7)
      .optional()
      .default(60 * 24 * 4),
  })
  .strict();

const GetMatterInput = z.object({ matter_id: z.string() }).strict();

const ListMattersInput = z
  .object({
    status: z
      .enum(["open", "awarded", "in_progress", "completed", "all"])
      .optional()
      .default("all"),
    limit: z.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

export function registerCoreTools(api: ScopeApiClient): RegisteredTool[] {
  return [
    {
      definition: {
        name: "scope_list_categories",
        description:
          "List the service categories Scope can dispatch matters to in this vertical. Each category has a slug, human label, and indicates whether vendors expose REST APIs (api_native) or are reached through Scope's ops-backed adapters (ops_backed).",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      handler: async (rawArgs) => {
        ListCategoriesInput.parse(rawArgs);
        return api.get("/api/industries/legal/categories");
      },
    },
    {
      definition: {
        name: "scope_list_vendors",
        description:
          "List Scope-verified vendors with their verified-reputation snapshot (on-time %, budget variance, rework rate, completed matters, satisfaction). Vendor names are returned only for authenticated callers; anonymous callers get anonymized labels.",
        inputSchema: {
          type: "object",
          properties: {
            category_slug: { type: "string" },
            jurisdiction: { type: "string" },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
          additionalProperties: false,
        },
      },
      handler: async (rawArgs) => {
        const args = ListVendorsInput.parse(rawArgs ?? {});
        const params = new URLSearchParams();
        if (args.category_slug) params.set("category", args.category_slug);
        if (args.jurisdiction) params.set("jurisdiction", args.jurisdiction);
        if (args.limit) params.set("limit", String(args.limit));
        const qs = params.toString();
        return api.get(`/api/vendors${qs ? `?${qs}` : ""}`);
      },
    },
    {
      definition: {
        name: "scope_dispatch_matter",
        description:
          "Post a new sealed-bid matter to Scope. Returns the matter id and status. Vendors in the matching category are notified; bids close after bid_window_minutes (default 4 days). Requires SCOPE_API_TOKEN. Use this when an AI workflow needs to engage a vendor on behalf of a buyer.",
        inputSchema: {
          type: "object",
          required: [
            "title",
            "matter_type",
            "service_category",
            "description",
          ],
          properties: {
            title: { type: "string" },
            matter_type: { type: "string" },
            service_category: { type: "string" },
            jurisdictions: { type: "array", items: { type: "string" } },
            description: { type: "string" },
            must_haves: { type: "array", items: { type: "string" } },
            budget_min: { type: "number" },
            budget_max: { type: "number" },
            target_kickoff: { type: "string" },
            bid_window_minutes: {
              type: "integer",
              minimum: 30,
              maximum: 10080,
              default: 5760,
            },
          },
          additionalProperties: false,
        },
      },
      handler: async (rawArgs) => {
        if (!api.hasAuth()) {
          throw new Error(
            "scope_dispatch_matter requires SCOPE_API_TOKEN. Generate one at scope-bid.vercel.app/settings.",
          );
        }
        const args = DispatchMatterInput.parse(rawArgs);
        return api.post("/api/scopes", {
          title: args.title,
          matter_type: args.matter_type,
          service_category: args.service_category,
          jurisdictions: args.jurisdictions ?? [],
          description: args.description,
          must_haves: args.must_haves ?? [],
          budget_min: args.budget_min,
          budget_max: args.budget_max,
          target_kickoff: args.target_kickoff,
          bid_window_minutes: args.bid_window_minutes,
          org_slug: api.getOrgSlug() || undefined,
        });
      },
    },
    {
      definition: {
        name: "scope_get_matter",
        description:
          "Look up a matter by its display id (e.g. SC-2041) or UUID. Returns scope details, bids received, award status, and any deliverables. For sealed matters, vendor names are anonymized in returned bids until the matter is awarded.",
        inputSchema: {
          type: "object",
          required: ["matter_id"],
          properties: { matter_id: { type: "string" } },
          additionalProperties: false,
        },
      },
      handler: async (rawArgs) => {
        const args = GetMatterInput.parse(rawArgs);
        return api.get(`/api/scopes/${encodeURIComponent(args.matter_id)}`);
      },
    },
    {
      definition: {
        name: "scope_list_matters",
        description:
          "List matters in flight for the calling buyer organization. Useful for status sweeps and pipeline reporting from inside an AI workflow.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["open", "awarded", "in_progress", "completed", "all"],
              default: "all",
            },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
          additionalProperties: false,
        },
      },
      handler: async (rawArgs) => {
        const args = ListMattersInput.parse(rawArgs ?? {});
        const params = new URLSearchParams();
        if (args.status && args.status !== "all") params.set("status", args.status);
        if (args.limit) params.set("limit", String(args.limit));
        const qs = params.toString();
        return api.get(`/api/scopes${qs ? `?${qs}` : ""}`);
      },
    },
  ];
}
