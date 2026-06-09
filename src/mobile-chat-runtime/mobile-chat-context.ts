/**
 * Mobile Chat Runtime Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getCloudVerification } from '../cloud-verification/index.js';
import { getMonitoringRecord } from '../cloud-monitoring/index.js';
import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobileChatSession, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import { setMobileChatState } from './mobile-chat-state-manager.js';
import { recordMobileChatLifecycleEvent } from './mobile-chat-lifecycle.js';
import type { MobileChatContext } from './mobile-chat-types.js';

export function buildDefaultMobileChatContext(input: {
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  mobileChatType?: string;
}): MobileChatContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const command = getMobileCommandSession(input.mobileCommandSessionId);
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const verification = getCloudVerification(input.verificationId);
  const monitoring = getMonitoringRecord(input.monitoringId);
  const feedDiag = getOperatorFeedDiagnostics();
  const aidevSummary = getLatestAiDevSummary();

  return {
    contextSummary: `Mobile chat context for ${input.mobileChatType ?? 'GENERAL_MOBILE_CHAT'} — metadata only`,
    commandSessionSummary: command
      ? `${command.mobileCommandId} — ${command.mobileCommandMetadata.commandName}`
      : null,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    verificationSummary: verification ? `${verification.verificationId} — ${verification.verificationMetadata.verificationName}` : null,
    monitoringSummary: monitoring ? `${monitoring.monitoringId} — ${monitoring.monitoringMetadata.monitoringName}` : null,
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
      'No LLM execution',
      'No push notifications',
      'No cloud execution',
      'Mobile Command Runtime remains command authority',
    ],
  };
}

export function refreshMobileChatContext(mobileChatId: string): MobileChatContext | null {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return null;

  const context = buildDefaultMobileChatContext({
    projectId: session.mobileChatOwner.projectId,
    mobileCommandSessionId: session.mobileChatOwner.mobileCommandSessionId,
    runtimeId: session.mobileChatOwner.runtimeId,
    workspaceId: session.mobileChatOwner.workspaceId,
    persistentBuildId: session.mobileChatOwner.persistentBuildId,
    verificationId: session.mobileChatOwner.verificationId,
    monitoringId: session.mobileChatOwner.monitoringId,
    mobileChatType: session.mobileChatType,
  });

  storeMobileChatSession({ ...session, mobileChatContext: context, updatedAt: Date.now() });
  recordMobileChatLifecycleEvent(mobileChatId, 'MOBILE_CHAT_CONTEXT_READY', 'Context refreshed');
  setMobileChatState(mobileChatId, 'CONTEXT_READY', true);
  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'CONTEXT',
    summary: 'Context refreshed from upstream authorities',
    scopeUsed: session.mobileChatOwner.projectId,
  });

  return context;
}

export function getMobileChatContextById(mobileChatId: string): MobileChatContext | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatContext ?? null;
}

export function validateMobileChatContext(context: MobileChatContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  return issues;
}

export function detectMobileChatContextMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const ctx = session.mobileChatContext;
  const owner = session.mobileChatOwner;
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.commandSessionSummary && !ctx.commandSessionSummary.includes(owner.mobileCommandSessionId)) return true;
  return false;
}
