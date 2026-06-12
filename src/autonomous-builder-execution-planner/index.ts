/**
 * Autonomous Builder Execution Planner — public API.
 */

export {
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_OWNER_MODULE,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_PHASE,
  AUTONOMOUS_BUILDER_EXECUTION_PLANNER_REPORT_TITLE,
  EXECUTION_PLANNER_CACHE_KEY_PREFIX,
  EXECUTION_PLANNER_CORE_QUESTION,
  MAX_EXECUTION_PLANNER_HISTORY,
  MAX_PLAN_STEPS,
  MAX_SUCCESS_CRITERIA,
  EXECUTION_PLAN_TYPES,
  EXECUTION_PLAN_RISK_LEVELS,
  EXECUTION_PLAN_COMPLEXITIES,
  REPAIR_ACTION_TO_PLAN_TYPE,
  mapRepairActionToPlanType,
  isExecutionPlanType,
  riskFromFindingSeverity,
  complexityFromPlan,
} from './autonomous-builder-execution-planner-registry.js';

export type {
  ExecutionPlanType,
  ExecutionPlanRiskLevel,
  ExecutionPlanComplexity,
  ExecutionPlanStep,
  ExecutionVerificationPlan,
  ExecutionRollbackPlan,
  ExecutionPlan,
  ExecutionPlannerInputSnapshot,
  ExecutionPlannerAssessment,
  ExecutionPlannerReport,
  BuildExecutionPlanInput,
  ExecutionPlannerHistorySummary,
} from './autonomous-builder-execution-planner-types.js';

export {
  resetAutonomousBuilderExecutionPlannerHistoryForTests,
  recordExecutionPlannerAssessment,
  getExecutionPlannerHistorySize,
  getLatestExecutionPlannerAssessment,
  getExecutionPlannerHistory,
  buildExecutionPlannerHistorySummary,
  countPlansByType,
} from './autonomous-builder-execution-planner-history.js';

export {
  buildExecutionPlan,
  buildExecutionPlanFromSnapshot,
  assessAutonomousBuilderExecutionPlanner,
  buildAutonomousBuilderExecutionPlannerReport,
  buildAutonomousBuilderExecutionPlannerArtifacts,
  resetAutonomousBuilderExecutionPlannerCounterForTests,
  resetAutonomousBuilderExecutionPlannerModuleForTests,
} from './autonomous-builder-execution-planner-authority.js';

export { buildAutonomousBuilderExecutionPlannerReportMarkdown } from './autonomous-builder-execution-planner-report-builder.js';
