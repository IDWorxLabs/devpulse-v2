/**
 * Phase 26.71 — Founder Truth Matrix Integration public API.
 */

export {
  FOUNDER_TRUTH_MATRIX_INTEGRATION_PASS,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_OWNER_MODULE,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_PHASE,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_REPORT_TITLE,
  FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION_REPORT_TITLE,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION,
  FOUNDER_TRUTH_MATRIX_RECONCILIATION_OPERATION,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_CACHE_KEY_PREFIX,
  MAX_TRUTH_MATRIX_INTEGRATION_HISTORY,
  TRUTH_MATRIX_INTEGRATION_SAFETY_GUARANTEES,
  ORCHESTRATION_FLOW,
  INTEGRATION_TARGET_AUTHORITIES,
  FOUNDER_TRUTH_QUESTIONS,
} from './founder-truth-matrix-integration-registry.js';

export type {
  TruthMatrixLaunchImpact,
  TruthMatrixReconciliationRootCause,
  ReconciledTruthClaim,
  FounderTruthMatrixReconciliation,
  FounderTruthQuestionAnswer,
  FounderTruthSummary,
  CategorizedLaunchBlockers,
  FounderTruthMatrixIntegrationReport,
  FounderTruthMatrixIntegrationAssessment,
  AssessFounderTruthMatrixIntegrationInput,
  FounderTruthMatrixIntegrationHistoryEntry,
} from './founder-truth-matrix-integration-types.js';

export {
  resetFounderTruthMatrixIntegrationHistoryForTests,
  recordFounderTruthMatrixIntegrationAssessment,
  getFounderTruthMatrixIntegrationHistorySize,
  getLatestFounderTruthMatrixIntegrationHistoryEntry,
  getFounderTruthMatrixIntegrationHistory,
} from './founder-truth-matrix-integration-history.js';

export {
  assessFounderTruthMatrixIntegration,
  applyTruthMatrixLaunchReconciliation,
  applyTruthMatrixLaunchReconciliationSync,
  resetFounderTruthMatrixIntegrationCounterForTests,
  resetFounderTruthMatrixIntegrationModuleForTests,
} from './founder-truth-matrix-integration-authority.js';

export type {
  ApplyTruthMatrixLaunchReconciliationInput,
  ApplyTruthMatrixLaunchReconciliationResult,
} from './founder-truth-matrix-integration-authority.js';

export {
  buildConsistencyEvidenceFromLaunchContext,
  type LaunchReadinessTruthBridgeInput,
} from './launch-readiness-truth-bridge.js';

export {
  buildFounderTruthMatrixIntegrationReportMarkdown,
  buildFounderTruthMatrixLaunchReconciliationReportMarkdown,
} from './founder-truth-matrix-integration-report-builder.js';

export { reconcileTruthClaims, buildTruthMatrixReconciliation } from './truth-reconciler.js';
export { reconcileLaunchVerdictWithTruthMatrix } from './launch-verdict-reconciler.js';
export type { LaunchVerdictReconciliationResult } from './launch-verdict-reconciler.js';
export { buildFounderTruthSummary } from './founder-truth-summary-builder.js';
