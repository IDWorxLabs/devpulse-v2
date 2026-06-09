/**
 * Mobile Approval Runtime Foundation — diagnostics tracker.
 */

import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getDevPulseV2MobileApprovalFlowFoundation } from '../mobile-approval-flow-foundation/index.js';
import {
  listStoredMobileApprovalSessions,
  listStoredMobileApprovalTrackedSessions,
  listStoredMobileApprovalRequests,
  listStoredMobileApprovalDecisions,
} from './mobile-approval-store.js';
import { detectMobileApprovalCommandMismatch } from './mobile-approval-command-bridge.js';
import { detectMobileApprovalChatMismatch } from './mobile-approval-chat-bridge.js';
import { detectMobileApprovalPreviewMismatch } from './mobile-approval-preview-bridge.js';
import { detectMobileApprovalCloudMismatch } from './mobile-approval-cloud-bridge.js';
import { detectMobileApprovalOperatorFeedMismatch } from './mobile-approval-operator-feed-bridge.js';
import {
  buildDuplicateMobileApprovalRiskContext,
  evaluateDuplicateMobileApprovalRisk,
  validateMobileApprovalState,
} from './mobile-approval-validator.js';
import type { MobileApprovalDiagnostics, MobileApprovalState } from './mobile-approval-types.js';

