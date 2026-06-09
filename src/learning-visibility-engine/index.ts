/**
 * DevPulse V2 Phase 13.6 — Learning Visibility Engine public API.
 */

export {
  LEARNING_VISIBILITY_ENGINE_PASS_TOKEN,
  LEARNING_VISIBILITY_ENGINE_OWNER_MODULE,
  LEARNING_VISIBILITY_QUESTION_SIGNALS,
  FORBIDDEN_LEARNING_VISIBILITY_DUPLICATES,
  isLearningVisibilityQuestion,
  type LearningCategory,
  type LearningConfidence,
  type LearningObservation,
  type LearningPattern,
  type LearningRecommendation,
  type LearningRecord,
  type LearningAnalysis,
  type LearningVisibilityResult,
  type LearningVisibilityDiagnostics,
} from './learning-visibility-types.js';

export { analyzeRecurringBlockers, resetLearningBlockerCounterForTests } from './learning-blocker-analyzer.js';
export { analyzeRecurringFailures, resetLearningFailureCounterForTests } from './learning-failure-analyzer.js';
export {
  analyzeRecurringRecommendations,
  resetLearningRecommendationCounterForTests,
} from './learning-recommendation-analyzer.js';
export { buildLearningPatterns, resetLearningPatternCounterForTests } from './learning-pattern-builder.js';
export { buildLearningMemory, resetLearningMemoryCounterForTests } from './learning-memory-builder.js';

export {
  getLearningVisibilityDiagnostics,
  updateLearningVisibilityDiagnostics,
  resetLearningVisibilityDiagnostics,
  learningVisibilityKey,
} from './learning-visibility-diagnostics.js';

export {
  analyzeLearning,
  processLearningVisibilityRequest,
  getLearningVisibilityContext,
} from './learning-visibility-engine.js';

export function getDevPulseV2LearningVisibilityEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_learning_visibility_engine',
    passToken: 'DEVPULSE_V2_LEARNING_VISIBILITY_ENGINE_FOUNDATION_V1_PASS',
    phase: 13.6,
  };
}
