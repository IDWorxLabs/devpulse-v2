/**
 * Capability Planning Engine — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listCapabilityPlanningEngineUvlRows,
  listCapabilityResearchEngineUvlRows,
  listMissingCapabilityEscalationUvlRows,
  listAutonomousVerificationUvlRows,
  listAutonomousCompletionEngineUvlRows,
  listMultiProjectMonitoringUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { getDevPulseV2CapabilityResearchEngine } from '../capability-research-engine/index.js';
import { getDevPulseV2AutonomousBuilderFoundation } from '../autonomous-builder/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import type { CapabilityPlanningInput, CapabilityPlanningRuntimeReport } from './capability-planning-types.js';
import {
  CAPABILITY_PLANNING_ENGINE_OWNER_MODULE,
  CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
} from './capability-planning-types.js';
import { buildCapabilityPlan, getDuplicateDetectionCount, getPlansCreatedCount } from './capability-plan-builder.js';
import { getCapabilityPlanCount } from './capability-plan-registry.js';
import { getImpactAnalysisCount } from './capability-impact-analyzer.js';
import { getRiskAnalysisCount } from './capability-risk-analyzer.js';
import { getDependencyAnalysisCount } from './capability-dependency-planner.js';
import { getApprovalDecisionCount } from './capability-approval-planner.js';
import { getCapabilityPlanningCacheStats } from './capability-planning-cache.js';

export interface CapabilityPlanningEngineSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  escalationToken: string;
  researchEngineToken: string;
  autonomousBuilderToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectMonitoringToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: CapabilityPlanningEngineSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2CapabilityPlanningEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: CAPABILITY_PLANNING_ENGINE_OWNER_MODULE,
    passToken: CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
    phase: 21.3,
    planningOnly: true,
  };
}

export function registerCapabilityPlanningEngineWithCentralBrain(): CapabilityPlanningEngineSystemSnapshot {
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
    autonomousBuilderToken: getDevPulseV2AutonomousBuilderFoundation().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    uvlRows:
      listMissingCapabilityEscalationUvlRows().length +
      listCapabilityResearchEngineUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length +
      listMultiProjectMonitoringUvlRows().length +
      listCapabilityPlanningEngineUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerCapabilityPlanningEngineWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerCapabilityPlanningEngineWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerCapabilityPlanningEngineWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerCapabilityPlanningEngineWithCapabilityResearchEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityResearchEngine().passToken, readOnly: true };
}

export function registerCapabilityPlanningEngineWithAutonomousBuilder(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousBuilderFoundation().passToken, readOnly: true };
}

export function registerCapabilityPlanningEngineWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerCapabilityPlanningEngineWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerCapabilityPlanningEngineWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerCapabilityPlanningEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listCapabilityPlanningEngineUvlRows().length, readOnly: true };
}

export function evaluateCapabilityPlanning(input: CapabilityPlanningInput): ReturnType<typeof buildCapabilityPlan> {
  registerCapabilityPlanningEngineWithCentralBrain();
  return buildCapabilityPlan(input);
}

export function getCapabilityPlanningEngineRuntimeReport(): CapabilityPlanningRuntimeReport {
  const cache = getCapabilityPlanningCacheStats();
  return {
    plansCreated: getPlansCreatedCount(),
    impactAnalyses: getImpactAnalysisCount(),
    riskAnalyses: getRiskAnalysisCount(),
    dependencyAnalyses: getDependencyAnalysisCount(),
    approvalDecisions: getApprovalDecisionCount(),
    duplicateDetections: getDuplicateDetectionCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetCapabilityPlanningEngineForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
