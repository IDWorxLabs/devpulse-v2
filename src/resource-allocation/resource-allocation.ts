/**
 * Resource Allocation — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listMultiProjectFoundationUvlRows,
  listWorkspaceIsolationExpansionUvlRows,
  listResourceAllocationUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2MultiProjectFoundation } from '../multi-project-foundation/index.js';
import { getDevPulseV2WorkspaceIsolationExpansion } from '../workspace-isolation-expansion/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { coordinateProject } from '../multi-project-foundation/project-coordinator.js';
import { coordinateWorkspace } from '../workspace-isolation-expansion/workspace-coordinator.js';
import type { AllocateResourcesInput, ResourceRuntimeReport } from './resource-allocation-types.js';
import {
  RESOURCE_ALLOCATION_OWNER_MODULE,
  RESOURCE_ALLOCATION_PASS_TOKEN,
} from './resource-allocation-types.js';
import { registerAllDefaultResources } from './resource-registry.js';
import { allocateResources } from './resource-allocation-engine.js';
import { generateResourceAllocationReport } from './resource-allocation-reporting.js';
import { getAllocationCount } from './resource-registry.js';
import { getQueueSize } from './resource-queue-manager.js';
import { getTotalContentionCount } from './resource-contention-detector.js';
import { getResourceCacheStats } from './resource-cache.js';

export interface ResourceAllocationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  autonomousBuildCount: number;
  multiProjectFoundationToken: string;
  workspaceIsolationToken: string;
  completionEngineToken: string;
  uvlRows: number;
  registeredAt: number;
}

const trackedProjects = new Set<string>();

let cachedSnapshot: ResourceAllocationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2ResourceAllocation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: RESOURCE_ALLOCATION_OWNER_MODULE,
    passToken: RESOURCE_ALLOCATION_PASS_TOKEN,
    phase: 20.3,
    planningOnly: true,
  };
}

export function registerResourceAllocationWithCentralBrain(): ResourceAllocationSystemSnapshot {
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
    workspaceIsolationToken: getDevPulseV2WorkspaceIsolationExpansion().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    uvlRows:
      listMultiProjectFoundationUvlRows().length +
      listWorkspaceIsolationExpansionUvlRows().length +
      listResourceAllocationUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerResourceAllocationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerResourceAllocationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerResourceAllocationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerResourceAllocationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listResourceAllocationUvlRows().length, readOnly: true };
}

export function registerResourceAllocationWithMultiProjectFoundation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectFoundation().passToken, readOnly: true };
}

export function registerResourceAllocationWithWorkspaceIsolation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2WorkspaceIsolationExpansion().passToken, readOnly: true };
}

export function registerResourceAllocationWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerResourceAllocationWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function allocateResourcesForProject(
  projectName: string,
  projectType: string,
  allocationInput: Partial<AllocateResourcesInput> = {},
): {
  projectId: string;
  workspaceId: string;
  allocation: ReturnType<typeof allocateResources>;
  report: ReturnType<typeof generateResourceAllocationReport>;
} {
  registerResourceAllocationWithCentralBrain();
  registerAllDefaultResources();

  const { record: project } = coordinateProject({ projectName, projectType });
  coordinateWorkspace({ workspaceId: project.workspaceId, ownerProjectId: project.projectId });
  trackedProjects.add(project.projectId);

  const allocation = allocateResources({
    projectId: project.projectId,
    resourceType: allocationInput.resourceType ?? 'BUILD_SLOT',
    requestedUnits: allocationInput.requestedUnits ?? 1,
    ...allocationInput,
  });

  const report = generateResourceAllocationReport();
  return { projectId: project.projectId, workspaceId: project.workspaceId, allocation, report };
}

export function allocateResourcesFromInput(input: AllocateResourcesInput): ReturnType<typeof allocateResources> {
  registerResourceAllocationWithCentralBrain();
  registerAllDefaultResources();
  trackedProjects.add(input.projectId);
  return allocateResources(input);
}

export function getResourceAllocationRuntimeReport(): ResourceRuntimeReport {
  const cache = getResourceCacheStats();
  return {
    projectCount: trackedProjects.size,
    allocationCount: getAllocationCount(),
    queueSize: getQueueSize(),
    contentionCount: getTotalContentionCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetResourceAllocationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  trackedProjects.clear();
}
