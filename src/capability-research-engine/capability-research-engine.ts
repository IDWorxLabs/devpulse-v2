/**
 * Capability Research Engine — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listCapabilityResearchEngineUvlRows,
  listMissingCapabilityEscalationUvlRows,
  listAutonomousTestingUvlRows,
  listAutonomousFixingUvlRows,
  listAutonomousVerificationUvlRows,
  listAutonomousCompletionEngineUvlRows,
  listMultiProjectMonitoringUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { getDevPulseV2AutonomousTesting } from '../autonomous-testing/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import type { CapabilityResearchInput, CapabilityResearchRuntimeReport } from './capability-research-types.js';
import {
  CAPABILITY_RESEARCH_ENGINE_OWNER_MODULE,
  CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN,
} from './capability-research-types.js';
import { buildCapabilityResearchDecision } from './capability-research-decision-engine.js';
import { getCapabilityResearchCount } from './capability-research-registry.js';
import { getDomainClassificationCount } from './capability-domain-classifier.js';
import { getEvidenceAnalyzedCount } from './capability-evidence-analyzer.js';
import { getDuplicateCheckCount } from './capability-similarity-analyzer.js';
import { getRootCauseAnalysisCount } from './capability-root-cause-researcher.js';
import { getResearchDecisionCount } from './capability-research-decision-engine.js';
import { getCapabilityResearchCacheStats } from './capability-research-cache.js';

export interface CapabilityResearchEngineSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  escalationToken: string;
  autonomousTestingToken: string;
  autonomousFixingToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectMonitoringToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: CapabilityResearchEngineSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2CapabilityResearchEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  researchOnly: true;
} {
  return {
    ownerModule: CAPABILITY_RESEARCH_ENGINE_OWNER_MODULE,
    passToken: CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN,
    phase: 21.2,
    researchOnly: true,
  };
}

export function registerCapabilityResearchEngineWithCentralBrain(): CapabilityResearchEngineSystemSnapshot {
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
    autonomousTestingToken: getDevPulseV2AutonomousTesting().passToken,
    autonomousFixingToken: getDevPulseV2AutonomousFixing().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    uvlRows:
      listMissingCapabilityEscalationUvlRows().length +
      listAutonomousTestingUvlRows().length +
      listAutonomousFixingUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length +
      listMultiProjectMonitoringUvlRows().length +
      listCapabilityResearchEngineUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerCapabilityResearchEngineWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerCapabilityResearchEngineWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerCapabilityResearchEngineWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerCapabilityResearchEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listCapabilityResearchEngineUvlRows().length, readOnly: true };
}

export function registerCapabilityResearchEngineWithAutonomousTesting(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousTesting().passToken, readOnly: true };
}

export function registerCapabilityResearchEngineWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function registerCapabilityResearchEngineWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerCapabilityResearchEngineWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerCapabilityResearchEngineWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function evaluateCapabilityResearch(input: CapabilityResearchInput): ReturnType<typeof buildCapabilityResearchDecision> {
  registerCapabilityResearchEngineWithCentralBrain();
  return buildCapabilityResearchDecision(input);
}

export function getCapabilityResearchEngineRuntimeReport(): CapabilityResearchRuntimeReport {
  const cache = getCapabilityResearchCacheStats();
  return {
    domainClassificationCount: getDomainClassificationCount(),
    evidenceAnalyzedCount: getEvidenceAnalyzedCount(),
    duplicateCheckCount: getDuplicateCheckCount(),
    rootCauseAnalysisCount: getRootCauseAnalysisCount(),
    researchDecisionCount: getResearchDecisionCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetCapabilityResearchEngineForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
