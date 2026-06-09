/**
 * Persistent Build Runtime Foundation — resume metadata (no rollback execution).
 */

import { getStoredPersistentBuild, storePersistentBuild } from './persistent-build-store.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuildResumeState, PersistentBuildState } from './persistent-build-types.js';

export function buildInitialResumeState(resumable = true): PersistentBuildResumeState {
  return {
    canResume: resumable,
    resumeReason: null,
    resumeCheckpointId: null,
    lastKnownGoodState: null,
    lastKnownGoodTimestamp: null,
    resumeInstructions: null,
    resumeRiskLevel: 'LOW',
  };
}

export function updateResumeState(
  buildId: string,
  updates: Partial<PersistentBuildResumeState>,
): PersistentBuildResumeState | null {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return null;

  const resumeState: PersistentBuildResumeState = { ...build.buildResumeState, ...updates };
  storePersistentBuild({ ...build, buildResumeState: resumeState, updatedAt: Date.now() });

  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'RESUME',
    summary: `Resume state updated: canResume=${resumeState.canResume} risk=${resumeState.resumeRiskLevel}`,
    scopeUsed: resumeState.resumeCheckpointId,
  });

  return resumeState;
}

export function markResumeCheckpoint(
  buildId: string,
  state: PersistentBuildState,
  reason: string,
): PersistentBuildResumeState | null {
  return updateResumeState(buildId, {
    canResume: true,
    resumeReason: reason,
    resumeCheckpointId: `chk-${buildId}-${Date.now()}`,
    lastKnownGoodState: state,
    lastKnownGoodTimestamp: Date.now(),
    resumeInstructions: 'Authority resume metadata only — no rollback execution',
    resumeRiskLevel: 'LOW',
  });
}

export function getBuildResumeState(buildId: string): PersistentBuildResumeState | null {
  return getStoredPersistentBuild(buildId)?.buildResumeState ?? null;
}

export function validateResumeMetadata(state: PersistentBuildResumeState): string[] {
  const issues: string[] = [];
  if (state.canResume && !state.resumeCheckpointId) {
    issues.push('Invalid resume metadata — canResume without checkpoint id');
  }
  return issues;
}
