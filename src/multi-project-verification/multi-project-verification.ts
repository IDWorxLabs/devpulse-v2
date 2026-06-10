/**
 * Multi Project Verification — orchestration and read-only integrations.
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
} from '../unified-verification-lab/uvl-row-registry.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2MultiProjectFoundation } from '../multi-project-foundation/index.js';
import { getDevPulseV2WorkspaceIsolationExpansion } from '../workspace-isolation-expansion/index.js';
import { getDevPulseV2ResourceAllocation } from '../resource-allocation/index.js';
import { getDevPulseV2ParallelBuildOrchestration } from '../parallel-build-orchestration/index.js';
import { getDevPulseV2AutonomousTesting } from '../autonomous-testing/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { coordinateProject } from '../multi-project-foundation/project-coordinator.js';
import { coordinateWorkspace } from '../workspace-isolation-expansion/workspace-coordinator.js';
import type { MultiProjectVerificationRuntimeReport, ProjectVerificationInput } from './multi-project-verification-types.js';
import {
  MULTI_PROJECT_VERIFICATION_OWNER_MODULE,
  MULTI_PROJECT_VERIFICATION_PASS_TOKEN,
} from './multi-project-verification-types.js';
import { coordinatePortfolioVerification } from './project-verification-coordinator.js';
import { getProjectVerificationCount } from './project-verification-registry.js';
import { getProjectVerificationCacheStats } from './project-verification-cache.js';

export interface MultiProjectVerificationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  autonomousBuildCount: number;
  multiProjectFoundationToken: string;
  workspaceIsolationToken: string;
  resourceAllocationToken: string;
  parallelBuildOrchestrationToken: string;
  autonomousTestingToken: string;
  autonomousFixingToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: MultiProjectVerificationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let trackedProjectCount = 0;
let trackedPortfolioSize = 0;

export function getDevPulseV2MultiProjectVerification(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: MULTI_PROJECT_VERIFICATION_OWNER_MODULE,
    passToken: MULTI_PROJECT_VERIFICATION_PASS_TOKEN,
    phase: 20.5,
    planningOnly: true,
  };
}

export function registerMultiProjectVerificationWithCentralBrain(): MultiProjectVerificationSystemSnapshot {
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
    autonomousTestingToken: getDevPulseV2AutonomousTesting().passToken,
    autonomousFixingToken: getDevPulseV2AutonomousFixing().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    uvlRows:
      listMultiProjectFoundationUvlRows().length +
      listWorkspaceIsolationExpansionUvlRows().length +
      listResourceAllocationUvlRows().length +
      listParallelBuildOrchestrationUvlRows().length +
      listMultiProjectVerificationUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerMultiProjectVerificationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerMultiProjectVerificationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerMultiProjectVerificationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerMultiProjectVerificationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listMultiProjectVerificationUvlRows().length, readOnly: true };
}

export function registerMultiProjectVerificationWithMultiProjectFoundation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectFoundation().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithWorkspaceIsolation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2WorkspaceIsolationExpansion().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithResourceAllocation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ResourceAllocation().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithParallelBuildOrchestration(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ParallelBuildOrchestration().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithAutonomousTesting(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousTesting().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerMultiProjectVerificationWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function verifyProjectsFromCoordinatedInputs(
  specs: Array<{
    name: string;
    type: string;
    trustScore?: number;
    verificationConfidence?: number;
    testingConfidence?: number;
    testResultStatus?: string;
    verificationDecision?: string;
    criticalSubsystem?: boolean;
  }>,
): ReturnType<typeof coordinatePortfolioVerification> {
  registerMultiProjectVerificationWithCentralBrain();

  const inputs: ProjectVerificationInput[] = [];

  for (const spec of specs) {
    const { record: project } = coordinateProject({ projectName: spec.name, projectType: spec.type });
    coordinateWorkspace({ workspaceId: project.workspaceId, ownerProjectId: project.projectId });
    inputs.push({
      projectId: project.projectId,
      workspaceId: project.workspaceId,
      trustScore: spec.trustScore ?? 70,
      verificationConfidence: spec.verificationConfidence ?? 65,
      testingConfidence: spec.testingConfidence ?? 60,
      testResultStatus: spec.testResultStatus ?? 'SIMULATED_PASS',
      verificationDecision: spec.verificationDecision ?? 'VERIFIED',
      criticalSubsystem: spec.criticalSubsystem ?? false,
      isolationOk: true,
      orchestrationReady: true,
      world2Active: true,
      projectState: project.state,
    });
  }

  const result = coordinatePortfolioVerification(inputs);
  trackedProjectCount = inputs.length;
  trackedPortfolioSize = result.portfolio.totalProjects;
  return result;
}

export function trackMultiProjectVerificationRuntime(projectCount: number, portfolioSize: number): void {
  trackedProjectCount = projectCount;
  trackedPortfolioSize = portfolioSize;
}

export function getMultiProjectVerificationRuntimeReport(): MultiProjectVerificationRuntimeReport {
  const cache = getProjectVerificationCacheStats();
  const verificationCount = getProjectVerificationCount();
  return {
    projectCount: trackedProjectCount || verificationCount,
    verificationCount,
    portfolioSize: trackedPortfolioSize || verificationCount,
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetMultiProjectVerificationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  trackedProjectCount = 0;
  trackedPortfolioSize = 0;
}
