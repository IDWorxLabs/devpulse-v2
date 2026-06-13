/**
 * Planning Gate Authority — public API (V1).
 */

export {
  PLANNING_GATE_AUTHORITY_V1_PASS,
  PLANNING_GATE_AUTHORITY_OWNER_MODULE,
  PLANNING_GATE_AUTHORITY_PHASE,
  PLANNING_GATE_AUTHORITY_REPORT_TITLE,
  MAX_PLANNING_GATE_HISTORY,
  PLANNING_READINESS_CATEGORIES,
  PLANNING_GATE_DECISIONS,
  PLANNING_RISK_TYPES,
  SAFETY_GUARANTEES,
  COVERAGE_DIMENSIONS,
} from './planning-gate-registry.js';

export type {
  PlanningReadinessCategory,
  PlanningGateDecision,
  PlanningRiskType,
  PlanningRiskSeverity,
  PlanningGateQuestionPriority,
  EvidenceCoverageDimension,
  EvidenceSufficiencyResult,
  PlanningRiskItem,
  PlanningRiskAnalysis,
  PlanningReadinessResult,
  PlanningGateQuestion,
  PlanningGateExplanation,
  PlanningGateAnalysis,
  PlanningGateHistoryEntry,
  PlanningGateAuthorityReport,
  AssessPlanningGateInput,
  PlanningGateAssessment,
  PlanningGateEvidenceSnapshot,
} from './planning-gate-types.js';

export {
  resetPlanningGateHistoryForTests,
  recordPlanningGateAnalysis,
  getPlanningGateHistorySize,
  getPlanningGateHistory,
  getPlanningGateAnalyses,
  getLatestPlanningGateAnalysis,
} from './planning-gate-history.js';

export {
  assessPlanningGate,
  runPlanningGateAuthority,
  buildPlanningGateAuthorityArtifacts,
  resetPlanningGateCounterForTests,
  resetPlanningGateAuthorityModuleForTests,
} from './planning-gate-authority.js';

export {
  buildPlanningGateAuthorityReport,
  buildPlanningGateAuthorityReportMarkdown,
} from './planning-gate-report-builder.js';

export { evaluateEvidenceSufficiency } from './evidence-sufficiency-evaluator.js';
export { detectPlanningRisks } from './planning-risk-detector.js';
export { analyzePlanningReadiness, mapPlanningReadinessCategory } from './planning-readiness-analyzer.js';
export {
  derivePlanningGateDecision,
  generatePlanningGateQuestions,
  determineSafeToPlan,
  composePlanningGateAnalysis,
} from './gate-decision-engine.js';
export {
  GATE_READINESS_PERMISSIONS,
  capReadinessToGatePermission,
  getMaxAllowedReadiness,
  isReadinessEscalation,
  gateDecisionToAuthorityKind,
  readinessRank,
} from './readiness-permission-matrix.js';
export type { DownstreamAuthorityKind } from './readiness-permission-matrix.js';
export {
  buildPlanningGateEvidenceSnapshot,
  hasMinimumPlanningGateEvidence,
} from './planning-gate-evidence-snapshot.js';
