/**
 * Self Evolution Governance — orchestration and read-only integrations.
 * Governance only — no execution, no self-modification.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listSelfEvolutionGovernanceUvlRows,
  listCapabilityVerificationEngineUvlRows,
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
import { getDevPulseV2CapabilityBuildEngine } from '../capability-build-engine/index.js';
import { getDevPulseV2CapabilityVerificationEngine } from '../capability-verification-engine/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import type { SelfEvolutionGovernanceInput, SelfEvolutionGovernanceRuntimeReport } from './self-evolution-governance-types.js';
import {
  SELF_EVOLUTION_GOVERNANCE_OWNER_MODULE,
  SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN,
} from './self-evolution-governance-types.js';
import { buildGovernanceDecision } from './governance-decision-engine.js';
import { getGovernanceRecordCount } from './self-evolution-governance-registry.js';
import { getBoundaryValidationCount } from './governance-boundary-validator.js';
import { getRiskReviewCount } from './governance-risk-evaluator.js';
import { getTrustReviewCount } from './governance-trust-evaluator.js';
import { getApprovalReviewCount } from './governance-approval-evaluator.js';
import { getRollbackReviewCount } from './governance-rollback-validator.js';
import { getReadinessEvaluationCount } from './governance-readiness-evaluator.js';
import { getGovernanceCacheStats } from './governance-cache.js';

export interface SelfEvolutionGovernanceSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  escalationToken: string;
  researchEngineToken: string;
  planningEngineToken: string;
  buildEngineToken: string;
  verificationEngineToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectMonitoringToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: SelfEvolutionGovernanceSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2SelfEvolutionGovernance(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  governanceOnly: true;
  noSelfModification: true;
  noExecution: true;
} {
  return {
    ownerModule: SELF_EVOLUTION_GOVERNANCE_OWNER_MODULE,
    passToken: SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN,
    phase: 21.6,
    governanceOnly: true,
    noSelfModification: true,
    noExecution: true,
  };
}

export function registerSelfEvolutionGovernanceWithCentralBrain(): SelfEvolutionGovernanceSystemSnapshot {
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
    buildEngineToken: getDevPulseV2CapabilityBuildEngine().passToken,
    verificationEngineToken: getDevPulseV2CapabilityVerificationEngine().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    uvlRows:
      listMissingCapabilityEscalationUvlRows().length +
      listCapabilityResearchEngineUvlRows().length +
      listCapabilityPlanningEngineUvlRows().length +
      listCapabilityBuildEngineUvlRows().length +
      listCapabilityVerificationEngineUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length +
      listMultiProjectMonitoringUvlRows().length +
      listSelfEvolutionGovernanceUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerSelfEvolutionGovernanceWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerSelfEvolutionGovernanceWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithCapabilityResearchEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityResearchEngine().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithCapabilityPlanningEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityPlanningEngine().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithCapabilityBuildEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityBuildEngine().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithCapabilityVerificationEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityVerificationEngine().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerSelfEvolutionGovernanceWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listSelfEvolutionGovernanceUvlRows().length, readOnly: true };
}

export function evaluateSelfEvolutionGovernance(input: SelfEvolutionGovernanceInput): ReturnType<typeof buildGovernanceDecision> {
  registerSelfEvolutionGovernanceWithCentralBrain();
  return buildGovernanceDecision(input);
}

export function getSelfEvolutionGovernanceRuntimeReport(): SelfEvolutionGovernanceRuntimeReport {
  const cache = getGovernanceCacheStats();
  return {
    boundaryValidations: getBoundaryValidationCount(),
    riskReviews: getRiskReviewCount(),
    trustReviews: getTrustReviewCount(),
    approvalReviews: getApprovalReviewCount(),
    rollbackReviews: getRollbackReviewCount(),
    readinessEvaluations: getReadinessEvaluationCount(),
    governanceCount: getGovernanceRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetSelfEvolutionGovernanceForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
