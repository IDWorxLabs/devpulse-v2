/**
 * DevPulse V2 Phase 9.3 Self-Learning Engine Foundation — public API.
 */

export {
  learningEventValidationKey,
  validateLearningEventInput,
} from './learning-event-validation-engine.js';

export {
  isKnownSourceSystem,
  sourceValidationKey,
  validateLearningSource,
} from './source-validation-engine.js';

export {
  evaluateLearningEvidence,
  evidenceEvaluationKey,
} from './evidence-evaluation-engine.js';

export {
  classifyLearningEvent,
  eventClassificationKey,
  isAcquisitionCategory,
  isApprovalCategory,
  isArchitectureCategory,
  isCapabilityCategory,
  isFailureCategory,
  isGovernanceCategory,
  isKnownEventType,
  isMobileCategory,
  isSimulationCategory,
  isSuccessCategory,
  isVerificationCategory,
  isWarningCategory,
} from './learning-event-classifier.js';

export {
  extractLearningPatterns,
  extractedPatternsKey,
  patternExtractionKey,
  reusablePatternKey,
} from './pattern-extraction-engine.js';

export {
  computeLearningConfidence,
  confidenceScoreKey,
  generateLesson,
  lessonGenerationKey,
} from './lesson-generation-engine.js';

export {
  createFutureGuidance,
  futureGuidanceKey,
  futureGuidanceListKey,
  isAvoidanceRuleGuidance,
  isBestPracticeGuidance,
  isCapabilitySuggestionGuidance,
  isCheckpointSuggestionGuidance,
  isGovernanceSuggestionGuidance,
  isRecommendationGuidance,
  isWarningGuidance,
} from './future-guidance-engine.js';

export {
  assertDistinctFromWorld2LearningLoop,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateSelfLearningEngine,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  getSelfLearningGovernanceSummary,
  governanceGatesKey,
  validateSelfLearningGovernance,
} from './self-learning-governance-bridge.js';

export {
  assertNoExecutionMethods,
  evaluateLearningProjectContext,
  ownershipGatesKey,
} from './self-learning-security-engine.js';

export {
  buildSelfLearningReport,
  buildSelfLearningReportOutput,
  formatSelfLearningReport,
} from './self-learning-report.js';

export {
  createDevPulseV2SelfLearningEngine,
  DevPulseV2SelfLearningEngine,
  getDevPulseV2SelfLearningEngine,
  learningStateIncludes,
  learningStructuralKey,
  processLearningEvent,
  resetDevPulseV2SelfLearningEngineForTests,
  scanModuleForForbiddenPatterns,
} from './self-learning-engine.js';

export type {
  AuthStatus,
  ExtractedPattern,
  FutureGuidance,
  GateRecord,
  GuidanceStatus,
  GuidanceType,
  GovernanceStatus,
  LearningCategory,
  LearningConfidence,
  LearningEventInput,
  LearningEventType,
  LearningRecord,
  LearningSourceSystem,
  SelfLearningConfirmation,
  SelfLearningEngineState,
  SelfLearningReport,
  SelfLearningReportOutput,
  SelfLearningResult,
  SelfLearningState,
} from './types.js';

export {
  AUTO_BEHAVIOR_BLOCKED_PATTERNS,
  CODE_GEN_BLOCKED_PATTERNS,
  DEPENDENCY_SYSTEMS,
  DEPLOY_BLOCKED_PATTERNS,
  DUPLICATE_PATTERNS,
  EVENT_TYPE_TO_CATEGORY,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  GUIDANCE_TYPES,
  KNOWN_EVENT_TYPES,
  KNOWN_LEARNING_CATEGORIES,
  KNOWN_SOURCE_SYSTEMS,
  LEARNING_CONFIDENCE_LEVELS,
  LEARNING_STATE_SEQUENCE,
  MODEL_TRAINING_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
  resetLearningCountersForTests,
  SELF_LEARNING_ENGINE_OWNER_MODULE,
  SELF_LEARNING_ENGINE_PASS_TOKEN,
} from './types.js';
