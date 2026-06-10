/**
 * Capability Verification Engine — orchestration and read-only integrations.
 * Verification only — no execution, no file modification.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
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
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import type { CapabilityVerificationInput, CapabilityVerificationRuntimeReport } from './capability-verification-types.js';
import {
  CAPABILITY_VERIFICATION_ENGINE_OWNER_MODULE,
  CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN,
} from './capability-verification-types.js';
import { buildCapabilityVerificationDecision, getVerificationDecisionCount } from './capability-verification-decision-engine.js';
import { getCapabilityVerificationCount } from './capability-verification-registry.js';
import { getRequirementValidationCount } from './capability-requirement-validator.js';
import { getDuplicateCheckCount } from './capability-duplicate-validator.js';
import { getRiskValidationCount } from './capability-risk-validator.js';
import { getRolloutValidationCount } from './capability-rollout-validator.js';
import { getTrustValidationCount } from './capability-trust-validator.js';
import { getReadinessEvaluationCount } from './capability-readiness-evaluator.js';
import { getCapabilityVerificationCacheStats } from './capability-verification-cache.js';

export interface CapabilityVerificationEngineSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  escalationToken: string;
  researchEngineToken: string;
  planningEngineToken: string;
  buildEngineToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectMonitoringToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: CapabilityVerificationEngineSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2CapabilityVerificationEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  verificationOnly: true;
  noFileModification: true;
  noExecution: true;
} {
  return {
    ownerModule: CAPABILITY_VERIFICATION_ENGINE_OWNER_MODULE,
    passToken: CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN,
    phase: 21.5,
    verificationOnly: true,
    noFileModification: true,
    noExecution: true,
  };
}

export function registerCapabilityVerificationEngineWithCentralBrain(): CapabilityVerificationEngineSystemSnapshot {
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
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    uvlRows:
      listMissingCapabilityEscalationUvlRows().length +
      listCapabilityResearchEngineUvlRows().length +
      listCapabilityPlanningEngineUvlRows().length +
      listCapabilityBuildEngineUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length +
      listMultiProjectMonitoringUvlRows().length +
      listCapabilityVerificationEngineUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerCapabilityVerificationEngineWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerCapabilityVerificationEngineWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerCapabilityVerificationEngineWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithCapabilityResearchEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityResearchEngine().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithCapabilityPlanningEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityPlanningEngine().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithCapabilityBuildEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityBuildEngine().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerCapabilityVerificationEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listCapabilityVerificationEngineUvlRows().length, readOnly: true };
}

export function evaluateCapabilityVerification(input: CapabilityVerificationInput): ReturnType<typeof buildCapabilityVerificationDecision> {
  registerCapabilityVerificationEngineWithCentralBrain();
  return buildCapabilityVerificationDecision(input);
}

export function getCapabilityVerificationEngineRuntimeReport(): CapabilityVerificationRuntimeReport {
  const cache = getCapabilityVerificationCacheStats();
  return {
    requirementValidations: getRequirementValidationCount(),
    duplicateChecks: getDuplicateCheckCount(),
    riskValidations: getRiskValidationCount(),
    rolloutValidations: getRolloutValidationCount(),
    trustValidations: getTrustValidationCount(),
    readinessEvaluations: getReadinessEvaluationCount(),
    verificationCount: getCapabilityVerificationCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetCapabilityVerificationEngineForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
