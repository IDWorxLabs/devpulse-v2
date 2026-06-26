/**
 * Autonomous Debugging Engine — public exports.
 */

import { resetAutonomousDebuggingAuthorityForTests } from './autonomous-debugging-authority.js';

export {
  AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN,
  AUTONOMOUS_DEBUGGING_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_DEBUGGING_HISTORY,
  DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS,
  DEFAULT_REPAIR_MAX_TOUCHED_FILES,
} from './autonomous-debugging-types.js';

export type {
  DebuggingVerdict,
  FailureSourceGate,
  DebuggingFailureCategory,
  RepairStrategy,
  ResponsibleSubsystem,
  RepairOutcome,
  FailureIntakeRecord,
  NormalizedFailure,
  RootCauseResult,
  RepairPlan,
  PatchScopePlan,
  PatchSafetyAnalysis,
  PatchApplicationPlan,
  TargetedValidationPlan,
  RegressionValidationPlan,
  RepairAttemptRecord,
  HumanReviewEscalation,
  RepairLoopResult,
  AutonomousDebuggingPipelineInput,
  AutonomousDebuggingPipelineResult,
  LaunchAutonomousDebuggingEvidence,
  AutonomousDebuggingReadinessResult,
  LivePreviewAutonomousDebuggingGateResult,
} from './autonomous-debugging-types.js';

export {
  getDevPulseV2AutonomousDebuggingEngine,
  registerAutonomousDebuggingEngineWithLaunchAuthority,
  registerAutonomousDebuggingEngineWithInteractionProofEngine,
  registerAutonomousDebuggingEngineWithLivePreviewGate,
} from './autonomous-debugging-registry.js';

export { intakeFailures, resetFailureIntakeForTests } from './failure-intake.js';
export { normalizeFailures } from './failure-normalizer.js';
export { classifyDebuggingFailure, canAutoPatch } from './failure-classifier.js';
export { analyzeRootCause, resetRootCauseAnalyzerForTests } from './root-cause-analyzer.js';
export {
  resolveResponsibleSubsystem,
  subsystemAllowsAutonomousPatch,
} from './responsible-subsystem-resolver.js';
export { generateRepairPlan, resetRepairPlanGeneratorForTests } from './repair-plan-generator.js';
export { planPatchScope } from './patch-scope-planner.js';
export { analyzePatchSafety } from './patch-safety-analyzer.js';
export { planPatchApplication, resetPatchApplicationPlannerForTests } from './patch-application-planner.js';
export { planTargetedValidation } from './targeted-validation-planner.js';
export { planRegressionValidation } from './regression-validation-planner.js';
export { simulateRepairExecution } from './repair-execution-simulator.js';
export {
  createRepairBudgetState,
  isRepairBudgetAvailable,
  recordRepairBudgetUsage,
  buildBudgetExhaustionEvidence,
} from './repair-budget-manager.js';
export type { RepairBudgetState } from './repair-budget-manager.js';
export type { RepairLoopBatchResult } from './repair-loop-controller.js';
export { runRepairLoop, resetRepairLoopControllerForTests } from './repair-loop-controller.js';
export { escalateToHumanReview, resetHumanReviewEscalatorForTests } from './human-review-escalator.js';
export { buildAutonomousDebuggingPipelineReport } from './autonomous-debugging-report-builder.js';
export {
  recordAutonomousDebuggingHistory,
  getAutonomousDebuggingHistorySize,
  resetAutonomousDebuggingHistoryForTests,
} from './autonomous-debugging-history.js';
export { evaluateLivePreviewAutonomousDebuggingGate } from './autonomous-debugging-live-preview-gate.js';
export { assessAutonomousDebuggingReadiness } from './autonomous-debugging-readiness.js';
export {
  runAutonomousDebuggingPipeline,
  getLastAutonomousDebuggingPipelineResult,
  isAutonomousDebuggingReadyForPreview,
  buildLaunchAutonomousDebuggingEvidence,
  getAutonomousDebuggingPassToken,
  resetAutonomousDebuggingAuthorityForTests,
} from './autonomous-debugging-authority.js';

export function resetAutonomousDebuggingEngineModuleForTests(): void {
  resetAutonomousDebuggingAuthorityForTests();
}
