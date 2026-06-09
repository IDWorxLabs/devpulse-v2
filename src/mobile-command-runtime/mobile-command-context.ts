/**
 * Mobile Command Runtime Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getOperatorFeedDiagnostics } from '../operator-feed/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getCloudVerification } from '../cloud-verification/index.js';
import { getRecovery } from '../cloud-recovery/index.js';
import { getMonitoringRecord } from '../cloud-monitoring/index.js';
import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import { getStoredMobileCommandSession, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandContext } from './mobile-command-types.js';

export function buildDefaultMobileCommandContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  mobileCommandType?: string;
}): MobileCommandContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const verification = getCloudVerification(input.verificationId);
  const recovery = getRecovery(input.recoveryId);
  const monitoring = getMonitoringRecord(input.monitoringId);
  const feedDiag = getOperatorFeedDiagnostics();
  const aidevSummary = getLatestAiDevSummary();

  return {
    contextSummary: `Mobile command context for ${input.mobileCommandType ?? 'GENERAL_MOBILE_COMMAND'} — metadata only`,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    verificationSummary: verification ? `${verification.verificationId} — ${verification.verificationMetadata.verificationName}` : null,
    recoverySummary: recovery ? `${recovery.recoveryId} — ${recovery.recoveryMetadata.recoveryName}` : null,
    monitoringSummary: monitoring ? `${monitoring.monitoringId} — ${monitoring.monitoringMetadata.monitoringName}` : null,
    operatorFeedSummary: feedDiag.operatorFeedActive
      ? `Operator feed active — events=${feedDiag.eventCount} source=${feedDiag.lastSourceSystem ?? 'none'}`
      : null,
    projectVaultSummary: vault.listProjects().find((p) => p.projectId === input.projectId)?.name ?? null,
    world2Summary: readAllSystemSummaries().find((s) => s.systemId.includes('world2'))?.summary ?? null,
    aidevSummary: aidevSummary?.summary ?? null,
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: readAllSystemSummaries().slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No mobile app UI',
      'No push notifications',
      'No cloud execution',
      'Upstream authorities remain source of truth',
    ],
  };
}

export function refreshMobileCommandContext(mobileCommandId: string): MobileCommandContext | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return null;

  const context = buildDefaultMobileCommandContext({
    projectId: session.mobileCommandOwner.projectId,
    runtimeId: session.mobileCommandOwner.runtimeId,
    workspaceId: session.mobileCommandOwner.workspaceId,
    persistentBuildId: session.mobileCommandOwner.persistentBuildId,
    verificationId: session.mobileCommandOwner.verificationId,
    recoveryId: session.mobileCommandOwner.recoveryId,
    monitoringId: session.mobileCommandOwner.monitoringId,
    mobileCommandType: session.mobileCommandType,
  });

  storeMobileCommandSession({ ...session, mobileCommandContext: context, updatedAt: Date.now() });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'CONTEXT',
    summary: 'Context refreshed from upstream authorities',
    scopeUsed: session.mobileCommandOwner.projectId,
  });

  return context;
}

export function getMobileCommandContextById(mobileCommandId: string): MobileCommandContext | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandContext ?? null;
}

export function validateMobileCommandContext(context: MobileCommandContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  return issues;
}

export function detectMobileCommandContextMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const ctx = session.mobileCommandContext;
  const owner = session.mobileCommandOwner;
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) return true;
  if (ctx.verificationSummary && !ctx.verificationSummary.includes(owner.verificationId)) return true;
  if (ctx.recoverySummary && !ctx.recoverySummary.includes(owner.recoveryId)) return true;
  if (ctx.monitoringSummary && !ctx.monitoringSummary.includes(owner.monitoringId)) return true;
  return false;
}
