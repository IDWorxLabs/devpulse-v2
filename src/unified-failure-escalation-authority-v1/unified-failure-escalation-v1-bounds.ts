/**
 * Unified Failure Escalation Authority V1 — bounds and pass token.
 */

export const UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN =
  'UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS';

export const UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_FAIL_TOKEN =
  'UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_FAIL';

export const UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE =
  'UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT.md';

export const UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR =
  '.unified-failure-escalation-authority-v1';

export const MAX_FAILURE_REGISTRY_SIZE = 1000;

export const MIN_SOURCE_SYSTEMS_CONSUMED = 10;

export const MIN_INCIDENTS_PROCESSED = 8;

export const MIN_ESCALATION_STRATEGIES_DEMONSTRATED = 4;

export const FAILURE_SOURCE_SYSTEMS = [
  'CQI',
  'UVL',
  'AFLA',
  'Product Architect',
  'Production Readiness',
  'Cloud Execution',
  'World2',
  'Mobile Runtime',
  'Large-Scale Validation',
  'Concurrent Execution',
  'Self-Evolution',
  'Validation Runtime Governance',
  'Capability Audit',
] as const;

export const PRIOR_PASS_TOKENS = [
  'MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS',
  'CANONICAL_OWNERSHIP_V2_PASS',
  'SELF_EVOLUTION_EXECUTION_V1_PASS',
  'WORLD2_REAL_INSTANTIATION_V1_PASS',
  'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS',
  'AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS',
] as const;
