/**
 * Execution Readiness Gate — public API (V1).
 */

export {
  EXECUTION_READINESS_GATE_V1_PASS,
  EXECUTION_READINESS_GATE_OWNER_MODULE,
  EXECUTION_READINESS_GATE_PHASE,
  EXECUTION_READINESS_GATE_REPORT_TITLE,
  MAX_EXECUTION_READINESS_HISTORY,
  MAX_EXECUTION_GATE_RUNTIME_MS,
  EXECUTION_READINESS_CATEGORIES,
  EXECUTION_GATE_DECISIONS,
  EXECUTION_BLOCKER_PRIORITIES,
  EXECUTION_RISK_TYPES,
  UPSTREAM_AUTHORITIES,
  SAFETY_GUARANTEES,
  EXECUTION_PERMISSION_THRESHOLDS,
} from './execution-readiness-registry.js';

export type {
  ExecutionReadinessCategory,
  ExecutionGateDecision,
  ExecutionBlockerPriority,
  ExecutionRiskType,
  ExecutionRiskSeverity,
  ExecutionAuthorityReadinessSignal,
  ExecutionEvidenceSnapshot,
  ExecutionRiskItem,
  ExecutionRiskAnalysis,
  ExecutionBlockerItem,
  ExecutionBlockerSummary,
  ExecutionReadinessScoreResult,
  ExecutionGateExplanation,
  ExecutionRecommendation,
  ExecutionPermissionResult,
  ExecutionReadinessAnalysis,
  ExecutionReadinessHistoryEntry,
  ExecutionReadinessGateReport,
  AssessExecutionReadinessInput,
  ExecutionReadinessAssessment,
} from './execution-readiness-types.js';

export {
  resetExecutionReadinessHistoryForTests,
  recordExecutionReadinessAnalysis,
  getExecutionReadinessHistorySize,
  getExecutionReadinessHistory,
  getExecutionReadinessAnalyses,
  getLatestExecutionReadinessAnalysis,
} from './execution-history.js';

export {
  assessExecutionReadiness,
  runExecutionReadinessGate,
  buildExecutionReadinessGateArtifacts,
  resetExecutionReadinessGateCounterForTests,
  resetExecutionReadinessGateModuleForTests,
} from './execution-readiness-gate.js';

export {
  buildExecutionReadinessGateReport,
  buildExecutionReadinessGateReportMarkdown,
} from './execution-report-builder.js';

export {
  consolidateExecutionEvidence,
  hasMinimumExecutionEvidence,
} from './execution-evidence-consolidator.js';

export { detectExecutionRisks, resetExecutionRiskCounterForTests } from './execution-risk-detector.js';
export { analyzeExecutionBlockers, resetExecutionBlockerCounterForTests } from './execution-blocker-analyzer.js';
export { scoreExecutionReadiness, mapExecutionReadinessCategory } from './execution-readiness-scorer.js';
export {
  deriveExecutionGateDecision,
  evaluateExecutionPermission,
  generateExecutionRecommendations,
  composeExecutionReadinessAnalysis,
  resetExecutionDecisionCounterForTests,
} from './execution-decision-engine.js';
