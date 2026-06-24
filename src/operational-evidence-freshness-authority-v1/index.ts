/**
 * Operational Evidence Freshness Authority V1 — public API.
 */

export {
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_FAIL_TOKEN,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE,
  EVIDENCE_SOURCE_SYSTEMS,
  CRITICAL_PROOF_MONITORS,
  MIN_EVIDENCE_SOURCES_CONSUMED,
  MIN_CAPABILITIES_ASSESSED,
  PRIOR_PASS_TOKENS,
  DEFAULT_FRESHNESS_THRESHOLDS,
  DEFAULT_CONFIDENCE_DECAY,
} from './operational-evidence-freshness-v1-bounds.js';

export type {
  EvidenceFreshnessRecord,
  FreshnessStatus,
  CapabilityFreshnessAssessment,
  ConfidenceDecayModel,
  RevalidationRecommendation,
  RevalidationAction,
  EvidenceDriftAssessment,
  FreshnessIncident,
  OperationalEvidenceFreshnessAssessment,
} from './operational-evidence-freshness-v1-types.js';

export { runOperationalEvidenceFreshnessAuthorityV1 } from './operational-evidence-freshness-assessor.js';
export { writeOperationalEvidenceFreshnessArtifacts } from './operational-evidence-freshness-artifact-writer.js';
export {
  isOperationalEvidenceFreshnessProven,
  loadOperationalEvidenceFreshnessAssessmentFromDisk,
  loadFreshnessSummaryForAudit,
} from './operational-evidence-freshness-evidence-loader.js';
export { buildOperationalEvidenceFreshnessAuthorityV1ReportMarkdown } from './operational-evidence-freshness-report-builder.js';
export { calculateEvidenceFreshness, resolveFreshnessStatus } from './calculate-evidence-freshness.js';
export { buildConfidenceDecayModel, applyConfidenceDecay } from './confidence-decay-model.js';
export { collectEvidenceArtifacts } from './evidence-source-collector.js';
export { assessEvidenceDrift } from './evidence-drift-assessment.js';
export { buildRevalidationRecommendations } from './revalidation-recommendation-engine.js';
