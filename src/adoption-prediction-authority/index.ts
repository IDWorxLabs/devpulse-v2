/**
 * Adoption Prediction Authority — public API.
 */

export {
  ADOPTION_PREDICTION_AUTHORITY_PASS_TOKEN,
  ADOPTION_PREDICTION_OWNER_MODULE,
  MAX_ADOPTION_FINDINGS,
  MAX_ADOPTION_RECOMMENDATIONS,
  MAX_ADOPTION_HISTORY,
  ADOPTION_PREDICTION_CACHE_KEY_PREFIX,
  ADOPTION_PREDICTION_REPORT_TITLE,
  ADOPTION_PREDICTION_BLOCK_SCORE,
  ADOPTION_ABANDONMENT_BLOCK_SCORE,
} from './adoption-prediction-bounds.js';

export type {
  AdoptionPredictionCategory,
  AdoptionPredictionReadinessState,
  AdoptionPredictionScenarioDefinition,
  AdoptionPredictionAssessment,
} from './adoption-prediction-types.js';

export { ADOPTION_PREDICTION_SCENARIOS, MAX_ADOPTION_CATEGORIES } from './adoption-prediction-scenarios.js';

export {
  resetAdoptionPredictionHistoryForTests,
  recordAdoptionPredictionAssessment,
  getAdoptionPredictionHistorySize,
  getLatestAdoptionPredictionAssessment,
} from './adoption-prediction-history.js';

export { buildAdoptionPredictionReportMarkdown } from './adoption-prediction-report-builder.js';

export {
  validateAdoptionCategoryCount,
  validateRetentionPrediction,
  validateRecommendationPrediction,
  validateAbandonmentPrediction,
  validateEvidenceConfidenceCalculation,
  validateAdoptionLaunchBlocking,
  validateAdoptionDeterministicScoring,
  validateAdoptionRecommendationGeneration,
  validateAdoptionAdvisoryOnly,
  validateLowConfidenceNotPresentedAsFact,
} from './adoption-prediction-validator.js';

export {
  assessAdoptionPredictionAuthority,
  buildAdoptionPredictionAuthorityArtifacts,
} from './adoption-prediction-authority.js';
