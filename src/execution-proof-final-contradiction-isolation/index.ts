/**
 * Phase 27.06 — Execution Proof Final Contradiction Isolation (V1).
 * Diagnostic-only root-cause isolation. No new reconciliation layer.
 */

export type {
  FinalContradictionDivergenceClass,
  AuthoritativeConvergedEvidence,
  AuthorityEvidenceConsumption,
  FinalContradictionRankedEntry,
  FinalContradictionIsolationSummary,
  ExecutionProofFinalContradictionIsolationReport,
  ExecutionProofFinalContradictionIsolationAssessment,
  AssessExecutionProofFinalContradictionIsolationInput,
} from './execution-proof-final-contradiction-isolation-types.js';

export {
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS,
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PHASE,
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CORE_QUESTION,
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_CACHE_KEY_PREFIX,
  EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME,
  FINAL_CONTRADICTION_ISOLATION_RULES,
  FINAL_STALE_CONSUMER_AUTHORITY_ID,
  FINAL_STALE_CONSUMER_AUTHORITY_NAME,
  FINAL_STALE_CONSUMER_SOURCE_MODULE,
  FINAL_STALE_CONSUMER_REASON,
  CLAIM_TO_DIMENSION,
  STALE_FOUNDER_TEST_AUTHORITY_IDS,
} from './execution-proof-final-contradiction-isolation-registry.js';

export { isolateLaunchCriticalAuthorityEvidence } from './launch-critical-authority-isolator.js';
export { classifyFinalContradictionDivergence } from './stale-evidence-classifier.js';
export { rankContradictionSources } from './contradiction-source-ranker.js';
export {
  buildExecutionProofFinalContradictionReportMarkdown,
  buildExecutionProofFinalContradictionValidationMarkdown,
} from './execution-proof-final-contradiction-report-builder.js';
export {
  recordExecutionProofFinalContradictionIsolationReport,
  getExecutionProofFinalContradictionIsolationHistory,
  resetExecutionProofFinalContradictionIsolationHistoryForTests,
} from './execution-proof-final-contradiction-isolation-history.js';
export {
  assessExecutionProofFinalContradictionIsolation,
  resetExecutionProofFinalContradictionIsolationCounterForTests,
  resetExecutionProofFinalContradictionIsolationModuleForTests,
} from './execution-proof-final-contradiction-isolation-authority.js';
