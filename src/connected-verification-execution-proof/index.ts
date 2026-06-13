/**
 * Connected Verification Execution Proof — public API (Phase 26.11).
 */

export {
  CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_OWNER_MODULE,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_PHASE,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT_TITLE,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_CORE_QUESTION,
  MAX_VERIFICATION_EXECUTION_PROOF_HISTORY,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './connected-verification-execution-proof-registry.js';

export type {
  VerificationProofLevel,
  VerificationExecutionState,
  VerificationRunState,
  VerificationTargetState,
  VerificationResultState,
  VerificationEvidenceState,
  VerificationReadinessState,
  VerificationFailureSeverity,
  VerificationRunAssessment,
  VerificationTargetAssessment,
  VerificationResultAssessment,
  VerificationEvidenceAssessment,
  VerificationFailureEntry,
  VerificationFailureAnalysis,
  VerificationReadinessAssessment,
  VerificationManifestAssessment,
  VerificationLinkageAnalysis,
  VerificationExecutionFounderQuestions,
  VerificationExecutionProofReport,
  VerificationExecutionProofAssessment,
  VerificationEvidenceFixture,
  AssessConnectedVerificationExecutionProofInput,
  VerificationExecutionProofHistoryEntry,
  VerificationExecutionProofHistorySummary,
  VerificationExecutionProofArtifacts,
} from './connected-verification-execution-proof-types.js';

export {
  resetVerificationExecutionProofHistoryForTests,
  recordVerificationExecutionProofAssessment,
  getVerificationExecutionProofHistorySize,
  buildVerificationExecutionProofHistorySummary,
} from './connected-verification-execution-proof-history.js';

export {
  assessConnectedVerificationExecutionProof,
  buildVerificationExecutionProofArtifacts,
  resetVerificationExecutionProofCounterForTests,
  resetConnectedVerificationExecutionProofModuleForTests,
} from './connected-verification-execution-proof-authority.js';

export {
  buildVerificationExecutionProofReportMarkdown,
  formatVerificationExecutionProofSummary,
} from './connected-verification-execution-proof-report-builder.js';

export { analyzeVerificationRun, isRunCompleted } from './verification-run-analyzer.js';
export { analyzeVerificationTarget, isTargetLinked } from './verification-target-analyzer.js';
export { analyzeVerificationResults, areResultsObserved } from './verification-result-analyzer.js';
export { analyzeVerificationEvidence, isEvidenceSufficient } from './verification-evidence-analyzer.js';
export { analyzeVerificationFailures } from './verification-failure-analyzer.js';
export { analyzeVerificationReadiness } from './verification-readiness-analyzer.js';
export { analyzeVerificationManifest } from './verification-manifest-analyzer.js';
export { analyzeVerificationLinkage } from './verification-linkage-analyzer.js';
