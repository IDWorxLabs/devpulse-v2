/**
 * Cloud Verification Foundation — diagnostics tracker.
 */

import { listStoredCloudVerifications, listStoredCloudVerificationSessions } from './cloud-verification-store.js';
import { detectCloudVerificationRuntimeMismatch } from './cloud-verification-runtime-bridge.js';
import { detectCloudVerificationWorkspaceMismatch } from './cloud-verification-workspace-bridge.js';
import { detectCloudVerificationBuildMismatch } from './cloud-verification-build-bridge.js';
import { detectEvidenceMismatch } from './cloud-verification-evidence-bridge.js';
import { detectReportMismatch } from './cloud-verification-report-bridge.js';
import { detectUnifiedVerificationMismatch } from './cloud-verification-unified-entry-bridge.js';
import type { CloudVerificationDiagnostics, CloudVerificationState } from './cloud-verification-types.js';

let diagnostics: CloudVerificationDiagnostics = {
  cloudVerificationAuthorityActive: false,
  registeredVerificationCount: 0,
  activeSessionCount: 0,
  readyVerificationCount: 0,
  waitingVerificationCount: 0,
  blockedVerificationCount: 0,
  duplicateRiskCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  evidenceMismatchCount: 0,
  reportMismatchCount: 0,
  unifiedEntryMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getCloudVerificationDiagnostics(): CloudVerificationDiagnostics {
  return { ...diagnostics };
}

export function updateCloudVerificationDiagnostics(
  query: string,
  finalState: CloudVerificationState | null = null,
  duplicateRiskCount = 0,
): CloudVerificationDiagnostics {
  const verifications = listStoredCloudVerifications();
  const sessions = listStoredCloudVerificationSessions();

  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let evidenceMismatchCount = 0;
  let reportMismatchCount = 0;
  let unifiedEntryMismatchCount = 0;

  for (const v of verifications) {
    if (detectCloudVerificationRuntimeMismatch(v.verificationId)) runtimeMismatchCount += 1;
    if (detectCloudVerificationWorkspaceMismatch(v.verificationId)) workspaceMismatchCount += 1;
    if (detectCloudVerificationBuildMismatch(v.verificationId)) buildMismatchCount += 1;
    if (detectEvidenceMismatch(v.verificationId)) evidenceMismatchCount += 1;
    if (detectReportMismatch(v.verificationId)) reportMismatchCount += 1;
    if (detectUnifiedVerificationMismatch(v.verificationId)) unifiedEntryMismatchCount += 1;
  }

  diagnostics = {
    cloudVerificationAuthorityActive: verifications.length > 0,
    registeredVerificationCount: verifications.length,
    activeSessionCount: sessions.length,
    readyVerificationCount: verifications.filter((v) => v.verificationState === 'READY' || v.verificationState === 'COMPLETED').length,
    waitingVerificationCount: verifications.filter((v) => v.verificationState.startsWith('WAITING_')).length,
    blockedVerificationCount: verifications.filter((v) => v.verificationState === 'FAILED').length,
    duplicateRiskCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    evidenceMismatchCount,
    reportMismatchCount,
    unifiedEntryMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getCloudVerificationDiagnostics();
}

export function resetCloudVerificationDiagnosticsForTests(): void {
  diagnostics = {
    cloudVerificationAuthorityActive: false,
    registeredVerificationCount: 0,
    activeSessionCount: 0,
    readyVerificationCount: 0,
    waitingVerificationCount: 0,
    blockedVerificationCount: 0,
    duplicateRiskCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    evidenceMismatchCount: 0,
    reportMismatchCount: 0,
    unifiedEntryMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function cloudVerificationFoundationKey(): string {
  return 'cloud_verification_foundation';
}
