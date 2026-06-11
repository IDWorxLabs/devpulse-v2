/**
 * Launch Verdict Governance — public API.
 */

export {
  LAUNCH_VERDICT_GOVERNANCE_PASS_TOKEN,
  LAUNCH_VERDICT_GOVERNANCE_OWNER_MODULE,
  MAX_GOVERNANCE_HISTORY,
  LAUNCH_VERDICT_GOVERNANCE_CACHE_KEY_PREFIX,
  LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE,
  GOVERNANCE_REALITY_PROOF_PUBLIC,
  GOVERNANCE_TRUST_PUBLIC,
} from './launch-verdict-governance-bounds.js';

export type {
  FinalLaunchVerdict,
  GovernanceRuleGroup,
  GovernanceRuleOutcome,
  GovernanceRuleEvaluation,
  LaunchVerdictGovernanceAssessment,
} from './launch-verdict-governance-types.js';

export {
  resetLaunchVerdictGovernanceHistoryForTests,
  recordLaunchVerdictGovernanceAssessment,
  getLaunchVerdictGovernanceHistorySize,
  getLatestLaunchVerdictGovernanceAssessment,
} from './launch-verdict-governance-history.js';

export { buildLaunchVerdictGovernanceReportMarkdown } from './launch-verdict-governance-report-builder.js';

export {
  detectImmediateBlockingAuthorities,
  evaluateGovernanceRules,
  deriveVerdictEligibility,
  deriveFinalLaunchVerdict,
  collectRequiredEvidenceMissing,
  calculateGovernanceScore,
  calculateGovernanceConfidence,
  countRuleOutcomes,
} from './launch-verdict-governance-rules.js';

export {
  validateVerdictDerivation,
  validateEscalationRules,
  validateBlockerEnforcement,
  validateMissingEvidenceDetection,
  validateGovernanceConfidenceRange,
  validateGovernanceScoreRange,
  validateGovernanceDeterministicScoring,
  validateGovernanceAdvisoryOnly,
  validateGovernanceReportGeneration,
  validateRuleEvaluationCounts,
  validateOnlyGovernanceDeclaresPublicLaunch,
} from './launch-verdict-governance-validator.js';

export {
  assessLaunchVerdictGovernance,
  buildLaunchVerdictGovernanceArtifacts,
  isGovernedPublicLaunchVerdict,
} from './launch-verdict-governance-authority.js';
