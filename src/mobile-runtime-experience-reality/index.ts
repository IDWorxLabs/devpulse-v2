/**
 * Mobile Runtime Experience Reality — public exports (Phase 24C.5).
 */

export {
  MOBILE_RUNTIME_EXPERIENCE_REALITY_PASS_TOKEN,
  MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE,
  MOBILE_RUNTIME_NEVER_PROOF,
  MAX_HISTORY_ENTRIES,
  MAX_MOBILE_RUNTIME_BLOCKERS,
  MAX_MOBILE_RUNTIME_EVIDENCE,
  MAX_REGISTRY_ENTRIES,
} from './mobile-runtime-experience-reality-bounds.js';

export type {
  AndroidRuntimeRealityLevel,
  CloudRuntimeRealityLevel,
  DeviceFrameRealityLevel,
  ExpoRuntimeRealityLevel,
  IosRuntimeRealityLevel,
  MobileExperienceCompletenessLevel,
  MobileRuntimeAreaId,
  MobileSimulationRealityLevel,
} from './mobile-runtime-experience-reality-analyzer-types.js';

export type {
  AssessMobileRuntimeExperienceRealityInput,
  MobileRuntimeBlocker,
  MobileRuntimeEvidence,
  MobileRuntimeExperienceRealityAssessment,
  MobileRuntimeMatrixRow,
  MobileRuntimeModulePresenceEvidence,
  MobileRuntimeReport,
  MobileRuntimeStage,
  MobileRuntimeSubscores,
  MobileRuntimeWorkspaceSignals,
} from './mobile-runtime-experience-reality-types.js';

export {
  analyzeAndroidRuntimeReality,
  analyzeCloudDeviceRuntimeReality,
  analyzeDeviceFrameReality,
  analyzeExpoRuntimeReality,
  analyzeIosRuntimeReality,
  analyzeMobileExperienceCompleteness,
  analyzeMobileSimulationReality,
  buildMobileRuntimeWorkspaceSignalsForValidation,
  collectMobileRuntimeEvidence,
  detectMobileRuntimeModulePresenceEvidence,
  getMobileRuntimeBoundedScanPaths,
  runAllMobileRuntimeAnalyzers,
} from './mobile-runtime-experience-reality-analyzers.js';

export {
  getMobileRuntimeRegistryCount,
  listMobileRuntimeRegistryEntries,
  resetMobileRuntimeExperienceRegistryForTests,
  storeMobileRuntimeRegistryEntry,
} from './mobile-runtime-experience-reality-registry.js';

export type { MobileRuntimeRegistryEntry } from './mobile-runtime-experience-reality-registry.js';
export type { MobileRuntimeHistoryEntry } from './mobile-runtime-experience-reality-history.js';

export {
  getMobileRuntimeHistoryCount,
  listMobileRuntimeHistory,
  recordMobileRuntimeHistory,
  resetMobileRuntimeExperienceHistoryForTests,
} from './mobile-runtime-experience-reality-history.js';

export {
  MOBILE_RUNTIME_EXPERIENCE_REALITY_OWNER_MODULE as MOBILE_RUNTIME_OWNER,
  assessMobileRuntimeExperienceReality,
  buildMobileRuntimeExperienceRealityReport,
  getMobileRuntimeExperienceDashboardSummary,
  resetMobileRuntimeExperienceRealityCounterForTests,
  writeMobileRuntimeExperienceRealityReportFile,
} from './mobile-runtime-experience-reality-authority.js';
