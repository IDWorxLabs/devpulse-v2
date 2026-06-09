/**
 * DevPulse V2 Phase 15.1 — World 2 Execution Activation Foundation public API.
 */

export {
  WORLD2_EXECUTION_ACTIVATION_FOUNDATION_PASS_TOKEN,
  WORLD2_EXECUTION_ACTIVATION_OWNER_MODULE,
  WORLD2_ACTIVATION_QUESTION_SIGNALS,
  WORLD2_ACTIVATION_INPUT_SOURCES,
  FORBIDDEN_WORLD2_ACTIVATION_DUPLICATES,
  isWorld2ExecutionActivationQuestion,
  isDuplicateWorld2BrainQuestion,
  isWorld2ExecutionActivationAdvisoryQuestion,
  type World2ActivationState,
  type World2ActivationConfidence,
  type World2ActivationRequest,
  type World2WorkspaceIsolationReport,
  type World2GovernanceGate,
  type World2GovernanceGateReport,
  type World2RuntimeChainLink,
  type World2ActivationReadinessReport,
  type World2ActivationPlan,
  type World2ExecutionActivationDiagnostics,
  type World2ExecutionActivationResult,
} from './world2-execution-activation-types.js';

export {
  parseWorld2ActivationRequest,
  resetWorld2ActivationRequestCounterForTests,
} from './world2-activation-request-parser.js';

export {
  checkWorld2WorkspaceIsolation,
  resetWorld2IsolationReportCounterForTests,
} from './world2-workspace-isolation-checker.js';

export {
  checkWorld2GovernanceGates,
  resetWorld2GovernanceCounterForTests,
} from './world2-governance-gate-checker.js';

export {
  linkWorld2RuntimeChain,
  resetWorld2RuntimeChainLinkCounterForTests,
} from './world2-runtime-chain-linker.js';

export {
  evaluateWorld2ActivationReadiness,
  resetWorld2ActivationReadinessCounterForTests,
} from './world2-activation-readiness.js';

export {
  buildWorld2ActivationPlan,
  resetWorld2ActivationPlanCounterForTests,
} from './world2-activation-plan-builder.js';

export {
  getWorld2ExecutionActivationDiagnostics,
  updateWorld2ExecutionActivationDiagnostics,
  resetWorld2ExecutionActivationDiagnostics,
  world2ExecutionActivationKey,
} from './world2-activation-diagnostics.js';

export {
  processWorld2ExecutionActivationRequest,
  getWorld2ExecutionActivationContext,
} from './world2-execution-activation.js';

export { buildWorld2ActivationFailureContext } from './world2-activation-failure-bridge.js';

export function getDevPulseV2World2ExecutionActivation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_world2_execution_activation',
    passToken: 'DEVPULSE_V2_WORLD2_EXECUTION_ACTIVATION_FOUNDATION_V1_PASS',
    phase: 15.1,
  };
}
