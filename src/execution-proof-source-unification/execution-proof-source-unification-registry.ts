/**
 * Phase 26.94 — Execution Proof Source Unification registry (V1).
 */

export const EXECUTION_PROOF_SOURCE_UNIFICATION_PASS = 'EXECUTION_PROOF_SOURCE_UNIFICATION_PASS';

export const EXECUTION_PROOF_SOURCE_UNIFICATION_PHASE = '26.94';

export const EXECUTION_PROOF_SOURCE_UNIFICATION_CORE_QUESTION =
  'Why are some authorities still consuming stale execution evidence after the authoritative runtime chain is proven?';

export const EXECUTION_PROOF_SOURCE_UNIFICATION_CACHE_KEY_PREFIX =
  'execution-proof-source-unification-v1';

export const TESTING_INFRASTRUCTURE_DEFECT = 'TESTING_INFRASTRUCTURE_DEFECT';

export const EXECUTION_PROOF_UNIFICATION_RULES = [
  'Rule 1 — APPLICATION_PROVEN requires all downstream authorities to consume authoritativeWorkspace and authoritativeRunId',
  'Rule 2 — authorities may not consume historical workspace, stale runId, or stale manifest when newer proof exists',
  'Rule 3 — stale-source verdict mismatch is TESTING_INFRASTRUCTURE_DEFECT not REAL_PRODUCT_GAP',
  'Rule 4 — only one authoritative execution chain per Founder Test run',
  'Rule 5 — launch readiness must not be blocked by stale execution sources alone',
] as const;

export const EXECUTION_PROOF_AUDIT_TARGETS = [
  'FOUNDER_TEST_INTEGRATION',
  'FOUNDER_EXECUTION_PROOF',
  'AUTONOMOUS_BUILD_EXECUTION_PROOF',
  'CONNECTED_BUILD_EXECUTION',
  'CONNECTED_RUNTIME_ACTIVATION',
  'CONNECTED_PREVIEW_EXPERIENCE',
  'CONNECTED_VERIFICATION_EXECUTION',
  'CONNECTED_LAUNCH_READINESS',
  'FOUNDER_TRUTH_MATRIX',
  'LAUNCH_COUNCIL',
] as const;

export type ExecutionProofAuditTargetId = (typeof EXECUTION_PROOF_AUDIT_TARGETS)[number];

export const KNOWN_STALE_EXECUTION_WORKSPACE_IDS = [
  'build-ready-idea-15',
  'build-ready-idea-21',
  'world2-ws-4',
  'build-ready-idea-4',
  'build-ready-idea-10',
  'build-ready-idea-12',
  'build-ready-idea-14',
] as const;

export const STALE_NOT_PROVEN_BLOCKER_PATTERNS = [
  /runtime not proven/i,
  /preview not proven/i,
  /build not proven/i,
  /build execution disconnected/i,
  /build_broken/i,
  /runtime_not_proven/i,
  /preview_not_proven/i,
  /missing artifacts/i,
  /not proven/i,
  /cannot run applications/i,
  /cannot build applications/i,
] as const;

export const UNIFICATION_INTEGRATION_TARGETS = [
  'Runtime Materialization Truth Bridge',
  'Evidence Propagation Reconciliation',
  'Authority Evidence Source Realignment',
  'Founder Truth Matrix',
  'Launch Readiness Reconciliation',
] as const;
