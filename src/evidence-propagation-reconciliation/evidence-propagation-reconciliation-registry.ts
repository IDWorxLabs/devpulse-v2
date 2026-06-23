/**
 * Evidence Propagation Reconciliation — registry (Phase 26.88).
 */

export const EVIDENCE_PROPAGATION_RECONCILIATION_PASS = 'EVIDENCE_PROPAGATION_RECONCILIATION_PASS';

export const EVIDENCE_PROPAGATION_RECONCILIATION_PHASE = '26.88';

export const EVIDENCE_PROPAGATION_RECONCILIATION_OPERATION = 'EVIDENCE_PROPAGATION_RECONCILIATION';

export const EVIDENCE_PROPAGATION_RECONCILIATION_CORE_QUESTION =
  'Can every authority consume the same runtime truth and produce the same launch reality verdict?';

export const EVIDENCE_PROPAGATION_RECONCILIATION_CACHE_KEY_PREFIX =
  'evidence-propagation-reconciliation-v1';

export const AUDITED_LAUNCH_AUTHORITIES = [
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
] as const;

export type AuditedLaunchAuthorityId = (typeof AUDITED_LAUNCH_AUTHORITIES)[number];

export const KNOWN_STALE_WORKSPACE_IDS = [
  'build-ready-idea-15',
  'world2-ws-4',
  'build-ready-idea-4',
  'build-ready-idea-10',
  'build-ready-idea-12',
  'build-ready-idea-14',
] as const;

export const EVIDENCE_PROPAGATION_RECONCILIATION_RULES = [
  'Rule 1 — full runtime chain proven: finalApplicationTruth=APPLICATION_PROVEN',
  'Rule 2 — authority verdict differs from authoritative runtime: rootCause=EVIDENCE_PROPAGATION_FAILURE',
  'Rule 3 — authority consumes stale workspace/run evidence: rootCause=STALE_EVIDENCE',
  'Rule 4 — all authorities aligned after reconciliation: authorityAgreement=true',
  'Rule 5 — launch readiness may not be blocked by stale proof paths alone',
] as const;

export const EVIDENCE_PROPAGATION_INTEGRATION_TARGETS = [
  'Runtime Materialization Truth Bridge',
  'Founder Truth Matrix Integration',
  'Founder Test Launch Readiness',
  'Founder Test Consistency Audit',
  'Autonomous Build Execution Proof',
] as const;

export const EVIDENCE_PROPAGATION_SAFETY_GUARANTEES = [
  'Read-only reconciliation — no scoring or product mutation',
  'No nested validator invocation from authority',
  'Runtime Materialization Truth Bridge is authoritative when full chain proven',
] as const;
