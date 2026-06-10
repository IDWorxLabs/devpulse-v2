/**
 * Autonomous Verification — orchestration and read-only integrations.
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
} from '../unified-verification-lab/uvl-row-registry.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { getDevPulseV2AutonomousFixing } from '../autonomous-fixing/index.js';
import { coordinateVerificationPlan } from '../verification-integration/verification-plan-coordinator.js';
import { generateFixPlanFromUpstream } from '../autonomous-fixing/autonomous-fixing.js';
import { generateAutonomousTestPlanFromUpstream } from '../autonomous-testing/autonomous-testing.js';
import type { VerificationStrategyInput } from '../verification-strategy-core/verification-strategy-types.js';
import type {
  AutonomousVerificationResult,
  VerificationInput,
  VerificationReport,
  VerificationRuntimeReport,
} from './autonomous-verification-types.js';
import {
  AUTONOMOUS_VERIFICATION_OWNER_MODULE,
  AUTONOMOUS_VERIFICATION_PASS_TOKEN,
} from './autonomous-verification-types.js';
import { buildVerificationDecision } from './verification-decision-builder.js';
import { generateVerificationReport } from './verification-reporting.js';
import { recordVerificationHistory, getVerificationHistorySize } from './verification-history.js';
import { listVerificationDecisionEntries } from './verification-registry.js';

export interface AutonomousVerificationSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  buildStrategyCount: number;
  autonomousBuildCount: number;
  verificationStackTokens: string[];
  autonomousFixingToken: string;
  uvlRows: number;
  decisionRegistryCount: number;
  registeredAt: number;
}

export interface AutonomousVerificationPipelineResult {
  result: AutonomousVerificationResult;
  report: VerificationReport;
}

let cachedSnapshot: AutonomousVerificationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

const inputCache = new Map<string, VerificationInput>();
let inputCacheHits = 0;
let inputCacheMisses = 0;

export function getDevPulseV2AutonomousVerification(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: AUTONOMOUS_VERIFICATION_OWNER_MODULE,
    passToken: AUTONOMOUS_VERIFICATION_PASS_TOKEN,
    phase: 19.6,
    planningOnly: true,
  };
}

export function registerAutonomousVerificationWithCentralBrain(): AutonomousVerificationSystemSnapshot {
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
    uvlRows:
      listVerificationStrategyCoreUvlRows().length +
      listVerificationIntelligenceUvlRows().length +
      listVerificationIntegrationUvlRows().length +
      listAutonomousFixingUvlRows().length +
      listAutonomousVerificationUvlRows().length,
    decisionRegistryCount: listVerificationDecisionEntries().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerAutonomousVerificationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerAutonomousVerificationWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerAutonomousVerificationWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerAutonomousVerificationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return {
    uvlRowCount: listAutonomousVerificationUvlRows().length,
    readOnly: true,
  };
}

export function registerAutonomousVerificationWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerAutonomousVerificationWithBuildStrategyEngine(): { strategyCount: number; readOnly: true } {
  return { strategyCount: listBuildStrategies().length, readOnly: true };
}

export function registerAutonomousVerificationWithAutonomousFixing(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousFixing().passToken, readOnly: true };
}

export function strategyInputToVerificationInput(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<VerificationInput> = {},
): VerificationInput {
  const cacheKey = JSON.stringify({ strategyInput, overrides });
  const cached = inputCache.get(cacheKey);
  if (cached) {
    inputCacheHits += 1;
    return cached;
  }
  inputCacheMisses += 1;

  const coordinated = coordinateVerificationPlan(strategyInput);

  const input: VerificationInput = {
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
    ...overrides,
  };

  inputCache.set(cacheKey, input);
  return input;
}

export function generateVerificationDecisionFromUpstream(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<VerificationInput> = {},
): AutonomousVerificationPipelineResult {
  registerAutonomousVerificationWithCentralBrain();

  const testPipeline = generateAutonomousTestPlanFromUpstream(strategyInput, {
    subsystemTouched: overrides.subsystemTouched,
  });

  const fixPipeline = generateFixPlanFromUpstream(strategyInput, {
    subsystemTouched: overrides.subsystemTouched,
    failureSignals: overrides.evidenceSignals,
  });

  const verificationInput = strategyInputToVerificationInput(strategyInput, {
    ...overrides,
    testingConfidence: testPipeline.plan.confidence,
    testResultStatus: testPipeline.result.status,
    fixingConfidence: fixPipeline.plan.confidence,
    fixStrategy: fixPipeline.plan.strategy,
    fixReadiness: fixPipeline.plan.readiness,
    repairCandidates: fixPipeline.plan.repairCandidates,
    evidenceSignals: overrides.evidenceSignals ?? [
      `test:${testPipeline.result.status}`,
      `fix:${fixPipeline.plan.strategy}`,
    ],
  });

  const result = buildVerificationDecision(verificationInput);
  const report = generateVerificationReport(result, verificationInput);
  recordVerificationHistory(result, verificationInput);

  return { result, report };
}

export function getAutonomousVerificationRuntimeReport(): VerificationRuntimeReport {
  return {
    registrySize: listVerificationDecisionEntries().length,
    historySize: getVerificationHistorySize(),
    cacheHits: inputCacheHits,
    cacheMisses: inputCacheMisses,
    bootstrapReuseCount,
  };
}

export function getAutonomousVerificationInputCacheStats(): { hits: number; misses: number } {
  return { hits: inputCacheHits, misses: inputCacheMisses };
}

export function resetAutonomousVerificationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  inputCache.clear();
  inputCacheHits = 0;
  inputCacheMisses = 0;
}
