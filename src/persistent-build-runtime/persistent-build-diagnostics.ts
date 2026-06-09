/**
 * Persistent Build Runtime Foundation — diagnostics tracker.
 */

import { listStoredPersistentBuilds, listStoredPersistentBuildSessions } from './persistent-build-store.js';
import { detectBuildRuntimeMismatch } from './persistent-build-cloud-bridge.js';
import { detectBuildWorkspaceMismatch } from './persistent-build-workspace-bridge.js';
import type { PersistentBuildDiagnostics, PersistentBuildState } from './persistent-build-types.js';

let diagnostics: PersistentBuildDiagnostics = {
  persistentBuildAuthorityActive: false,
  registeredBuildCount: 0,
  activeSessionCount: 0,
  readyBuildCount: 0,
  pausedBuildCount: 0,
  waitingBuildCount: 0,
  blockedBuildCount: 0,
  duplicateRiskCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getPersistentBuildDiagnostics(): PersistentBuildDiagnostics {
  return { ...diagnostics };
}

export function updatePersistentBuildDiagnostics(
  query: string,
  state: PersistentBuildState | null,
  duplicateRiskCount = 0,
): void {
  const builds = listStoredPersistentBuilds();
  const sessions = listStoredPersistentBuildSessions();
  let runtimeMismatch = 0;
  let workspaceMismatch = 0;
  for (const b of builds) {
    if (detectBuildRuntimeMismatch(b.buildId)) runtimeMismatch += 1;
    if (detectBuildWorkspaceMismatch(b.buildId)) workspaceMismatch += 1;
  }

  diagnostics = {
    persistentBuildAuthorityActive: builds.length > 0,
    registeredBuildCount: builds.length,
    activeSessionCount: sessions.length,
    readyBuildCount: builds.filter((b) => b.buildState === 'READY' || b.buildState === 'ACTIVE').length,
    pausedBuildCount: builds.filter((b) => b.buildState === 'PAUSED').length,
    waitingBuildCount: builds.filter((b) =>
      b.buildState === 'WAITING_FOR_APPROVAL' ||
      b.buildState === 'WAITING_FOR_VERIFICATION' ||
      b.buildState === 'WAITING_FOR_RECOVERY',
    ).length,
    blockedBuildCount: builds.filter((b) => b.buildState === 'FAILED' || b.buildState === 'ARCHIVED').length,
    duplicateRiskCount,
    runtimeMismatchCount: runtimeMismatch,
    workspaceMismatchCount: workspaceMismatch,
    lastQuery: query,
    lastState: state,
  };
}

export function resetPersistentBuildDiagnosticsForTests(): void {
  diagnostics = {
    persistentBuildAuthorityActive: false,
    registeredBuildCount: 0,
    activeSessionCount: 0,
    readyBuildCount: 0,
    pausedBuildCount: 0,
    waitingBuildCount: 0,
    blockedBuildCount: 0,
    duplicateRiskCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function persistentBuildRuntimeFoundationKey(): string {
  return 'persistent_build_runtime_foundation';
}
