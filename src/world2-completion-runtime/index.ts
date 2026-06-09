/**
 * DevPulse V2 Phase 15.6 — World 2 Completion Runtime public API.
 */

export {
  WORLD2_COMPLETION_RUNTIME_PASS_TOKEN,
  WORLD2_COMPLETION_RUNTIME_OWNER_MODULE,
  COMPLETION_QUESTION_SIGNALS,
  FORBIDDEN_COMPLETION_DUPLICATES,
  isWorld2CompletionQuestion,
  isWorld2CompletionAdvisoryQuestion,
  isDuplicateCompletionExecutorQuestion,
  type CompletionRiskLevel,
  type CompletionState,
  type CompletionCriterion,
  type CompletionEvidenceType,
  type VerificationRequirement,
  type CompletionEvidence,
  type CompletionPlan,
  type CompletionReport,
  type CompletionDiagnostics,
  type ProjectContext,
  type PrepareCompletionPlanInput,
  type PrepareCompletionPlanResult,
} from './types.js';

export { parseCompletionQuery, resetCompletionRequestCounterForTests } from './completion-request-parser.js';
export { evaluateCompletionCriteria, isProjectGoalCriterionSatisfied } from './completion-criteria-engine.js';
export { buildCompletionEvidence, evidenceSufficient, resetCompletionEvidenceCounterForTests } from './completion-evidence-engine.js';
export {
  buildVerificationRequirements,
  evaluateVerificationSatisfaction,
} from './completion-verification-engine.js';
export { classifyCompletionRisk, hasCriticalCompletionViolation } from './completion-risk-engine.js';
export {
  evaluateCompletionGates,
  validateCompletion,
  type CompletionGateReport,
  type CompletionValidationResult,
} from './completion-validator.js';
export { buildCompletionPlanAndReport, resetCompletionPlanCounterForTests } from './completion-plan-builder.js';
export { composeCompletionResponse } from './completion-report.js';
export {
  getCompletionDiagnostics,
  updateCompletionDiagnostics,
  resetCompletionDiagnostics,
  completionKey,
} from './completion-diagnostics.js';
export {
  prepareCompletionPlan,
  processCompletionRequest,
  getCompletionContext,
} from './completion-runtime.js';
export { buildCompletionFailureContext } from './completion-failure-bridge.js';

export function getDevPulseV2World2CompletionRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_world2_completion_runtime',
    passToken: 'WORLD2_COMPLETION_RUNTIME_V1_PASS',
    phase: 15.6,
    extensionOnly: true,
  };
}
