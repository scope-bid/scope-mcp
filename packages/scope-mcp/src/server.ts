#!/usr/bin/env node
//
// @scope-bid/scope-mcp - Scope's MCP server for legal services.
//
// Imports the cross-vertical core (auth, REST client, base server) from
// @scope-bid/mcp-core and registers legal-specific tools on top.
//
// Configuration via env vars:
//   SCOPE_API_BASE   default https://scope-bid.vercel.app
//   SCOPE_API_TOKEN  required for write tools (dispatch_matter)
//   SCOPE_ORG_SLUG   optional, scopes reads/writes to a specific buyer org
//
// V1 categories: court reporting, records retrieval. Social media evidence,
// expert witness, process serving, trial graphics, ADR scheduling, and
// translation roll out as Scope's V1 cohort onboards.

import { createScopeServer } from "@scope-bid/mcp-core";
import { z } from "zod";

const SERVER_VERSION = "0.2.0";

const server = createScopeServer({
  vertical: "legal",
  serverName: "scope-mcp",
  serverVersion: SERVER_VERSION,
});

// ----------------------------------------------------------------------------
// Legal-specific tools (layered on top of the core dispatch primitives)
// ----------------------------------------------------------------------------

const BookDepositionInput = z.object({
  witness_name: z.string(),
  date: z.string().describe("ISO date or plain English ('next Tuesday')"),
  location: z.string().describe("City, state - or 'remote' for video-only"),
  duration_hours: z.number().min(0.5).max(12).optional().default(4),
  video_required: z.boolean().optional().default(true),
  realtime_required: z.boolean().optional().default(false),
  case_caption: z.string().optional(),
  jurisdictions: z.array(z.string()).optional(),
});

server.registerTool(
  {
    name: "scope_book_deposition",
    description:
      "Convenience tool for booking a deposition. Wraps scope_dispatch_matter with the court-reporting service category and structured deposition fields. Returns matter id and bid window.",
    inputSchema: {
      type: "object",
      required: ["witness_name", "date", "location"],
      properties: {
        witness_name: { type: "string" },
        date: { type: "string" },
        location: { type: "string" },
        duration_hours: { type: "number", minimum: 0.5, maximum: 12, default: 4 },
        video_required: { type: "boolean", default: true },
        realtime_required: { type: "boolean", default: false },
        case_caption: { type: "string" },
        jurisdictions: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  },
  async (rawArgs) => {
    const args = BookDepositionInput.parse(rawArgs);
    const description = [
      `Witness deposition. Witness: ${args.witness_name}.`,
      `Date: ${args.date}. Location: ${args.location}.`,
      `Duration: ~${args.duration_hours} hours.`,
      `Video: ${args.video_required ? "required" : "not required"}.`,
      `Real-time transcript: ${args.realtime_required ? "required" : "not required"}.`,
      args.case_caption ? `Case: ${args.case_caption}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return server.api.post("/api/scopes", {
      title: `Deposition - ${args.witness_name}${
        args.case_caption ? " - " + args.case_caption : ""
      }`,
      matter_type: "plaintiff-personal-injury",
      service_category: "court-reporting",
      jurisdictions: args.jurisdictions ?? [],
      description,
      must_haves: [
        ...(args.video_required ? ["video"] : []),
        ...(args.realtime_required ? ["real-time transcript"] : []),
      ],
      bid_window_minutes: 60 * 24, // 1-day window for time-sensitive depo bookings
      org_slug: server.api.getOrgSlug() || undefined,
    });
  },
);

const RequestRecordsInput = z.object({
  custodian_name: z.string().describe("Hospital, employer, school, or agency name"),
  custodian_type: z
    .enum(["medical", "employment", "school", "police", "pharmacy", "other"])
    .describe("Type of records being requested"),
  patient_or_subject_name: z.string(),
  date_range: z.string().describe("e.g. '2018-01-01 to 2024-12-31' or 'last 5 years'"),
  matter_type: z.string().optional().default("plaintiff-personal-injury"),
  jurisdiction: z.string().optional(),
});

server.registerTool(
  {
    name: "scope_request_records",
    description:
      "Convenience tool for ordering records retrieval. Wraps scope_dispatch_matter with the records-retrieval service category and structured custodian fields. Returns matter id and bid window.",
    inputSchema: {
      type: "object",
      required: [
        "custodian_name",
        "custodian_type",
        "patient_or_subject_name",
        "date_range",
      ],
      properties: {
        custodian_name: { type: "string" },
        custodian_type: {
          type: "string",
          enum: ["medical", "employment", "school", "police", "pharmacy", "other"],
        },
        patient_or_subject_name: { type: "string" },
        date_range: { type: "string" },
        matter_type: { type: "string", default: "plaintiff-personal-injury" },
        jurisdiction: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async (rawArgs) => {
    const args = RequestRecordsInput.parse(rawArgs);
    return server.api.post("/api/scopes", {
      title: `${args.custodian_type} records - ${args.patient_or_subject_name}`,
      matter_type: args.matter_type,
      service_category: "records-retrieval",
      jurisdictions: args.jurisdiction ? [args.jurisdiction] : [],
      description: `${args.custodian_type} records request. Custodian: ${args.custodian_name}. Subject: ${args.patient_or_subject_name}. Date range: ${args.date_range}.`,
      bid_window_minutes: 60 * 24 * 2, // 2-day window
      org_slug: server.api.getOrgSlug() || undefined,
    });
  },
);

// ----------------------------------------------------------------------------
// Start
// ----------------------------------------------------------------------------

server.start().catch((err: unknown) => {
  process.stderr.write(`[scope-mcp] fatal: ${String(err)}\n`);
  process.exit(1);
});
