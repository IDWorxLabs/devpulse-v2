/**
 * Cloud Monitoring Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getCloudVerification } from '../cloud-verification/index.js';
import { getRecovery } from '../cloud-recovery/index.js';
import { getStoredCloudMonitoringRecord, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringContext } from './cloud-monitoring-types.js';

export function buildDefaultCloudMonitoringContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringType?: string;
}): CloudMonitoringContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const verification = getCloudVerification(input.verificationId);
  const recovery = getRecovery(input.recoveryId);

  return {
    contextSummary: `Cloud monitoring context for ${input.monitoringType ?? 'GENERAL_MONITORING'} — metadata only`,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    verificationSummary: verification ? `${verification.verificationId} — ${verification.verificationMetadata.verificationName}` : null,
    recoverySummary: recovery ? `${recovery.recoveryId} — ${recovery.recoveryMetadata.recoveryName}` : null,
    healthSummary: null,
    alertSummary: null,
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: readAllSystemSummaries().slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No real infrastructure monitoring',
      'No cloud provider connections',
      'No notifications',
      'Upstream authorities remain source of truth',
    ],
  };
}

export function refreshCloudMonitoringContext(monitoringId: string): CloudMonitoringContext | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return null;

  const context = buildDefaultCloudMonitoringContext({
    projectId: record.monitoringOwner.projectId,
    runtimeId: record.monitoringOwner.runtimeId,
    workspaceId: record.monitoringOwner.workspaceId,
    persistentBuildId: record.monitoringOwner.persistentBuildId,
    verificationId: record.monitoringOwner.verificationId,
    recoveryId: record.monitoringOwner.recoveryId,
    monitoringType: record.monitoringType,
  });

  storeCloudMonitoringRecord({ ...record, monitoringContext: context, updatedAt: Date.now() });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'CONTEXT',
    summary: 'Context refreshed from upstream authorities',
    scopeUsed: record.monitoringOwner.projectId,
  });

  return context;
}

export function getMonitoringContextById(monitoringId: string): CloudMonitoringContext | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringContext ?? null;
}

export function validateCloudMonitoringContext(context: CloudMonitoringContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  return issues;
}

export function detectContextMismatch(monitoringId: string): boolean {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return true;
  const ctx = record.monitoringContext;
  const owner = record.monitoringOwner;
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) return true;
  if (ctx.verificationSummary && !ctx.verificationSummary.includes(owner.verificationId)) return true;
  if (ctx.recoverySummary && !ctx.recoverySummary.includes(owner.recoveryId)) return true;
  return false;
}
