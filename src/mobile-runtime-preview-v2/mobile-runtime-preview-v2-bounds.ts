/**
 * Mobile Runtime Preview V2 — bounds and pass tokens.
 * Bounded Android emulator launch + verification.
 */

export const MOBILE_RUNTIME_PREVIEW_V2_PASS_TOKEN = 'MOBILE_RUNTIME_PREVIEW_V2_PASS';

export const MOBILE_RUNTIME_PREVIEW_V2_ANDROID_UNAVAILABLE_TOKEN =
  'MOBILE_RUNTIME_PREVIEW_V2_ANDROID_UNAVAILABLE';

export const MOBILE_RUNTIME_PREVIEW_V2_OWNER_MODULE = 'mobile-runtime-preview-v2';

export const MOBILE_RUNTIME_PREVIEW_V2_ARTIFACT_DIR = '.mobile-runtime-preview-v2';

export const MOBILE_RUNTIME_PREVIEW_V2_REPORT_FILENAME = 'MOBILE_RUNTIME_PREVIEW_V2_REPORT.md';

export const ANDROID_EMULATOR_LAUNCH_EVIDENCE_FILENAME = 'android-emulator-launch-evidence.json';

/** Default bounded launch timeout (ms). */
export const DEFAULT_ANDROID_LAUNCH_TIMEOUT_MS = 120_000;

/** Poll interval while waiting for device/boot (ms). */
export const ANDROID_LAUNCH_POLL_INTERVAL_MS = 2_000;

/** Preferred AVD when present on host. */
export const DEFAULT_PREFERRED_AVD = 'Medium_Phone_API_36.1';

/** Immediate stderr capture window after emulator spawn (ms). */
export const EMULATOR_SPAWN_OBSERVE_MS = 4_000;

export const DOCUMENTED_ANDROID_VERDICTS = [
  'VERIFIED',
  'AVAILABLE_NOT_BOOTED',
  'LAUNCH_TIMED_OUT',
  'UNSUPPORTED_HOST_CONFIG',
  'NO_AVD_AVAILABLE',
  'DEVICE_UNAUTHORIZED',
  'DEVICE_OFFLINE',
  'TOOLCHAIN_MISSING',
  'UNKNOWN_FAILURE',
] as const;
