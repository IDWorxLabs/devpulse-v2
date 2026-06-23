/**
 * Phase 27.06 — Execution Proof Final Contradiction Isolation registry (V1).
 */

export const EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS =
  'EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS';

export const EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PHASE = '27.06';

export const EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CORE_QUESTION =
  'Which exact downstream authority consumer still emits stale BUILD/RUNTIME/PREVIEW/LAUNCH verdicts after authoritative evidence has converged?';

export const EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CACHE_KEY_PREFIX =
  'execution-proof-final-contradiction-isolation-v1';

export const EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME =
  'EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT';

export const FINAL_CONTRADICTION_ISOLATION_RULES = [
  'Rule 1 — missingArtifacts=0 and disk proves files exist: no authority may emit ARTIFACTS_MISREPORTED_MISSING',
  'Rule 2 — Authority Reality Convergence + Execution Proof Contradiction Elimination complete: no downstream authority may consume pre-convergence evidence',
  'Rule 3 — consumer proofTimestamp < authoritative proofTimestamp: classify STALE_PROOF_CONSUMER',
  'Rule 4 — same workspaceId/runId/manifestId/timestamp but verdict differs: classify POST_CONVERGENCE_VERDICT_DRIFT',
] as const;

/** Primary stale consumer identified when convergence passes but report contradictions persist. */
export const FINAL_STALE_CONSUMER_AUTHORITY_ID = 'FOUNDER_TEST_CONSISTENCY_AUDIT';

export const FINAL_STALE_CONSUMER_AUTHORITY_NAME = 'Founder Test Consistency Audit';

export const FINAL_STALE_CONSUMER_SOURCE_MODULE =
  'src/founder-test-consistency-audit/consistency-analyzers.ts';

export const FINAL_STALE_CONSUMER_REASON =
  'Consumes founder-test-integration authorityResults (REQUIREMENT_REALITY, LIVE_PREVIEW_REALITY, EXECUTION_PROOF_EVOLUTION) captured before convergence; emits PARTIAL/NOT_PROVEN finalTruth to Founder Truth Matrix despite executionChainTruth and disk evidence already PROVEN.';

export const CLAIM_TO_DIMENSION: Record<string, 'BUILD' | 'RUNTIME' | 'PREVIEW' | 'LAUNCH' | 'APPLICATION'> = {
  AIDEVENGINE_BUILDS_APPLICATIONS: 'BUILD',
  AUTONOMOUS_BUILD_EXECUTION_PROOF: 'BUILD',
  LIVE_PREVIEW_RUNS_APPLICATIONS: 'PREVIEW',
  APPLICATION_WORKS: 'RUNTIME',
  APPLICATION_RUNS: 'RUNTIME',
  APPLICATION_REACHABLE: 'RUNTIME',
  FOUNDER_CAN_USE_APPLICATION: 'RUNTIME',
  IDEA_TO_LAUNCH: 'LAUNCH',
  LAUNCH_READINESS_VERDICT: 'LAUNCH',
  LAUNCH_DAY_READINESS: 'LAUNCH',
  WORLD2_EXECUTES_PLANS: 'APPLICATION',
  VERIFICATION_PROVES_READINESS: 'APPLICATION',
  CHAT_INTELLIGENCE_READINESS: 'APPLICATION',
};

export const STALE_FOUNDER_TEST_AUTHORITY_IDS = [
  'REQUIREMENT_REALITY',
  'LIVE_PREVIEW_REALITY',
  'EXECUTION_PROOF_EVOLUTION',
  'VERIFICATION_REALITY',
  'MOBILE_RUNTIME_REALITY',
] as const;
