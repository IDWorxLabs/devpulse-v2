/**
 * Persistent Build Runtime Foundation — build progress metadata (no task execution).
 */

import { getStoredPersistentBuild, storePersistentBuild } from './persistent-build-store.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuildProgress } from './persistent-build-types.js';

export function buildInitialBuildProgress(): PersistentBuildProgress {
  return {
    progressState: 'NOT_STARTED',
    progressPercent: 0,
    completedSteps: [],
    remainingSteps: ['initialize', 'link-runtime', 'link-workspace', 'ready-authority'],
    blockedSteps: [],
    lastProgressMessage: 'Persistent build registered — progress metadata only',
    lastUpdatedAt: Date.now(),
  };
}

export function updateBuildProgress(
  buildId: string,
  updates: Partial<PersistentBuildProgress>,
): PersistentBuildProgress | null {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return null;

  const progress: PersistentBuildProgress = {
    ...build.buildProgress,
    ...updates,
    lastUpdatedAt: Date.now(),
  };

  if (progress.progressPercent < 0) progress.progressPercent = 0;
  if (progress.progressPercent > 100) progress.progressPercent = 100;

  storePersistentBuild({ ...build, buildProgress: progress, updatedAt: Date.now() });

  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'PROGRESS',
    summary: `Progress ${progress.progressPercent}% — ${progress.lastProgressMessage}`,
    scopeUsed: progress.progressState,
  });

  return progress;
}

export function getBuildProgress(buildId: string): PersistentBuildProgress | null {
  return getStoredPersistentBuild(buildId)?.buildProgress ?? null;
}

export function validateProgressPercent(percent: number): boolean {
  return Number.isFinite(percent) && percent >= 0 && percent <= 100;
}
