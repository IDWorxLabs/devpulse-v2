/**
 * Phase 26.97 — Founder Simulation Payload Guard registry (V1).
 */

export const FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS = 'FOUNDER_SIMULATION_PAYLOAD_GUARD_PASS';

export const FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS =
  'FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS';

export const FOUNDER_SIMULATION_PAYLOAD_GUARD_CORE_QUESTION =
  'Which Founder Simulation result field is undefined when downstream code expects `.length`?';

export const FOUNDER_SIMULATION_PAYLOAD_GUARD_CACHE_KEY_PREFIX =
  'founder-simulation-payload-guard-v1';

export const FOUNDER_SIMULATION_UNIFIED_SUMMARY_ARRAY_FIELDS = [
  'whatWorks',
  'whatIsBroken',
  'whatDoesntMakeSense',
  'whatHurtsTrust',
  'whatChanged',
  'recommendedActions',
  'launchBlockers',
] as const;

export const FOUNDER_SIMULATION_V4_ARRAY_FIELDS = [
  'chatIntelligenceReality.failedScenarios',
  'chatIntelligenceReality.founderProofNotes',
  'chatIntelligenceReality.requiredFixesBeforeLaunch',
  'repositoryTypecheckReality.findings',
  'repositoryTypecheckReality.founderProofNotes',
  'skepticalFounderSimulator.objections',
  'realityGaps',
  'founderActionCenter.topActions',
  'founderActionCenter.blockers',
  'founderSensemaking.findings',
  'founderSensemaking.topTrustRisks',
  'creationJourney',
  'issues',
  'phaseFeedEvents',
  'launchVerdictGovernance.requiredEvidenceMissing',
  'launchVerdictGovernance.blockingAuthorities',
  'launchVerdictGovernance.satisfiedRules',
  'launchVerdictGovernance.failedRules',
  'launchVerdictGovernance.governanceReasoning',
  'launchVerdictGovernance.recommendations',
] as const;

export const FOUNDER_SIMULATION_PAYLOAD_GUARD_RULES = [
  'Rule 1 — undefined arrays default to []',
  'Rule 2 — undefined strings default to ""',
  'Rule 3 — undefined objects default to {}',
  'Rule 4 — preserve degraded/warning metadata on completion-with-warnings',
  'Rule 5 — do not hide real failures; record missingFields',
] as const;

export const INTEGRATION_TARGETS = [
  'Founder Simulation Completion Boundary Repair',
  'Founder Test V5 result aggregation',
  'Founder Test Handler',
  'Report Generation',
  'Result Store Delivery Repair',
  'Runtime Status Reporting',
] as const;
