/**
 * Operational Evidence Freshness Authority V1 — bounds and pass token.
 */

export const OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN =
  'OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS';

export const OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_FAIL_TOKEN =
  'OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_FAIL';

export const OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE =
  'OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT.md';

export const OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR =
  '.operational-evidence-freshness-authority-v1';

export const MAX_FRESHNESS_REGISTRY_SIZE = 1000;

export const MIN_EVIDENCE_SOURCES_CONSUMED = 12;

export const MIN_CAPABILITIES_ASSESSED = 14;

export const MIN_REVALIDATION_ACTIONS_DEMONSTRATED = 4;

/** Days before status transitions (configurable via ConfidenceDecayModel). */
export const DEFAULT_FRESHNESS_THRESHOLDS = {
  agingDays: 14,
  staleDays: 45,
  expiredDays: 90,
} as const;

export const DEFAULT_CONFIDENCE_DECAY = {
  FRESH: 100,
  AGING: 90,
  STALE: 75,
  EXPIRED: 50,
} as const;

export const EVIDENCE_SOURCE_SYSTEMS = [
  'Capability Audit V3.1',
  'CQI Maturity',
  'UVL Verification Execution',
  'AFLA Trust Calibration',
  'Product Architect Intelligence',
  'Real Build Execution',
  'Production Readiness',
  'Cloud Execution',
  'World2',
  'Mobile Runtime Validation',
  'Large-Scale Validation',
  'Concurrent Execution',
  'Self-Evolution',
  'Unified Failure Escalation',
  'Canonical Ownership V2',
  'Validation Runtime Governance',
] as const;

export const CRITICAL_PROOF_MONITORS = [
  'Build Proof',
  'Verification Proof',
  'Production Proof',
  'Mobile Proof',
  'Cloud Proof',
  'World2 Proof',
  'Concurrent Proof',
  'Self-Evolution Proof',
] as const;

export const PRIOR_PASS_TOKENS = [
  'UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS',
  'MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS',
  'CANONICAL_OWNERSHIP_V2_PASS',
  'SELF_EVOLUTION_EXECUTION_V1_PASS',
  'WORLD2_REAL_INSTANTIATION_V1_PASS',
  'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS',
  'AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS',
] as const;
