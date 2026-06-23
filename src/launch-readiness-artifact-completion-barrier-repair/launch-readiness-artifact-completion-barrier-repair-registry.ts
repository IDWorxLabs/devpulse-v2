/**
 * Phase 26.98 — Launch Readiness Artifact Completion Barrier Repair registry (V1).
 */

export const LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS =
  'LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_PASS';

export const LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_CORE_QUESTION =
  'When chat stress settles inside product readiness, does the launch readiness artifact build always emit a completion boundary — even on SIMULATION_BUDGET_EXCEEDED?';

export const LAUNCH_READINESS_ARTIFACT_COMPLETION_BARRIER_REPAIR_CACHE_KEY_PREFIX =
  'launch-readiness-artifact-completion-barrier-repair';

export const LAUNCH_READINESS_ASSESSMENT_COMPLETE = 'launch-readiness-assessment-complete';
export const LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS =
  'launch-readiness-assessment-complete-with-warnings';

export const LAUNCH_ARTIFACT_COMPLETION_CHAIN_STEPS = [
  'launch-readiness-artifact-build-started',
  'loading-autonomous-build-proof',
  'running-product-readiness-simulation',
  'product-readiness-chat-stress-started',
  'product-readiness-chat-stress-complete',
  'building-product-readiness-scoring',
  'product-readiness-simulation-complete',
  'assessing-launch-readiness',
  'building-launch-readiness-report-markdown',
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
  'launch-readiness-artifacts-built',
] as const;

export const LAUNCH_ARTIFACT_COMPLETION_FAILURE_CLASSES = [
  'CHAT_SETTLED_BUT_ARTIFACT_ACTIVE',
  'PRODUCT_READINESS_BUDGET_RESULT_DROPPED',
  'DEGRADED_RESULT_NOT_PROPAGATED',
  'LAUNCH_READINESS_COMPLETION_NOT_EMITTED',
  'ARTIFACT_SUBSTEP_NOT_CLEARED',
  'INTAKE_COMPLETION_BLOCKED_BY_DEGRADED_RESULT',
  'DIAGNOSTIC_ARTIFACT_NOT_STORED',
  'UNKNOWN_LAUNCH_ARTIFACT_COMPLETION_FAILURE',
  'NONE',
] as const;

export const PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH = 'SIMULATION_BUDGET_EXCEEDED';
