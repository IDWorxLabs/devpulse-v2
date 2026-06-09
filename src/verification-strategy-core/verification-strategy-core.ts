/**
 * Verification Strategy Core — orchestration and read-only system registration.
 * Decision-making only — no validator execution.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import { listVerificationStrategyCoreUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type {
  VerificationStrategyDecision,
  VerificationStrategyInput,
  VerificationStrategyRuntimeReport,
} from './verification-strategy-types.js';
import {
  VERIFICATION_STRATEGY_CORE_OWNER_MODULE,
  VERIFICATION_STRATEGY_CORE_PASS_TOKEN,
} from './verification-strategy-types.js';
import { buildVerificationStrategy, getVerificationStrategyRuntimeReport, markBootstrapReused } from './verification-strategy-builder.js';
import { listVerificationStrategyRegistryEntries } from './verification-strategy-registry.js';

export interface VerificationStrategyIntegrationSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2Systems: number;
  uvlRowCount: number;
  registeredAt: number;
}

let cachedIntegration: VerificationStrategyIntegrationSnapshot | null = null;
let integrationCacheHits = 0;

export function getDevPulseV2VerificationStrategyCore(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  strategyOnly: true;
} {
  return {
    ownerModule: VERIFICATION_STRATEGY_CORE_OWNER_MODULE,
    passToken: VERIFICATION_STRATEGY_CORE_PASS_TOKEN,
    phase: 19.3,
    strategyOnly: true,
  };
}

export function registerVerificationStrategyWithCentralBrain(): VerificationStrategyIntegrationSnapshot {
  if (cachedIntegration) {
    integrationCacheHits += 1;
    markBootstrapReused();
    return cachedIntegration;
  }

  const summaries = readAllSystemSummaries();
  const world2Systems = summaries.filter((s) => s.systemId.includes('world2')).length;

  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedIntegration = {
    centralBrainSystems: summaries.length,
    projectVaultProjects: vaultState.projectCount,
    trustScore: trustResult?.trustScore ?? null,
    world2Systems,
    uvlRowCount: listVerificationStrategyCoreUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedIntegration;
}

export function registerVerificationStrategyWithProjectVault(): { projectCount: number; readOnly: true } {
  const state = getDevPulseV2ProjectVaultAuthority().getVaultState();
  return { projectCount: state.projectCount, readOnly: true };
}

export function registerVerificationStrategyWithTrustEngine(): {
  trustScore: number | null;
  status: string | null;
  readOnly: true;
} {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return {
    trustScore: result?.trustScore ?? null,
    status: result?.status ?? null,
    readOnly: true,
  };
}

export function registerVerificationStrategyWithWorld2Coordinator(): {
  world2SystemCount: number;
  readOnly: true;
} {
  const summaries = readAllSystemSummaries();
  const world2Systems = summaries.filter(
    (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
  );
  return { world2SystemCount: world2Systems.length, readOnly: true };
}

export function registerVerificationStrategyWithUvl(): {
  strategyRegistryCount: number;
  verificationStrategyUvlRows: number;
  readOnly: true;
} {
  return {
    strategyRegistryCount: listVerificationStrategyRegistryEntries().length,
    verificationStrategyUvlRows: listVerificationStrategyCoreUvlRows().length,
    readOnly: true,
  };
}

export function decideVerificationStrategy(
  input: VerificationStrategyInput,
): VerificationStrategyDecision {
  registerVerificationStrategyWithCentralBrain();
  return buildVerificationStrategy(input);
}

export function getVerificationStrategyCoreRuntimeReport(): VerificationStrategyRuntimeReport & {
  integrationCacheHits: number;
} {
  return {
    ...getVerificationStrategyRuntimeReport(),
    integrationCacheHits,
  };
}

export function resetVerificationStrategyCoreForTests(): void {
  cachedIntegration = null;
  integrationCacheHits = 0;
}
