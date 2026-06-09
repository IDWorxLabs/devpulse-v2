/**
 * Mobile Command Runtime Foundation — diagnostics tracker.
 */

import { listStoredMobileCommandSessions, listStoredMobileCommandTrackedSessions } from './mobile-command-store.js';
import { detectMobileCommandCloudMismatch } from './mobile-command-cloud-bridge.js';
import { detectMobileCommandWorkspaceMismatch } from './mobile-command-workspace-bridge.js';
import { detectMobileCommandBuildMismatch } from './mobile-command-build-bridge.js';
import { detectMobileCommandVerificationMismatch } from './mobile-command-verification-bridge.js';
import { detectMobileCommandRecoveryMismatch } from './mobile-command-recovery-bridge.js';
import { detectMobileCommandMonitoringMismatch } from './mobile-command-monitoring-bridge.js';
import { validateMobileCommandPermissions } from './mobile-command-permissions.js';
import { validateMobileCommandState } from './mobile-command-validator.js';
import type { MobileCommandDiagnostics, MobileCommandState } from './mobile-command-types.js';

let diagnostics: MobileCommandDiagnostics = {
  mobileCommandAuthorityActive: false,
  registeredMobileCommandCount: 0,
  activeSessionCount: 0,
  connectedMobileCommandCount: 0,
  actionAllowedCount: 0,
  actionBlockedCount: 0,
  waitingApprovalCount: 0,
  duplicateRiskCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  verificationMismatchCount: 0,
  recoveryMismatchCount: 0,
  monitoringMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getMobileCommandDiagnostics(): MobileCommandDiagnostics {
  return { ...diagnostics };
}

export function updateMobileCommandDiagnostics(
  query: string,
  finalState: MobileCommandState | null = null,
  duplicateRiskCount = 0,
): MobileCommandDiagnostics {
  const sessions = listStoredMobileCommandSessions();
  const tracked = listStoredMobileCommandTrackedSessions();

  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let verificationMismatchCount = 0;
  let recoveryMismatchCount = 0;
  let monitoringMismatchCount = 0;

  for (const s of sessions) {
    if (detectMobileCommandCloudMismatch(s.mobileCommandId)) runtimeMismatchCount += 1;
    if (detectMobileCommandWorkspaceMismatch(s.mobileCommandId)) workspaceMismatchCount += 1;
    if (detectMobileCommandBuildMismatch(s.mobileCommandId)) buildMismatchCount += 1;
    if (detectMobileCommandVerificationMismatch(s.mobileCommandId)) verificationMismatchCount += 1;
    if (detectMobileCommandRecoveryMismatch(s.mobileCommandId)) recoveryMismatchCount += 1;
    if (detectMobileCommandMonitoringMismatch(s.mobileCommandId)) monitoringMismatchCount += 1;
    validateMobileCommandPermissions(s.mobileCommandPermissions);
  }

  diagnostics = {
    mobileCommandAuthorityActive: sessions.length > 0,
    registeredMobileCommandCount: sessions.length,
    activeSessionCount: tracked.length,
    connectedMobileCommandCount: sessions.filter((s) => s.mobileCommandState.startsWith('CONNECTED_')).length,
    actionAllowedCount: sessions.filter((s) => s.mobileCommandState === 'ACTION_ALLOWED').length,
    actionBlockedCount: sessions.filter((s) => s.mobileCommandState === 'ACTION_BLOCKED').length,
    waitingApprovalCount: sessions.filter((s) => s.mobileCommandState === 'WAITING_FOR_APPROVAL').length,
    duplicateRiskCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    verificationMismatchCount,
    recoveryMismatchCount,
    monitoringMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getMobileCommandDiagnostics();
}

export function resetMobileCommandDiagnosticsForTests(): void {
  diagnostics = {
    mobileCommandAuthorityActive: false,
    registeredMobileCommandCount: 0,
    activeSessionCount: 0,
    connectedMobileCommandCount: 0,
    actionAllowedCount: 0,
    actionBlockedCount: 0,
    waitingApprovalCount: 0,
    duplicateRiskCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    verificationMismatchCount: 0,
    recoveryMismatchCount: 0,
    monitoringMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function mobileCommandRuntimeFoundationKey(): string {
  return 'mobile_command_runtime_foundation';
}

export function runMobileCommandDiagnosticsScan(): string[] {
  const findings: string[] = [];
  for (const s of listStoredMobileCommandSessions()) {
    if (!s.mobileCommandOwner.projectId) findings.push(`${s.mobileCommandId}: missing ownership project`);
    if (!s.mobileCommandCloudLink.runtimeId) findings.push(`${s.mobileCommandId}: missing runtime link`);
    if (!s.mobileCommandWorkspaceLink.workspaceId) findings.push(`${s.mobileCommandId}: missing workspace link`);
    if (!s.mobileCommandBuildLink.persistentBuildId) findings.push(`${s.mobileCommandId}: missing build link`);
    if (!validateMobileCommandState(s.mobileCommandState)) findings.push(`${s.mobileCommandId}: invalid state`);
    findings.push(...validateMobileCommandPermissions(s.mobileCommandPermissions).map((i) => `${s.mobileCommandId}: ${i}`));
  }
  return findings;
}
