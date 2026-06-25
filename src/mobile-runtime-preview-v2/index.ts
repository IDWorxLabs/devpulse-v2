/**
 * Mobile Runtime Preview V2 — public API.
 * Bounded Android emulator launch + verification on V1/V1.1 foundation.
 */

export {
  MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN,
  MOBILE_RUNTIME_PREVIEW_V2_ANDROID_UNAVAILABLE_TOKEN,
  MOBILE_RUNTIME_PREVIEW_V2_OWNER_MODULE,
  MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR,
  MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME,
  ANDROID_EMULATOR_LAUNCH_EVIDENCE_FILENAME,
  DEFAULT_ANDROID_LAUNCH_TIMEOUT_MS,
  ANDROID_LAUNCH_POLL_INTERVAL_MS,
  DOCUMENTED_ANDROID_VERDICTS,
} from './mobile-runtime-preview-v2-bounds.js';

export type {
  AndroidVerificationVerdict,
  AdbDeviceInfo,
  AndroidDeviceStateCapture,
  AndroidEmulatorLaunchEvidence,
  AndroidEmulatorLaunchOptions,
  MobileRuntimePreviewV2Assessment,
  AssessMobileRuntimePreviewV2Input,
} from './mobile-runtime-preview-v2-types.js';

export { AndroidEmulatorLaunchController } from './android-emulator-launch-controller.js';

export {
  AndroidRuntimeAdapterV2,
  runBoundedAndroidLaunch,
  getLastAndroidLaunchEvidence,
  resetAndroidRuntimeV2ForTests,
} from './android-runtime-adapter-v2.js';

export {
  buildV2WorkspaceSignals,
  assessMobileRuntimeRealityWithV2Evidence,
} from './mobile-runtime-preview-v2-reality-bridge.js';

export {
  assessMobileRuntimePreviewV2,
  writeMobileRuntimePreviewV2Artifacts,
  resetMobileRuntimePreviewV2CounterForTests,
} from './mobile-runtime-preview-v2-authority.js';

export { buildMobileRuntimePreviewV2ReportMarkdown } from './mobile-runtime-preview-v2-report-builder.js';
