/**
 * DevPulse V2 Phase 16.8 — Verification Registry public API.
 */

export {
  VERIFICATION_REGISTRY_PASS_TOKEN,
  VERIFICATION_REGISTRY_OWNER_MODULE,
  VERIFICATION_REGISTRY_QUESTION_SIGNALS,
  FORBIDDEN_VERIFICATION_REGISTRY_DUPLICATES,
  INITIAL_VERIFICATION_TARGET_CATEGORIES,
  isVerificationRegistryQuestion,
  isVerificationRegistryAdvisoryQuestion,
  isDuplicateVerificationRegistryQuestion,
  type VerificationTargetCategory,
  type VerificationRegistryState,
  type OwnerStatus,
  type VerificationTarget,
  type VerificationOwnerRecord,
  type VerificationDependencyRecord,
  type VerificationRequirementRecord,
  type VerificationCapabilityRecord,
  type VerificationRegistryReport,
  type VerificationRegistryDiagnostics,
  type PrepareVerificationRegistryInput,
  type PrepareVerificationRegistryResult,
} from './types.js';

export {
  registerVerificationTarget,
  registerInitialTargets,
  getVerificationTarget,
  getVerificationTargetByCategory,
  listVerificationTargets,
  buildInitialTargetDefinition,
  updateVerificationTarget,
  resetVerificationTargetRegistryForTests,
  type RegisterTargetResult,
} from './verification-target-registry.js';

export {
  registerVerificationOwner,
  registerInitialOwners,
  getVerificationOwner,
  listVerificationOwners,
  buildOwnerRecord,
  resetVerificationOwnerRegistryForTests,
} from './verification-owner-registry.js';

export {
  registerVerificationDependency,
  registerInitialDependencies,
  getVerificationDependency,
  listVerificationDependencies,
  buildDependencyRecord,
  resetVerificationDependencyRegistryForTests,
  type RegisterDependencyResult,
} from './verification-dependency-registry.js';

export {
  registerVerificationRequirement,
  registerInitialRequirements,
  getVerificationRequirement,
  listVerificationRequirements,
  buildRequirementRecord,
  resetVerificationRequirementRegistryForTests,
  type RegisterRequirementResult,
} from './verification-requirement-registry.js';

export {
  registerVerificationCapability,
  registerInitialCapabilities,
  getVerificationCapability,
  listVerificationCapabilities,
  buildCapabilityRecord,
  resetVerificationCapabilityRegistryForTests,
  type RegisterCapabilityResult,
} from './verification-capability-registry.js';

export {
  evaluateVerificationRegistryGates,
  validateVerificationRegistry,
  validateDependencyRegistration,
  validateOwnerExists,
  type VerificationRegistryGateReport,
  type VerificationRegistryValidationResult,
} from './verification-registry-validator.js';

export {
  buildVerificationRegistryReport,
  composeVerificationRegistryResponse,
  buildVerificationRegistryFailureContext,
  deriveRegistryState,
  nextVerificationRegistryReportId,
  resetVerificationRegistryReportCounterForTests,
  type VerificationRegistryFailureContext,
} from './verification-registry-report.js';

export {
  getVerificationRegistryDiagnostics,
  updateVerificationRegistryDiagnostics,
  resetVerificationRegistryDiagnostics,
  verificationRegistryKey,
} from './verification-registry-diagnostics.js';

export {
  prepareVerificationRegistry,
  processVerificationRegistryRequest,
  getVerificationRegistryContext,
} from './verification-registry.js';

export function getDevPulseV2VerificationRegistry(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_verification_registry',
    passToken: 'VERIFICATION_REGISTRY_V1_PASS',
    phase: 16.8,
    extensionOnly: true,
  };
}
