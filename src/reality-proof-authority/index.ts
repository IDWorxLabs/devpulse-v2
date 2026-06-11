/**
 * Reality-Proof Authority — public API.
 */

export {
  REALITY_PROOF_AUTHORITY_PASS_TOKEN,
  REALITY_PROOF_OWNER_MODULE,
  MAX_REALITY_PROOF_FINDINGS,
  MAX_REALITY_PROOF_RECOMMENDATIONS,
  MAX_REALITY_PROOF_HISTORY,
  REALITY_PROOF_CACHE_KEY_PREFIX,
  REALITY_PROOF_REPORT_TITLE,
  REALITY_PROOF_BLOCK_SCORE,
  REALITY_PROOF_UNKNOWN_BLOCK_COUNT,
} from './reality-proof-bounds.js';

export type {
  RealityEvidenceLevel,
  RealityProofCategory,
  RealityProofReadinessState,
  RealityProofFinding,
  RealityProofAssessment,
} from './reality-proof-types.js';

export {
  resetRealityProofHistoryForTests,
  recordRealityProofAssessment,
  getRealityProofHistorySize,
  getLatestRealityProofAssessment,
} from './reality-proof-history.js';

export {
  classifyRealityProofFindings,
  countRealityLevels,
  classifyAuthorityResult,
} from './reality-proof-classifier.js';

export { buildRealityProofReportMarkdown } from './reality-proof-report-builder.js';

export {
  validateEvidenceClassification,
  validateRealityLevelAssignment,
  validateRealityRiskCalculation,
  validateRealityProofLaunchBlocking,
  validateRealityProofDeterministicScoring,
  validateRealityProofRecommendationGeneration,
  validateRealityProofAdvisoryOnly,
  validateRealityProofScoreCalculation,
} from './reality-proof-validator.js';

export {
  assessRealityProofAuthority,
  buildRealityProofAuthorityArtifacts,
} from './reality-proof-authority.js';
