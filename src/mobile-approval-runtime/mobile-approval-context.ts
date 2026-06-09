/**
 * Mobile Approval Runtime Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readSystemSummariesForMobileApproval } from './mobile-approval-read-cache.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getDevPulseV2MobileApprovalFlowFoundation } from '../mobile-approval-flow-foundation/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobileApprovalSession, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalContext } from './mobile-approval-types.js';

export function buildDefaultMobileApprovalContext(input: {
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  mobilePreviewSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  mobileApprovalFlowFoundationId?: string | null;
  mobileApprovalType?: string;
}): MobileApprovalContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const command = getMobileCommandSession(input.mobileCommandSessionId);
  const chat = getMobileChatSession(input.mobileChatSessionId);
  const preview = getMobilePreviewSession(input.mobilePreviewSessionId);
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  const feedDiag = getOperatorFeedDiagnostics();
  const aidevSummary = getLatestAiDevSummary();
  const brainSummaries = readSystemSummariesForMobileApproval();

  return {
    contextSummary: `Mobile approval context for ${input.mobileApprovalType ?? 'GENERAL_APPROVAL'} — metadata only`,
    commandSessionSummary: command
      ? `${command.mobileCommandId} — ${command.mobileCommandMetadata.commandName}`
      : null,
    chatSessionSummary: chat
      ? `${chat.mobileChatId} — ${chat.mobileChatMetadata.chatName}`
      : null,
    previewSessionSummary: preview
      ? `${preview.mobilePreviewId} — ${preview.mobilePreviewMetadata.previewName}`
      : null,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    flowFoundationSummary: flowFoundation
      ? `${flowFoundation.getFoundationState().foundationId} — Phase 8.4 governance interface`
      : null,
    operatorFeedSummary: feedDiag.operatorFeedActive
      ? `Operator feed active — events=${feedDiag.eventCount}`
      : null,
    projectVaultSummary: vault.listProjects().find((p) => p.projectId === input.projectId)?.name ?? null,
    world2Summary: brainSummaries.find((s) => s.systemId.includes('world2'))?.summary ?? null,
    aidevSummary: aidevSummary?.summary ?? null,
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: brainSummaries.slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No mobile app UI',
      'No push notifications',
      'No real cloud approvals',
      'No World 2 execution',
      'No autonomous execution',
      'Mobile Command, Chat, and Preview Runtime remain upstream authorities',
      'Mobile Approval Flow Foundation (8.4) remains governance interface',
    ],
  };
}

export function refreshMobileApprovalContext(mobileApprovalId: string): MobileApprovalContext | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const context = buildDefaultMobileApprovalContext({
    projectId: session.mobileApprovalOwner.projectId,
    mobileCommandSessionId: session.mobileApprovalOwner.mobileCommandSessionId,
    mobileChatSessionId: session.mobileApprovalOwner.mobileChatSessionId,
    mobilePreviewSessionId: session.mobileApprovalOwner.mobilePreviewSessionId,
    runtimeId: session.mobileApprovalOwner.runtimeId,
    workspaceId: session.mobileApprovalOwner.workspaceId,
    persistentBuildId: session.mobileApprovalOwner.persistentBuildId,
    mobileApprovalFlowFoundationId: session.mobileApprovalOwner.mobileApprovalFlowFoundationId,
    mobileApprovalType: session.mobileApprovalType,
  });

  storeMobileApprovalSession({ ...session, mobileApprovalContext: context, updatedAt: Date.now() });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'CONTEXT',
    summary: 'Context refreshed from command, chat, preview, cloud, world2, and aidev authorities',
    scopeUsed: session.mobileApprovalOwner.projectId,
  });

  return context;
}

export function getMobileApprovalContextById(mobileApprovalId: string): MobileApprovalContext | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalContext ?? null;
}

export function validateMobileApprovalContext(context: MobileApprovalContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  if (context.knownConstraints.length === 0) issues.push('Context missing known constraints');
  return issues;
}

export function detectMobileApprovalContextMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;

  const ctx = session.mobileApprovalContext;
  const owner = session.mobileApprovalOwner;

  if (ctx.commandSessionSummary && !ctx.commandSessionSummary.includes(owner.mobileCommandSessionId)) {
    return true;
  }
  if (ctx.chatSessionSummary && !ctx.chatSessionSummary.includes(owner.mobileChatSessionId)) {
    return true;
  }
  if (ctx.previewSessionSummary && !ctx.previewSessionSummary.includes(owner.mobilePreviewSessionId)) {
    return true;
  }
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) {
    return true;
  }
  if (
    owner.mobileApprovalFlowFoundationId &&
    ctx.flowFoundationSummary &&
    !ctx.flowFoundationSummary.includes(owner.mobileApprovalFlowFoundationId)
  ) {
    return true;
  }

  return false;
}
