/**
 * Adaptive AutoFix Intelligence — public API.
 */

export {
  ADAPTIVE_AUTOFIX_INTELLIGENCE_PASS_TOKEN,
  ADAPTIVE_AUTOFIX_OWNER_MODULE,
  MAX_ADAPTIVE_AUTOFIX_HISTORY,
  ADAPTIVE_AUTOFIX_CACHE_KEY_PREFIX,
  ADAPTIVE_AUTOFIX_REPORT_TITLE,
  REPEATED_FAILURE_THRESHOLD,
} from './adaptive-autofix-bounds.js';

export type {
  FailureCategory,
  CapabilityGapCategory,
  EvolutionPriority,
  AdaptiveAutofixReadinessState,
  FailureOutcome,
  FailureRecord,
  CapabilityGap,
  EvolutionRecommendation,
  AdaptiveAutoFixAssessment,
} from './adaptive-autofix-types.js';

export {
  resetAdaptiveAutofixHistoryForTests,
  recordAdaptiveAutofixFailures,
  getAdaptiveAutofixHistorySize,
  getLatestAdaptiveAutofixFailures,
  countRepeatedCategoryFailures,
} from './adaptive-autofix-failure-history.js';

export { detectRepeatedFailurePatterns } from './adaptive-autofix-pattern-detector.js';

export {
  detectCapabilityGaps,
  lookupCapabilityMapping,
  getCapabilityMappingCount,
} from './adaptive-autofix-capability-detector.js';

export { planAdaptiveEvolution, sumEstimatedFailureReduction } from './adaptive-autofix-evolution-planner.js';

export { buildAdaptiveAutofixReportMarkdown } from './adaptive-autofix-report-builder.js';

export {
  validateRepeatedFailureDetection,
  validateAdaptiveThresholdTrigger,
  validateCapabilityGapDetection,
  validateEvolutionPlanning,
  validateRecommendationGeneration,
  validateAdaptiveDeterministicScoring,
  validateAdaptiveAdvisoryOnly,
  validateAdaptiveReportGeneration,
  validateCapabilityMappingCount,
  validateAdaptiveLaunchBlocking,
} from './adaptive-autofix-validator.js';

export {
  assessAdaptiveAutofixIntelligence,
  buildAdaptiveAutofixIntelligenceArtifacts,
} from './adaptive-autofix-authority.js';

export type { FounderTestV4ReportForAdaptiveAutofix } from './adaptive-autofix-authority.js';
