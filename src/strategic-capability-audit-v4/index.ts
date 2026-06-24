/**
 * Strategic Capability Audit V4 — public API.
 */

export {
  STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN,
  STRATEGIC_CAPABILITY_AUDIT_V4_FAIL_TOKEN,
  STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR,
  STRATEGIC_CAPABILITY_AUDIT_V4_REPORT_TITLE,
  STRATEGIC_GAP_CATEGORIES,
  MIN_EVIDENCE_SOURCES_CONSUMED,
  PRIOR_PASS_TOKENS,
} from './strategic-capability-audit-v4-bounds.js';

export type {
  StrategicCapabilityAuditV4Assessment,
  StrategicGapEntry,
  RoadmapV4Priority,
  FactoryReadinessAssessment,
  AutonomyReadinessAssessment,
  CommercializationReadinessAssessment,
  StrategicCapabilityQuestion,
} from './strategic-capability-audit-v4-types.js';

export { runStrategicCapabilityAuditV4 } from './strategic-capability-audit-assessor.js';
export { writeStrategicCapabilityAuditV4Artifacts } from './strategic-capability-audit-artifact-writer.js';
export {
  isStrategicCapabilityAuditV4Proven,
  loadStrategicCapabilityAuditV4FromDisk,
} from './strategic-capability-audit-evidence-loader.js';
export { buildStrategicCapabilityAuditV4ReportMarkdown } from './strategic-capability-audit-report-builder.js';
export { collectStrategicEvidence } from './strategic-evidence-collector.js';
