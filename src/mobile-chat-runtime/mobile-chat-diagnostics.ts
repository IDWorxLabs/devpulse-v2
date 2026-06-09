/**
 * Mobile Chat Runtime Foundation — diagnostics tracker.
 */

import { listStoredMobileChatSessions, listStoredMobileChatTrackedSessions, listStoredMobileChatMessages } from './mobile-chat-store.js';
import { detectMobileChatCommandMismatch } from './mobile-chat-command-bridge.js';
import { detectMobileChatCloudMismatch } from './mobile-chat-cloud-bridge.js';
import { detectMobileChatWorkspaceMismatch } from './mobile-chat-workspace-bridge.js';
import { detectMobileChatBuildMismatch } from './mobile-chat-build-bridge.js';
import { detectMobileChatVerificationMismatch } from './mobile-chat-verification-bridge.js';
import { detectMobileChatMonitoringMismatch } from './mobile-chat-monitoring-bridge.js';
import { validateMobileChatPermissions } from './mobile-chat-action-gate.js';
import { validateMobileChatState } from './mobile-chat-validator.js';
import type { MobileChatDiagnostics, MobileChatState } from './mobile-chat-types.js';

let diagnostics: MobileChatDiagnostics = {
  mobileChatAuthorityActive: false,
  registeredMobileChatCount: 0,
  registeredMessageCount: 0,
  activeSessionCount: 0,
  promptReceivedCount: 0,
  responseReadyCount: 0,
  actionAllowedCount: 0,
  actionBlockedCount: 0,
  waitingApprovalCount: 0,
  duplicateRiskCount: 0,
  commandMismatchCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  verificationMismatchCount: 0,
  monitoringMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getMobileChatDiagnostics(): MobileChatDiagnostics {
  return { ...diagnostics };
}

export function updateMobileChatDiagnostics(
  query: string,
  finalState: MobileChatState | null = null,
  duplicateRiskCount = 0,
): MobileChatDiagnostics {
  const sessions = listStoredMobileChatSessions();
  const tracked = listStoredMobileChatTrackedSessions();
  const messages = listStoredMobileChatMessages();

  let commandMismatchCount = 0;
  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let verificationMismatchCount = 0;
  let monitoringMismatchCount = 0;

  for (const s of sessions) {
    if (detectMobileChatCommandMismatch(s.mobileChatId)) commandMismatchCount += 1;
    if (detectMobileChatCloudMismatch(s.mobileChatId)) runtimeMismatchCount += 1;
    if (detectMobileChatWorkspaceMismatch(s.mobileChatId)) workspaceMismatchCount += 1;
    if (detectMobileChatBuildMismatch(s.mobileChatId)) buildMismatchCount += 1;
    if (detectMobileChatVerificationMismatch(s.mobileChatId)) verificationMismatchCount += 1;
    if (detectMobileChatMonitoringMismatch(s.mobileChatId)) monitoringMismatchCount += 1;
    validateMobileChatPermissions(s.mobileChatPermissions);
  }

  diagnostics = {
    mobileChatAuthorityActive: sessions.length > 0,
    registeredMobileChatCount: sessions.length,
    registeredMessageCount: messages.length,
    activeSessionCount: tracked.length,
    promptReceivedCount: sessions.filter((s) => s.mobileChatPrompts.length > 0).length,
    responseReadyCount: sessions.filter((s) => s.mobileChatResponseState?.responseStatus === 'READY').length,
    actionAllowedCount: sessions.filter((s) => s.mobileChatState === 'ACTION_ALLOWED').length,
    actionBlockedCount: sessions.filter((s) => s.mobileChatState === 'ACTION_BLOCKED').length,
    waitingApprovalCount: sessions.filter((s) => s.mobileChatState === 'WAITING_FOR_APPROVAL').length,
    duplicateRiskCount,
    commandMismatchCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    verificationMismatchCount,
    monitoringMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getMobileChatDiagnostics();
}

export function resetMobileChatDiagnosticsForTests(): void {
  diagnostics = {
    mobileChatAuthorityActive: false,
    registeredMobileChatCount: 0,
    registeredMessageCount: 0,
    activeSessionCount: 0,
    promptReceivedCount: 0,
    responseReadyCount: 0,
    actionAllowedCount: 0,
    actionBlockedCount: 0,
    waitingApprovalCount: 0,
    duplicateRiskCount: 0,
    commandMismatchCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    verificationMismatchCount: 0,
    monitoringMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runMobileChatDiagnosticsScan(): string[] {
  const findings: string[] = [];
  for (const s of listStoredMobileChatSessions()) {
    if (!s.mobileChatOwner.projectId) findings.push(`${s.mobileChatId}: missing project`);
    if (!s.mobileChatOwner.mobileCommandSessionId) findings.push(`${s.mobileChatId}: missing command link`);
    if (!s.mobileChatCloudLink.runtimeId) findings.push(`${s.mobileChatId}: missing runtime link`);
    if (!validateMobileChatState(s.mobileChatState)) findings.push(`${s.mobileChatId}: invalid state`);
    for (const p of s.mobileChatPrompts) {
      if (p.giantPromptFlag && !p.longPromptSummary) findings.push(`${s.mobileChatId}: giant prompt without summary`);
    }
  }
  return findings;
}
