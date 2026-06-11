/**
 * Competitive Reality Authority — public API.
 */

export {
  COMPETITIVE_REALITY_AUTHORITY_PASS_TOKEN,
  COMPETITIVE_REALITY_OWNER_MODULE,
  MAX_COMPETITIVE_CATEGORIES,
  MAX_COMPETITIVE_FINDINGS,
  MAX_UNIQUE_ADVANTAGES,
  MAX_COMPETITIVE_RISKS,
  MAX_COMPETITIVE_RECOMMENDATIONS,
  MAX_COMPETITIVE_HISTORY,
  COMPETITIVE_REALITY_CACHE_KEY_PREFIX,
  COMPETITIVE_REALITY_REPORT_TITLE,
  COMPETITIVE_REALITY_BLOCK_SCORE,
} from './competitive-reality-bounds.js';

export type {
  CompetitiveComparisonCategory,
  CompetitiveCompetitorType,
  CompetitiveDifferentiationLevel,
  CompetitiveReadinessState,
  CompetitiveComparisonDefinition,
  CompetitiveRealityFinding,
  CompetitiveRealityAssessment,
} from './competitive-reality-types.js';

export { COMPETITIVE_REALITY_COMPARISONS } from './competitive-reality-scenarios.js';

export {
  resetCompetitiveRealityHistoryForTests,
  recordCompetitiveRealityAssessment,
  getCompetitiveRealityHistorySize,
  getLatestCompetitiveRealityAssessment,
} from './competitive-reality-history.js';

export { buildCompetitiveRealityReportMarkdown } from './competitive-reality-report-builder.js';

export {
  validateCompetitiveCategoryCount,
  validateDifferentiationEvaluation,
  validateCompetitiveRiskDetection,
  validateUniqueAdvantageDetection,
  validateCompetitiveClassification,
  validateCompetitiveLaunchBlocking,
  validateCompetitiveDeterministicScoring,
  validateCompetitiveRecommendationGeneration,
  validateCompetitiveAdvisoryOnly,
} from './competitive-reality-validator.js';

export {
  assessCompetitiveRealityAuthority,
  buildCompetitiveRealityAuthorityArtifacts,
} from './competitive-reality-authority.js';
