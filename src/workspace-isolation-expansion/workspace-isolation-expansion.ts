/**
 * Workspace Isolation Expansion — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listMultiProjectFoundationUvlRows,
  listWorkspaceIsolationExpansionUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2MultiProjectFoundation } from '../multi-project-foundation/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { coordinateProject } from '../multi-project-foundation/project-coordinator.js';
import type { RegisterWorkspaceInput, WorkspaceRuntimeReport } from './workspace-isolation-types.js';
import {
  WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE,
  WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN,
} from './workspace-isolation-types.js';
import { coordinateWorkspace } from './workspace-coordinator.js';
import { getWorkspaceRegistrySize } from './workspace-registry.js';
import { getWorkspaceCacheStats } from './workspace-cache.js';
import { getTotalWorkspaceViolationCount } from './workspace-violation-detector.js';

export interface WorkspaceIsolationExpansionSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  autonomousBuildCount: number;
  multiProjectFoundationToken: string;
  completionEngineToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: WorkspaceIsolationExpansionSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2WorkspaceIsolationExpansion(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  isolationOnly: true;
} {
  return {
    ownerModule: WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE,
    passToken: WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN,
    phase: 20.2,
    isolationOnly: true,
  };
}

export function registerWorkspaceIsolationExpansionWithCentralBrain(): WorkspaceIsolationExpansionSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    projectVaultProjects: vaultState.projectCount,
    trustScore: trustResult?.trustScore ?? null,
    world2SystemCount: summaries.filter((s) => s.systemId.includes('world2')).length,
    autonomousBuildCount: listAutonomousBuilds().length,
    multiProjectFoundationToken: getDevPulseV2MultiProjectFoundation().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    uvlRows:
      listMultiProjectFoundationUvlRows().length +
      listWorkspaceIsolationExpansionUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerWorkspaceIsolationExpansionWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerWorkspaceIsolationExpansionWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerWorkspaceIsolationExpansionWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerWorkspaceIsolationExpansionWithUvl(): { uvlRowCount: number; readOnly: true } {
  return {
    uvlRowCount: listWorkspaceIsolationExpansionUvlRows().length,
    readOnly: true,
  };
}

export function registerWorkspaceIsolationExpansionWithMultiProjectFoundation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectFoundation().passToken, readOnly: true };
}

export function registerWorkspaceIsolationExpansionWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerWorkspaceIsolationExpansionWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function coordinateWorkspaceFromProject(
  projectName: string,
  projectType: string,
): ReturnType<typeof coordinateWorkspace> {
  registerWorkspaceIsolationExpansionWithCentralBrain();
  const { record: project } = coordinateProject({ projectName, projectType });
  return coordinateWorkspace({
    workspaceId: project.workspaceId,
    ownerProjectId: project.projectId,
  });
}

export function coordinateWorkspaceFromInput(input: RegisterWorkspaceInput): ReturnType<typeof coordinateWorkspace> {
  registerWorkspaceIsolationExpansionWithCentralBrain();
  return coordinateWorkspace(input);
}

export function getWorkspaceIsolationExpansionRuntimeReport(): WorkspaceRuntimeReport {
  const cache = getWorkspaceCacheStats();
  return {
    workspaceCount: getWorkspaceRegistrySize(),
    registrySize: getWorkspaceRegistrySize(),
    violationCount: getTotalWorkspaceViolationCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetWorkspaceIsolationExpansionForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
