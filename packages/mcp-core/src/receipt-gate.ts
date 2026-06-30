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
// set, only receipts signed by these issuers verify. This is the SECURE,
// production posture: pin the issuer key(s) you accept.
const TRUSTED_KEYS = (process.env.SCOPE_RECEIPT_TRUSTED_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
// Explicit, NON-PRODUCTION opt-in to accept a receipt's own inline key (proves
// integrity, NOT issuer trust). Off by default: a self-signed receipt is NOT
// accepted for this irreversible dispatch unless an operator deliberately turns
// this on for a demo/dev environment. Production should pin
// SCOPE_RECEIPT_TRUSTED_KEYS instead and leave this unset.
const ALLOW_INLINE_KEY = /^(1|true)$/i.test(
  process.env.SCOPE_RECEIPT_ALLOW_INLINE_KEY ?? "",
);
// Only advertise a manifest URL the deployment actually serves. Set
// SCOPE_RECEIPT_MANIFEST_URL to the served path (e.g.
// /.well-known/agent-actions.json) so the 428 challenge points agents at a real
// URL; if unset, no manifest URL is advertised (no dangling 404).
const MANIFEST_URL = (process.env.SCOPE_RECEIPT_MANIFEST_URL ?? "").trim() || undefined;

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
      // Secure by default: trust only pinned issuer keys. Inline (self-signed)
      // keys are accepted ONLY under the explicit non-production opt-in. A
      // misconfigured deployment (enforcement on, no trusted keys, no opt-in)
      // never reaches here - dispatch() fails closed before constructing a gate.
      trustedKeys: TRUSTED_KEYS,
      allowInlineKey: ALLOW_INLINE_KEY,
      maxAgeSec: req.max_age_sec,
      statusCode: RECEIPT_REQUIRED_STATUS,
      // Advertised only when the operator says the manifest is actually served.
      ...(MANIFEST_URL ? { manifestUrl: MANIFEST_URL } : {}),
      assuranceClass: req.assurance_class,
      // NOTE: the default one-time-consumption store is process-local
      // (in-memory). It does NOT survive a restart and does NOT span multiple
      // instances. For durable / multi-instance replay protection, pass a
      // durable { has, add } store here (Redis/DB).
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

  // FAIL CLOSED: enforcement is on for this irreversible dispatch but no issuer
  // key is trusted and inline keys are not explicitly opted in. Refuse rather
  // than run the dispatch under a self-signed (untrusted) receipt. Pin
  // SCOPE_RECEIPT_TRUSTED_KEYS (production), or set
  // SCOPE_RECEIPT_ALLOW_INLINE_KEY=1 for non-production demos only.
  if (TRUSTED_KEYS.length === 0 && !ALLOW_INLINE_KEY) {
    throw new Error(
      `scope_dispatch_matter receipt enforcement is misconfigured: ` +
        `Receipt Required is on but no trusted issuer key is pinned. ` +
        `Set SCOPE_RECEIPT_TRUSTED_KEYS to the issuer key(s) you trust, or ` +
        `SCOPE_RECEIPT_ALLOW_INLINE_KEY=1 for non-production demos only. ` +
        `Refusing to dispatch under an untrusted self-signed receipt.`,
    );
  }

  const r = await gateFor(req).run(receipt, { target }, async () => dispatch());
  if (r.ok) {
    return r.result as T;
  }

  const reason = r.body?.rejected?.reason ?? "missing_receipt";
  // Point at the manifest URL only if the operator advertised a served one;
  // otherwise refer to the action manifest generically (no dangling 404).
  throw new Error(
    `scope_dispatch_matter requires a verifiable authorization receipt ` +
      `(${RECEIPT_REQUIRED_STATUS} Receipt Required: ${reason}). ` +
      `Obtain an EP-RECEIPT-v1 for this matter and resend it as the ` +
      `"emilia_receipt" argument. See ${MANIFEST_URL ?? "the action manifest"}.`,
  );
}
