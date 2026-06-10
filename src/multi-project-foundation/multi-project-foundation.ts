/**
 * Multi Project Foundation — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listVerificationIntegrationUvlRows,
  listVerificationIntelligenceUvlRows,
  listVerificationStrategyCoreUvlRows,
  listMultiProjectFoundationUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import type { ProjectRuntimeReport, RegisterProjectInput } from './multi-project-types.js';
import {
  MULTI_PROJECT_FOUNDATION_OWNER_MODULE,
  MULTI_PROJECT_FOUNDATION_PASS_TOKEN,
} from './multi-project-types.js';
import { coordinateProject } from './project-coordinator.js';
import { generateProjectReport } from './project-reporting.js';
import { getProjectRegistrySize } from './project-registry.js';
import { getTotalProjectHistorySize } from './project-history-manager.js';
import { getProjectRegistryCacheStats } from './project-registry-cache.js';

export interface MultiProjectFoundationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  buildStrategyCount: number;
  autonomousBuildCount: number;
  verificationStackTokens: string[];
  completionEngineToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: MultiProjectFoundationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2MultiProjectFoundation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  foundationOnly: true;
} {
  return {
    ownerModule: MULTI_PROJECT_FOUNDATION_OWNER_MODULE,
    passToken: MULTI_PROJECT_FOUNDATION_PASS_TOKEN,
    phase: 20.1,
    foundationOnly: true,
  };
}

export function registerMultiProjectFoundationWithCentralBrain(): MultiProjectFoundationSystemSnapshot {
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
    buildStrategyCount: listBuildStrategies().length,
    autonomousBuildCount: listAutonomousBuilds().length,
    verificationStackTokens: [
      getDevPulseV2VerificationStrategyCore().passToken,
      getDevPulseV2VerificationIntelligence().passToken,
      getDevPulseV2VerificationIntegration().passToken,
    ],
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    uvlRows:
      listVerificationStrategyCoreUvlRows().length +
      listVerificationIntelligenceUvlRows().length +
      listVerificationIntegrationUvlRows().length +
      listMultiProjectFoundationUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerMultiProjectFoundationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerMultiProjectFoundationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerMultiProjectFoundationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerMultiProjectFoundationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return {
    uvlRowCount: listMultiProjectFoundationUvlRows().length,
    readOnly: true,
  };
}

export function registerMultiProjectFoundationWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerMultiProjectFoundationWithBuildStrategyEngine(): { strategyCount: number; readOnly: true } {
  return { strategyCount: listBuildStrategies().length, readOnly: true };
}

export function registerMultiProjectFoundationWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerAndReportProject(input: RegisterProjectInput): {
  coordinated: ReturnType<typeof coordinateProject>;
  report: ReturnType<typeof generateProjectReport>;
} {
  registerMultiProjectFoundationWithCentralBrain();
  const coordinated = coordinateProject(input);
  const report = generateProjectReport(coordinated.record.projectId);
  return { coordinated, report };
}

export function getMultiProjectFoundationRuntimeReport(): ProjectRuntimeReport {
  const cache = getProjectRegistryCacheStats();
  return {
    projectCount: getProjectRegistrySize(),
    registrySize: getProjectRegistrySize(),
    historySize: getTotalProjectHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetMultiProjectFoundationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
