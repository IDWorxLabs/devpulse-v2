/**
 * DevPulse V2 Phase 15.5 — World 2 Recovery Runtime public API.
 */

export {
  WORLD2_RECOVERY_RUNTIME_PASS_TOKEN,
  WORLD2_RECOVERY_RUNTIME_OWNER_MODULE,
  RECOVERY_QUESTION_SIGNALS,
  FORBIDDEN_RECOVERY_DUPLICATES,
  ALLOWED_RECOVERY_STRATEGIES,
  BLOCKED_RECOVERY_STRATEGIES,
  REPEATED_FAILURE_LIMIT,
  isWorld2RecoveryQuestion,
  isWorld2RecoveryAdvisoryQuestion,
  isDuplicateRecoveryExecutorQuestion,
  type RecoveryRiskLevel,
  type RecoveryState,
  type EscalationLevel,
  type FailureCategory,
  type RecoveryStrategy,
  type FailureContext,
  type RecoveryStep,
  type RecoveryPlan,
  type RecoveryReport,
  type RecoveryDiagnostics,
  type PrepareRecoveryPlanInput,
  type PrepareRecoveryPlanResult,
} from './types.js';

export { parseRecoveryQuery, resetRecoveryRequestCounterForTests } from './recovery-request-parser.js';
export { classifyFailure } from './recovery-failure-classifier.js';
export { selectRecoveryStrategy, strategyWouldRepeat } from './recovery-strategy-selector.js';
export { evaluateEscalation } from './recovery-escalation-engine.js';
export {
  buildRecoverySteps,
  aggregateRecoveryRisk,
  hasCriticalRecoveryViolation,
  resetRecoveryStepCounterForTests,
} from './recovery-risk-engine.js';
export {
  evaluateRecoveryGates,
  validateRecovery,
  type RecoveryGateReport,
  type RecoveryValidationResult,
} from './recovery-validator.js';
export { buildRecoveryPlanAndReport, resetRecoveryPlanCounterForTests } from './recovery-plan-builder.js';
export { composeRecoveryResponse } from './recovery-report.js';
export {
  getRecoveryDiagnostics,
  updateRecoveryDiagnostics,
  resetRecoveryDiagnostics,
  recoveryKey,
} from './recovery-diagnostics.js';
export {
  prepareRecoveryPlan,
  processRecoveryRequest,
  getRecoveryContext,
} from './recovery-runtime.js';
export { buildRecoveryFailureContext } from './recovery-failure-bridge.js';

export function getDevPulseV2World2RecoveryRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_world2_recovery_runtime',
    passToken: 'WORLD2_RECOVERY_RUNTIME_V1_PASS',
    phase: 15.5,
    extensionOnly: true,
  };
}
