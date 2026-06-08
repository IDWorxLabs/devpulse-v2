export {
  createDevPulseV2ExecutionRealityValidation,
  DevPulseV2ExecutionRealityValidation,
  getDevPulseV2ExecutionRealityValidation,
  resetDevPulseV2ExecutionRealityValidationForTests,
  realityStateIncludes,
  validateExecutionRealityChain,
} from './execution-reality-validation.js';
export {
  assertPhase6DependenciesPresent,
  buildRealityChainFromSystems,
  getRealityDependencyChainSummary,
} from './reality-bridge.js';
export {
  checkApprovalLayer,
  checkAuthorityLayer,
  checkRecoveryLayer,
  checkRuntimeLayer,
  checkVerificationLayer,
  isApprovalRequired,
  isRecoveryNotNeeded,
  isRecoveryRequired,
} from './reality-consistency-checker.js';
export {
  detectRealityContradictions,
  hasCriticalContradictions,
  hasWarningContradictions,
} from './reality-contradiction-detector.js';
export {
  summarizeChainCompleteness,
  validateRealityChainCompleteness,
} from './reality-chain-validator.js';
export {
  computeRealityConfidence,
  computeRealityVerdict,
} from './reality-confidence-engine.js';
export {
  buildExecutionRealityReport,
  formatExecutionRealityReport,
} from './execution-reality-report.js';
export {
  DEPENDENCY_SYSTEMS,
  REALITY_VALIDATION_OWNER_MODULE,
  REALITY_VALIDATION_PASS_TOKEN,
  type ContradictionCode,
  type ExecutionRealityChainInput,
  type ExecutionRealityReport,
  type ExecutionRealityResult,
  type ExecutionRealityValidationState,
  type RealityConfidence,
  type RealityContradiction,
  type RealityState,
  type RealityVerdict,
} from './types.js';
