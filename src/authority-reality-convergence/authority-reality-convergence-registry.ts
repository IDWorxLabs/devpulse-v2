/**
 * Phase 27.00 — Authority Reality Convergence registry (V1).
 */

export const AUTHORITY_REALITY_CONVERGENCE_PASS = 'AUTHORITY_REALITY_CONVERGENCE_PASS';

export const AUTHORITY_REALITY_CONVERGENCE_PHASE = '27.00';

export const AUTHORITY_REALITY_CONVERGENCE_CORE_QUESTION =
  'Why do launch-critical authorities still disagree after execution proof source unification when disk evidence and runtime truth are aligned?';

export const AUTHORITY_REALITY_CONVERGENCE_CACHE_KEY_PREFIX = 'authority-reality-convergence-v1';

export const CONVERGENCE_RULES = [
  'Rule 1 — all launch-critical authorities must consume the same workspace, runId, manifestId, and proof timestamp',
  'Rule 2 — no authority may report missing artifacts when authoritative disk evidence shows missingArtifacts=0',
  'Rule 3 — stale proof, cached verdict, and stale report consumers are TESTING_INFRASTRUCTURE_DEFECT not REAL_PRODUCT_GAP',
  'Rule 4 — CHAT_CAPABILITY_ANSWER_QUALITY_PASS must propagate into Product Readiness Simulation',
  'Rule 5 — Founder Report, Truth Matrix, and Launch Readiness must consume converged evidence',
  'Rule 6 — launch blockers must reflect genuine product gaps only after convergence repair',
] as const;

export const LAUNCH_CRITICAL_AUTHORITY_TARGETS = [
  'CONNECTED_BUILD_EXECUTION',
  'CONNECTED_RUNTIME_ACTIVATION',
  'CONNECTED_PREVIEW_EXPERIENCE',
  'CONNECTED_VERIFICATION_EXECUTION',
  'CONNECTED_LAUNCH_READINESS',
  'FOUNDER_TRUTH_MATRIX',
  'FOUNDER_TEST_INTEGRATION',
] as const;

export type LaunchCriticalAuthorityId = (typeof LAUNCH_CRITICAL_AUTHORITY_TARGETS)[number];

export const LAUNCH_CRITICAL_DISPLAY_NAMES: Record<LaunchCriticalAuthorityId, string> = {
  CONNECTED_BUILD_EXECUTION: 'Connected Build Execution',
  CONNECTED_RUNTIME_ACTIVATION: 'Runtime Activation',
  CONNECTED_PREVIEW_EXPERIENCE: 'Preview Experience',
  CONNECTED_VERIFICATION_EXECUTION: 'Verification Execution',
  CONNECTED_LAUNCH_READINESS: 'Launch Readiness',
  FOUNDER_TRUTH_MATRIX: 'Truth Matrix',
  FOUNDER_TEST_INTEGRATION: 'Founder Report',
};

export const AUTHORITY_DISAGREEMENT_PATTERNS = [
  /EVIDENCE_PROPAGATION_FAILURE/i,
  /PROOF_STALE_VS_DISK/i,
  /ARTIFACTS_MISREPORTED_MISSING/i,
  /AUTHORITY_DISAGREEMENT/i,
  /missing artifacts/i,
  /NOT_PROVEN/i,
] as const;

export const STALE_CONSUMER_REPORT_PATTERNS = [
  /cached authority snapshot/i,
  /stale markdown report/i,
  /historical workspace/i,
  /historical founder run/i,
  /cached run/i,
] as const;

export const CONVERGENCE_INTEGRATION_TARGETS = [
  'Execution Proof Source Unification',
  'Build Materialization Truth Bridge',
  'Runtime Materialization Truth Bridge',
  'Chat Intelligence Scenario Consumption',
  'Founder Truth Matrix Integration',
  'Launch Readiness Reconciliation',
] as const;
