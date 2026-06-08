export {
  DevPulseV2ControlledExecutionBridge,
  bridgeInputFromStack,
  bridgeStateIncludes,
  bridgeStructuralKey,
  classifyBridge,
  createDevPulseV2ControlledExecutionBridge,
  getDevPulseV2ControlledExecutionBridge,
  resetBridgeCounterForTests,
  resetDevPulseV2ControlledExecutionBridgeForTests,
  scanModuleForForbiddenPatterns,
  validateBridgeOwnership,
  approvalGatesKey,
  executionRequestsKey,
  protectionGatesKey,
  rollbackGatesKey,
  riskGatesKey,
  verificationGatesKey,
  BRIDGE_STATE_SEQUENCE,
  CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE,
  CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN,
} from './controlled-execution-bridge.js';

export {
  classifyPreparedAction,
  classifyPreparedActions,
} from './action-eligibility-engine.js';

export { generateApprovalGates } from './approval-gate-engine.js';
export { generateVerificationGates } from './verification-gate-engine.js';
export { generateRollbackGates } from './rollback-gate-engine.js';
export { generateRiskGates } from './risk-gate-engine.js';
export {
  determineExecutionReadiness,
  generateProtectionGates,
  isGlobalEligibilityMet,
} from './protection-gate-engine.js';

export {
  assertDistinctFromAutonomousBuilder,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getBridgeGovernanceSummary,
} from './bridge-governance-bridge.js';

export {
  buildControlledExecutionReport,
  formatControlledExecutionReport,
} from './controlled-execution-report.js';

export type {
  BridgeConfirmation,
  BridgeInput,
  BridgeResult,
  BridgeState,
  ControlledExecutionBridgeState,
  ControlledExecutionReport,
  ExecutionReadiness,
  ExecutionRequest,
  GateRecord,
  GovernanceGateStatus,
  ProtectionGateStatus,
} from './types.js';

export {
  DEPENDENCY_SYSTEMS,
  DUPLICATE_PATTERNS,
  EXECUTION_READINESS_LEVELS,
  SPECIAL_APPROVAL_ACTION_TYPES,
} from './types.js';
