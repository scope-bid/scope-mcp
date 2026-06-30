// Minimal ambient declarations for @emilia-protocol/require-receipt (Apache-2.0).
//
// The published package is plain ESM with no bundled types. We only consume a
// small, stable surface (the hardened gate + manifest helpers), so we declare
// exactly that here rather than pulling in a heavier dependency. Kept local to
// mcp-core so the rest of the monorepo never sees the untyped import.

declare module "@emilia-protocol/require-receipt" {
  /** HTTP status for a Receipt Required challenge (428). */
  export const RECEIPT_REQUIRED_STATUS: number;

  export type ActionRequirement = {
    id: string;
    action_type: string;
    receipt_required?: boolean;
    risk?: string;
    assurance_class?: string;
    max_age_sec?: number;
    [key: string]: unknown;
  };

  export type ActionRiskManifest = {
    "@version"?: string;
    service?: { name?: string; manifest_url?: string };
    actions?: ActionRequirement[];
  };

  /** Find the manifest entry that matches an action selector. */
  export function findActionRequirement(
    manifest: ActionRiskManifest,
    selector: { protocol?: string; tool?: string; id?: string; action_type?: string },
  ): ActionRequirement | null;

  export type GateOk = {
    ok: true;
    receiptId: string;
    outcome?: string;
    signer?: string;
    result: unknown;
  };

  export type GateRefusal = {
    ok: false;
    status: number;
    body: { rejected?: { reason: string }; [key: string]: unknown };
  };

  export type ReceiptGate = {
    run(
      receipt: unknown,
      ctx: { target?: unknown },
      fn: () => Promise<unknown>,
    ): Promise<GateOk | GateRefusal>;
  };

  export function makeReceiptGate(opts: {
    action: string | ((target: unknown) => string);
    trustedKeys?: string[];
    allowInlineKey?: boolean;
    maxAgeSec?: number;
    allowedOutcomes?: string[];
    statusCode?: number;
    manifestUrl?: string;
    assuranceClass?: string;
    store?: { has(id: string): boolean; add(id: string): void };
  }): ReceiptGate;
}
