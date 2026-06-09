/**
 * Cross Device Runtime Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForCrossDevice } from './cross-device-read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getStoredCrossDeviceSession, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceContext } from './cross-device-types.js';

export function buildDefaultCrossDeviceContext(input: {
  projectId: string;
  deviceId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  mobileApprovalSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  crossDeviceType?: string;
}): CrossDeviceContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const command = getMobileCommandSession(input.mobileCommandSessionId);
  const chat = getMobileChatSession(input.mobileChatSessionId);
  const preview = getMobilePreviewSession(input.mobilePreviewSessionId);
  const approval = getMobileApprovalSession(input.mobileApprovalSessionId);
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const feedDiag = getOperatorFeedDiagnostics();
  const brainSummaries = readSystemSummariesForCrossDevice();

  return {
    contextSummary: `Cross device context for ${input.crossDeviceType ?? 'GENERAL_CROSS_DEVICE'} — metadata only`,
    commandSessionSummary: command
      ? `${command.mobileCommandId} — ${command.mobileCommandMetadata.commandName}`
      : null,
    chatSessionSummary: chat ? `${chat.mobileChatId} — ${chat.mobileChatMetadata.chatName}` : null,
    previewSessionSummary: preview
      ? `${preview.mobilePreviewId} — ${preview.mobilePreviewMetadata.previewName}`
      : null,
    approvalSessionSummary: approval
      ? `${approval.mobileApprovalId} — ${approval.mobileApprovalMetadata.approvalName}`
      : null,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    operatorFeedSummary: feedDiag.operatorFeedActive
      ? `Operator feed active — events=${feedDiag.eventCount}`
      : null,
    projectVaultSummary: vault.listProjects().find((p) => p.projectId === input.projectId)?.name ?? null,
    deviceSummaries: [`${input.deviceId} — authority metadata only`],
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: brainSummaries.slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No real device sync',
      'No device pairing connections',
      'No cross-device execution',
      'Mobile Command, Chat, Preview, and Approval remain upstream authorities',
      'Authority metadata only',
    ],
  };
}

export function refreshCrossDeviceContext(crossDeviceId: string): CrossDeviceContext | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return null;

  const context = buildDefaultCrossDeviceContext({
    projectId: session.crossDeviceOwner.projectId,
    deviceId: session.crossDeviceOwner.deviceId,
    mobileCommandSessionId: session.crossDeviceOwner.mobileCommandSessionId,
    mobileChatSessionId: session.crossDeviceOwner.mobileChatSessionId,
    mobilePreviewSessionId: session.crossDeviceOwner.mobilePreviewSessionId,
    mobileApprovalSessionId: session.crossDeviceOwner.mobileApprovalSessionId,
    runtimeId: session.crossDeviceOwner.runtimeId,
    workspaceId: session.crossDeviceOwner.workspaceId,
    persistentBuildId: session.crossDeviceOwner.persistentBuildId,
    crossDeviceType: session.crossDeviceType,
  });

  storeCrossDeviceSession({ ...session, crossDeviceContext: context, updatedAt: Date.now() });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'CONTEXT',
    summary: 'Context refreshed from command, chat, preview, approval, cloud authorities',
    scopeUsed: session.crossDeviceOwner.projectId,
  });

  return context;
}

export function getCrossDeviceContextById(crossDeviceId: string): CrossDeviceContext | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceContext ?? null;
}

export function validateCrossDeviceContext(context: CrossDeviceContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  if (context.knownConstraints.length === 0) issues.push('Context missing known constraints');
  return issues;
}

export function detectCrossDeviceContextMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;

  const ctx = session.crossDeviceContext;
  const owner = session.crossDeviceOwner;

  if (ctx.commandSessionSummary && !ctx.commandSessionSummary.includes(owner.mobileCommandSessionId)) return true;
  if (ctx.chatSessionSummary && !ctx.chatSessionSummary.includes(owner.mobileChatSessionId)) return true;
  if (ctx.previewSessionSummary && !ctx.previewSessionSummary.includes(owner.mobilePreviewSessionId)) return true;
  if (ctx.approvalSessionSummary && !ctx.approvalSessionSummary.includes(owner.mobileApprovalSessionId)) return true;
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) return true;

  return false;
}
