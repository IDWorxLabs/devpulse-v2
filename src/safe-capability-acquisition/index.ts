/**
 * DevPulse V2 Phase 9.2 Safe Capability Acquisition Foundation — public API.
 */

export {
  approvalNotRequiredForMode,
  approvalRequiredForMode,
  approvalRequirementsKey,
  createApprovalRequirements,
} from './acquisition-approval-engine.js';

export {
  assertDistinctFromMissingCapabilityDetector,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  getAcquisitionGovernanceSummary,
  governanceGatesKey,
  validateAcquisitionGovernance,
} from './acquisition-governance-bridge.js';

export {
  createRollbackRequirements,
  rollbackRequiredForMode,
  rollbackRequirementsKey,
} from './acquisition-rollback-engine.js';

export {
  classifyAcquisitionRisk,
  requiresRiskApproval,
  riskKey,
} from './acquisition-risk-engine.js';

export {
  classifyAcquisitionStrategy,
  isBuildStrategy,
  isDeferStrategy,
  isDependencyStrategy,
  isExternalToolStrategy,
  isLayerStrategy,
  isResearchStrategy,
  strategyKey,
} from './acquisition-strategy-engine.js';

export {
  createVerificationRequirements,
  verificationRequiredForMode,
  verificationRequirementsKey,
} from './acquisition-verification-engine.js';

export {
  evaluateAcquisitionProjectContext,
  gapValidationKey,
  validateCapabilityGapInput,
} from './capability-gap-validation-engine.js';

export { createBuildRequestPacket, buildPacketKey } from './build-request-engine.js';
export { createDeferRecord, deferRecordKey } from './defer-record-engine.js';
export { createResearchRequestPacket, researchPacketKey } from './research-request-engine.js';

export {
  buildSafeAcquisitionReport,
  buildSafeAcquisitionReportOutput,
  formatSafeAcquisitionReport,
} from './safe-acquisition-report.js';

export {
  acquisitionStateIncludes,
  createDevPulseV2SafeCapabilityAcquisition,
  DevPulseV2SafeCapabilityAcquisition,
  getDevPulseV2SafeCapabilityAcquisition,
  planStructuralKey,
  processAcquisitionPlan,
  resetDevPulseV2SafeCapabilityAcquisitionForTests,
  scanModuleForForbiddenPatterns,
} from './safe-capability-acquisition.js';

export type {
  AcquisitionConfirmation,
  AcquisitionInput,
  AcquisitionMode,
  AcquisitionPlanResult,
  AcquisitionReadiness,
  AcquisitionRiskLevel,
  AcquisitionState,
  AcquisitionStrategy,
  ApprovalRequirement,
  AuthStatus,
  BuildRequestPacket,
  DeferRecord,
  GateRecord,
  GovernanceStatus,
  ResearchRequestPacket,
  RollbackRequirement,
  SafeAcquisitionReport,
  SafeAcquisitionReportOutput,
  SafeCapabilityAcquisitionState,
  VerificationRequirement,
} from './types.js';

export {
  ACQUISITION_RISK_LEVELS,
  ACQUISITION_STATE_SEQUENCE,
  APPROVAL_REQUIRED_MODES,
  CODE_GEN_BLOCKED_PATTERNS,
  DEPENDENCY_SYSTEMS,
  DEPLOY_BLOCKED_PATTERNS,
  DOWNLOAD_BLOCKED_PATTERNS,
  DUPLICATE_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  FILE_MOD_BLOCKED_PATTERNS,
  INSTALL_BLOCKED_PATTERNS,
  KNOWN_ACQUISITION_MODES,
  KNOWN_ACQUISITION_STRATEGIES,
  MODE_TO_STRATEGY,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
  resetAcquisitionCountersForTests,
  SAFE_CAPABILITY_ACQUISITION_OWNER_MODULE,
  SAFE_CAPABILITY_ACQUISITION_PASS_TOKEN,
} from './types.js';
