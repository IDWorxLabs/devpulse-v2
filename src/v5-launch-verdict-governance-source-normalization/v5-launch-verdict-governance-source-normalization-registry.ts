/**
 * Phase 27.04 — V5 Launch Verdict Governance Source Normalization registry (V1).
 */

export const V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS =
  'V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS';

export const V5_LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX =
  'v5-launch-verdict-governance-source-normalization';

export const LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH =
  'report.v4.launchVerdictGovernance';

export const LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS = [
  'requiredEvidenceMissing',
  'blockingAuthorities',
  'satisfiedRules',
  'failedRules',
  'governanceReasoning',
] as const;

export const LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS = ['recommendations', 'ruleEvaluations'] as const;

export const LAUNCH_VERDICT_GOVERNANCE_NESTED_ARRAY_PATHS = [
  'launchVerdictGovernance.requiredEvidenceMissing',
  'launchVerdictGovernance.blockingAuthorities',
  'launchVerdictGovernance.satisfiedRules',
  'launchVerdictGovernance.failedRules',
  'launchVerdictGovernance.governanceReasoning',
  'launchVerdictGovernance.recommendations',
] as const;
