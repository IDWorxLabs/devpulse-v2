/**
 * Verification Intelligence — orchestration and read-only integrations.
 * Planning only — no validator execution.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import { listVerificationStrategyCoreUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import {
  buildVerificationStrategy,
  decideVerificationStrategy,
} from '../verification-strategy-core/index.js';
import type { VerificationStrategyInput } from '../verification-strategy-core/verification-strategy-types.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import type { VerificationPlan, VerificationPlanInput, VerificationPlanRuntimeReport } from './verification-plan-types.js';
import {
  VERIFICATION_INTELLIGENCE_OWNER_MODULE,
  VERIFICATION_INTELLIGENCE_PASS_TOKEN,
} from './verification-plan-types.js';
import { buildVerificationPlan, getVerificationPlanRuntimeReport, markPlanBootstrapReused } from './verification-plan-builder.js';
import { listVerificationPathEntries } from './verification-path-registry.js';

export interface VerificationIntelligenceSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  uvlRowCount: number;
  world2SystemCount: number;
  buildStrategyCount: number;
  pathCount: number;
  registeredAt: number;
}

let cachedSnapshot: VerificationIntelligenceSnapshot | null = null;
let integrationCacheHits = 0;

export function getDevPulseV2VerificationIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: VERIFICATION_INTELLIGENCE_OWNER_MODULE,
    passToken: VERIFICATION_INTELLIGENCE_PASS_TOKEN,
    phase: 19.31,
    planningOnly: true,
  };
}

export function registerVerificationIntelligenceWithCentralBrain(): VerificationIntelligenceSnapshot {
  if (cachedSnapshot) {
    integrationCacheHits += 1;
    markPlanBootstrapReused();
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    projectVaultProjects: vaultState.projectCount,
    trustScore: trustResult?.trustScore ?? null,
    uvlRowCount: listVerificationStrategyCoreUvlRows().length,
    world2SystemCount: summaries.filter((s) => s.systemId.includes('world2')).length,
    buildStrategyCount: listBuildStrategies().length,
    pathCount: listVerificationPathEntries().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerVerificationIntelligenceWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerVerificationIntelligenceWithTrustEngine(): {
  trustScore: number | null;
  readOnly: true;
} {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerVerificationIntelligenceWithUvl(): {
  strategyCoreUvlRows: number;
  readOnly: true;
} {
  return {
    strategyCoreUvlRows: listVerificationStrategyCoreUvlRows().length,
    readOnly: true,
  };
}

export function registerVerificationIntelligenceWithWorld2Coordinator(): {
  world2SystemCount: number;
  readOnly: true;
} {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerVerificationIntelligenceWithBuildStrategyEngine(): {
  buildStrategyCount: number;
  readOnly: true;
} {
  return { buildStrategyCount: listBuildStrategies().length, readOnly: true };
}

export function strategyInputToPlanInput(
  strategyInput: VerificationStrategyInput,
  decision: ReturnType<typeof buildVerificationStrategy>,
): VerificationPlanInput {
  return {
    projectContext: strategyInput.projectContext,
    strategy: decision.strategy,
    strategyConfidence: decision.confidence,
    trustScore: strategyInput.trustScore,
    executionMode: strategyInput.executionMode,
    requiredValidators: decision.requiredValidators,
    optionalValidators: decision.optionalValidators,
    changeSize: strategyInput.changeSize,
    historicalFailures: strategyInput.historicalFailures,
    validationHistoryPassRate: strategyInput.validationHistoryPassRate,
    criticalSubsystemModified: strategyInput.criticalSubsystemModified,
    repeatFailuresDetected: strategyInput.repeatFailuresDetected,
    verificationDisagreement: strategyInput.verificationDisagreement,
    releaseReady: strategyInput.releaseReady,
    world2ExecutionActive: strategyInput.world2ExecutionActive,
    cloudRuntimeTouched: strategyInput.cloudRuntimeTouched,
    brainChanged: strategyInput.brainChanged,
    routingChanged: strategyInput.routingChanged,
    subsystemCriticality: strategyInput.criticalSubsystemModified ? 'CRITICAL' : 'MEDIUM',
    blastRadius: strategyInput.changeScope === 'MAJOR' ? 'PLATFORM' : 'MODULE',
  };
}

export function generateVerificationPlanFromStrategy(
  strategyInput: VerificationStrategyInput,
): VerificationPlan {
  registerVerificationIntelligenceWithCentralBrain();
  const decision = decideVerificationStrategy(strategyInput);
  const planInput = strategyInputToPlanInput(strategyInput, decision);
  return buildVerificationPlan(planInput);
}

export function getVerificationIntelligenceRuntimeReport(): VerificationPlanRuntimeReport & {
  integrationCacheHits: number;
} {
  return {
    ...getVerificationPlanRuntimeReport(),
    integrationCacheHits,
  };
}

export function resetVerificationIntelligenceForTests(): void {
  cachedSnapshot = null;
  integrationCacheHits = 0;
}