let diagnostics: MobileApprovalDiagnostics = {
  mobileApprovalAuthorityActive: false,
  registeredMobileApprovalCount: 0,
  registeredApprovalRequestCount: 0,
  registeredApprovalDecisionCount: 0,
  activeSessionCount: 0,
  requestRegisteredCount: 0,
  waitingForDecisionCount: 0,
  decisionRecordedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  pendingDecisionCount: 0,
  founderOnlyCount: 0,
  duplicateRiskCount: 0,
  commandMismatchCount: 0,
  chatMismatchCount: 0,
  previewMismatchCount: 0,
  runtimeMismatchCount: 0,
  workspaceMismatchCount: 0,
  buildMismatchCount: 0,
  flowMismatchCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getMobileApprovalDiagnostics(): MobileApprovalDiagnostics {
  return { ...diagnostics };
}

function detectMobileApprovalWorkspaceMismatch(mobileApprovalId: string): boolean {
  const session = listStoredMobileApprovalSessions().find((s) => s.mobileApprovalId === mobileApprovalId);
  if (!session) return true;
  const workspace = getWorkspace(session.mobileApprovalWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== session.mobileApprovalOwner.projectId ||
    session.mobileApprovalWorkspaceLink.mismatchDetected
  );
}

function detectMobileApprovalBuildMismatch(mobileApprovalId: string): boolean {
  const session = listStoredMobileApprovalSessions().find((s) => s.mobileApprovalId === mobileApprovalId);
  if (!session) return true;
  const build = getPersistentBuild(session.mobileApprovalBuildLink.persistentBuildId);
  if (!build) return true;
  return (
    build.buildOwner.projectId !== session.mobileApprovalOwner.projectId ||
    session.mobileApprovalBuildLink.mismatchDetected
  );
}

function detectMobileApprovalFlowMismatch(mobileApprovalId: string): boolean {
  const session = listStoredMobileApprovalSessions().find((s) => s.mobileApprovalId === mobileApprovalId);
  if (!session) return true;
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  if (!flowFoundation.getFoundationState().foundationId) return true;
  return session.mobileApprovalFlowLink.mismatchDetected;
}

export function updateMobileApprovalDiagnostics(
  query: string,
  finalState: MobileApprovalState | null = null,
  duplicateRiskCount = 0,
): MobileApprovalDiagnostics {
  const sessions = listStoredMobileApprovalSessions();
  const tracked = listStoredMobileApprovalTrackedSessions();
  const requests = listStoredMobileApprovalRequests();
  const decisions = listStoredMobileApprovalDecisions();

  let commandMismatchCount = 0;
  let chatMismatchCount = 0;
  let previewMismatchCount = 0;
  let runtimeMismatchCount = 0;
  let workspaceMismatchCount = 0;
  let buildMismatchCount = 0;
  let flowMismatchCount = 0;

  for (const s of sessions) {
    if (detectMobileApprovalCommandMismatch(s.mobileApprovalId)) commandMismatchCount += 1;
    if (detectMobileApprovalChatMismatch(s.mobileApprovalId)) chatMismatchCount += 1;
    if (detectMobileApprovalPreviewMismatch(s.mobileApprovalId)) previewMismatchCount += 1;
    if (detectMobileApprovalCloudMismatch(s.mobileApprovalId)) runtimeMismatchCount += 1;
    if (detectMobileApprovalWorkspaceMismatch(s.mobileApprovalId)) workspaceMismatchCount += 1;
    if (detectMobileApprovalBuildMismatch(s.mobileApprovalId)) buildMismatchCount += 1;
    if (detectMobileApprovalFlowMismatch(s.mobileApprovalId)) flowMismatchCount += 1;
    detectMobileApprovalOperatorFeedMismatch(s.mobileApprovalId);
  }

  diagnostics = {
    mobileApprovalAuthorityActive: sessions.length > 0,
    registeredMobileApprovalCount: sessions.length,
    registeredApprovalRequestCount: requests.length,
    registeredApprovalDecisionCount: decisions.length,
    activeSessionCount: tracked.length,
    requestRegisteredCount: sessions.filter((s) => s.mobileApprovalState === 'REQUEST_REGISTERED').length,
    waitingForDecisionCount: sessions.filter((s) => s.mobileApprovalState === 'WAITING_FOR_DECISION').length,
    decisionRecordedCount: sessions.filter((s) => s.mobileApprovalState === 'DECISION_RECORDED').length,
    approvedCount: sessions.filter((s) => s.mobileApprovalState === 'APPROVED_STATE').length,
    rejectedCount: sessions.filter((s) => s.mobileApprovalState === 'REJECTED_STATE').length,
    pendingDecisionCount: requests.filter((r) => r.result === 'REGISTERED').length,
    founderOnlyCount: sessions.filter((s) => s.mobileApprovalType === 'FOUNDER_APPROVAL').length,
    duplicateRiskCount,
    commandMismatchCount,
    chatMismatchCount,
    previewMismatchCount,
    runtimeMismatchCount,
    workspaceMismatchCount,
    buildMismatchCount,
    flowMismatchCount,
    lastQuery: query,
    lastState: finalState,
  };

  return getMobileApprovalDiagnostics();
}

export function resetMobileApprovalDiagnosticsForTests(): void {
  diagnostics = {
    mobileApprovalAuthorityActive: false,
    registeredMobileApprovalCount: 0,
    registeredApprovalRequestCount: 0,
    registeredApprovalDecisionCount: 0,
    activeSessionCount: 0,
    requestRegisteredCount: 0,
    waitingForDecisionCount: 0,
    decisionRecordedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingDecisionCount: 0,
    founderOnlyCount: 0,
    duplicateRiskCount: 0,
    commandMismatchCount: 0,
    chatMismatchCount: 0,
    previewMismatchCount: 0,
    runtimeMismatchCount: 0,
    workspaceMismatchCount: 0,
    buildMismatchCount: 0,
    flowMismatchCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function runMobileApprovalDiagnosticsScan(): string[] {
  const findings: string[] = [];
  const approvalIds = listStoredMobileApprovalSessions().map((s) => s.mobileApprovalId);
  if (new Set(approvalIds).size !== approvalIds.length) {
    findings.push('Duplicate mobile approval ids detected');
  }

  const parallelRisks = evaluateDuplicateMobileApprovalRisk(
    buildDuplicateMobileApprovalRiskContext('diagnostics-scan'),
  );
  if (parallelRisks.length > 0) {
    findings.push(`Parallel authority risk: ${parallelRisks[0]}`);
  }

  for (const s of listStoredMobileApprovalSessions()) {
    if (!s.mobileApprovalOwner.projectId) findings.push(`${s.mobileApprovalId}: missing project`);
    if (!s.mobileApprovalOwner.mobileCommandSessionId) findings.push(`${s.mobileApprovalId}: missing command link`);
    if (!s.mobileApprovalOwner.mobileChatSessionId) findings.push(`${s.mobileApprovalId}: missing chat link`);
    if (!s.mobileApprovalOwner.mobilePreviewSessionId) findings.push(`${s.mobileApprovalId}: missing preview link`);
    if (!s.mobileApprovalCloudLink.runtimeId) findings.push(`${s.mobileApprovalId}: missing runtime link`);
    if (!s.mobileApprovalWorkspaceLink.workspaceId) findings.push(`${s.mobileApprovalId}: missing workspace link`);
    if (!s.mobileApprovalBuildLink.persistentBuildId) findings.push(`${s.mobileApprovalId}: missing build link`);
    if (!s.mobileApprovalFlowLink.approvalFlowFoundationId) {
      findings.push(`${s.mobileApprovalId}: missing flow foundation link`);
    }

    if (!validateMobileApprovalState(s.mobileApprovalState)) {
      findings.push(`${s.mobileApprovalId}: invalid state ${s.mobileApprovalState}`);
    }

    if (s.mobileApprovalState === 'WAITING_FOR_DECISION' && s.mobileApprovalRequests.length === 0) {
      findings.push(`${s.mobileApprovalId}: waiting without registered request`);
    }

    if (s.mobileApprovalState === 'DECISION_RECORDED' && s.mobileApprovalDecisions.length === 0) {
      findings.push(`${s.mobileApprovalId}: decision recorded without decision metadata`);
    }
  }

  return findings;
}
