/**
 * Capability Build Engine — orchestration and read-only integrations.
 * NO file modification, NO execution, NO deployment.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listCapabilityBuildEngineUvlRows,
  listCapabilityPlanningEngineUvlRows,
  listCapabilityResearchEngineUvlRows,
  listMissingCapabilityEscalationUvlRows,
  listAutonomousVerificationUvlRows,
  listAutonomousCompletionEngineUvlRows,
  listMultiProjectMonitoringUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { getDevPulseV2CapabilityResearchEngine } from '../capability-research-engine/index.js';
import { getDevPulseV2CapabilityPlanningEngine } from '../capability-planning-engine/index.js';
import { getDevPulseV2AutonomousBuilderFoundation } from '../autonomous-builder/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import type { CapabilityBuildInput, CapabilityBuildRuntimeReport } from './capability-build-types.js';
import {
  CAPABILITY_BUILD_ENGINE_OWNER_MODULE,
  CAPABILITY_BUILD_ENGINE_PASS_TOKEN,
} from './capability-build-types.js';
import { buildCapabilityConstructionPlan, getBuildPlansCreatedCount } from './capability-build-pipeline.js';
import { getCapabilityBuildPlanCount } from './capability-build-registry.js';
import { getModulesPlannedCount } from './capability-module-builder.js';
import { getIntegrationsPlannedCount } from './capability-integration-builder.js';
import { getRolloutPlansCount } from './capability-rollout-builder.js';
import { getRollbackPlansCount } from './capability-rollback-builder.js';
import { getValidationPlansCount } from './capability-build-validation-planner.js';
import { getCapabilityBuildCacheStats } from './capability-build-cache.js';

export interface CapabilityBuildEngineSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  escalationToken: string;
  researchEngineToken: string;
  planningEngineToken: string;
  autonomousBuilderToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectMonitoringToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: CapabilityBuildEngineSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2CapabilityBuildEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
  noFileModification: true;
  noExecution: true;
} {
  return {
    ownerModule: CAPABILITY_BUILD_ENGINE_OWNER_MODULE,
    passToken: CAPABILITY_BUILD_ENGINE_PASS_TOKEN,
    phase: 21.4,
    planningOnly: true,
    noFileModification: true,
    noExecution: true,
  };
}

export function registerCapabilityBuildEngineWithCentralBrain(): CapabilityBuildEngineSystemSnapshot {
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
    escalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    researchEngineToken: getDevPulseV2CapabilityResearchEngine().passToken,
    planningEngineToken: getDevPulseV2CapabilityPlanningEngine().passToken,
    autonomousBuilderToken: getDevPulseV2AutonomousBuilderFoundation().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    uvlRows:
      listMissingCapabilityEscalationUvlRows().length +
      listCapabilityResearchEngineUvlRows().length +
      listCapabilityPlanningEngineUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length +
      listMultiProjectMonitoringUvlRows().length +
      listCapabilityBuildEngineUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerCapabilityBuildEngineWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerCapabilityBuildEngineWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerCapabilityBuildEngineWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithCapabilityResearchEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityResearchEngine().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithCapabilityPlanningEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityPlanningEngine().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithAutonomousBuilder(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousBuilderFoundation().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerCapabilityBuildEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listCapabilityBuildEngineUvlRows().length, readOnly: true };
}

export function evaluateCapabilityBuild(input: CapabilityBuildInput): ReturnType<typeof buildCapabilityConstructionPlan> {
  registerCapabilityBuildEngineWithCentralBrain();
  return buildCapabilityConstructionPlan(input);
}

export function getCapabilityBuildEngineRuntimeReport(): CapabilityBuildRuntimeReport {
  const cache = getCapabilityBuildCacheStats();
  return {
    buildPlans: getCapabilityBuildPlanCount(),
    modulesPlanned: getModulesPlannedCount(),
    integrationsPlanned: getIntegrationsPlannedCount(),
    rolloutPlans: getRolloutPlansCount(),
    rollbackPlans: getRollbackPlansCount(),
    validationPlans: getValidationPlansCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetCapabilityBuildEngineForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
