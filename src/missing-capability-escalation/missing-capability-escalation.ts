/**
 * Missing Capability Escalation — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listMissingCapabilityEscalationUvlRows,
  listAutonomousTestingUvlRows,
  listAutonomousFixingUvlRows,
  listAutonomousVerificationUvlRows,
  listAutonomousCompletionEngineUvlRows,
  listMultiProjectMonitoringUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2AutonomousTesting } from '../autonomous-testing/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import type { EscalationInput, EscalationRuntimeReport } from './escalation-types.js';
import {
  MISSING_CAPABILITY_ESCALATION_OWNER_MODULE,
  MISSING_CAPABILITY_ESCALATION_PASS_TOKEN,
} from './escalation-types.js';
import { buildEscalationDecision } from './escalation-decision-engine.js';
import { getEscalationCount } from './escalation-registry.js';
import { getFailurePatternCount } from './failure-pattern-detector.js';
import { getStallPatternCount } from './stall-pattern-detector.js';
import { getBottleneckPatternCount } from './bottleneck-pattern-detector.js';
import { getBlockedPatternCount } from './blocked-state-detector.js';
import { getEscalationCacheStats } from './escalation-cache.js';

export interface MissingCapabilityEscalationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  autonomousTestingToken: string;
  autonomousFixingToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectMonitoringToken: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: MissingCapabilityEscalationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2MissingCapabilityEscalation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  analysisOnly: true;
} {
  return {
    ownerModule: MISSING_CAPABILITY_ESCALATION_OWNER_MODULE,
    passToken: MISSING_CAPABILITY_ESCALATION_PASS_TOKEN,
    phase: 21.1,
    analysisOnly: true,
  };
}

export function registerMissingCapabilityEscalationWithCentralBrain(): MissingCapabilityEscalationSystemSnapshot {
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
    autonomousTestingToken: getDevPulseV2AutonomousTesting().passToken,
    autonomousFixingToken: getDevPulseV2AutonomousFixing().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    uvlRows:
      listAutonomousTestingUvlRows().length +
      listAutonomousFixingUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length +
      listMultiProjectMonitoringUvlRows().length +
      listMissingCapabilityEscalationUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerMissingCapabilityEscalationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerMissingCapabilityEscalationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerMissingCapabilityEscalationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerMissingCapabilityEscalationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listMissingCapabilityEscalationUvlRows().length, readOnly: true };
}

export function registerMissingCapabilityEscalationWithAutonomousTesting(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousTesting().passToken, readOnly: true };
}

export function registerMissingCapabilityEscalationWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function registerMissingCapabilityEscalationWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerMissingCapabilityEscalationWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerMissingCapabilityEscalationWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function evaluateCapabilityEscalation(input: EscalationInput): ReturnType<typeof buildEscalationDecision> {
  registerMissingCapabilityEscalationWithCentralBrain();
  return buildEscalationDecision(input);
}

export function getMissingCapabilityEscalationRuntimeReport(): EscalationRuntimeReport {
  const cache = getEscalationCacheStats();
  return {
    failurePatternCount: getFailurePatternCount(),
    stallPatternCount: getStallPatternCount(),
    bottleneckPatternCount: getBottleneckPatternCount(),
    blockedPatternCount: getBlockedPatternCount(),
    escalationCount: getEscalationCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetMissingCapabilityEscalationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
