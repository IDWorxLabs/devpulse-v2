/**
 * Parallel Build Orchestration — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listMultiProjectFoundationUvlRows,
  listWorkspaceIsolationExpansionUvlRows,
  listResourceAllocationUvlRows,
  listParallelBuildOrchestrationUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2MultiProjectFoundation } from '../multi-project-foundation/index.js';
import { getDevPulseV2WorkspaceIsolationExpansion } from '../workspace-isolation-expansion/index.js';
import { getDevPulseV2ResourceAllocation } from '../resource-allocation/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { coordinateProject } from '../multi-project-foundation/project-coordinator.js';
import { coordinateWorkspace } from '../workspace-isolation-expansion/workspace-coordinator.js';
import { registerAllDefaultResources } from '../resource-allocation/resource-registry.js';
import type { OrchestrationProjectInput, OrchestrationRuntimeReport } from './orchestration-types.js';
import {
  PARALLEL_BUILD_ORCHESTRATION_OWNER_MODULE,
  PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN,
} from './orchestration-types.js';
import { buildOrchestrationPlan } from './orchestration-plan-builder.js';
import { generateOrchestrationReport } from './orchestration-reporting.js';
import { recordOrchestrationHistory } from './orchestration-history.js';
import { getOrchestrationPlanCount } from './orchestration-registry.js';
import { getDependencyCount } from './orchestration-dependency-manager.js';
import { getTotalOrchestrationConflictCount } from './orchestration-conflict-detector.js';
import { getOrchestrationCacheStats } from './orchestration-cache.js';
import { detectOrchestrationConflicts } from './orchestration-conflict-detector.js';
import { buildDependencyChains } from './orchestration-dependency-manager.js';

export interface ParallelBuildOrchestrationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  autonomousBuildCount: number;
  multiProjectFoundationToken: string;
  workspaceIsolationToken: string;
  resourceAllocationToken: string;
  completionEngineToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: ParallelBuildOrchestrationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let trackedProjectCount = 0;
let trackedDependencyCount = 0;

export function getDevPulseV2ParallelBuildOrchestration(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: PARALLEL_BUILD_ORCHESTRATION_OWNER_MODULE,
    passToken: PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN,
    phase: 20.4,
    planningOnly: true,
  };
}

export function registerParallelBuildOrchestrationWithCentralBrain(): ParallelBuildOrchestrationSystemSnapshot {
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
    resourceAllocationToken: getDevPulseV2ResourceAllocation().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    uvlRows:
      listMultiProjectFoundationUvlRows().length +
      listWorkspaceIsolationExpansionUvlRows().length +
      listResourceAllocationUvlRows().length +
      listParallelBuildOrchestrationUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerParallelBuildOrchestrationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerParallelBuildOrchestrationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerParallelBuildOrchestrationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerParallelBuildOrchestrationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listParallelBuildOrchestrationUvlRows().length, readOnly: true };
}

export function registerParallelBuildOrchestrationWithMultiProjectFoundation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectFoundation().passToken, readOnly: true };
}

export function registerParallelBuildOrchestrationWithWorkspaceIsolation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2WorkspaceIsolationExpansion().passToken, readOnly: true };
}

export function registerParallelBuildOrchestrationWithResourceAllocation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ResourceAllocation().passToken, readOnly: true };
}

export function registerParallelBuildOrchestrationWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerParallelBuildOrchestrationWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function buildOrchestrationPlanFromProjects(
  projectInputs: OrchestrationProjectInput[],
): {
  plan: ReturnType<typeof buildOrchestrationPlan>;
  report: ReturnType<typeof generateOrchestrationReport>;
} {
  registerParallelBuildOrchestrationWithCentralBrain();
  registerAllDefaultResources();

  const plan = buildOrchestrationPlan(projectInputs);
  const dependencyResult = buildDependencyChains(projectInputs);
  const conflicts = detectOrchestrationConflicts(projectInputs, dependencyResult, plan.executionGroups);
  recordOrchestrationHistory(plan, conflicts.length);

  const report = generateOrchestrationReport(plan, projectInputs);
  trackedProjectCount = projectInputs.length;
  trackedDependencyCount = getDependencyCount(projectInputs);

  return { plan, report };
}

export function buildOrchestrationPlanFromCoordinatedProjects(
  specs: Array<{ name: string; type: string; priority?: string; dependsOn?: string[] }>,
): ReturnType<typeof buildOrchestrationPlanFromProjects> {
  const inputs: OrchestrationProjectInput[] = [];

  for (const spec of specs) {
    const { record: project } = coordinateProject({ projectName: spec.name, projectType: spec.type });
    coordinateWorkspace({ workspaceId: project.workspaceId, ownerProjectId: project.projectId });
    inputs.push({
      projectId: project.projectId,
      workspaceId: project.workspaceId,
      priority: spec.priority ?? 'NORMAL',
      dependsOn: spec.dependsOn,
      projectState: project.state,
      resourceAvailable: true,
      isolationOk: true,
    });
  }

  return buildOrchestrationPlanFromProjects(inputs);
}

export function getParallelBuildOrchestrationRuntimeReport(): OrchestrationRuntimeReport {
  const cache = getOrchestrationCacheStats();
  return {
    projectCount: trackedProjectCount,
    planCount: getOrchestrationPlanCount(),
    dependencyCount: trackedDependencyCount,
    conflictCount: getTotalOrchestrationConflictCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetParallelBuildOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  trackedProjectCount = 0;
  trackedDependencyCount = 0;
}
