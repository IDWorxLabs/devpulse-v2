/**
 * Unified Failure Escalation Authority V1 — public API.
 */

export {
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_FAIL_TOKEN,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE,
  FAILURE_SOURCE_SYSTEMS,
  MAX_FAILURE_REGISTRY_SIZE,
  MIN_SOURCE_SYSTEMS_CONSUMED,
  MIN_INCIDENTS_PROCESSED,
  PRIOR_PASS_TOKENS,
} from './unified-failure-escalation-v1-bounds.js';

export type {
  FailureIncident,
  FailureSeverity,
  FailureClassificationCategory,
  RootCauseType,
  EscalationStrategy,
  EscalationDecision,
  UnifiedFailureEscalationAssessment,
  UnifiedFailureRegistrySnapshot,
  EscalationEffectivenessAssessment,
  World2FailureExperiment,
} from './unified-failure-escalation-v1-types.js';

export { runUnifiedFailureEscalationAuthorityV1 } from './unified-failure-escalation-assessor.js';
export { writeUnifiedFailureEscalationArtifacts } from './unified-failure-escalation-artifact-writer.js';
export {
  isUnifiedFailureEscalationProven,
  loadUnifiedFailureEscalationAssessmentFromDisk,
} from './unified-failure-escalation-evidence-loader.js';
export { buildUnifiedFailureEscalationAuthorityV1ReportMarkdown } from './unified-failure-escalation-report-builder.js';
export { collectFailureEvidence } from './failure-evidence-collector.js';
export { classifyFailureSignal } from './failure-classification-engine.js';
export { selectEscalationStrategy } from './escalation-strategy-selector.js';
export { applyRepeatedFailureEscalation } from './repeated-failure-escalation.js';
