/**
 * Autonomous Repair Loop — public API.
 */

export {
  AUTONOMOUS_REPAIR_LOOP_PASS_TOKEN,
  AUTONOMOUS_REPAIR_LOOP_OWNER_MODULE,
  AUTONOMOUS_REPAIR_LOOP_PHASE,
  AUTONOMOUS_REPAIR_LOOP_REPORT_TITLE,
  AUTONOMOUS_REPAIR_LOOP_CACHE_KEY_PREFIX,
  MAX_REPAIR_LOOP_HISTORY,
  MAX_REPAIR_LOOP_ATTEMPTS,
  MAX_ESCALATION_SUGGESTIONS,
  REPAIR_LOOP_CORE_QUESTION,
  REPAIR_LOOP_ACTIONS,
  REPAIR_LOOP_STATES,
  ATTEMPT_BUDGET_BY_SEVERITY,
  getAttemptBudgetForSeverity,
  isRepairLoopAction,
  isRepairLoopState,
} from './autonomous-repair-loop-registry.js';

export type {
  RepairLoopSeverity,
  RepairLoopAction,
  RepairLoopState,
  RepairLoopFinding,
  RepairLoopAttempt,
  RepairLoopEscalationGuidance,
  RepairLoopInputSnapshot,
  RepairLoopDecision,
  AutonomousRepairLoopAssessment,
  AutonomousRepairLoopReport,
  AssessAutonomousRepairLoopInput,
  AutonomousRepairLoopHistorySummary,
} from './autonomous-repair-loop-types.js';

export {
  buildRepairLoopInputSnapshot,
  collectAutonomousRepairLoopInputs,
} from './autonomous-repair-loop-orchestrator.js';

export {
  assessAutonomousRepairLoop,
  deriveRepairLoopAction,
  deriveRepairLoopState,
  buildAutonomousRepairLoopReport,
  buildAutonomousRepairLoopArtifacts,
  resetAutonomousRepairLoopModuleForTests,
} from './autonomous-repair-loop-authority.js';

export type { RepairLoopDecisionContext } from './autonomous-repair-loop-authority.js';

export {
  resetAutonomousRepairLoopHistoryForTests,
  recordAutonomousRepairLoopAssessment,
  getAutonomousRepairLoopHistorySize,
  getLatestAutonomousRepairLoopAssessment,
  getAutonomousRepairLoopHistory,
  buildAutonomousRepairLoopHistorySummary,
  countRepairLoopAction,
} from './autonomous-repair-loop-history.js';

export { buildAutonomousRepairLoopReportMarkdown } from './autonomous-repair-loop-report-builder.js';
