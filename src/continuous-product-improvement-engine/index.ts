/**
 * Continuous Product Improvement Engine — public exports.
 */

import { resetContinuousImprovementAuthorityForTests } from './continuous-improvement-authority.js';
import { resetImprovementHistoryForTests } from './improvement-history.js';

export {
  CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN,
  CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_IMPROVEMENT_HISTORY,
  DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS,
  DEFAULT_IMPROVEMENT_MAX_TOUCHED_FILES,
} from './continuous-improvement-types.js';

export type {
  ImprovementVerdict,
  ImprovementSignalSource,
  ImprovementSignalKind,
  ImprovementOpportunityCategory,
  ImprovementPriorityLevel,
  ImprovementStrategy,
  ImprovementOutcome,
  ImprovementSignalRecord,
  ImprovementOpportunity,
  RankedImprovementOpportunity,
  ImprovementSafetyAssessment,
  ImprovementPlan,
  ImprovementPatchScope,
  ImprovementApplicationPlan,
  ImprovementValidationPlan,
  ImprovementRegressionPlan,
  ImprovementAttemptRecord,
  ImprovementLoopResult,
  ProductQualityScore,
  ContinuousImprovementPipelineInput,
  ContinuousImprovementPipelineResult,
  LaunchContinuousImprovementEvidence,
  ContinuousImprovementReadinessResult,
  LivePreviewContinuousImprovementGateResult,
} from './continuous-improvement-types.js';

export {
  getDevPulseV2ContinuousProductImprovementEngine,
  registerContinuousImprovementWithLaunchAuthority,
  registerContinuousImprovementWithAutonomousDebugging,
  registerContinuousImprovementWithLivePreviewGate,
} from './continuous-improvement-registry.js';

export { intakeImprovementSignals, resetImprovementSignalIntakeForTests } from './improvement-signal-intake.js';
export {
  detectImprovementOpportunities,
  resetImprovementOpportunityDetectorForTests,
} from './improvement-opportunity-detector.js';
export {
  rankImprovementOpportunities,
  isLaunchBlockingPriority,
  resetImprovementPriorityRankerForTests,
} from './improvement-priority-ranker.js';
export { assessImprovementSafety, resolveImprovementStrategy } from './improvement-safety-assessor.js';
export { generateImprovementPlan, resetImprovementPlanGeneratorForTests } from './improvement-plan-generator.js';
export { planImprovementPatchScope } from './improvement-patch-scope-planner.js';
export {
  planImprovementApplication,
  resetImprovementApplicationPlannerForTests,
} from './improvement-application-planner.js';
export { planImprovementValidation } from './improvement-validation-planner.js';
export { planImprovementRegression } from './improvement-regression-planner.js';
export { simulateImprovementExecution } from './improvement-execution-simulator.js';
export {
  createImprovementBudgetState,
  isImprovementBudgetAvailable,
  recordImprovementBudgetUsage,
  buildImprovementBudgetExhaustionEvidence,
} from './improvement-budget-manager.js';
export type { ImprovementBudgetState } from './improvement-budget-manager.js';
export { runImprovementLoop, resetImprovementLoopControllerForTests } from './improvement-loop-controller.js';
export { calculateProductQualityScore, resetImprovementQualityScorerForTests } from './improvement-quality-scorer.js';
export {
  recordImprovementHistory,
  getImprovementHistorySize,
  resetImprovementHistoryForTests,
} from './improvement-history.js';
export { buildContinuousImprovementPipelineReport } from './continuous-improvement-report-builder.js';
export {
  assessContinuousImprovementReadiness,
  evaluateLivePreviewContinuousImprovementGate,
} from './continuous-improvement-live-preview-gate.js';
export {
  runContinuousImprovementPipeline,
  getLastContinuousImprovementPipelineResult,
  isContinuousImprovementReadyForPreview,
  buildLaunchContinuousImprovementEvidence,
  getContinuousImprovementPassToken,
  resetContinuousImprovementAuthorityForTests,
} from './continuous-improvement-authority.js';

export function resetContinuousProductImprovementEngineModuleForTests(): void {
  resetContinuousImprovementAuthorityForTests();
  resetImprovementHistoryForTests();
}
