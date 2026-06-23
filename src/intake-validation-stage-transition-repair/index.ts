/**
 * Phase 27.05 — Intake Validation Stage Transition Repair (V1).
 */

export type {
  IntakeValidationStageTransitionFailureClass,
  IntakeValidationBoundaryAudit,
  IntakeValidationCompletionDetection,
  StageTransitionPropagationAnalysis,
  PlanningGateEligibilityAnalysis,
  IntakeValidationStageTransitionRepairPlan,
  IntakeValidationStageTransitionRepairReport,
  IntakeValidationStageTransitionRepairAssessment,
  AssessIntakeValidationStageTransitionRepairInput,
  ReconcileIntakeValidationStageTransitionHandlers,
} from './intake-validation-stage-transition-repair-types.js';

export {
  INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_PASS,
  INTAKE_VALIDATION_STAGE_TRANSITION_REPAIR_CACHE_KEY_PREFIX,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE_WITH_WARNINGS,
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  INTAKE_VALIDATION_COMPLETE,
  INTAKE_VALIDATION_COMPLETE_EMITTED,
  PLANNING_GATE_ENTERED,
  PLANNING_GATE_STARTED,
  STAGE2_TRANSITION_CHAIN,
} from './intake-validation-stage-transition-repair-registry.js';

export { auditIntakeValidationBoundary } from './intake-validation-boundary-auditor.js';
export { detectIntakeValidationCompletion } from './intake-validation-completion-detector.js';
export { analyzeStageTransitionPropagation } from './stage-transition-propagation-analyzer.js';
export { analyzePlanningGateEligibility } from './planning-gate-eligibility-analyzer.js';
export { planIntakeValidationStageTransitionRepair } from './intake-validation-repair-planner.js';
export {
  buildIntakeValidationStageTransitionReportMarkdown,
  buildIntakeValidationTransitionRepairReportMarkdown,
  buildIntakeValidationTransitionValidationMarkdown,
} from './intake-validation-stage-transition-report-builder.js';
export {
  recordIntakeValidationStageTransitionRepair,
  getIntakeValidationStageTransitionRepairHistory,
  resetIntakeValidationStageTransitionRepairHistoryForTests,
} from './intake-validation-stage-transition-history.js';
export {
  assessIntakeValidationStageTransitionRepair,
  emitIntakeValidationCompleteOnce,
  emitPlanningGateRunningOnce,
  reconcileIntakeValidationStageTransitionOnSnapshot,
  applyIntakeValidationStageTransitionRepairSync,
  hasIntakeValidationCompleteRepairEmitted,
  resetIntakeValidationStageTransitionRepairCounterForTests,
  resetIntakeValidationStageTransitionRepairModuleForTests,
} from './intake-validation-stage-transition-repair-authority.js';
