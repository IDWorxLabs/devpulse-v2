/**
 * Launch Project Hydration V1 — client hydration reliability types and helpers.
 */

export const LAUNCH_PROJECT_HYDRATION_PASS_TOKEN = 'LAUNCH_PROJECT_HYDRATION_V1_PASS';

export const REGISTRY_CACHE_STORAGE_KEY = 'aidevengine.project-registry-cache.v1';

export const REGISTRY_HYDRATION_RETRY_ATTEMPTS = 3;
export const REGISTRY_HYDRATION_RETRY_BASE_MS = 400;
export const REGISTRY_HYDRATION_SLOW_THRESHOLD_MS = 10000;
export const REGISTRY_HYDRATION_EXPECTED_MAX_MS = 3000;

export type RegistryHydrationState = 'pending' | 'loading' | 'ready' | 'error' | 'stale-fallback';

export interface CachedRegistryPayload {
  readOnly: true;
  cachedAt: string;
  registryPath: string | null;
  updatedAt: string | null;
  payload: unknown;
}

export interface RegistryHydrationEvidence {
  readOnly: true;
  hydrationState: RegistryHydrationState;
  hydrationDurationMs: number;
  usedCachedFallback: boolean;
  retryCount: number;
  endpoint: string | null;
  projectCount: number;
  error: string | null;
}

export function computeRegistryRetryDelayMs(attempt: number): number {
  return REGISTRY_HYDRATION_RETRY_BASE_MS * Math.pow(2, Math.max(0, attempt - 1));
}

export function shouldShowRegistryLoadingCounts(hydrationState: RegistryHydrationState): boolean {
  return hydrationState === 'pending' || hydrationState === 'loading';
}

export function formatRegistryCountForUi(
  hydrationState: RegistryHydrationState,
  count: number,
): string {
  if (shouldShowRegistryLoadingCounts(hydrationState)) return '—';
  return String(count);
}

export function isRegistryHydrationSlow(durationMs: number): boolean {
  return durationMs > REGISTRY_HYDRATION_SLOW_THRESHOLD_MS;
}

export function buildRegistryHydrationTraceMessage(evidence: RegistryHydrationEvidence): string {
  return [
    'PROJECT_REGISTRY_HYDRATION',
    `state=${evidence.hydrationState}`,
    `durationMs=${evidence.hydrationDurationMs}`,
    `count=${evidence.projectCount}`,
    evidence.usedCachedFallback ? 'fallback=stale-cache' : 'fallback=none',
    evidence.retryCount > 0 ? `retries=${evidence.retryCount}` : null,
  ]
    .filter(Boolean)
    .join(' ');
}
