/**
 * Virtual Device Laboratory — public exports.
 */

import { resetVirtualDeviceAuthorityForTests } from './virtual-device-authority.js';

export {
  VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN,
  VIRTUAL_DEVICE_LABORATORY_OWNER_MODULE,
  DEFAULT_MAX_DEVICE_HISTORY,
  DEFAULT_MAX_DEVICE_MATRIX_ENTRIES,
  DEFAULT_DEVICE_TIMEOUT_MS,
  DEFAULT_LOW_END_RENDER_THRESHOLD_MS,
} from './virtual-device-types.js';

export type {
  DeviceType,
  DeviceOrientation,
  ThemeMode,
  PerformanceTier,
  PerformanceStatus,
  DeviceVerdict,
  DeviceFailureCategory,
  DeviceProfile,
  DeviceMatrixEntry,
  EnvironmentLaunchPlan,
  DeviceValidationCheck,
  DevicePerformanceSample,
  DeviceFailureReport,
  DeviceRepairRecommendation,
  DeviceProfileResult,
  WholeAppDeviceSweepResult,
  VirtualDevicePipelineInput,
  VirtualDevicePipelineResult,
  LaunchVirtualDeviceEvidence,
  VirtualDeviceReadinessResult,
  LivePreviewVirtualDeviceGateResult,
} from './virtual-device-types.js';

export {
  getDevPulseV2VirtualDeviceLaboratory,
  registerVirtualDeviceLaboratoryWithLaunchAuthority,
  registerVirtualDeviceLaboratoryWithVirtualUserEngine,
  registerVirtualDeviceLaboratoryWithLivePreviewGate,
} from './virtual-device-registry.js';

export { discoverDeviceProfiles, resetDeviceProfileDiscoveryForTests } from './device-profile-discovery.js';
export { buildDeviceMatrix, resetDeviceMatrixBuilderForTests } from './device-matrix-builder.js';
export { planEnvironmentLaunches } from './environment-launch-planner.js';
export { validateDeviceRender } from './device-render-validator.js';
export { validateResponsiveLayout } from './responsive-layout-validator.js';
export { validateDeviceNavigation } from './device-navigation-validator.js';
export { validateInteractionReachability } from './device-interaction-reachability.js';
export { validateDeviceAccessibilityScaling, validateDeviceTheme } from './device-accessibility-scaling.js';
export { sampleDevicePerformance } from './device-performance-sampler.js';
export { classifyDeviceFailure, resetDeviceFailureClassifierForTests } from './device-failure-classifier.js';
export { recommendDeviceRepair, resetDeviceRepairRecommenderForTests } from './device-repair-recommender.js';
export { buildVirtualDevicePipelineReport } from './virtual-device-report-builder.js';
export {
  recordVirtualDeviceHistory,
  getVirtualDeviceHistorySize,
  getLastCompletedDeviceProfileIds,
  resetVirtualDeviceHistoryForTests,
} from './virtual-device-history.js';
export { assessVirtualDeviceReadiness } from './virtual-device-readiness.js';
export { evaluateLivePreviewVirtualDeviceGate } from './virtual-device-live-preview-gate.js';
export {
  runVirtualDevicePipeline,
  simulateVirtualDeviceImpactForFeatureSlice,
  getLastVirtualDevicePipelineResult,
  isVirtualDeviceLaboratoryReadyForPreview,
  buildLaunchVirtualDeviceEvidence,
  getVirtualDevicePassToken,
  resetVirtualDeviceAuthorityForTests,
} from './virtual-device-authority.js';

export function resetVirtualDeviceLaboratoryModuleForTests(): void {
  resetVirtualDeviceAuthorityForTests();
}
