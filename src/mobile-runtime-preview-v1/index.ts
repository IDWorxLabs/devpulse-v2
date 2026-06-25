/**
 * Mobile Runtime Preview V1 — public API.
 * Platform capability for AiDevEngine mobile runtime orchestration.
 */

export {
  MOBILE_RUNTIME_PREVIEW_V1_PASS_TOKEN,
  MOBILE_RUNTIME_PREVIEW_V1_OWNER_MODULE,
  MOBILE_RUNTIME_PREVIEW_V1_ARTIFACT_DIR,
  MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME,
  MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME,
  MOBILE_RUNTIME_KINDS,
  REUSED_MOBILE_PREVIEW_MODULES,
} from './mobile-runtime-preview-bounds.js';

export type {
  MobileRuntimeKind,
  AndroidRuntimeState,
  AndroidToolchainResolution,
  MobileRuntimeCapabilityMatrix,
  MobileRuntimeAdapterStatus,
  MobileRuntimeLaunchInput,
  MobileRuntimeLaunchResult,
  MobileRuntimeVerificationResult,
  MobileRuntimeVerificationRecord,
  MobileRuntimePreviewRegistry,
  MobileRuntimePreviewRegistryEntry,
  MobileRuntimeRealityBridgeResult,
  MobileRuntimePreviewAssessment,
  AssessMobileRuntimePreviewInput,
} from './mobile-runtime-preview-types.js';

export type { MobileRuntimeAdapter, MobileRuntimeAdapterRegistry } from './runtime-adapter-types.js';

export {
  detectMobileRuntimeCapabilities,
  buildCapabilityMatrixSummary,
} from './mobile-runtime-capability-registry.js';

export {
  resolveAndroidSdkPath,
  resolveAndroidToolchain,
  resolveAdbPath,
  resolveEmulatorPath,
  listAndroidAvds,
  classifyAndroidRuntimeState,
} from './android-sdk-path-resolver.js';

export {
  createMobileRuntimeAdapterRegistry,
  shutdownAllRuntimeAdapters,
} from './runtime-adapters.js';

export { buildMobileRuntimePreviewRegistry } from './mobile-runtime-preview-registry-builder.js';

export {
  buildWorkspaceSignalsFromVerification,
  assessMobileRuntimeRealityWithPreviewEvidence,
} from './mobile-runtime-reality-bridge.js';

export {
  assessMobileRuntimePreviewV1,
  writeMobileRuntimePreviewArtifacts,
  resetMobileRuntimePreviewCounterForTests,
} from './mobile-runtime-preview-authority.js';

export { buildMobileRuntimePreviewReportMarkdown } from './mobile-runtime-preview-report-builder.js';
