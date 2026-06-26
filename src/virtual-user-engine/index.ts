/**
 * Virtual User Engine — public exports.
 */

import { resetVirtualUserAuthorityForTests } from './virtual-user-authority.js';

export {
  VIRTUAL_USER_ENGINE_PASS_TOKEN,
  VIRTUAL_USER_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_VIRTUAL_USER_HISTORY,
  DEFAULT_JOURNEY_STEP_BUDGET,
  DEFAULT_JOURNEY_TIME_BUDGET_MS,
} from './virtual-user-types.js';

export type {
  VirtualUserGoalStatus,
  VirtualUserVerdict,
  FrictionSeverity,
  VirtualUserFailureCategory,
  VirtualUserProfile,
  VirtualUserPersona,
  VirtualUserGoal,
  VirtualUserJourney,
  VirtualUserStepResult,
  FrictionEvent,
  VirtualUserJourneyResult,
  VirtualUserFailureReport,
  VirtualUserRepairRecommendation,
  WholeAppVirtualUserSweepResult,
  VirtualUserPipelineInput,
  VirtualUserPipelineResult,
  LaunchVirtualUserEvidence,
  VirtualUserReadinessResult,
  LivePreviewVirtualUserGateResult,
} from './virtual-user-types.js';

export {
  getDevPulseV2VirtualUserEngine,
  registerVirtualUserEngineWithLaunchAuthority,
  registerVirtualUserEngineWithBehaviorSimulation,
  registerVirtualUserEngineWithLivePreviewGate,
} from './virtual-user-registry.js';

export { discoverVirtualUserProfiles, resetVirtualUserProfileDiscoveryForTests } from './virtual-user-profile-discovery.js';
export { buildVirtualUserPersonas } from './virtual-user-persona-builder.js';
export { extractVirtualUserGoals } from './virtual-user-goal-extractor.js';
export { planVirtualUserJourneys } from './virtual-user-journey-planner.js';
export { executeVirtualUserJourney } from './virtual-user-executor.js';
export { verifyVirtualUserGoal } from './virtual-user-goal-verifier.js';
export { analyzeVirtualUserFriction, resetVirtualUserFrictionAnalyzerForTests } from './virtual-user-friction-analyzer.js';
export { analyzeVirtualUserAccessibility } from './virtual-user-accessibility-analyzer.js';
export { classifyVirtualUserFailure, resetVirtualUserFailureClassifierForTests } from './virtual-user-failure-classifier.js';
export { recommendVirtualUserRepair, resetVirtualUserRepairRecommenderForTests } from './virtual-user-repair-recommender.js';
export { buildVirtualUserPipelineReport } from './virtual-user-report-builder.js';
export { recordVirtualUserHistory, getVirtualUserHistorySize, resetVirtualUserHistoryForTests } from './virtual-user-history.js';
export { assessVirtualUserReadiness } from './virtual-user-readiness.js';
export { evaluateLivePreviewVirtualUserGate } from './virtual-user-live-preview-gate.js';
export {
  runVirtualUserPipeline,
  simulateVirtualUserImpactForFeatureSlice,
  getLastVirtualUserPipelineResult,
  isVirtualUserSimulationReadyForPreview,
  buildLaunchVirtualUserEvidence,
  getVirtualUserPassToken,
  resetVirtualUserAuthorityForTests,
} from './virtual-user-authority.js';

export function resetVirtualUserEngineModuleForTests(): void {
  resetVirtualUserAuthorityForTests();
}
