/**
 * DevPulse V2 Phase 10.1 Experience Layer Foundation — public API.
 */

export {
  validateExperienceMapInput,
  evaluateExperienceProjectContext,
  processExperienceMap,
  experienceStructuralKey,
  experienceStateIncludes,
  scanModuleForForbiddenPatterns,
  DevPulseV2ExperienceLayerFoundation,
  createDevPulseV2ExperienceLayerFoundation,
  getDevPulseV2ExperienceLayerFoundation,
  resetDevPulseV2ExperienceLayerFoundationForTests,
  journeyKey,
  systemSequenceKey,
  decisionPointsKey,
  recommendedPathKey,
  governanceGatesKey,
  EXPERIENCE_STATE_SEQUENCE,
  EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE,
  EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN,
  includesGovernanceStack,
  includesWorld2Stack,
  includesMobileStack,
  includesSelfEvolutionStack,
  includesVerificationAwareness,
  includesTrustAwareness,
  countRequiredDecisions,
  getPrimaryRecommendation,
  pathIncludesAllStacks,
  generateSystemSequence,
  generateDecisionPoints,
  generateRecommendedPath,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  assertWorld2Protected,
  assertNoDuplicateExperienceLayer,
  assertExperienceNotSourceOfTruth,
  assertExposedSystemsRegistered,
  assertDistinctFromIntelligenceSystems,
  validateExperienceGovernance,
} from './experience-layer-foundation.js';

export {
  generateExperienceSurfaces,
  getSurfaceSequence,
  getSurfaceForStage,
  isWorld2Surface,
  isMobileSurface,
  isSelfEvolutionSurface,
  surfacesKey,
} from './experience-surface-engine.js';

export {
  generateJourneyStages,
  getJourneyStageDescription,
  getFounderActionsForStage,
  getSystemActionsForStage,
  getCurrentStageIndex,
} from './founder-journey-engine.js';

export {
  getFullExposedSystemSequence,
  systemsForStage,
} from './system-sequence-engine.js';

export {
  answerFounderQuestions,
} from './decision-point-engine.js';

export {
  buildExperienceLayerReport,
  buildExperienceLayerReportOutput,
  formatExperienceLayerReport,
} from './experience-layer-report.js';

export {
  assertNoExecutionMethods,
  assertNoRegistryRuntimeMutation,
  getExperienceGovernanceSummary,
} from './experience-governance-bridge.js';

export type {
  ExperienceSurface,
  ExperienceJourneyStage,
  ExperienceState,
  GovernanceStatus,
  GateRecord,
  ExperienceMapInput,
  ExperienceSurfaceRecord,
  DecisionPoint,
  RecommendedPathStep,
  ExperienceConfirmation,
  ExperienceMapResult,
  ExperienceLayerReportOutput,
  ExperienceLayerReport,
  ExperienceLayerFoundationState,
} from './types.js';

export {
  KNOWN_EXPERIENCE_SURFACES,
  KNOWN_JOURNEY_STAGES,
  FOUNDER_QUESTIONS,
  EXPOSED_SYSTEM_DOMAINS,
  DUPLICATE_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
  UI_RENDER_BLOCKED_PATTERNS,
  nextExperienceId,
  nextJourneyId,
  resetExperienceCountersForTests,
} from './types.js';
