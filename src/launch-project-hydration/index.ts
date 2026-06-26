/**
 * Launch Project Hydration V1 — public API.
 */

export {
  LAUNCH_PROJECT_HYDRATION_PASS_TOKEN,
  REGISTRY_CACHE_STORAGE_KEY,
  REGISTRY_HYDRATION_EXPECTED_MAX_MS,
  REGISTRY_HYDRATION_RETRY_ATTEMPTS,
  REGISTRY_HYDRATION_RETRY_BASE_MS,
  REGISTRY_HYDRATION_SLOW_THRESHOLD_MS,
  buildRegistryHydrationTraceMessage,
  computeRegistryRetryDelayMs,
  formatRegistryCountForUi,
  isRegistryHydrationSlow,
  shouldShowRegistryLoadingCounts,
} from './launch-project-hydration-types.js';

export type {
  CachedRegistryPayload,
  RegistryHydrationEvidence,
  RegistryHydrationState,
} from './launch-project-hydration-types.js';
