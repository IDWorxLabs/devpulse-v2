/**
 * Autonomous Build Execution Proof — public API.
 */

export {
  AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_OWNER_MODULE,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_PHASE,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT_TITLE,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_CORE_QUESTION,
  MAX_AUTONOMOUS_BUILD_EXECUTION_PROOF_HISTORY,
  EXECUTION_CHAIN_STAGE_ORDER,
  CORE_CHAIN_STAGES,
  STAGE_PROOF_LEVELS,
  REQUIRED_INPUT_AUTHORITIES,
  ORCHESTRATION_FLOW,
  EXECUTION_PROOF_SAFETY_GUARANTEES,
} from './autonomous-build-execution-proof-registry.js';

export type {
  ExecutionStageId,
  StageProofLevel,
  StageEvidenceEntry,
  StageExecutionProof,
  ChainLinkEvidence,
  ExecutionChainAnalysis,
  FounderExecutionProofQuestions,
  AutonomousBuildExecutionProofInputSnapshot,
  AutonomousBuildExecutionProofReport,
  AutonomousBuildExecutionProofAssessment,
  AssessAutonomousBuildExecutionProofInput,
  AutonomousBuildExecutionProofHistoryEntry,
  AutonomousBuildExecutionProofHistorySummary,
  AutonomousBuildExecutionProofArtifacts,
} from './autonomous-build-execution-proof-types.js';

export {
  resetAutonomousBuildExecutionProofHistoryForTests,
  recordAutonomousBuildExecutionProofAssessment,
  getAutonomousBuildExecutionProofHistorySize,
  getAutonomousBuildExecutionProofHistory,
  buildAutonomousBuildExecutionProofHistorySummary,
} from './execution-proof-history.js';

export {
  assessAutonomousBuildExecutionProof,
  buildAutonomousBuildExecutionProofArtifacts,
  resetAutonomousBuildExecutionProofCounterForTests,
  resetAutonomousBuildExecutionProofModuleForTests,
} from './autonomous-build-execution-proof-authority.js';

export {
  buildAutonomousBuildExecutionProofReportMarkdown,
  formatAutonomousBuildExecutionProofSummary,
} from './execution-proof-report-builder.js';

export { analyzeBuildStage } from './build-stage-analyzer.js';
export { analyzeRuntimeStage } from './runtime-stage-analyzer.js';
export { analyzePreviewStage } from './preview-stage-analyzer.js';
export { analyzeVerificationStage } from './verification-stage-analyzer.js';
export { analyzeLaunchStage } from './launch-stage-analyzer.js';
export {
  analyzeRequirementsStage,
  analyzePlanStage,
  buildChainLinks,
  analyzeExecutionChain,
} from './execution-chain-analyzer.js';
