/**
 * Universal Capability Pack Framework V1 — public exports.
 */

export {
  buildCapabilityPackMaterializationInputFromEnvelope,
  materializeCapabilityPacksForWorkspace,
  augmentWorkspaceFilesWithCapabilityPacks,
  shouldMaterializeCapabilityPacks,
  resetCapabilityPackFrameworkForTests,
  buildCapabilityPackSharedRuntimeFiles,
  bootstrapCapabilityPackRegistry,
  registerPack,
  getPack,
  listPacks,
  listProductionReadyPacks,
  findProvidersForCapability,
  validatePack,
  fingerprintPack,
  detectDuplicateCapabilityProvider,
  resolveCapabilityRequirement,
  resolveAllCapabilityRequirements,
  resolvePackDependencies,
  validatePackCompatibility,
  validatePackConfiguration,
  mergePackConfiguration,
  buildCapabilityCompositionPlan,
  detectContributionCollisions,
  verifyPackBehavior,
  detectStaticCapabilityShell,
  diagnoseCapabilityPackGaps,
  buildCapabilityPackMaterializationReport,
  computeCapabilityPackCoverageScore,
  enforceLifecycleOrder,
  FUTURE_CAPABILITY_PACK_CATALOG,
  UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION,
  UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE,
  stableCapabilityRequirementId,
  CAPABILITY_PACK_RUNTIME_EVENT_TYPES,
} from './universal-capability-pack-framework.js';

export type {
  CapabilityRequirementDescriptor,
  CapabilityPackDescriptor,
  CapabilityCompositionPlan,
  CapabilityPackMaterializationInput,
  CapabilityPackMaterializationReport,
  PackSupportStatus,
  RequirementResolutionOutcome,
  PackLifecycleStage,
  PackVerificationClassification,
  CapabilityCategory,
} from './universal-capability-pack-types.js';

export type { CapabilityPackWorkspaceMaterializationResult } from './universal-capability-pack-framework.js';

export { extractCapabilityRequirementsFromEnvelope } from './approved-capability-requirement-extractor.js';
export { normalizeCapabilityKey, normalizeCapabilityRequirements } from './capability-requirement-normalizer.js';
export { isSelectablePackStatus, countsTowardBehavioralCoverage } from './capability-pack-support-classifier.js';
