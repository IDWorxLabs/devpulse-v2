/**
 * Behavior Simulation Engine — public exports.
 */

import { resetBehaviorSimulationAuthorityForTests } from './behavior-simulation-authority.js';

export {
  BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN,
  BEHAVIOR_SIMULATION_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_BEHAVIOR_SIMULATION_HISTORY,
  DEFAULT_SIMULATION_TIMEOUT_MS,
  DEFAULT_SIMULATION_RETRY_BUDGET,
} from './behavior-simulation-types.js';

export type {
  BehaviorFailureCategory,
  BehaviorSimulationVerdict,
  InteractionTargetType,
  BehaviorScenario,
  BehaviorModel,
  InteractionTarget,
  SimulationActionPlan,
  SimulatedActionRecord,
  StateTransitionVerification,
  ServiceEffectVerification,
  DataUpdateVerification,
  UiResultVerification,
  BehaviorFailureReport,
  BehaviorRepairRecommendation,
  BehaviorScenarioResult,
  WholeAppBehaviorSweepResult,
  BehaviorSimulationPipelineInput,
  BehaviorSimulationPipelineResult,
  LaunchBehaviorSimulationEvidence,
  BehaviorSimulationReadinessResult,
  LivePreviewBehaviorGateResult,
} from './behavior-simulation-types.js';

export {
  getDevPulseV2BehaviorSimulationEngine,
  registerBehaviorSimulationWithLaunchAuthority,
  registerBehaviorSimulationWithIncrementalBuilder,
  registerBehaviorSimulationWithLivePreviewGate,
} from './behavior-simulation-registry.js';

export { discoverBehaviorScenarios, resetBehaviorScenarioDiscoveryForTests } from './behavior-scenario-discovery.js';
export { buildBehaviorModel } from './behavior-model-builder.js';
export { mapInteractionTargets } from './interaction-target-mapper.js';
export { planSimulationActions } from './simulation-action-planner.js';
export { executeSimulatedActions, resetSimulatedActionExecutorForTests } from './simulated-action-executor.js';
export { verifyStateTransition } from './state-transition-verifier.js';
export { verifyServiceEffect } from './service-effect-verifier.js';
export { verifyDataUpdate } from './data-update-verifier.js';
export { verifyUiResult } from './ui-result-verifier.js';
export { classifyBehaviorFailure, resetBehaviorFailureClassifierForTests } from './behavior-failure-classifier.js';
export { recommendBehaviorRepair, resetBehaviorRepairRecommenderForTests } from './behavior-repair-recommender.js';
export { buildBehaviorSimulationPipelineReport } from './behavior-simulation-report-builder.js';
export { recordBehaviorSimulationHistory, getBehaviorSimulationHistorySize, resetBehaviorSimulationHistoryForTests } from './behavior-simulation-history.js';
export { assessBehaviorSimulationReadiness } from './behavior-simulation-readiness.js';
export { evaluateLivePreviewBehaviorGate } from './behavior-live-preview-gate.js';
export {
  runBehaviorSimulationPipeline,
  simulateBehaviorForFeatureSlice,
  getLastBehaviorSimulationPipelineResult,
  isBehaviorSimulationReadyForPreview,
  buildLaunchBehaviorSimulationEvidence,
  getBehaviorSimulationPassToken,
  resetBehaviorSimulationAuthorityForTests,
} from './behavior-simulation-authority.js';

export function resetBehaviorSimulationEngineModuleForTests(): void {
  resetBehaviorSimulationAuthorityForTests();
}
