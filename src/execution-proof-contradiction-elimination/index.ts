/**
 * Phase 27.01 — Execution Proof Contradiction Elimination (V1).
 */

export {
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PHASE,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CORE_QUESTION,
  CONTRADICTION_ELIMINATION_RULES,
  CONTRADICTION_AUDIT_TARGETS,
  CONTRADICTION_DISPLAY_NAMES,
  AUTHORITY_SOURCE_FILES,
  CONTRADICTORY_VERDICTS,
  FOUNDER_MISREPORT_TOKENS,
  TESTING_INFRASTRUCTURE_DEFECT,
} from './execution-proof-contradiction-elimination-registry.js';

export type {
  ExecutionProofDimension,
  ContradictionRootCause,
  ContradictionReclassification,
  AuthoritativeContradictionContext,
  AuthorityVerdictTrace,
  ExecutionProofContradiction,
  ExecutionProofContradictionElimination,
  ExecutionProofContradictionEliminationReport,
  ExecutionProofContradictionEliminationAssessment,
  AssessExecutionProofContradictionEliminationInput,
} from './execution-proof-contradiction-elimination-types.js';

export {
  assessExecutionProofContradictionElimination,
  applyExecutionProofContradictionEliminationSync,
  resetExecutionProofContradictionEliminationModuleForTests,
  resetExecutionProofContradictionEliminationCounterForTests,
} from './execution-proof-contradiction-elimination-authority.js';

export { traceAuthorityVerdicts, findTraceByDimension } from './authority-verdict-tracer.js';
export { traceWorkspaceSource } from './workspace-source-tracer.js';
export { traceRunIdSource } from './runid-source-tracer.js';
export { traceManifestSource } from './manifest-source-tracer.js';
export { traceTimestampSource } from './timestamp-source-tracer.js';
export {
  detectExecutionProofContradictions,
  planContradictionElimination,
} from './execution-proof-contradiction-detector.js';
export {
  classifyContradictionRootCause,
  reclassifyContradiction,
  isContradictoryVerdict,
  expectedVerdictForDimension,
  buildEvidencePath,
} from './contradiction-root-cause-classifier.js';

export {
  buildExecutionProofContradictionEliminationReportMarkdown,
  buildExecutionProofContradictionAuditMarkdown,
  buildExecutionProofContradictionRootCauseMarkdown,
  buildExecutionProofContradictionValidationMarkdown,
} from './execution-proof-contradiction-report-builder.js';

export {
  recordExecutionProofContradictionReport,
  resetExecutionProofContradictionHistoryForTests,
  getExecutionProofContradictionHistorySize,
  getExecutionProofContradictionHistory,
} from './execution-proof-contradiction-history.js';
