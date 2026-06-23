/**
 * Phase 26.91 — Authority Evidence Source Realignment registry (V1).
 */

export const AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS =
  'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS';

export const AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PHASE = '26.91';

export const AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_OPERATION =
  'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT';

export const AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CORE_QUESTION =
  'Which authorities are still reading stale evidence instead of the authoritative runtime-proven workspace and runId?';

export const AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CACHE_KEY_PREFIX =
  'authority-evidence-source-realignment-v1';

export const REALIGNMENT_AUDITED_AUTHORITIES = [
  'AUTONOMOUS_BUILD_EXECUTION_PROOF',
  'FOUNDER_EXECUTION_PROOF',
  'FOUNDER_TRUTH_MATRIX',
  'LAUNCH_READINESS_PROOF',
  'LAUNCH_COUNCIL',
  'FOUNDER_ACCEPTANCE',
  'FOUNDER_REALITY',
  'LIVE_PREVIEW_REALITY',
  'VERIFICATION_REALITY',
  'PRODUCT_READINESS_SIMULATION',
  'FOUNDER_TEST_INTEGRATION',
  'CONNECTED_RUNTIME_ACTIVATION',
  'CONNECTED_PREVIEW_EXPERIENCE',
  'CONNECTED_VERIFICATION_EXECUTION',
  'CONNECTED_LAUNCH_READINESS',
  'EVIDENCE_PROPAGATION_RECONCILIATION',
] as const;

export type RealignmentAuditedAuthorityId = (typeof REALIGNMENT_AUDITED_AUTHORITIES)[number];

export const AUTHORITY_SOURCE_REALIGNMENT_RULES = [
  'Rule 1 — APPLICATION_PROVEN + stale workspace/run: classify STALE_EVIDENCE not REAL_PRODUCT_GAP',
  'Rule 2 — newest runtime-proven workspace is authoritativeWorkspace',
  'Rule 3 — newest founder-flow-delivered runId is authoritativeRunId',
  'Rule 4 — authorities may not consume older workspace/run/manifest/report when newer proof exists',
  'Rule 5 — launch blockers from stale evidence only become TESTING_INFRASTRUCTURE_DEFECT',
] as const;

export const TESTING_INFRASTRUCTURE_DEFECT = 'TESTING_INFRASTRUCTURE_DEFECT';

export const REALIGNMENT_INTEGRATION_TARGETS = [
  'Founder Truth Matrix',
  'Evidence Propagation Reconciliation',
  'Launch Council',
  'Launch Readiness',
  'Founder Test Integration',
  'Runtime Materialization Truth Bridge',
] as const;
