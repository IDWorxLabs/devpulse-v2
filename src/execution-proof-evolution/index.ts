/**
 * Execution Proof Evolution — public API.
 */

export {
  EXECUTION_PROOF_EVOLUTION_PASS_TOKEN,
  EXECUTION_PROOF_EVOLUTION_OWNER_MODULE,
  EXECUTION_PROOF_EVOLUTION_PHASE,
  EXECUTION_PROOF_EVOLUTION_REPORT_TITLE,
  EXECUTION_PROOF_CACHE_KEY_PREFIX,
  MAX_EXECUTION_PROOF_HISTORY,
  MAX_EXECUTION_PROOF_MEMORY,
  MAX_EXECUTION_PROOF_RECOMMENDATIONS,
  LOOP_RISK_UNPROVEN_THRESHOLD,
  SCORE_ORIGINAL_FAILURE_RETESTED,
  SCORE_BEFORE_AFTER_EVIDENCE,
  SCORE_INDEPENDENT_CONFIRMATION,
  SCORE_NO_REGRESSION,
  SCORE_CAUSAL_LINK,
  SCORE_REUSABLE_MEMORY,
  VERDICT_PROVEN_FIXED_MIN,
  VERDICT_PARTIALLY_PROVEN_MIN,
  VERDICT_NOT_PROVEN_MIN,
  EXECUTION_PROOF_VERDICTS,
  EXECUTION_PROOF_EVIDENCE_SOURCES,
  isExecutionProofVerdict,
  isExecutionProofEvidenceSource,
  emptyVerdictDistribution,
} from './execution-proof-registry.js';

export type {
  ExecutionProofEvidenceSource,
  ExecutionProofVerdict,
  ExecutionProofConfidence,
  ExecutionProofFixDisposition,
  ExecutionProofProblem,
  ExecutionProofEvidence,
  ExecutionProofBeforeAfterSnapshot,
  ExecutionProofAttempt,
  ExecutionProofScoreBreakdown,
  ExecutionProofAssessment,
  ExecutionProofEvolutionMemory,
  ExecutionProofHistorySummary,
  ExecutionProofReport,
  AssessExecutionProofEvolutionInput,
} from './execution-proof-types.js';

export { evaluateExecutionProofAttempt } from './execution-proof-evaluator.js';
export type { ExecutionProofEvaluationResult } from './execution-proof-evaluator.js';

export {
  resetExecutionProofHistoryForTests,
  recordExecutionProofAssessment,
  getExecutionProofHistorySize,
  getLatestExecutionProofAssessment,
  getExecutionProofHistory,
  countPriorUnprovenAttemptsForProblem,
  buildExecutionProofHistorySummary,
  buildVerdictDistribution,
} from './execution-proof-history.js';

export {
  assessExecutionProofEvolution,
  buildExecutionProofEvolutionReport,
  buildExecutionProofEvolutionArtifacts,
  resetExecutionProofEvolutionMemoryForTests,
  getExecutionProofEvolutionMemory,
  resetExecutionProofEvolutionModuleForTests,
} from './execution-proof-authority.js';

export {
  buildExecutionProofEvolutionReportMarkdown,
  buildSampleExecutionProofReportMarkdown,
} from './execution-proof-report-builder.js';

export {
  EXECUTION_PROOF_AUTHORITATIVE_OWNER,
  EXECUTION_PROOF_PERSISTENCE_OWNER,
  mapExecutionProofAssessmentToEvidenceChain,
  recordExecutionProofAssessmentInLedger,
} from './execution-evidence-ledger-bridge.js';
