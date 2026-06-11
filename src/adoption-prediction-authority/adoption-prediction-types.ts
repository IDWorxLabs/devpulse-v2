/**
 * Adoption Prediction Authority — assessment types.
 */

export type AdoptionPredictionCategory =
  | 'RETENTION_PREDICTION'
  | 'RECOMMENDATION_PREDICTION'
  | 'ADOPTION_FRICTION'
  | 'GROWTH_POTENTIAL'
  | 'ABANDONMENT_PREDICTION';

export type AdoptionPredictionReadinessState =
  | 'HIGH_ADOPTION_PROBABILITY'
  | 'MODERATE_ADOPTION_PROBABILITY'
  | 'UNCERTAIN_ADOPTION'
  | 'HIGH_ABANDONMENT_RISK'
  | 'BLOCKED';

export interface AdoptionPredictionScenarioDefinition {
  id: string;
  category: AdoptionPredictionCategory;
  question: string;
}

export interface AdoptionPredictionAssessment {
  readOnly: true;
  advisoryOnly: true;
  adoptionPredictionScore: number;
  retentionPredictionScore: number;
  recommendationPredictionScore: number;
  abandonmentRiskScore: number;
  growthPotentialScore: number;
  evidenceConfidenceScore: number;
  blocksLaunchReadiness: boolean;
  readinessState: AdoptionPredictionReadinessState;
  findings: string[];
  recommendations: string[];
  cacheKey: string;
}
