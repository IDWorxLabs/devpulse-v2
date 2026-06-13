/**
 * Cross-System Orchestration Proof — public API (V1).
 */

export {
  CROSS_SYSTEM_ORCHESTRATION_PROOF_V1_PASS,
  ORCHESTRATION_PROOF_OWNER_MODULE,
  ORCHESTRATION_PROOF_PHASE,
  ORCHESTRATION_PROOF_REPORT_TITLE,
  MAX_ORCHESTRATION_PROOF_HISTORY,
  MAX_ORCHESTRATION_PROOF_RUNTIME_MS,
  ORCHESTRATION_PROOF_CATEGORIES,
  CHAIN_PROOF_SCENARIO_TYPES,
  AUTHORITY_CHAIN_ORDER,
  SAFETY_GUARANTEES,
} from './orchestration-proof-registry.js';

export type {
  OrchestrationProofCategory,
  DriftType,
  PropagationIssueType,
  AuthorityId,
  AuthorityProjectSnapshot,
  InformationLossItem,
  DriftFinding,
  EvidencePropagationAnalysis,
  PropagationIssueItem,
  ConfidencePropagationStep,
  ConfidencePropagationAnalysis,
  ReadinessPropagationStep,
  ReadinessPropagationAnalysis,
  OrchestrationFailureItem,
  SystemOrchestrationProof,
  ChainConsistencyResult,
  OrchestrationProofAnalysis,
  OrchestrationProofHistoryEntry,
  OrchestrationProofReport,
  ProveOrchestrationInput,
  OrchestrationProofAssessment,
  RunOrchestrationProofInput,
  OrchestrationProofRun,
} from './orchestration-proof-types.js';

export {
  resetOrchestrationProofHistoryForTests,
  recordOrchestrationProofAnalysis,
  getOrchestrationProofHistorySize,
  getOrchestrationProofHistory,
  getOrchestrationProofAnalyses,
  getLatestOrchestrationProofAnalysis,
} from './orchestration-proof-history.js';

export {
  proveOrchestration,
  runOrchestrationProofAuthority,
  runOrchestrationProof,
  resetOrchestrationProofModuleForTests,
  resetOrchestrationProofCounterForTests,
} from './orchestration-proof-authority.js';

export {
  buildOrchestrationProofReport,
  buildOrchestrationProofReportMarkdown,
} from './orchestration-proof-report-builder.js';

export {
  normalizeToken,
  normalizeTokens,
  extractAuthoritySnapshots,
  detectInformationLosses,
} from './project-consistency-tracker.js';

export { analyzeEvidencePropagation } from './evidence-propagation-analyzer.js';
export { analyzeWorkflowConsistency } from './workflow-consistency-analyzer.js';
export { analyzeRoleConsistency } from './role-consistency-analyzer.js';
export { analyzeIntegrationConsistency } from './integration-consistency-analyzer.js';
export { analyzeConfidencePropagation } from './confidence-propagation-analyzer.js';
export { analyzeReadinessPropagation } from './readiness-propagation-analyzer.js';
export {
  checkReadinessAlignment,
  compareReadinessInconsistencyCount,
  exceedsGatePermission,
  resetReadinessAlignmentCountersForTests,
} from './readiness-alignment-check.js';
export type {
  ReadinessAlignmentCheck,
  ReadinessEscalationFinding,
  ClarificationPreservationFinding,
} from './readiness-alignment-check.js';
export {
  detectOrchestrationFailures,
  deriveFailingAuthorities,
  deriveStrongestAuthorities,
  buildRepairRecommendations,
} from './orchestration-failure-detector.js';
