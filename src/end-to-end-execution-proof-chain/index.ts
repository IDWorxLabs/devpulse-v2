/**
 * End-to-End Execution Proof Chain — public API.
 */

export {
  END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN,
  END_TO_END_EXECUTION_PROOF_OWNER_MODULE,
  END_TO_END_EXECUTION_PROOF_PHASE,
  END_TO_END_EXECUTION_PROOF_REPORT_TITLE,
  END_TO_END_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
  MAX_END_TO_END_EXECUTION_PROOF_HISTORY,
  MAX_CHAIN_GAPS,
  MAX_PROOF_ARTIFACTS,
  MAX_RECOMMENDED_ACTIONS,
  MAX_CONFIDENCE_FACTORS,
  PROOF_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  END_TO_END_PROOF_SAFETY_GUARANTEES,
  isEndToEndProofState,
} from './end-to-end-execution-proof-registry.js';

export type {
  EndToEndProofState,
  StageProofSummary,
  ChainGapEntry,
  ProofArtifactEntry,
  ConfidenceFactorEntry,
  EndToEndExecutionProofBundle,
  EndToEndProofQuestionAnswers,
  EndToEndExecutionProofInputSnapshot,
  EndToEndExecutionProofReport,
  EndToEndExecutionProofAssessment,
  AssessEndToEndExecutionProofInput,
  EndToEndExecutionProofHistoryEntry,
  EndToEndExecutionProofHistorySummary,
  EndToEndExecutionProofArtifacts,
} from './end-to-end-execution-proof-types.js';

export {
  resetEndToEndExecutionProofHistoryForTests,
  recordEndToEndExecutionProofAssessment,
  getEndToEndExecutionProofHistorySize,
  getLatestEndToEndExecutionProofHistoryEntry,
  getEndToEndExecutionProofHistory,
  countEndToEndProofState,
  buildEndToEndExecutionProofHistorySummary,
} from './end-to-end-execution-proof-history.js';

export {
  assessEndToEndExecutionProofChain,
  buildEndToEndExecutionProofArtifacts,
  buildEndToEndExecutionProofBundle,
  deriveEndToEndProofQuestionAnswers,
  deriveConnectedExecutionScore,
  deriveExecutionConfidence,
  deriveEndToEndProofState,
  resetEndToEndExecutionProofCounterForTests,
  resetEndToEndExecutionProofModuleForTests,
} from './end-to-end-execution-proof-authority.js';

export { buildEndToEndExecutionProofReportMarkdown } from './end-to-end-execution-proof-report-builder.js';
