/**
 * Incremental Autonomous Builder — durable build state store.
 */

import type { BuildStateSnapshot } from './incremental-builder-types.js';

const stateStore = new Map<string, BuildStateSnapshot>();

export function resetBuildStateStoreForTests(): void {
  stateStore.clear();
}

export function saveBuildState(state: BuildStateSnapshot): void {
  stateStore.set(state.buildId, state);
}

export function loadBuildState(buildId: string): BuildStateSnapshot | null {
  return stateStore.get(buildId) ?? null;
}

export function createInitialBuildState(buildId: string): BuildStateSnapshot {
  return {
    readOnly: true,
    buildId,
    currentSliceId: null,
    completedSliceIds: [],
    blockedSliceIds: [],
    failedSliceIds: [],
    repairAttempts: {},
    rollbackPoints: [],
    wholeAppAssemblyStatus: 'PENDING',
    lastStableBoundary: null,
    updatedAt: Date.now(),
  };
}

export function updateBuildState(
  buildId: string,
  patch: Partial<Omit<BuildStateSnapshot, 'readOnly' | 'buildId'>>,
): BuildStateSnapshot {
  const current = stateStore.get(buildId) ?? createInitialBuildState(buildId);
  const next: BuildStateSnapshot = {
    ...current,
    ...patch,
    readOnly: true,
    buildId,
    updatedAt: Date.now(),
  };
  stateStore.set(buildId, next);
  return next;
}

export function getResumableSliceId(state: BuildStateSnapshot, orderedSliceIds: readonly string[]): string | null {
  const completed = new Set(state.completedSliceIds);
  for (const id of orderedSliceIds) {
    if (!completed.has(id) && !state.blockedSliceIds.includes(id) && !state.failedSliceIds.includes(id)) {
      return id;
    }
  }
  return null;
}
