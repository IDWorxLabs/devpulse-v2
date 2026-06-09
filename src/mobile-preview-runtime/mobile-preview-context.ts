/**
 * Mobile Preview Runtime Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getCloudVerification } from '../cloud-verification/index.js';
import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobilePreviewSession, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewContext } from './mobile-preview-types.js';

export function buildDefaultMobilePreviewContext(input: {
  projectId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  mobilePreviewType?: string;
}): MobilePreviewContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const command = getMobileCommandSession(input.mobileCommandSessionId);
  const chat = getMobileChatSession(input.mobileChatSessionId);
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const verification = getCloudVerification(input.verificationId);
  const feedDiag = getOperatorFeedDiagnostics();
  const aidevSummary = getLatestAiDevSummary();

  return {
    contextSummary: `Mobile preview context for ${input.mobilePreviewType ?? 'GENERAL_MOBILE_PREVIEW'} — metadata only`,
    commandSessionSummary: command
      ? `${command.mobileCommandId} — ${command.mobileCommandMetadata.commandName}`
      : null,
    chatSessionSummary: chat
      ? `${chat.mobileChatId} — ${chat.mobileChatMetadata.chatName}`
      : null,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    verificationSummary: verification
      ? `${verification.verificationId} — ${verification.verificationMetadata.verificationName}`
      : null,
    livePreviewSummary: chat
      ? `Live preview companion metadata linked via chat ${chat.mobileChatId}`
      : null,
    operatorFeedSummary: feedDiag.operatorFeedActive
      ? `Operator feed active — events=${feedDiag.eventCount}`
      : null,
    projectVaultSummary: vault.listProjects().find((p) => p.projectId === input.projectId)?.name ?? null,
    world2Summary: readAllSystemSummaries().find((s) => s.systemId.includes('world2'))?.summary ?? null,
    aidevSummary: aidevSummary?.summary ?? null,
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: readAllSystemSummaries().slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No mobile app UI',
      'No preview streaming',
      'No preview rendering',
      'No device detection',
      'No cloud execution',
      'Mobile Command and Chat Runtime remain upstream authorities',
    ],
  };
}

export function refreshMobilePreviewContext(mobilePreviewId: string): MobilePreviewContext | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  const context = buildDefaultMobilePreviewContext({
    projectId: session.mobilePreviewOwner.projectId,
    mobileCommandSessionId: session.mobilePreviewOwner.mobileCommandSessionId,
    mobileChatSessionId: session.mobilePreviewOwner.mobileChatSessionId,
    runtimeId: session.mobilePreviewOwner.runtimeId,
    workspaceId: session.mobilePreviewOwner.workspaceId,
    persistentBuildId: session.mobilePreviewOwner.persistentBuildId,
    verificationId: session.mobilePreviewOwner.verificationId,
    mobilePreviewType: session.mobilePreviewType,
  });

  storeMobilePreviewSession({ ...session, mobilePreviewContext: context, updatedAt: Date.now() });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'CONTEXT',
    summary: 'Context refreshed from mobile command, chat, and cloud foundations',
    scopeUsed: session.mobilePreviewOwner.projectId,
  });

  return context;
}

export function getMobilePreviewContextById(mobilePreviewId: string): MobilePreviewContext | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewContext ?? null;
}

export function validateMobilePreviewContext(context: MobilePreviewContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  if (context.knownConstraints.length === 0) issues.push('Context missing known constraints');
  return issues;
}

export function detectMobilePreviewContextMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;

  const ctx = session.mobilePreviewContext;
  const owner = session.mobilePreviewOwner;

  if (ctx.commandSessionSummary && !ctx.commandSessionSummary.includes(owner.mobileCommandSessionId)) {
    return true;
  }
  if (ctx.chatSessionSummary && !ctx.chatSessionSummary.includes(owner.mobileChatSessionId)) {
    return true;
  }
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) {
    return true;
  }
  if (ctx.verificationSummary && !ctx.verificationSummary.includes(owner.verificationId)) return true;

  return false;
}
