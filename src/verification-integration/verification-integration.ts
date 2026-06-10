/**
 * Verification Integration — orchestration and read-only system registration.
 * Integration only — no validator execution.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listVerificationIntelligenceUvlRows,
  listVerificationStrategyCoreUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import type { VerificationIntegrationRuntimeReport } from './verification-integration-types.js';
import {
  VERIFICATION_INTEGRATION_OWNER_MODULE,
  VERIFICATION_INTEGRATION_PASS_TOKEN,
} from './verification-integration-types.js';
import { getVerificationRegistrySize } from './verification-plan-registration.js';
import { getVerificationHistorySize } from './verification-plan-history.js';
import { getVerificationSnapshotCount } from './verification-plan-snapshot.js';
import { getReadinessEvaluationCount } from './verification-plan-readiness.js';
import { getVerificationVisibilityModel } from './verification-plan-visibility.js';
import { getLatestVerificationHistory } from './verification-plan-history.js';
import { getVerificationPlanById } from './verification-plan-registration.js';

export interface VerificationIntegrationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  buildStrategyCount: number;
  strategyCorePassToken: string;
  intelligencePassToken: string;
  strategyCoreUvlRows: number;
  intelligenceUvlRows: number;
  registeredAt: number;
}

let cachedSystemSnapshot: VerificationIntegrationSystemSnapshot | null = null;
let cacheHits = 0;
let cacheMisses = 0;
let bootstrapReuseCount = 0;

export function getDevPulseV2VerificationIntegration(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  integrationOnly: true;
} {
  return {
    ownerModule: VERIFICATION_INTEGRATION_OWNER_MODULE,
    passToken: VERIFICATION_INTEGRATION_PASS_TOKEN,
    phase: 19.32,
    integrationOnly: true,
  };
}

export function registerVerificationIntegrationWithCentralBrain(): VerificationIntegrationSystemSnapshot {
  if (cachedSystemSnapshot) {
    cacheHits += 1;
    bootstrapReuseCount += 1;
    return cachedSystemSnapshot;
  }
  cacheMisses += 1;

  const summaries = readAllSystemSummaries();
  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();
  const strategyCore = getDevPulseV2VerificationStrategyCore();
  const intelligence = getDevPulseV2VerificationIntelligence();

  cachedSystemSnapshot = {
    centralBrainSystems: summaries.length,
    projectVaultProjects: vaultState.projectCount,
    trustScore: trustResult?.trustScore ?? null,
    world2SystemCount: summaries.filter((s) => s.systemId.includes('world2')).length,
    buildStrategyCount: listBuildStrategies().length,
    strategyCorePassToken: strategyCore.passToken,
    intelligencePassToken: intelligence.passToken,
    strategyCoreUvlRows: listVerificationStrategyCoreUvlRows().length,
    intelligenceUvlRows: listVerificationIntelligenceUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSystemSnapshot;
}

export function registerVerificationIntegrationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerVerificationIntegrationWithTrustEngine(): {
  trustScore: number | null;
  readOnly: true;
} {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerVerificationIntegrationWithWorld2Coordinator(): {
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

export function registerVerificationIntegrationWithUvl(): {
  strategyCoreRows: number;
  intelligenceRows: number;
  readOnly: true;
} {
  return {
    strategyCoreRows: listVerificationStrategyCoreUvlRows().length,
    intelligenceRows: listVerificationIntelligenceUvlRows().length,
    readOnly: true,
  };
}

export function registerVerificationIntegrationWithBuildStrategyEngine(): {
  buildStrategyCount: number;
  readOnly: true;
} {
  return { buildStrategyCount: listBuildStrategies().length, readOnly: true };
}

export function registerVerificationIntegrationWithStrategyCore(): {
  passToken: string;
  readOnly: true;
} {
  return {
    passToken: getDevPulseV2VerificationStrategyCore().passToken,
    readOnly: true,
  };
}

export function registerVerificationIntegrationWithIntelligence(): {
  passToken: string;
  readOnly: true;
} {
  return {
    passToken: getDevPulseV2VerificationIntelligence().passToken,
    readOnly: true,
  };
}

export function getCurrentVerificationVisibilityForConsumers(): ReturnType<typeof getVerificationVisibilityModel> {
  const latest = getLatestVerificationHistory();
  if (!latest) {
    return getVerificationVisibilityModel(null, null);
  }
  const record = getVerificationPlanById(latest.planId);
  if (!record) {
    return getVerificationVisibilityModel(null, null);
  }
  return getVerificationVisibilityModel(
    {
      id: record.planId,
      type: record.planType as import('../verification-intelligence/verification-plan-types.js').VerificationPlanType,
      strategy: record.strategyType as import('../verification-strategy-core/verification-strategy-types.js').VerificationStrategy,
      confidence: record.confidence,
      riskScore: record.riskScore,
      estimatedCost: record.estimatedCost,
      estimatedDurationMs: record.estimatedDurationMs,
      requiredValidators: [],
      optionalValidators: [],
      executionOrder: record.executionOrder,
      reasoning: [],
      generatedAt: record.createdAt,
    },
    {
      planId: record.planId,
      state: latest.readinessState,
      confidence: record.confidence,
      riskScore: record.riskScore,
      strategy: record.strategyType as import('../verification-strategy-core/verification-strategy-types.js').VerificationStrategy,
      planType: record.planType as import('../verification-intelligence/verification-plan-types.js').VerificationPlanType,
      reasons: [],
      evaluatedAt: latest.recordedAt,
    },
  );
}

export function getVerificationIntegrationRuntimeReport(): VerificationIntegrationRuntimeReport {
  return {
    registrySize: getVerificationRegistrySize(),
    historySize: getVerificationHistorySize(),
    snapshotCount: getVerificationSnapshotCount(),
    readinessEvaluations: getReadinessEvaluationCount(),
    cacheHits,
    cacheMisses,
    bootstrapReuseCount,
  };
}

export function resetVerificationIntegrationForTests(): void {
  cachedSystemSnapshot = null;
  cacheHits = 0;
  cacheMisses = 0;
  bootstrapReuseCount = 0;
}
