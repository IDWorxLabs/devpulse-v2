/**
 * Evidence Propagation Reconciliation — public API (Phase 26.88).
 */

export {
  EVIDENCE_PROPAGATION_RECONCILIATION_PASS,
  EVIDENCE_PROPAGATION_RECONCILIATION_PHASE,
  EVIDENCE_PROPAGATION_RECONCILIATION_OPERATION,
  EVIDENCE_PROPAGATION_RECONCILIATION_CORE_QUESTION,
  EVIDENCE_PROPAGATION_RECONCILIATION_CACHE_KEY_PREFIX,
  AUDITED_LAUNCH_AUTHORITIES,
  KNOWN_STALE_WORKSPACE_IDS,
  EVIDENCE_PROPAGATION_RECONCILIATION_RULES,
  EVIDENCE_PROPAGATION_INTEGRATION_TARGETS,
  EVIDENCE_PROPAGATION_SAFETY_GUARANTEES,
  type AuditedLaunchAuthorityId,
} from './evidence-propagation-reconciliation-registry.js';

export type {
  EvidencePropagationRootCause,
  StaleEvidenceKind,
  AuthoritativeRuntimeTruth,
  AuthorityEvidenceSource,
  StaleEvidenceFinding,
  AuthorityVerdictContradiction,
  EvidencePropagationReconciliation,
  EvidencePropagationReconciliationReport,
  EvidencePropagationReconciliationAssessment,
  AssessEvidencePropagationReconciliationInput,
} from './evidence-propagation-reconciliation-types.js';

export { scanAuthorityEvidenceSources } from './authority-evidence-source-scanner.js';
export { detectStaleEvidence, markStaleSources } from './stale-proof-detector.js';
export {
  analyzeWorkspaceProofAlignment,
  type WorkspaceProofAlignment,
} from './workspace-proof-alignment-analyzer.js';
export {
  buildAuthoritativeRuntimeTruth,
  auditRuntimeTruthConsumers,
  type RuntimeTruthConsumerAudit,
} from './runtime-truth-consumer-audit.js';
export {
  detectAuthorityContradictions,
  applyEvidencePropagationReconciliationToClaims,
  reconcileAuthorityVerdicts,
} from './authority-verdict-reconciliation.js';
export {
  buildEvidencePropagationReconciliationReportMarkdown,
  buildEvidencePropagationAuditReportMarkdown,
  buildAuthorityVerdictAlignmentReportMarkdown,
} from './evidence-propagation-report-builder.js';
export {
  resetEvidencePropagationReconciliationHistoryForTests,
  recordEvidencePropagationReconciliationAssessment,
  getEvidencePropagationReconciliationHistorySize,
  peekLatestEvidencePropagationReconciliationAssessment,
} from './evidence-propagation-history.js';
export {
  assessEvidencePropagationReconciliation,
  applyEvidencePropagationReconciliationSync,
  resetEvidencePropagationReconciliationCounterForTests,
  resetEvidencePropagationReconciliationModuleForTests,
} from './evidence-propagation-reconciliation-authority.js';
