/**
 * Cross Device Runtime Foundation — diagnostics tracker.
 */

import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import {
  listStoredCrossDeviceSessions,
  listStoredCrossDeviceTrackedSessions,
  listStoredDeviceRecords,
  listStoredDeviceLinks,
  listStoredDeviceHandoffs,
} from './cross-device-store.js';
import { detectCrossDeviceCommandMismatch } from './cross-device-command-bridge.js';
import { detectCrossDeviceChatMismatch } from './cross-device-chat-bridge.js';
import { detectCrossDevicePreviewMismatch } from './cross-device-preview-bridge.js';
import { detectCrossDeviceApprovalMismatch } from './cross-device-approval-bridge.js';
import { detectCrossDeviceCloudMismatch } from './cross-device-cloud-bridge.js';
import { detectCrossDeviceOperatorFeedMismatch } from './cross-device-operator-feed-bridge.js';
import {
  buildDuplicateCrossDeviceRiskContext,
  evaluateDuplicateCrossDeviceRisk,
  validateCrossDeviceState,
} from './cross-device-validator.js';
import type { CrossDeviceDiagnostics, CrossDeviceState } from './cross-device-types.js';

let diagnostics: CrossDeviceDiagnostics = {
  crossDeviceAuthorityActive: false,
  registeredCrossDeviceCount: 0,
  registeredDeviceRecordCount: 0,
  registeredDeviceLinkCount: 0,
  registeredDeviceHandoffCount: 0,
  activeSessionCount: 0,
  deviceRegisteredCount: 0,
  deviceLinkedCount: 0,
  handoffAvailableCount: 0,
  handoffRequestedCount: 0,
  handoffReadyCount: 0,
  handoffCompletedCount: 0,
  visibilityUpdatedCount: 0,
  duplicateRiskCount: 0,
  commandMismatchCount: 0,
  chatMismatchCount: 0,
  previewMismatchCount: 0,
  approvalMismatchCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getCrossDeviceDiagnostics(): CrossDeviceDiagnostics {
  return { ...diagnostics };
}

function detectCrossDeviceWorkspaceMismatch(crossDeviceId: string): boolean {
  const session = listStoredCrossDeviceSessions().find((s) => s.crossDeviceId === crossDeviceId);
  if (!session) return true;
  const workspace = getWorkspace(session.crossDeviceWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceWorkspaceLink.mismatchDetected
  );
}

function detectCrossDeviceBuildMismatchLocal(crossDeviceId: string): boolean {
  const session = listStoredCrossDeviceSessions().find((s) => s.crossDeviceId === crossDeviceId);
  if (!session) return true;
  const build = getPersistentBuild(session.crossDeviceBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceBuildLink.mismatchDetected
  );
}

export function updateCrossDeviceDiagnostics(
  query: string,
  finalState: CrossDeviceState | null = null,
  duplicateRiskCount = 0,
): CrossDeviceDiagnostics {
  const sessions = listStoredCrossDeviceSessions();
  const tracked = listStoredCrossDeviceTrackedSessions();
  const records = listStoredDeviceRecords();
  const links = listStoredDeviceLinks();
  const handoffs = listStoredDeviceHandoffs();

  let commandMismatchCount = 0;
  let chatMismatchCount = 0;
  let previewMismatchCount = 0;
  let approvalMismatchCount = 0;
  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;

  for (const s of sessions) {
    if (detectCrossDeviceCommandMismatch(s.crossDeviceId)) commandMismatchCount += 1;
    if (detectCrossDeviceChatMismatch(s.crossDeviceId)) chatMismatchCount += 1;
    if (detectCrossDevicePreviewMismatch(s.crossDeviceId)) previewMismatchCount += 1;
    if (detectCrossDeviceApprovalMismatch(s.crossDeviceId)) approvalMismatchCount += 1;
    if (detectCrossDeviceCloudMismatch(s.crossDeviceId)) runtimeMismatchCount += 1;
    if (detectCrossDeviceWorkspaceMismatch(s.crossDeviceId)) workspaceMismatchCount += 1;
    if (detectCrossDeviceBuildMismatchLocal(s.crossDeviceId)) buildMismatchCount += 1;
    detectCrossDeviceOperatorFeedMismatch(s.crossDeviceId);
  }

  diagnostics = {
    crossDeviceAuthorityActive: sessions.length > 0,
    registeredCrossDeviceCount: sessions.length,
    registeredDeviceRecordCount: records.length,
    registeredDeviceLinkCount: links.length,
    registeredDeviceHandoffCount: handoffs.length,
    activeSessionCount: tracked.length,
    deviceRegisteredCount: sessions.filter((s) => s.crossDeviceState === 'DEVICE_REGISTERED').length,
    deviceLinkedCount: sessions.filter((s) => s.crossDeviceState === 'DEVICE_LINKED').length,
    handoffAvailableCount: sessions.filter((s) => s.crossDeviceState === 'HANDOFF_AVAILABLE').length,
    handoffRequestedCount: sessions.filter((s) => s.crossDeviceState === 'HANDOFF_REQUESTED').length,
    handoffReadyCount: sessions.filter((s) => s.crossDeviceState === 'HANDOFF_READY').length,
    handoffCompletedCount: sessions.filter((s) => s.crossDeviceState === 'HANDOFF_COMPLETED').length,
    visibilityUpdatedCount: sessions.filter((s) => s.crossDeviceState === 'VISIBILITY_UPDATED').length,
    duplicateRiskCount,
    commandMismatchCount,
    chatMismatchCount,
    previewMismatchCount,
    approvalMismatchCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getCrossDeviceDiagnostics();
}

export function resetCrossDeviceDiagnosticsForTests(): void {
  diagnostics = {
    crossDeviceAuthorityActive: false,
    registeredCrossDeviceCount: 0,
    registeredDeviceRecordCount: 0,
    registeredDeviceLinkCount: 0,
    registeredDeviceHandoffCount: 0,
    activeSessionCount: 0,
    deviceRegisteredCount: 0,
    deviceLinkedCount: 0,
    handoffAvailableCount: 0,
    handoffRequestedCount: 0,
    handoffReadyCount: 0,
    handoffCompletedCount: 0,
    visibilityUpdatedCount: 0,
    duplicateRiskCount: 0,
    commandMismatchCount: 0,
    chatMismatchCount: 0,
    previewMismatchCount: 0,
    approvalMismatchCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runCrossDeviceDiagnosticsScan(): string[] {
  const findings: string[] = [];
  const ids = listStoredCrossDeviceSessions().map((s) => s.crossDeviceId);
  if (new Set(ids).size !== ids.length) {
    findings.push('Duplicate cross device ids detected');
  }

  const parallelRisks = evaluateDuplicateCrossDeviceRisk(
    buildDuplicateCrossDeviceRiskContext('diagnostics-scan'),
  );
  if (parallelRisks.length > 0) {
    findings.push(`Parallel authority risk: ${parallelRisks[0]}`);
  }

  for (const s of listStoredCrossDeviceSessions()) {
    if (!s.crossDeviceOwner.projectId) findings.push(`${s.crossDeviceId}: missing project`);
    if (!s.crossDeviceOwner.mobileCommandSessionId) findings.push(`${s.crossDeviceId}: missing command link`);
    if (!s.crossDeviceOwner.mobileApprovalSessionId) findings.push(`${s.crossDeviceId}: missing approval link`);
    if (!validateCrossDeviceState(s.crossDeviceState)) {
      findings.push(`${s.crossDeviceId}: invalid state ${s.crossDeviceState}`);
    }
  }

  return findings;
}
