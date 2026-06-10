/**
 * Multi Project Verification Orchestration — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listMultiProjectFoundationUvlRows,
  listWorkspaceIsolationExpansionUvlRows,
  listResourceAllocationUvlRows,
  listParallelBuildOrchestrationUvlRows,
  listMultiProjectVerificationUvlRows,
  listMultiProjectVerificationOrchestrationUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2MultiProjectFoundation } from '../multi-project-foundation/index.js';
import { getDevPulseV2WorkspaceIsolationExpansion } from '../workspace-isolation-expansion/index.js';
import { getDevPulseV2ResourceAllocation } from '../resource-allocation/index.js';
import { getDevPulseV2ParallelBuildOrchestration } from '../parallel-build-orchestration/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { coordinateProject } from '../multi-project-foundation/project-coordinator.js';
import { coordinateWorkspace } from '../workspace-isolation-expansion/workspace-coordinator.js';
import { registerAllDefaultResources } from '../resource-allocation/resource-registry.js';
import type { VerificationOrchestrationProjectInput, VerificationOrchestrationRuntimeReport } from './verification-orchestration-types.js';
import {
  MULTI_PROJECT_VERIFICATION_ORCHESTRATION_OWNER_MODULE,
  MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN,
} from './verification-orchestration-types.js';
import { buildVerificationOrchestrationPlan } from './verification-plan-builder.js';
import { generateVerificationOrchestrationReport } from './verification-reporting.js';
import { recordVerificationOrchestrationHistory } from './verification-history.js';
import { getVerificationOrchestrationPlanCount } from './verification-orchestration-registry.js';
import { getVerificationDependencyCount } from './verification-dependency-manager.js';
import { getTotalVerificationConflictCount } from './verification-conflict-detector.js';
import { getVerificationOrchestrationCacheStats } from './verification-cache.js';
import { detectVerificationConflicts } from './verification-conflict-detector.js';
import { buildVerificationDependencyChains } from './verification-dependency-manager.js';

export interface MultiProjectVerificationOrchestrationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  autonomousBuildCount: number;
  multiProjectFoundationToken: string;
  workspaceIsolationToken: string;
  resourceAllocationToken: string;
  parallelBuildOrchestrationToken: string;
  multiProjectVerificationToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: MultiProjectVerificationOrchestrationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let trackedProjectCount = 0;
let trackedDependencyCount = 0;

export function getDevPulseV2MultiProjectVerificationOrchestration(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: MULTI_PROJECT_VERIFICATION_ORCHESTRATION_OWNER_MODULE,
    passToken: MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN,
    phase: 20.51,
    planningOnly: true,
  };
}

export function registerMultiProjectVerificationOrchestrationWithCentralBrain(): MultiProjectVerificationOrchestrationSystemSnapshot {
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
    parallelBuildOrchestrationToken: getDevPulseV2ParallelBuildOrchestration().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    uvlRows:
      listMultiProjectFoundationUvlRows().length +
      listWorkspaceIsolationExpansionUvlRows().length +
      listResourceAllocationUvlRows().length +
      listParallelBuildOrchestrationUvlRows().length +
      listMultiProjectVerificationUvlRows().length +
      listMultiProjectVerificationOrchestrationUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerMultiProjectVerificationOrchestrationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerMultiProjectVerificationOrchestrationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerMultiProjectVerificationOrchestrationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listMultiProjectVerificationOrchestrationUvlRows().length, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithMultiProjectFoundation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectFoundation().passToken, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithWorkspaceIsolation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2WorkspaceIsolationExpansion().passToken, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithResourceAllocation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ResourceAllocation().passToken, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithParallelBuildOrchestration(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ParallelBuildOrchestration().passToken, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerMultiProjectVerificationOrchestrationWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function buildVerificationOrchestrationPlanFromProjects(
  projectInputs: VerificationOrchestrationProjectInput[],
): {
  plan: ReturnType<typeof buildVerificationOrchestrationPlan>;
  report: ReturnType<typeof generateVerificationOrchestrationReport>;
} {
  registerMultiProjectVerificationOrchestrationWithCentralBrain();
  registerAllDefaultResources();

  const plan = buildVerificationOrchestrationPlan(projectInputs);
  const dependencyResult = buildVerificationDependencyChains(projectInputs);
  const conflicts = detectVerificationConflicts(projectInputs, dependencyResult, plan.groups);
  recordVerificationOrchestrationHistory(plan, conflicts.length);

  const report = generateVerificationOrchestrationReport(plan, projectInputs);
  trackedProjectCount = projectInputs.length;
  trackedDependencyCount = getVerificationDependencyCount(projectInputs);

  return { plan, report };
}

export function buildVerificationOrchestrationPlanFromCoordinatedProjects(
  specs: Array<{
    name: string;
    type: string;
    dependsOn?: string[];
    confidence?: number;
    riskScore?: number;
    verificationStatus?: VerificationOrchestrationProjectInput['verificationStatus'];
  }>,
): ReturnType<typeof buildVerificationOrchestrationPlanFromProjects> {
  const inputs: VerificationOrchestrationProjectInput[] = [];

  for (const spec of specs) {
    const { record: project } = coordinateProject({ projectName: spec.name, projectType: spec.type });
    coordinateWorkspace({ workspaceId: project.workspaceId, ownerProjectId: project.projectId });
    inputs.push({
      projectId: project.projectId,
      workspaceId: project.workspaceId,
      dependsOn: spec.dependsOn,
      confidence: spec.confidence ?? 65,
      riskScore: spec.riskScore ?? 25,
      verificationStatus: spec.verificationStatus ?? 'NEEDS_VERIFICATION',
      verificationReady: true,
      resourceAvailable: true,
      isolationOk: true,
      orchestrationReady: true,
    });
  }

  return buildVerificationOrchestrationPlanFromProjects(inputs);
}

export function getMultiProjectVerificationOrchestrationRuntimeReport(): VerificationOrchestrationRuntimeReport {
  const cache = getVerificationOrchestrationCacheStats();
  return {
    projectCount: trackedProjectCount,
    planCount: getVerificationOrchestrationPlanCount(),
    dependencyCount: trackedDependencyCount,
    conflictCount: getTotalVerificationConflictCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetMultiProjectVerificationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  trackedProjectCount = 0;
  trackedDependencyCount = 0;
}
