/**
 * Phase 27.01 — Execution Proof Contradiction Elimination registry (V1).
 */

export const EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS =
  'EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS';

export const EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PHASE = '27.01';

export const EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CORE_QUESTION =
  'Which exact authority still emits stale BUILD/RUNTIME/PREVIEW/LAUNCH verdicts after authoritative evidence has converged?';

export const EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CACHE_KEY_PREFIX =
  'execution-proof-contradiction-elimination-v1';

export const TESTING_INFRASTRUCTURE_DEFECT = 'TESTING_INFRASTRUCTURE_DEFECT';

export const CONTRADICTION_ELIMINATION_RULES = [
  'Rule 1 — APPLICATION_PROVEN + aligned workspace/runId/manifest + missingArtifacts=0 requires PROVEN downstream verdicts',
  'Rule 2 — PARTIAL/NOT_PROVEN/BLOCKED after convergence is a contradiction unless newer contradictory evidence exists',
  'Rule 3 — contradictions with authoritative execution proof reclassify as TESTING_INFRASTRUCTURE_DEFECT',
  'Rule 4 — REAL_PRODUCT_GAP only when contradictory authority provides newer evidence than the authoritative chain',
  'Rule 5 — every launch-critical authority must be traced with sourceFile and sourceChain',
  'Rule 6 — Founder Truth Matrix must not emit ARTIFACTS_MISREPORTED_MISSING or PROOF_STALE_VS_DISK when disk proves otherwise',
] as const;

export const CONTRADICTION_AUDIT_TARGETS = [
  'CONNECTED_BUILD_EXECUTION',
  'CONNECTED_RUNTIME_ACTIVATION',
  'CONNECTED_PREVIEW_EXPERIENCE',
  'CONNECTED_VERIFICATION_EXECUTION',
  'CONNECTED_LAUNCH_READINESS',
  'FOUNDER_TRUTH_MATRIX',
  'AUTHORITY_REALITY_CONVERGENCE',
  'EXECUTION_PROOF_SOURCE_UNIFICATION',
  'FOUNDER_TEST_INTEGRATION',
  'AUTONOMOUS_BUILD_EXECUTION_PROOF',
] as const;

export type ContradictionAuditTargetId = (typeof CONTRADICTION_AUDIT_TARGETS)[number];

export const CONTRADICTION_DISPLAY_NAMES: Record<ContradictionAuditTargetId, string> = {
  CONNECTED_BUILD_EXECUTION: 'Connected Build Execution',
  CONNECTED_RUNTIME_ACTIVATION: 'Runtime Activation',
  CONNECTED_PREVIEW_EXPERIENCE: 'Preview Experience',
  CONNECTED_VERIFICATION_EXECUTION: 'Verification Execution',
  CONNECTED_LAUNCH_READINESS: 'Launch Readiness',
  FOUNDER_TRUTH_MATRIX: 'Founder Truth Matrix',
  AUTHORITY_REALITY_CONVERGENCE: 'Authority Reality Convergence',
  EXECUTION_PROOF_SOURCE_UNIFICATION: 'Execution Proof Source Unification',
  FOUNDER_TEST_INTEGRATION: 'Founder Test Integration',
  AUTONOMOUS_BUILD_EXECUTION_PROOF: 'Autonomous Build Execution Proof',
};

export const AUTHORITY_SOURCE_FILES: Record<ContradictionAuditTargetId, string> = {
  CONNECTED_BUILD_EXECUTION:
    'src/connected-build-execution/connected-build-execution-authority.ts',
  CONNECTED_RUNTIME_ACTIVATION:
    'src/connected-runtime-activation-proof/connected-runtime-activation-proof-authority.ts',
  CONNECTED_PREVIEW_EXPERIENCE:
    'src/connected-preview-experience-proof/connected-preview-experience-proof-authority.ts',
  CONNECTED_VERIFICATION_EXECUTION:
    'src/connected-verification-execution-proof/connected-verification-execution-proof-authority.ts',
  CONNECTED_LAUNCH_READINESS:
    'src/connected-launch-readiness-proof/connected-launch-readiness-proof-authority.ts',
  FOUNDER_TRUTH_MATRIX:
    'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts',
  AUTHORITY_REALITY_CONVERGENCE:
    'src/authority-reality-convergence/authority-reality-convergence-authority.ts',
  EXECUTION_PROOF_SOURCE_UNIFICATION:
    'src/execution-proof-source-unification/execution-proof-source-unification-authority.ts',
  FOUNDER_TEST_INTEGRATION: 'src/founder-test-integration/founder-test-integration-authority.ts',
  AUTONOMOUS_BUILD_EXECUTION_PROOF:
    'src/autonomous-build-execution-proof/autonomous-build-execution-proof-authority.ts',
};

export const CONTRADICTORY_VERDICTS = ['PARTIAL', 'NOT_PROVEN', 'BLOCKED'] as const;

export const FOUNDER_MISREPORT_TOKENS = [
  'ARTIFACTS_MISREPORTED_MISSING',
  'PROOF_STALE_VS_DISK',
  'AUTHORITY_DISAGREEMENT',
] as const;
