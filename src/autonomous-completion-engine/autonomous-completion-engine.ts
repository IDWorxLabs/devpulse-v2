/**
 * Autonomous Completion Engine — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listVerificationIntegrationUvlRows,
  listVerificationIntelligenceUvlRows,
  listVerificationStrategyCoreUvlRows,
  listAutonomousFixingUvlRows,
  listAutonomousVerificationUvlRows,
  listAutonomousCompletionEngineUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { coordinateVerificationPlan } from '../verification-integration/verification-plan-coordinator.js';
import { generateVerificationDecisionFromUpstream } from '../autonomous-verification/autonomous-verification.js';
import type { VerificationStrategyInput } from '../verification-strategy-core/verification-strategy-types.js';
import type {
  CompletionInput,
  CompletionReport,
  CompletionResult,
  CompletionRuntimeReport,
  CompletionState,
} from './autonomous-completion-engine-types.js';
import {
  AUTONOMOUS_COMPLETION_ENGINE_OWNER_MODULE,
  AUTONOMOUS_COMPLETION_ENGINE_PASS_TOKEN,
} from './autonomous-completion-engine-types.js';
import { buildCompletionDecision } from './completion-decision-builder.js';
import { generateCompletionReport } from './completion-reporting.js';
import { recordCompletionHistory, getCompletionHistorySize } from './completion-history.js';
import { listCompletionDecisionEntries } from './completion-registry.js';
import { getCompletionLoopGuardDetectionCount } from './completion-loop-guard.js';

export interface AutonomousCompletionEngineSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  buildStrategyCount: number;
  autonomousBuildCount: number;
  verificationStackTokens: string[];
  autonomousFixingToken: string;
  autonomousVerificationToken: string;
  uvlRows: number;
  decisionRegistryCount: number;
  registeredAt: number;
}

export interface AutonomousCompletionPipelineResult {
  result: CompletionResult;
  state: CompletionState;
  report: CompletionReport;
}

let cachedSnapshot: AutonomousCompletionEngineSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

const inputCache = new Map<string, CompletionInput>();
let inputCacheHits = 0;
let inputCacheMisses = 0;

export function getDevPulseV2AutonomousCompletionEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: AUTONOMOUS_COMPLETION_ENGINE_OWNER_MODULE,
    passToken: AUTONOMOUS_COMPLETION_ENGINE_PASS_TOKEN,
    phase: 19.7,
    planningOnly: true,
  };
}

export function registerAutonomousCompletionEngineWithCentralBrain(): AutonomousCompletionEngineSystemSnapshot {
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
    buildStrategyCount: listBuildStrategies().length,
    autonomousBuildCount: listAutonomousBuilds().length,
    verificationStackTokens: [
      getDevPulseV2VerificationStrategyCore().passToken,
      getDevPulseV2VerificationIntelligence().passToken,
      getDevPulseV2VerificationIntegration().passToken,
    ],
    autonomousFixingToken: getDevPulseV2AutonomousFixing().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    uvlRows:
      listVerificationStrategyCoreUvlRows().length +
      listVerificationIntelligenceUvlRows().length +
      listVerificationIntegrationUvlRows().length +
      listAutonomousFixingUvlRows().length +
      listAutonomousVerificationUvlRows().length +
      listAutonomousCompletionEngineUvlRows().length,
    decisionRegistryCount: listCompletionDecisionEntries().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerAutonomousCompletionEngineWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerAutonomousCompletionEngineWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerAutonomousCompletionEngineWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerAutonomousCompletionEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return {
    uvlRowCount: listAutonomousCompletionEngineUvlRows().length,
    readOnly: true,
  };
}

export function registerAutonomousCompletionEngineWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerAutonomousCompletionEngineWithBuildStrategyEngine(): { strategyCount: number; readOnly: true } {
  return { strategyCount: listBuildStrategies().length, readOnly: true };
}

export function registerAutonomousCompletionEngineWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function registerAutonomousCompletionEngineWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function strategyInputToCompletionInput(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<CompletionInput> = {},
): CompletionInput {
  const cacheKey = JSON.stringify({ strategyInput, overrides });
  const cached = inputCache.get(cacheKey);
  if (cached) {
    inputCacheHits += 1;
    return cached;
  }
  inputCacheMisses += 1;

  const coordinated = coordinateVerificationPlan(strategyInput);

  const input: CompletionInput = {
    trustScore: strategyInput.trustScore,
    buildConfidence: overrides.buildConfidence ?? 70,
    testingConfidence: overrides.testingConfidence ?? 70,
    fixingConfidence: overrides.fixingConfidence ?? 65,
    verificationConfidence: coordinated.plan.confidence,
    blastRadius: strategyInput.changeScope === 'MAJOR' ? 'PLATFORM' : 'MODULE',
    criticalSubsystem: strategyInput.taskType === 'BRAIN',
    verificationDisagreement: strategyInput.verificationDisagreement,
    repeatFailures: strategyInput.historicalFailures,
    world2Active: strategyInput.world2ExecutionActive,
    cloudTouched: strategyInput.cloudRuntimeTouched,
    testingCoverageSufficient: overrides.testingCoverageSufficient ?? true,
    verificationEvidenceSufficient: overrides.verificationEvidenceSufficient ?? true,
    ...overrides,
  };

  inputCache.set(cacheKey, input);
  return input;
}

export function generateCompletionDecisionFromUpstream(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<CompletionInput> = {},
): AutonomousCompletionPipelineResult {
  registerAutonomousCompletionEngineWithCentralBrain();

  const verificationPipeline = generateVerificationDecisionFromUpstream(strategyInput, {
    subsystemTouched: overrides.subsystemTouched,
    evidenceSignals: overrides.evidenceSignals,
  });

  const completionInput = strategyInputToCompletionInput(strategyInput, {
    ...overrides,
    testingConfidence: overrides.testingConfidence ?? 70,
    fixingConfidence: overrides.fixingConfidence ?? 65,
    verificationConfidence: verificationPipeline.result.confidence,
    verificationDecision: verificationPipeline.result.decision,
    evidenceSignals: overrides.evidenceSignals ?? [
      `verification:${verificationPipeline.result.decision}`,
      `confidence:${verificationPipeline.result.confidence}`,
    ],
  });

  const { result, state } = buildCompletionDecision(completionInput);
  const report = generateCompletionReport(result, state, completionInput);
  recordCompletionHistory(result);

  return { result, state, report };
}

export function getAutonomousCompletionEngineRuntimeReport(): CompletionRuntimeReport {
  return {
    registrySize: listCompletionDecisionEntries().length,
    historySize: getCompletionHistorySize(),
    cacheHits: inputCacheHits,
    cacheMisses: inputCacheMisses,
    bootstrapReuseCount,
    loopGuardDetections: getCompletionLoopGuardDetectionCount(),
  };
}

export function getAutonomousCompletionEngineInputCacheStats(): { hits: number; misses: number } {
  return { hits: inputCacheHits, misses: inputCacheMisses };
}

export function resetAutonomousCompletionEngineForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  inputCache.clear();
  inputCacheHits = 0;
  inputCacheMisses = 0;
}
