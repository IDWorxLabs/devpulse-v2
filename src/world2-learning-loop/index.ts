export {
  createDevPulseV2World2LearningLoop,
  DevPulseV2World2LearningLoop,
  getDevPulseV2World2LearningLoop,
  resetDevPulseV2World2LearningLoopForTests,
  resetLearningCounterForTests,
  generateLearning,
  learningInputFromVerification,
  validateLearningOwnership,
  learningStructuralKey,
  learningStateIncludes,
  scanModuleForForbiddenPatterns,
  projectAnalysisKey,
  successPatternsKey,
  failurePatternsKey,
  warningPatternsKey,
  recommendationPatternsKey,
  verificationPatternsKey,
  riskPatternsKey,
  rollbackPatternsKey,
  governancePatternsKey,
  workspacePatternsKey,
  futureRecommendationsKey,
  WORLD2_LEARNING_LOOP_OWNER_MODULE,
  WORLD2_LEARNING_LOOP_PASS_TOKEN,
} from './world2-learning-loop.js';
export { analyzeProjectData } from './project-analysis-engine.js';
export { extractSuccessPatterns } from './success-pattern-engine.js';
export { extractFailurePatterns } from './failure-pattern-engine.js';
export { extractWarningPatterns } from './warning-pattern-engine.js';
export { extractRecommendationPatterns } from './recommendation-pattern-engine.js';
export { extractVerificationPatterns } from './verification-pattern-engine.js';
export { extractRiskPatterns } from './risk-pattern-engine.js';
export { extractRollbackPatterns } from './rollback-pattern-engine.js';
export { extractGovernancePatterns } from './governance-pattern-engine.js';
export { extractWorkspacePatterns } from './workspace-pattern-engine.js';
export {
  compileLessonCount,
  determineLearningConfidence,
  generateFutureRecommendations,
} from './future-recommendation-engine.js';
export {
  assertDistinctFromCompletionVerifier,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getLearningGovernanceSummary,
} from './learning-governance-bridge.js';
export { buildWorld2LearningReport, formatWorld2LearningReport } from './world2-learning-report.js';
export type {
  LearnedPattern,
  LearningConfidence,
  LearningConfirmation,
  LearningInput,
  LearningResult,
  LearningState,
  World2LearningLoopState,
  World2LearningReport,
} from './types.js';
export {
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  LEARNING_CONFIDENCE_LEVELS,
  LEARNING_STATE_SEQUENCE,
  WORLD1_PROTECTED_DOMAINS,
} from './types.js';
