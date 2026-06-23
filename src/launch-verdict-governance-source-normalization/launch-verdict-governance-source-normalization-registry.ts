/**
 * Phase 27.06 — Launch Verdict Governance Source Normalization registry (V1).
 */

export const LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS =
  'LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_PASS';

export const LAUNCH_VERDICT_GOVERNANCE_SOURCE_NORMALIZATION_CACHE_KEY_PREFIX =
  'launch-verdict-governance-source-normalization';

/** Identified upstream producer for undefined-length governance crash. */
export const LAUNCH_VERDICT_GOVERNANCE_CRASH_UPSTREAM_PRODUCER =
  'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD';

export const LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH = 'report.v4.launchVerdictGovernance';

export const LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS = [
  'requiredEvidenceMissing',
  'blockingAuthorities',
  'satisfiedRules',
  'failedRules',
  'governanceReasoning',
] as const;

export const LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS = [
  'recommendations',
  'ruleEvaluations',
] as const;

export const LAUNCH_VERDICT_GOVERNANCE_PROPAGATION_CHAIN = [
  'Launch Readiness Authority',
  'Launch Council Finalization',
  'Launch Verdict Governance Authority',
  'Founder Test V4 Report Assembly',
  'Founder Test V5 Report Generation',
  'Founder Simulation Payload Guard',
] as const;
