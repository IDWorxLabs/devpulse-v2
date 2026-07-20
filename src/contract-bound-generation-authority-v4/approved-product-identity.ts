/**
 * Contract-Bound Generation Authority V4 — Approved Product Identity handoff.
 *
 * Production Pipeline Constitution Adoption Phase 3 — Identity Computation Collapse V1.
 *
 * PPC-1207 "No Parallel Truth": a production fact may exist in exactly one authoritative form.
 * Product identity (the app title/display name every downstream stage renders/records) is that
 * fact. CBGA already owns identity repair (`CbgaRepairedGeneratorInputs.appTitle`, derived from
 * `CbgaSurfacePlan.titleRequirement`, which in turn derives from the approved canonical product
 * contract's `productIdentity` — see contract-surface-plan.ts). This module does not compute a new
 * identity and does not add a new authority: it packages CBGA's own already-repaired identity into
 * a single, typed, immutable handoff object every downstream production stage must consume instead
 * of independently parsing/inferring/splitting/re-deriving identity from the raw prompt.
 */

export const APPROVED_PRODUCT_IDENTITY_SOURCE = 'CBGA_REPAIRED_PLAN' as const;

/** PPC rules this handoff object exists to satisfy — see docs/production-pipeline-constitution-v1.md. */
export const APPROVED_PRODUCT_IDENTITY_PROVENANCE_RULE_IDS: readonly string[] = [
  'PPC-101',
  'PPC-201',
  'PPC-202',
  'PPC-401',
  'PPC-402',
  'PPC-1207',
  'PPC-1609',
  'PPC-1701',
  'PPC-1702',
  'PPC-1703',
];

/**
 * Every production stage this milestone collapses onto the approved identity. Not exhaustive of
 * every file that reads `displayName`/`appName` off an already-corrected build plan — it names the
 * stages that previously computed identity *independently* (see Identity Computation Collapse V1
 * root cause B in the constitution) and now consume this object instead.
 */
export const APPROVED_PRODUCT_IDENTITY_CONSUMERS: readonly string[] = [
  'UNIVERSAL_APP_BLUEPRINT_GENERATOR',
  'UNIVERSAL_APP_BLUEPRINT_PRODUCT_SURFACE',
  'MODULAR_FEATURE_ROUTER_GENERATOR',
  'MODULAR_FEATURE_MODULE_GENERATOR',
  'UNIVERSAL_FEATURE_CONTRACT_INTELLIGENCE',
  'GENERATED_APP_MANIFEST',
  'BUILD_MANIFEST',
  'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
  'FINAL_ENGINEERING_REPORT',
];

/**
 * The single authoritative product identity for a build, produced immediately after CBGA repair.
 * Immutable (readOnly + `immutable: true` marker) — no downstream stage may derive a different one.
 */
export interface ApprovedProductIdentity {
  readOnly: true;
  /** The canonical business identity/concept — CanonicalProductContract.productIdentity, unchanged by CBGA. */
  productIdentity: string;
  /** The CBGA-repaired app title/display name every generator must render. */
  displayName: string;
  /** Always CBGA_REPAIRED_PLAN — there is exactly one authoritative source. */
  source: typeof APPROVED_PRODUCT_IDENTITY_SOURCE;
  /** Constitutional rule IDs this object's existence/consumption satisfies. */
  provenanceRuleIds: readonly string[];
  /** The authority that produced and owns this identity. */
  owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4';
  /** Declared downstream consumers — documentation of intended collapse scope, not an access-control list. */
  consumers: readonly string[];
  /** Always true — this object must never be mutated once produced. */
  immutable: true;
  promptHash: string | null;
  buildId: string | null;
  generatedAt: string;
}

/**
 * Builds the approved identity handoff from a CBGA generation report. Never derives anything new:
 * every field is copied verbatim from CBGA's already-repaired output.
 */
export function buildApprovedProductIdentity(input: {
  contractProductIdentity: string;
  repairedAppTitle: string;
  promptHash?: string | null;
  buildId?: string | null;
}): ApprovedProductIdentity {
  return {
    readOnly: true,
    productIdentity: input.contractProductIdentity,
    displayName: input.repairedAppTitle,
    source: APPROVED_PRODUCT_IDENTITY_SOURCE,
    provenanceRuleIds: APPROVED_PRODUCT_IDENTITY_PROVENANCE_RULE_IDS,
    owningStage: 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4',
    consumers: APPROVED_PRODUCT_IDENTITY_CONSUMERS,
    immutable: true,
    promptHash: input.promptHash ?? null,
    buildId: input.buildId ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** True only for a structurally valid, non-blank approved identity. */
export function isApprovedProductIdentityValid(
  identity: ApprovedProductIdentity | null | undefined,
): identity is ApprovedProductIdentity {
  return Boolean(identity && identity.displayName.trim().length > 0 && identity.productIdentity.trim().length > 0);
}

/**
 * PPC-1207 enforcement point: downstream production stages must fail with a constitutional
 * violation rather than silently deriving a fallback identity when the approved identity is
 * missing or structurally invalid. Test-only/pre-contract call sites that intentionally omit the
 * approved identity must not call this — they keep their existing draft-derivation behavior.
 */
export function requireApprovedProductIdentity(
  identity: ApprovedProductIdentity | null | undefined,
  contextLabel: string,
): ApprovedProductIdentity {
  if (!isApprovedProductIdentityValid(identity)) {
    throw new Error(
      `CONSTITUTIONAL_VIOLATION_PPC_1207_NO_PARALLEL_TRUTH: ${contextLabel} was invoked downstream of Contract-Bound Generation Authority V4 without a valid approved product identity. Fallback/independent identity derivation is forbidden after CBGA repair.`,
    );
  }
  return identity;
}
