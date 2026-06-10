/**
 * Unified Trust Runtime — orchestration and read-only integrations.
 * Collects, normalizes, aggregates, and exposes trust signals. No execution.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/index.js';
import { getDevPulseV2AutonomousTesting } from '../autonomous-testing/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { listUnifiedTrustRuntimeUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type { TrustRuntimeInput, TrustRuntimeResult, TrustRuntimeRuntimeReport } from './trust-runtime-types.js';
import {
  UNIFIED_TRUST_RUNTIME_OWNER_MODULE,
  UNIFIED_TRUST_RUNTIME_PASS_TOKEN,
} from './trust-runtime-types.js';
import { normalizeTrustSignals, getNormalizationCount } from './trust-signal-normalizer.js';
import { buildUnifiedTrustAuthority, getAuthorityBuildCount } from './trust-authority-builder.js';
import { evaluateTrustRuntime, getEvaluationCount } from './trust-runtime-evaluator.js';
import { recordTrustRuntimeHistory } from './trust-runtime-history.js';
import { generateTrustRuntimeReport } from './trust-runtime-reporting.js';
import { registerTrustRuntimeRecord, getTrustRuntimeRecordCount } from './trust-runtime-registry.js';
import { getTrustRuntimeCacheStats } from './trust-runtime-cache.js';
import { listTrustSources, getTrustSourceCount } from './trust-source-registry.js';

export interface UnifiedTrustRuntimeSystemSnapshot {
  centralBrainSystems: number;
  trustEngineScore: number | null;
  trustSourceCount: number;
  autonomousTestingToken: string;
  autonomousFixingToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  verificationStrategyToken: string;
  verificationIntelligenceToken: string;
  verificationIntegrationToken: string;
  multiProjectVerificationToken: string;
  multiProjectMonitoringToken: string;
  selfEvolutionGovernanceToken: string;
  world2Token: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: UnifiedTrustRuntimeSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

export function getDevPulseV2UnifiedTrustRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: UNIFIED_TRUST_RUNTIME_OWNER_MODULE,
    passToken: UNIFIED_TRUST_RUNTIME_PASS_TOKEN,
    phase: 22.1,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerUnifiedTrustRuntimeWithCentralBrain(): UnifiedTrustRuntimeSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    trustEngineScore: trustResult?.trustScore ?? null,
    trustSourceCount: getTrustSourceCount(),
    autonomousTestingToken: getDevPulseV2AutonomousTesting().passToken,
    autonomousFixingToken: getDevPulseV2AutonomousFixing().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    verificationStrategyToken: getDevPulseV2VerificationStrategyCore().passToken,
    verificationIntelligenceToken: getDevPulseV2VerificationIntelligence().passToken,
    verificationIntegrationToken: getDevPulseV2VerificationIntegration().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    uvlRows: listUnifiedTrustRuntimeUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerUnifiedTrustRuntimeWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithAutonomousTesting(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousTesting().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithVerificationStrategyCore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VerificationStrategyCore().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithVerificationIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VerificationIntelligence().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithVerificationIntegration(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VerificationIntegration().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerUnifiedTrustRuntimeWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listUnifiedTrustRuntimeUvlRows().length, readOnly: true };
}

export function evaluateUnifiedTrustRuntime(input: TrustRuntimeInput): TrustRuntimeResult {
  registerUnifiedTrustRuntimeWithCentralBrain();
  listTrustSources();

  const normalized = normalizeTrustSignals(input.signals);
  const authority = buildUnifiedTrustAuthority(input.requestId, normalized);
  const evaluation = evaluateTrustRuntime(authority);

  recordCounter += 1;
  const record = {
    recordId: `trust-runtime-${recordCounter}`,
    authority,
    evaluation,
    createdAt: Date.now(),
  };

  registerTrustRuntimeRecord(record);
  recordTrustRuntimeHistory(record);
  const report = generateTrustRuntimeReport(record, evaluation);

  return { record, report };
}

export function getUnifiedTrustRuntimeRuntimeReport(): TrustRuntimeRuntimeReport {
  const cache = getTrustRuntimeCacheStats();
  return {
    normalizationCount: getNormalizationCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getTrustRuntimeRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetUnifiedTrustRuntimeForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
