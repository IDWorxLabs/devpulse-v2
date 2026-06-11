/**
 * Self-Evolution Authority — public API.
 */

export {
  SELF_EVOLUTION_AUTHORITY_PASS_TOKEN,
  SELF_EVOLUTION_OWNER_MODULE,
  MAX_EVOLUTION_CATEGORIES,
  MAX_EVOLUTION_PATTERNS,
  MAX_REQUIRED_EVOLUTIONS,
  MAX_EVOLUTION_RECOMMENDATIONS,
  MAX_EVOLUTION_HISTORY,
  SELF_EVOLUTION_CACHE_KEY_PREFIX,
  SELF_EVOLUTION_REPORT_TITLE,
  SELF_EVOLUTION_BLOCK_SCORE,
  REPEATED_FAILURE_THRESHOLD,
  EVOLUTION_REQUIRED_BLOCK_THRESHOLD,
} from './self-evolution-bounds.js';

export type {
  SelfEvolutionPatternCategory,
  SelfEvolutionPatternStatus,
  SelfEvolutionPatternSeverity,
  SelfEvolutionReadinessState,
  SelfEvolutionPatternDefinition,
  SelfEvolutionPattern,
  SelfEvolutionAssessment,
} from './self-evolution-types.js';

export { SELF_EVOLUTION_PATTERNS } from './self-evolution-patterns.js';

export {
  resetSelfEvolutionHistoryForTests,
  recordSelfEvolutionAssessment,
  getSelfEvolutionHistorySize,
  getLatestSelfEvolutionAssessment,
  categoryRepeatedInHistory,
} from './self-evolution-history.js';

export { buildSelfEvolutionReportMarkdown } from './self-evolution-report-builder.js';

export {
  validateSelfEvolutionCategoryCount,
  validateRepeatedFailureDetection,
  validateEvolutionClassification,
  validateMissingCapabilityMapping,
  validateSelfEvolutionLaunchBlocking,
  validateSelfEvolutionDeterministicScoring,
  validateSelfEvolutionRecommendationGeneration,
  validateSelfEvolutionAdvisoryOnly,
} from './self-evolution-validator.js';

export { assessSelfEvolutionAuthority, buildSelfEvolutionAuthorityArtifacts } from './self-evolution-authority.js';
