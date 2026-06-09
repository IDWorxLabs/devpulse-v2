/**
 * DevPulse V2 Execution Runtime — Phase 6 package runtime + Phase 14.1 foundation.
 */

export {
  createDevPulseV2ExecutionPackageRuntime,
  createReadOnlyPackage,
  DevPulseV2ExecutionPackageRuntime,
  getDevPulseV2ExecutionPackageRuntime,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
} from './execution-package-runtime.js';
export {
  assertCentralBrainOwnershipUnchanged,
  assertExecutionAuthorityOwnershipUnchanged,
  assertRuntimeDoesNotDuplicateExecutionAuthority,
  assertTimelineLedgerOwnershipUnchanged,
  checkPackageWithExecutionAuthority,
  publishRuntimeSummary,
  recordRuntimeDecisionTimelineEvent,
} from './execution-runtime-authority-bridge.js';
export {
  isKnownRiskLevel,
  normalizePackage,
  REQUIRED_PACKAGE_FIELDS,
} from './execution-package-schema.js';
export { validateExecutionPackage } from './execution-package-validator.js';
export {
  buildExecutionPackageRuntimeReport,
  formatExecutionPackageRuntimeReport,
  formatRuntimeRecordReport,
} from './execution-runtime-report.js';
export {
  advanceAfterAuthorityCheck,
  advanceAfterSchemaValidation,
  buildRuntimeDecision,
  createRuntimeRecord,
  finalizeRuntimeStates,
  initialRuntimeStates,
  stateSequenceIncludes,
} from './execution-runtime-state-machine.js';
export {
  RUNTIME_FUTURE_GATE_AUTONOMY,
  RUNTIME_FUTURE_GATE_COMMAND,
  RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
  RUNTIME_FUTURE_GATE_RECOVERY,
  RUNTIME_OWNER_MODULE,
  RUNTIME_PASS_TOKEN,
  VALID_RISK_LEVELS,
  mapClassificationToFutureGate,
  type ExecutionPackage,
  type ExecutionPackageRuntimeReport,
  type ExecutionPackageRuntimeState,
  type PackageRiskLevel,
  type PackageValidationResult,
  type RuntimeDecision,
  type RuntimeRecord,
  type RuntimeState,
} from './types.js';

export {
  EXECUTION_RUNTIME_FOUNDATION_PASS_TOKEN,
  EXECUTION_RUNTIME_OWNER_MODULE,
  EXECUTION_RUNTIME_QUESTION_SIGNALS,
  EXECUTION_RUNTIME_INPUT_SOURCES,
  FORBIDDEN_EXECUTION_RUNTIME_DUPLICATES,
  isExecutionRuntimeFoundationQuestion,
  isDuplicateExecutionRuntimeBrainQuestion,
  isExecutionReadinessAdvisoryQuestion,
  type ExecutionState,
  type ExecutionSafetyStatus,
  type ExecutionReadinessLevel,
  type ExecutionConfidence,
  type ExecutionPlan,
  type ExecutionReadinessReport,
  type ExecutionPacket,
  type ExecutionRuntimeDiagnostics,
  type ExecutionRuntimeResult,
} from './execution-runtime-types.js';

export {
  buildExecutionPlan,
  createExecutionPacket,
  summarizePacket,
  resetExecutionPacketCounterForTests,
} from './execution-packet.js';

export {
  initialExecutionState,
  canTransition,
  resolveStateFromReadiness,
  advanceExecutionState,
  stateSequenceForEvaluation,
  isTerminalState,
  statesAllowFoundationOnly,
} from './execution-state-machine.js';

export { evaluateExecutionReadiness } from './execution-readiness-evaluator.js';

export {
  assertExecutionRuntimeOwnership,
  assertNoDuplicateExecutionRuntimeAuthority,
  governanceAllowsPacketCreation,
  governanceAllowsStateCreation,
  governanceForbidsActionExecution,
  applyGovernanceToReadiness,
  requiredApprovalGates,
} from './execution-governance.js';

export {
  assessRequestedActionSafety,
  foundationBlocksRealExecution,
  safetyViolationsForQuery,
  aggregateSafetyStatus,
} from './execution-safety-boundary.js';

export {
  getExecutionRuntimeDiagnostics,
  updateExecutionRuntimeDiagnostics,
  resetExecutionRuntimeDiagnostics,
  executionRuntimeKey,
} from './execution-runtime-diagnostics.js';

export {
  buildExecutionRuntimePacket,
  processExecutionRuntimeRequest,
  getExecutionRuntimeContext,
} from './execution-runtime.js';

export function getDevPulseV2ExecutionRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_execution_runtime',
    passToken: 'DEVPULSE_V2_EXECUTION_RUNTIME_FOUNDATION_V1_PASS',
    phase: 14.1,
  };
}
