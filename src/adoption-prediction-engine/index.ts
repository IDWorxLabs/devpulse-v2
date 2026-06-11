export {
  ADOPTION_PREDICTION_ENGINE_PASS_TOKEN,
  ADOPTION_PREDICTION_ENGINE_OWNER_MODULE,
  MAX_ADOPTION_FINDINGS,
  MAX_ADOPTION_BLOCKERS,
  MAX_ADOPTION_ACTIONS,
  MAX_ADOPTION_STRENGTHS,
} from './adoption-prediction-engine-bounds.js';

export type {
  AdoptionFindingType,
  AdoptionCategory,
  AdoptionSeverity,
  AdoptionSubscores,
  AdoptionFinding,
  AdoptionFeedEvent,
  AdoptionPredictionAssessment,
  AdoptionShellSources,
  AssessAdoptionPredictionInput,
  EnrichedAdoptionAssessments,
  AdoptionPredictionVisibility,
} from './adoption-prediction-engine-types.js';

export {
  assessAdoptionPrediction,
  evaluateAdoptionPredictionVisibility,
  enrichAssessmentsWithAdoptionPrediction,
  resetAdoptionPredictionCounterForTests,
} from './adoption-prediction-engine-authority.js';
