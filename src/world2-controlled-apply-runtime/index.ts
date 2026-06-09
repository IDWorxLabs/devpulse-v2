/**
 * DevPulse V2 Phase 15.3 — World 2 Controlled Apply Runtime public API.
 */

export {
  WORLD2_CONTROLLED_APPLY_RUNTIME_PASS_TOKEN,
  WORLD2_CONTROLLED_APPLY_RUNTIME_OWNER_MODULE,
  CONTROLLED_APPLY_QUESTION_SIGNALS,
  FORBIDDEN_CONTROLLED_APPLY_DUPLICATES,
  isWorld2ControlledApplyQuestion,
  isWorld2ControlledApplyAdvisoryQuestion,
  isDuplicateControlledApplyExecutorQuestion,
  type ControlledApplyRiskLevel,
  type ControlledApplyState,
  type ControlledApplyApprovalLevel,
  type ControlledApplyStep,
  type ControlledApplyPlan,
  type ControlledApplyReport,
  type ControlledApplyDiagnostics,
  type PrepareControlledApplyPlanInput,
  type PrepareControlledApplyPlanResult,
} from './types.js';

export {
  parseControlledApplyQuery,
  resetControlledApplyRequestCounterForTests,
} from './controlled-apply-request-parser.js';

export {
  evaluateControlledApplyGates,
  resetControlledApplyGateCounterForTests,
  type ControlledApplyGate,
  type ControlledApplyGateReport,
} from './controlled-apply-gate-engine.js';

export {
  buildControlledApplySteps,
  aggregateControlledApplyRisk,
  hasCriticalApplyViolation,
  resetControlledApplyStepCounterForTests,
} from './controlled-apply-risk-engine.js';

export { validateControlledApply } from './controlled-apply-validator.js';

export {
  buildControlledApplyPlanAndReport,
  resetControlledApplyPlanCounterForTests,
} from './controlled-apply-plan-builder.js';

export { composeControlledApplyResponse } from './controlled-apply-report.js';

export {
  getControlledApplyDiagnostics,
  updateControlledApplyDiagnostics,
  resetControlledApplyDiagnostics,
  controlledApplyKey,
} from './controlled-apply-diagnostics.js';

export {
  prepareControlledApplyPlan,
  processControlledApplyRequest,
  getControlledApplyContext,
} from './controlled-apply-runtime.js';

export { buildControlledApplyFailureContext } from './controlled-apply-failure-bridge.js';

export function getDevPulseV2World2ControlledApplyRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_world2_controlled_apply_runtime',
    passToken: 'WORLD2_CONTROLLED_APPLY_RUNTIME_V1_PASS',
    phase: 15.3,
    extensionOnly: true,
  };
}
