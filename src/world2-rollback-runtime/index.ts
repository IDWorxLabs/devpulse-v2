/**
 * DevPulse V2 Phase 15.4 — World 2 Rollback Runtime public API.
 */

export {
  WORLD2_ROLLBACK_RUNTIME_PASS_TOKEN,
  WORLD2_ROLLBACK_RUNTIME_OWNER_MODULE,
  ROLLBACK_QUESTION_SIGNALS,
  FORBIDDEN_ROLLBACK_DUPLICATES,
  ALLOWED_ROLLBACK_ACTIONS,
  BLOCKED_ROLLBACK_ACTIONS,
  isWorld2RollbackQuestion,
  isWorld2RollbackAdvisoryQuestion,
  isDuplicateRollbackExecutorQuestion,
  type RollbackRiskLevel,
  type RollbackState,
  type RollbackApprovalLevel,
  type RollbackAction,
  type SnapshotRequirement,
  type RollbackStep,
  type RollbackPlan,
  type RollbackReport,
  type RollbackDiagnostics,
  type PrepareRollbackPlanInput,
  type PrepareRollbackPlanResult,
} from './types.js';

export { parseRollbackQuery, resetRollbackRequestCounterForTests } from './rollback-request-parser.js';
export {
  analyzeSnapshotRequirements,
  snapshotRequirementsIdentified,
} from './rollback-snapshot-analyzer.js';
export { mapApplyStepToRollbackAction, estimateRollbackImpact } from './rollback-impact-analyzer.js';
export {
  buildRollbackSteps,
  aggregateRollbackRisk,
  hasCriticalRollbackViolation,
  resetRollbackStepCounterForTests,
} from './rollback-risk-engine.js';
export {
  evaluateRollbackGates,
  validateRollback,
  type RollbackGateReport,
  type RollbackValidationResult,
} from './rollback-validator.js';
export { buildRollbackPlanAndReport, resetRollbackPlanCounterForTests } from './rollback-plan-builder.js';
export { composeRollbackResponse } from './rollback-report.js';
export {
  getRollbackDiagnostics,
  updateRollbackDiagnostics,
  resetRollbackDiagnostics,
  rollbackKey,
} from './rollback-diagnostics.js';
export {
  prepareRollbackPlan,
  processRollbackRequest,
  getRollbackContext,
} from './rollback-runtime.js';
export { buildRollbackFailureContext } from './rollback-failure-bridge.js';

export function getDevPulseV2World2RollbackRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_world2_rollback_runtime',
    passToken: 'WORLD2_ROLLBACK_RUNTIME_V1_PASS',
    phase: 15.4,
    extensionOnly: true,
  };
}
