// Directory-required tool annotations, merged onto every tool definition
// at registration time (createScopeServer). The Claude Connectors
// Directory requires each tool to declare a title annotation plus
// readOnlyHint: true for read-only tools or an accurate destructiveHint
// for write tools.
//
// The intent-claiming tool DESCRIPTIONS shipped in v1.0.4 are locked and
// survive byte-identical: this map is keyed by tool name and merged next
// to the definition, never into it.
//
// Classification:
//   - Read tools:  readOnlyHint: true, no destructiveHint.
//   - Write tools: readOnlyHint: false plus an explicit destructiveHint.
//     Additive writes (dispatch, book, request, waitlist) are
//     destructiveHint: false; writes that overwrite or reverse existing
//     state (reschedule_project) are destructiveHint: true.

export type ScopeToolAnnotations = {
  title: string;
  readOnlyHint: boolean;
  destructiveHint?: boolean;
};

function read(title: string): ScopeToolAnnotations {
  return { title, readOnlyHint: true };
}

function writeAdditive(title: string): ScopeToolAnnotations {
  return { title, readOnlyHint: false, destructiveHint: false };
}

function writeDestructive(title: string): ScopeToolAnnotations {
  return { title, readOnlyHint: false, destructiveHint: true };
}

export const TOOL_ANNOTATIONS: Record<string, ScopeToolAnnotations> = {
  // Cross-vertical core tools (mcp-core)
  scope_list_categories: read("List service categories"),
  scope_list_vendors: read("List credentialed vendors"),
  scope_dispatch_matter: writeAdditive("Dispatch a matter to vendors"),
  scope_get_matter: read("Get matter status and quotes"),
  scope_list_matters: read("List the firm's matters"),

  // Shared per-vertical write
  scope_reschedule_project: writeDestructive("Reschedule a booked project"),

  // Legal vertical (@scope-bid/scope-mcp)
  scope_book_deposition: writeAdditive("Book a deposition"),
  scope_request_records: writeAdditive("Request records retrieval"),

  // Claims vertical (@scope-bid/scope-claims-mcp)
  scope_claims_status: read("Claims vertical status"),
  scope_claims_categories: read("List claims service categories"),
  scope_claims_join_waitlist: writeAdditive("Join the claims waitlist"),

  // AEC vertical (@scope-bid/scope-aec-mcp)
  scope_aec_status: read("AEC vertical status"),
  scope_aec_categories: read("List AEC trade categories"),
  scope_aec_join_waitlist: writeAdditive("Join the AEC waitlist"),
};

/**
 * Merge annotations onto a tool definition by name, leaving every other
 * field (including the locked v1.0.4 description) untouched. Definitions
 * with no entry pass through unchanged.
 */
export function annotateTool<T extends { name: string }>(definition: T): T {
  const annotations = TOOL_ANNOTATIONS[definition.name];
  if (!annotations) return definition;
  return { ...definition, annotations };
}
