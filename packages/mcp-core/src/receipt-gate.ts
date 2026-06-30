// Opt-in "Receipt Required" gate for irreversible dispatch.
//
// scope_dispatch_matter posts a budgeted matter to external vendors. Today the
// only precondition is an API-token check. This adds an OPTIONAL gate so an
// operator can additionally require a verifiable human-authorization receipt -
// proof that a named human accountably approved THIS exact dispatch - before the
// matter is posted.
//
// It is OFF by default. With no manifest configured the gate is a no-op and
// dispatch behaves byte-identically to before. An operator turns it on by
// pointing SCOPE_RECEIPT_MANIFEST at an EP-ACTION-RISK-MANIFEST JSON file that
// marks scope_dispatch_matter as receipt_required.
//
// Verification is offline Ed25519 over canonical JSON (no network, no EMILIA
// backend trusted). Reference implementation: @emilia-protocol/require-receipt
// (Apache-2.0). Spec: draft-schrock-ep-authorization-receipts. This is an
// accountability rail, NOT authentication or authorization.

import { readFileSync } from "node:fs";
import {
  makeReceiptGate,
  findActionRequirement,
  RECEIPT_REQUIRED_STATUS,
  type ReceiptGate,
  type ActionRiskManifest,
  type ActionRequirement,
} from "@emilia-protocol/require-receipt";

const MANIFEST_PATH = process.env.SCOPE_RECEIPT_MANIFEST ?? "";
// Comma-separated issuer SPKI keys (base64url DER) the operator trusts. When
// set, only receipts signed by these issuers verify. When unset, the gate falls
// back to the receipt's inline key (proves integrity, NOT issuer trust) so the
// rail can be exercised end-to-end before key pinning is wired up.
const TRUSTED_KEYS = (process.env.SCOPE_RECEIPT_TRUSTED_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

let cachedManifest: ActionRiskManifest | null | undefined;
function loadManifest(): ActionRiskManifest | null {
  if (cachedManifest !== undefined) return cachedManifest;
  if (!MANIFEST_PATH) {
    cachedManifest = null;
    return cachedManifest;
  }
  try {
    cachedManifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ActionRiskManifest;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `SCOPE_RECEIPT_MANIFEST is set to "${MANIFEST_PATH}" but could not be read: ${msg}`,
    );
  }
  return cachedManifest;
}

// One gate per action type (each keeps its own one-time-consumption store).
const gates = new Map<string, ReceiptGate>();
function gateFor(req: ActionRequirement): ReceiptGate {
  let gate = gates.get(req.action_type);
  if (!gate) {
    gate = makeReceiptGate({
      action: req.action_type,
      trustedKeys: TRUSTED_KEYS,
      // No pinned issuer keys yet -> accept the receipt's inline key so the rail
      // is usable immediately. Pin SCOPE_RECEIPT_TRUSTED_KEYS in production.
      allowInlineKey: TRUSTED_KEYS.length === 0,
      maxAgeSec: req.max_age_sec,
      statusCode: RECEIPT_REQUIRED_STATUS,
      manifestUrl: loadManifest()?.service?.manifest_url,
      assuranceClass: req.assurance_class,
      // store: pass a durable { has, add } for restart/multi-instance one-time use.
    });
    gates.set(req.action_type, gate);
  }
  return gate;
}

/**
 * Run `dispatch` behind the optional Receipt Required gate.
 *
 * - Gate OFF (no manifest, or this tool not marked receipt_required): runs
 *   `dispatch` directly - behavior is unchanged.
 * - Gate ON: requires a valid, fresh receipt bound to THIS dispatch (via
 *   `target`). The receipt is consumed only if `dispatch` succeeds, so a failed
 *   post never burns a valid approval. A missing/invalid receipt throws a
 *   machine-readable Receipt Required challenge instead of dispatching.
 *
 * @param tool     MCP tool name, e.g. "scope_dispatch_matter".
 * @param target   stable identity of the specific matter being dispatched, so a
 *                 receipt for one matter cannot authorize a different one.
 * @param receipt  the presented EP-RECEIPT-v1 document, or null/undefined.
 * @param dispatch the real side effect (posts the matter). MUST throw on failure.
 */
export async function withReceiptGate<T>(
  tool: string,
  target: unknown,
  receipt: unknown,
  dispatch: () => Promise<T>,
): Promise<T> {
  const manifest = loadManifest();
  const req = manifest
    ? findActionRequirement(manifest, { protocol: "mcp", tool })
    : null;

  // Not configured for receipts -> pass straight through (no behavior change).
  if (!req || !req.receipt_required) {
    return dispatch();
  }

  const r = await gateFor(req).run(receipt, { target }, async () => dispatch());
  if (r.ok) {
    return r.result as T;
  }

  const reason = r.body?.rejected?.reason ?? "missing_receipt";
  throw new Error(
    `scope_dispatch_matter requires a verifiable authorization receipt ` +
      `(${RECEIPT_REQUIRED_STATUS} Receipt Required: ${reason}). ` +
      `Obtain an EP-RECEIPT-v1 for this matter and resend it as the ` +
      `"emilia_receipt" argument. See ${manifest?.service?.manifest_url ?? "the action manifest"}.`,
  );
}
