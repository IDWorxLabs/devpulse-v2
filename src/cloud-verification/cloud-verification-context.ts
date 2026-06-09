/**
 * Cloud Verification Foundation — context aggregation (read-only metadata).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getStoredCloudVerification, storeCloudVerification } from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerificationContext } from './cloud-verification-types.js';

export function buildDefaultCloudVerificationContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationType?: string;
}): CloudVerificationContext {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const runtime = getRuntime(input.runtimeId);
  const workspace = getWorkspace(input.workspaceId);
  const build = getPersistentBuild(input.persistentBuildId);

  return {
    contextSummary: `Cloud verification context for ${input.verificationType ?? 'GENERAL_CLOUD_VERIFICATION'} — metadata only`,
    runtimeSummary: runtime ? `${runtime.runtimeId} — ${runtime.runtimeMetadata.runtimeName}` : null,
    workspaceSummary: workspace ? `${workspace.workspaceId} — ${workspace.workspaceMetadata.workspaceName}` : null,
    persistentBuildSummary: build ? `${build.buildId} — ${build.buildMetadata.buildName}` : null,
    unifiedEntrySummary: 'Route global verification through Unified Verification Entry',
    evidenceSummary: 'Evidence authority via Verification Evidence Engine',
    reportSummary: 'Reporting authority via Verification Reporting Engine',
    vaultSummaries: vault.listProjects().slice(0, 3).map((p) => `${p.projectId}: ${p.name}`),
    brainSummaries: readAllSystemSummaries().slice(0, 3).map((s) => `${s.systemId}: ${s.summary}`),
    knownConstraints: [
      'No verification provider execution',
      'No cloud worker execution',
      'Unified Verification Entry remains global authority',
    ],
  };
}

export function refreshCloudVerificationContext(verificationId: string): CloudVerificationContext | null {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return null;

  const context = buildDefaultCloudVerificationContext({
    projectId: verification.verificationOwner.projectId,
    runtimeId: verification.verificationOwner.runtimeId,
    workspaceId: verification.verificationOwner.workspaceId,
    persistentBuildId: verification.verificationOwner.persistentBuildId,
    verificationType: verification.verificationType,
  });

  storeCloudVerification({ ...verification, verificationContext: context, updatedAt: Date.now() });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'CONTEXT',
    summary: 'Context refreshed from upstream authorities',
    scopeUsed: verification.verificationOwner.projectId,
  });

  return context;
}

export function getVerificationContextById(verificationId: string): CloudVerificationContext | null {
  return getStoredCloudVerification(verificationId)?.verificationContext ?? null;
}

export function validateCloudVerificationContext(context: CloudVerificationContext): string[] {
  const issues: string[] = [];
  if (!context.contextSummary?.trim()) issues.push('Context missing summary');
  if (!context.unifiedEntrySummary) issues.push('Context missing unified entry reference');
  return issues;
}

export function detectContextMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  const ctx = verification.verificationContext;
  const owner = verification.verificationOwner;
  if (ctx.runtimeSummary && !ctx.runtimeSummary.includes(owner.runtimeId)) return true;
  if (ctx.workspaceSummary && !ctx.workspaceSummary.includes(owner.workspaceId)) return true;
  if (ctx.persistentBuildSummary && !ctx.persistentBuildSummary.includes(owner.persistentBuildId)) return true;
  return false;
}
