/**
 * Phase 26.94 — Execution Proof Source Unification (V1).
 */

export {
  EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
  EXECUTION_PROOF_SOURCE_UNIFICATION_PHASE,
  EXECUTION_PROOF_SOURCE_UNIFICATION_CORE_QUESTION,
  EXECUTION_PROOF_UNIFICATION_RULES,
  EXECUTION_PROOF_AUDIT_TARGETS,
  KNOWN_STALE_EXECUTION_WORKSPACE_IDS,
  STALE_NOT_PROVEN_BLOCKER_PATTERNS,
  TESTING_INFRASTRUCTURE_DEFECT,
  UNIFICATION_INTEGRATION_TARGETS,
} from './execution-proof-source-unification-registry.js';

export type {
  ExecutionProofSourceClassification,
  AuthoritativeExecutionSource,
  ExecutionProofConsumerRecord,
  StaleExecutionSourceFinding,
  ExecutionProofSourceReconciliation,
  ExecutionProofSourceUnificationReport,
  ExecutionProofSourceUnificationAssessment,
  AssessExecutionProofSourceUnificationInput,
} from './execution-proof-source-unification-types.js';

export {
  assessExecutionProofSourceUnification,
  applyExecutionProofSourceUnificationSync,
  classifyLaunchBlockerFromStaleExecutionSource,
  detectStaleExecutionSources,
  auditAuthoritySourceConsumers,
  computeExecutionProofSourceAgreement,
  resetExecutionProofSourceUnificationModuleForTests,
  resetExecutionProofSourceUnificationCounterForTests,
} from './execution-proof-source-unification-authority.js';

export {
  resolveAuthoritativeExecutionWorkspaceId,
  isStaleExecutionWorkspace,
  describeWorkspaceSource,
} from './authoritative-workspace-resolver.js';

export {
  resolveAuthoritativeExecutionRunId,
  describeRunIdSource,
} from './authoritative-runid-resolver.js';

export { reconcileExecutionProofSources } from './execution-proof-source-reconciliation.js';

export {
  buildExecutionProofSourceUnificationReportMarkdown,
  buildExecutionProofSourceAuditMarkdown,
  buildExecutionProofSourceReconciliationMarkdown,
  buildExecutionProofSourceUnificationValidationMarkdown,
} from './execution-proof-source-unification-report-builder.js';

export {
  recordExecutionProofSourceUnificationReport,
  resetExecutionProofSourceUnificationHistoryForTests,
  getExecutionProofSourceUnificationHistorySize,
  getExecutionProofSourceUnificationHistory,
} from './execution-proof-source-unification-history.js';
