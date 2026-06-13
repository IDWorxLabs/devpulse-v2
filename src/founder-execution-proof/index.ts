/**
 * Founder Execution Proof — public API (Phase 25.31).
 * Read-only aggregation of real execution-chain evidence.
 */

export {
  FOUNDER_EXECUTION_PROOF_PASS_TOKEN,
  FOUNDER_EXECUTION_PROOF_OWNER_MODULE,
  FOUNDER_EXECUTION_PROOF_PHASE,
  FOUNDER_EXECUTION_PROOF_REPORT_TITLE,
  FOUNDER_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  FOUNDER_EXECUTION_PROOF_CORE_QUESTION,
  FOUNDER_EXECUTION_STATES,
  LAUNCH_RECOMMENDATION_STATES,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  FOUNDER_EXECUTION_PROOF_SAFETY_GUARANTEES,
  isFounderExecutionState,
  isLaunchRecommendationState,
} from './founder-execution-proof-registry.js';

export type {
  FounderExecutionState,
  LaunchRecommendationState,
  StageExecutionEvidence,
  ExecutionChainEvidenceSummary,
  LaunchEvidenceSummary,
  ProofArtifactEntry,
  ExecutionCompletenessBreakdown,
  FounderExecutionProofBundle,
  FounderExecutionProofQuestionAnswers,
  FounderExecutionProofInputSnapshot,
  FounderExecutionProofReport,
  FounderExecutionProofAssessment,
  AssessFounderExecutionProofInput,
  FounderExecutionProofHistoryEntry,
  FounderExecutionProofHistorySummary,
  FounderExecutionProofArtifacts,
  FounderTestExecutionProofSummary,
} from './founder-execution-proof-types.js';

export {
  extractWorkspaceEvidence,
  extractBuildEvidence,
  extractRuntimeEvidence,
  extractPreviewEvidence,
  extractVerificationEvidence,
  extractExecutionChainEvidence,
  extractLaunchEvidence,
  aggregateFounderExecutionProofBundle,
  computeExecutionCompleteness,
  extractTopEvidence,
  extractMissingProofAreas,
} from './execution-proof-aggregator.js';

export {
  assessFounderExecutionProof,
  buildFounderExecutionProofSummary,
  buildFounderExecutionProofArtifacts,
  buildFounderExecutionProofReport,
  resetFounderExecutionProofModuleForTests,
  resetFounderExecutionProofCounterForTests,
} from './founder-execution-proof-authority.js';

export {
  recordFounderExecutionProofAssessment,
  resetFounderExecutionProofHistoryForTests,
  getFounderExecutionProofHistorySize,
  getLatestFounderExecutionProofHistoryEntry,
  getFounderExecutionProofHistory,
  buildFounderExecutionProofHistorySummary,
  countLaunchRecommendation,
} from './founder-execution-proof-history.js';

export { buildFounderExecutionProofReportMarkdown } from './founder-execution-proof-report-builder.js';
