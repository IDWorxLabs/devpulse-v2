/**
 * Launch Council Finalization — public API.
 */

export {
  LAUNCH_COUNCIL_FINALIZATION_PASS_TOKEN,
  LAUNCH_COUNCIL_FINALIZATION_OWNER_MODULE,
  MAX_FINALIZATION_FINDINGS,
  MAX_FINALIZATION_RECOMMENDATIONS,
  MAX_FINALIZATION_HISTORY,
  LAUNCH_COUNCIL_FINALIZATION_CACHE_KEY_PREFIX,
  LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE,
  MAX_RISK_AUTHORITIES,
  MAX_STRONG_AUTHORITIES,
} from './launch-council-finalization-bounds.js';

export type {
  LaunchCouncilFinalizationPosition,
  LaunchCouncilAuthorityRole,
  LaunchCouncilAuthorityClassification,
  LaunchCouncilAgreementAnalysis,
  LaunchCouncilFinalizationAssessment,
} from './launch-council-finalization-types.js';

export {
  resetLaunchCouncilFinalizationHistoryForTests,
  recordLaunchCouncilFinalizationAssessment,
  getLaunchCouncilFinalizationHistorySize,
  getLatestLaunchCouncilFinalizationAssessment,
} from './launch-council-finalization-history.js';

export { buildLaunchCouncilFinalizationReportMarkdown } from './launch-council-finalization-report-builder.js';

export {
  validateAuthorityClassification,
  validateCouncilScoreRange,
  validateCouncilConfidenceRange,
  validateAgreementAnalysis,
  validateCouncilPositionDerivation,
  validateLaunchGateBlockingRule,
  validateFinalizationDeterministicScoring,
  validateFinalizationAdvisoryOnly,
  validateFinalizationReportGeneration,
  validateAuthorityAggregation,
  validateContradictionDetection,
} from './launch-council-finalization-validator.js';

export {
  LAUNCH_GATE_AUTHORITY_IDS,
  ADVISORY_AUTHORITY_IDS,
  classifyLaunchCouncilAuthorities,
  analyzeLaunchCouncilAgreement,
  assessLaunchCouncilFinalization,
  buildLaunchCouncilFinalizationArtifacts,
} from './launch-council-finalization-authority.js';
