/**
 * Adoption Prediction Authority — bounded prediction categories.
 */

import type { AdoptionPredictionScenarioDefinition } from './adoption-prediction-types.js';

export const ADOPTION_PREDICTION_SCENARIOS: readonly AdoptionPredictionScenarioDefinition[] = [
  {
    id: 'retention-prediction',
    category: 'RETENTION_PREDICTION',
    question: 'Will users return tomorrow?',
  },
  {
    id: 'recommendation-prediction',
    category: 'RECOMMENDATION_PREDICTION',
    question: 'Would users recommend it?',
  },
  {
    id: 'adoption-friction',
    category: 'ADOPTION_FRICTION',
    question: 'What will prevent adoption?',
  },
  {
    id: 'growth-potential',
    category: 'GROWTH_POTENTIAL',
    question: 'Can adoption improve over time?',
  },
  {
    id: 'abandonment-prediction',
    category: 'ABANDONMENT_PREDICTION',
    question: 'Why might users stop using it?',
  },
] as const;

export const MAX_ADOPTION_CATEGORIES = ADOPTION_PREDICTION_SCENARIOS.length;
