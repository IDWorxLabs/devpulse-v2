/**
 * Cloud Runtime Foundation — diagnostics tracker.
 */

import { listStoredRuntimes, listStoredSessions } from './cloud-runtime-store.js';
import type { CloudRuntimeDiagnostics, CloudRuntimeState } from './cloud-runtime-types.js';

let diagnostics: CloudRuntimeDiagnostics = {
  cloudRuntimeAuthorityActive: false,
  registeredRuntimeCount: 0,
  activeSessionCount: 0,
  readyRuntimeCount: 0,
  blockedRuntimeCount: 0,
  duplicateRiskCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getCloudRuntimeDiagnostics(): CloudRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateCloudRuntimeDiagnostics(
  query: string,
  state: CloudRuntimeState | null,
  duplicateRiskCount = 0,
): void {
  const runtimes = listStoredRuntimes();
  const sessions = listStoredSessions();
  diagnostics = {
    cloudRuntimeAuthorityActive: runtimes.length > 0,
    registeredRuntimeCount: runtimes.length,
    activeSessionCount: sessions.length,
    readyRuntimeCount: runtimes.filter((r) => r.runtimeState === 'READY' || r.runtimeState === 'ACTIVE').length,
    blockedRuntimeCount: runtimes.filter((r) => r.runtimeState === 'FAILED' || r.runtimeState === 'ARCHIVED').length,
    duplicateRiskCount,
    lastQuery: query,
    lastState: state,
  };
}

export function resetCloudRuntimeDiagnosticsForTests(): void {
  diagnostics = {
    cloudRuntimeAuthorityActive: false,
    registeredRuntimeCount: 0,
    activeSessionCount: 0,
    readyRuntimeCount: 0,
    blockedRuntimeCount: 0,
    duplicateRiskCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function cloudRuntimeFoundationKey(): string {
  return 'cloud_runtime_foundation';
}
