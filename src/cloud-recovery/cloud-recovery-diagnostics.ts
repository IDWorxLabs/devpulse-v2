/**
 * Cloud Recovery Foundation — diagnostics tracker.
 */

import { listStoredCloudRecoveries, listStoredCloudRecoverySessions } from './cloud-recovery-store.js';
import { detectRecoveryRuntimeMismatch } from './cloud-recovery-runtime-bridge.js';
import { detectRecoveryWorkspaceMismatch } from './cloud-recovery-workspace-bridge.js';
import { detectRecoveryBuildMismatch } from './cloud-recovery-build-bridge.js';
import { detectRecoveryVerificationMismatch } from './cloud-recovery-verification-bridge.js';
import type { CloudRecoveryDiagnostics, CloudRecoveryState } from './cloud-recovery-types.js';

let diagnostics: CloudRecoveryDiagnostics = {
  cloudRecoveryAuthorityActive: false,
  registeredRecoveryCount: 0,
  activeSessionCount: 0,
  readyRecoveryCount: 0,
  waitingRecoveryCount: 0,
  blockedRecoveryCount: 0,
  duplicateRiskCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  verificationMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getCloudRecoveryDiagnostics(): CloudRecoveryDiagnostics {
  return { ...diagnostics };
}

export function updateCloudRecoveryDiagnostics(
  query: string,
  finalState: CloudRecoveryState | null = null,
  duplicateRiskCount = 0,
): CloudRecoveryDiagnostics {
  const recoveries = listStoredCloudRecoveries();
  const sessions = listStoredCloudRecoverySessions();

  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let verificationMismatchCount = 0;

  for (const r of recoveries) {
    if (detectRecoveryRuntimeMismatch(r.recoveryId)) runtimeMismatchCount += 1;
    if (detectRecoveryWorkspaceMismatch(r.recoveryId)) workspaceMismatchCount += 1;
    if (detectRecoveryBuildMismatch(r.recoveryId)) buildMismatchCount += 1;
    if (detectRecoveryVerificationMismatch(r.recoveryId)) verificationMismatchCount += 1;
  }

  diagnostics = {
    cloudRecoveryAuthorityActive: recoveries.length > 0,
    registeredRecoveryCount: recoveries.length,
    activeSessionCount: sessions.length,
    readyRecoveryCount: recoveries.filter(
      (r) => r.recoveryState === 'RECOVERY_READY' || r.recoveryState === 'COMPLETED',
    ).length,
    waitingRecoveryCount: recoveries.filter((r) => r.recoveryState.startsWith('WAITING_')).length,
    blockedRecoveryCount: recoveries.filter((r) => r.recoveryState === 'FAILED').length,
    duplicateRiskCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    verificationMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getCloudRecoveryDiagnostics();
}

export function resetCloudRecoveryDiagnosticsForTests(): void {
  diagnostics = {
    cloudRecoveryAuthorityActive: false,
    registeredRecoveryCount: 0,
    activeSessionCount: 0,
    readyRecoveryCount: 0,
    waitingRecoveryCount: 0,
    blockedRecoveryCount: 0,
    duplicateRiskCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    verificationMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function cloudRecoveryFoundationKey(): string {
  return 'cloud_recovery_foundation';
}
