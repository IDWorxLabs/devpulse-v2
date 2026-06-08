export {
  createDevPulseV2CrossDeviceContinuityFoundation,
  DevPulseV2CrossDeviceContinuityFoundation,
  getDevPulseV2CrossDeviceContinuityFoundation,
  processContinuityHandoff,
  resetDevPulseV2CrossDeviceContinuityFoundationForTests,
  scanModuleForForbiddenPatterns,
  continuityStateIncludes,
  continuityStructuralKey,
  handoffKey,
  governanceGatesKey,
  CONTINUITY_STATE_SEQUENCE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN,
} from './cross-device-continuity-foundation.js';
export {
  validateSourceDevice,
  validateTargetDevice,
  classifyHandoff,
  validateCloudContinuitySession,
  validateHandoffRequest,
  handoffClassificationKey,
} from './device-handoff-engine.js';
export {
  classifyContinuityScope,
  scopeClassificationKey,
  requiresCloudStateRefresh,
} from './continuity-scope-engine.js';
export {
  classifyContinuityCapability,
  evaluateContinuityCapabilities,
  capabilitiesKey,
} from './continuity-capability-engine.js';
export {
  determineContinuityReadiness,
  readinessKey,
} from './continuity-readiness-engine.js';
export {
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  assertNoRegistryRuntimeMutation,
  assertDistinctFromMobileApprovalFlowFoundation,
  getContinuityGovernanceSummary,
  validateContinuityGovernance,
  isGovernanceReady,
} from './continuity-governance-bridge.js';
export {
  evaluateContinuitySecurity,
  assertNoDuplicateProjectTruth,
  assertNoDuplicateProjectVault,
  assertNoDuplicateChatTruth,
  assertNoDuplicatePreviewTruth,
  assertNoDuplicateApprovalTruth,
  assertNoDuplicateExecutionTruth,
} from './continuity-security-engine.js';
export {
  createContinuityPacketId,
  generateHandoffSummary,
  handoffSummaryKey,
  resetContinuityPacketCounterForTests,
} from './continuity-packet-engine.js';
export { buildContinuityReport, formatContinuityReport } from './continuity-report.js';
export type {
  AuthStatus,
  CapabilityClassification,
  CloudConnectionStatus,
  ContinuityCapability,
  ContinuityConfirmation,
  ContinuityInput,
  ContinuityReadiness,
  ContinuityReport,
  ContinuityResult,
  ContinuityScope,
  ContinuityState,
  CrossDeviceContinuityFoundationState,
  DeviceType,
  GateRecord,
  GovernanceStatus,
  HandoffType,
  Platform,
} from './types.js';
export {
  CODE_GEN_BLOCKED_PATTERNS,
  CONTINUITY_READINESS_LEVELS,
  DEPENDENCY_SYSTEMS,
  DEPLOY_BLOCKED_PATTERNS,
  DUPLICATE_PATTERNS,
  DUPLICATE_TRUTH_BLOCKED_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  KNOWN_CONTINUITY_CAPABILITIES,
  KNOWN_CONTINUITY_SCOPES,
  KNOWN_HANDOFF_TYPES,
  SCOPE_CAPABILITY_MAP,
} from './types.js';
