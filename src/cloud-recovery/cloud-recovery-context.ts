/**
 * Cloud Recovery Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getCloudVerification } from '../cloud-verification/index.js';
import { getStoredCloudRecovery, storeCloudRecovery } from './cloud-recovery-store.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecoveryContext } from './cloud-recovery-types.js';

export function buildDefaultCloudRecoveryContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryType?: string;
  failureDescription?: string | null;
  candidateDescription?: string | null;
  planDescription?: string | null;
}): CloudRecoveryContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);
  const verification = getCloudVerification(input.verificationId);

  return {
    contextSummary: `Cloud recovery context for ${input.recoveryType ?? 'GENERAL_RECOVERY'} — metadata only`,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    verificationSummary: verification ? `${verification.verificationId} — ${verification.verificationMetadata.verificationName}` : null,
    failureSummary: input.failureDescription ?? null,
    candidateSummary: input.candidateDescription ?? null,
    planSummary: input.planDescription ?? null,
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: readAllSystemSummaries().slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No recovery execution',
      'No rollback execution',
      'No cloud worker restart',
      'Upstream authorities remain source of truth',
    ],
  };
}

export function refreshCloudRecoveryContext(recoveryId: string): CloudRecoveryContext | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return null;

  const context = buildDefaultCloudRecoveryContext({
    projectId: recovery.recoveryOwner.projectId,
    runtimeId: recovery.recoveryOwner.runtimeId,
    workspaceId: recovery.recoveryOwner.workspaceId,
    persistentBuildId: recovery.recoveryOwner.persistentBuildId,
    verificationId: recovery.recoveryOwner.verificationId,
    recoveryType: recovery.recoveryType,
    failureDescription: recovery.recoveryMetadata.failureDescription,
    candidateDescription: recovery.recoveryMetadata.candidateDescription,
    planDescription: recovery.recoveryMetadata.planDescription,
  });

  storeCloudRecovery({ ...recovery, recoveryContext: context, updatedAt: Date.now() });

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'CONTEXT',
    summary: 'Context refreshed from upstream authorities',
    scopeUsed: recovery.recoveryOwner.projectId,
  });

  return context;
}

export function getRecoveryContextById(recoveryId: string): CloudRecoveryContext | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryContext ?? null;
}

export function validateCloudRecoveryContext(context: CloudRecoveryContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  return issues;
}

export function detectContextMismatch(recoveryId: string): boolean {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return true;
  const ctx = recovery.recoveryContext;
  const owner = recovery.recoveryOwner;
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) return true;
  if (ctx.verificationSummary && !ctx.verificationSummary.includes(owner.verificationId)) return true;
  return false;
}
