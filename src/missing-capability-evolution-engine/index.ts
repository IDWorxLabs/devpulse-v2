/**
 * Missing Capability Evolution Engine — public exports.
 */

import { resetMissingCapabilityEvolutionAuthorityForTests } from './capability-evolution-authority.js';
import { resetCapabilityEvolutionHistoryForTests } from './capability-evolution-history.js';

export {
  MISSING_CAPABILITY_EVOLUTION_ENGINE_PASS_TOKEN,
  MISSING_CAPABILITY_EVOLUTION_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_EVOLUTION_HISTORY,
  DEFAULT_EVOLUTION_LOOP_MAX_ATTEMPTS,
  DEFAULT_EVOLUTION_MAX_GENERATED_FILES,
  DEFAULT_EVOLUTION_MAX_MODIFIED_FILES,
} from './missing-capability-evolution-types.js';

export type {
  EvolutionVerdict,
  EvolutionSafetyVerdict,
  CapabilityValidationStatus,
  EvolvedCapabilityStatus,
  MissingCapabilitySourceGate,
  MissingCapabilityIntakeItem,
  EvolutionSafetyAssessment,
  CapabilityDesign,
  CapabilityInterfaceDesign,
  CapabilityImplementationPlan,
  CapabilityValidatorDesign,
  CapabilityTestFixturePlan,
  CapabilityWorkspaceArtifact,
  CapabilityValidationEvidence,
  CapabilityInstallationResult,
  EvolvedCapabilityRecord,
  CapabilityReuseIndexEntry,
  EvolutionLoopBudget,
  EvolutionAttemptRecord,
  HumanReviewEscalation,
  MissingCapabilityEvolutionPipelineInput,
  MissingCapabilityEvolutionPipelineResult,
  LaunchMissingCapabilityEvolutionEvidence,
  LivePreviewMissingCapabilityEvolutionGateResult,
  MissingCapabilityEvolutionReadinessResult,
} from './missing-capability-evolution-types.js';

export {
  getDevPulseV2MissingCapabilityEvolutionEngine,
  registerMissingCapabilityEvolutionEngineWithLaunchAuthority,
  registerMissingCapabilityEvolutionEngineWithCapabilityPlanning,
  registerMissingCapabilityEvolutionEngineWithAutonomousDebugging,
  registerMissingCapabilityEvolutionEngineWithLivePreviewGate,
  registerMissingCapabilityEvolutionEngineWithMissingCapabilityEscalation,
  listEvolvedCapabilities,
  getEvolvedCapabilityRecord,
  registerEvolvedCapabilityRecord,
  listCapabilityReuseIndex,
  getCapabilityReuseIndexEntry,
  searchCapabilityReuseIndex,
  findExistingEvolvedCapability,
  resetMissingCapabilityEvolutionRegistryForTests,
} from './missing-capability-evolution-registry.js';

export {
  intakeMissingCapabilities,
  hasRequirementEvidence,
  resetMissingCapabilityIntakeForTests,
} from './missing-capability-intake.js';
export {
  assessEvolutionSafety,
  isSafeToEvolve,
  resetEvolutionSafetyAssessorForTests,
} from './evolution-safety-assessor.js';
export { planCapabilityDesign, resetCapabilityDesignPlannerForTests } from './capability-design-planner.js';
export { designCapabilityInterface } from './capability-interface-designer.js';
export { planCapabilityImplementation } from './capability-implementation-planner.js';
export { designCapabilityValidators } from './capability-validator-designer.js';
export { planCapabilityTestFixtures } from './capability-test-fixture-planner.js';
export { generateCapabilityWorkspace } from './capability-workspace-generator.js';
export {
  runCapabilityValidation,
  isValidationInstallable,
} from './capability-validation-runner.js';
export {
  executeCapabilityInstallation,
  getRollbackSnapshot,
  resetCapabilityInstallationExecutorForTests,
} from './capability-installation-executor.js';
export { updateCapabilityRegistry } from './capability-registry-updater.js';
export {
  indexCapabilityForReuse,
  checkCapabilityReuse,
  preventDuplicateEvolution,
} from './capability-reuse-indexer.js';
export {
  createEvolutionLoopBudget,
  recordEvolutionAttempt,
  isEvolutionBudgetExhausted,
  escalateEvolutionToHumanReview,
  resetCapabilityEvolutionLoopControllerForTests,
} from './capability-evolution-loop-controller.js';
export {
  recordCapabilityEvolutionHistory,
  getCapabilityEvolutionHistorySize,
  getCapabilityEvolutionHistory,
  resetCapabilityEvolutionHistoryForTests,
} from './capability-evolution-history.js';
export { buildMissingCapabilityEvolutionReport } from './capability-evolution-report-builder.js';
export {
  evaluateLivePreviewMissingCapabilityEvolutionGate,
  isMissingCapabilityEvolutionReadyForPreview,
} from './capability-evolution-live-preview-gate.js';
export { assessMissingCapabilityEvolutionReadiness } from './capability-evolution-readiness.js';
export {
  runMissingCapabilityEvolutionPipeline,
  getLastMissingCapabilityEvolutionPipelineResult,
  isMissingCapabilityEvolutionComplete,
  buildLaunchMissingCapabilityEvolutionEvidence,
  getMissingCapabilityEvolutionPassToken,
  registerMissingCapabilityEvolutionWithLaunchAuthority,
  resetMissingCapabilityEvolutionAuthorityForTests,
} from './capability-evolution-authority.js';

export function resetMissingCapabilityEvolutionEngineModuleForTests(): void {
  resetMissingCapabilityEvolutionAuthorityForTests();
  resetCapabilityEvolutionHistoryForTests();
}
