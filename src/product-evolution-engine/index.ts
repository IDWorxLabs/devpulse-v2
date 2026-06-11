export {
  PRODUCT_EVOLUTION_ENGINE_PASS_TOKEN,
  PRODUCT_EVOLUTION_ENGINE_OWNER_MODULE,
  MAX_EVOLUTION_CANDIDATES,
  MAX_EVOLUTION_RANKED,
  MAX_EVOLUTION_ACTIONS,
  MAX_EVIDENCE_TRACES,
} from './product-evolution-engine-bounds.js';

export type {
  EvolutionCategory,
  RecommendationConfidence,
  EvolutionRankingBucket,
  EvolutionSubscores,
  EvolutionCandidate,
  EvolutionFeedEvent,
  ProductEvolutionAssessment,
  EvolutionShellSources,
  AssessProductEvolutionInput,
  EnrichedEvolutionAssessments,
  ProductEvolutionVisibility,
} from './product-evolution-engine-types.js';

export {
  assessProductEvolution,
  evaluateProductEvolutionVisibility,
  enrichAssessmentsWithProductEvolution,
  resetProductEvolutionCounterForTests,
} from './product-evolution-engine-authority.js';
