/**
 * Autonomous Fixing — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listVerificationIntegrationUvlRows,
  listVerificationIntelligenceUvlRows,
  listVerificationStrategyCoreUvlRows,
  listAutonomousFixingUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { coordinateVerificationPlan } from '../verification-integration/verification-plan-coordinator.js';
import { generateAutonomousTestPlanFromUpstream } from '../autonomous-testing/autonomous-testing.js';
import type { VerificationStrategyInput } from '../verification-strategy-core/verification-strategy-types.js';
import type { FixPlan, FixPlanInput, FixReport, FixRuntimeReport } from './autonomous-fixing-types.js';
import {
  AUTONOMOUS_FIXING_OWNER_MODULE,
  AUTONOMOUS_FIXING_PASS_TOKEN,
} from './autonomous-fixing-types.js';
import { buildFixPlan } from './fix-plan-builder.js';
import { buildRollbackPlan } from './rollback-planner.js';
import { classifyFailure } from './failure-classifier.js';
import { analyzeRootCause } from './root-cause-analyzer.js';
import { generateRepairCandidates } from './repair-candidate-generator.js';
import { analyzeFixRisk } from './fix-risk-analyzer.js';
import { generateFixReport } from './fix-reporting.js';
import { recordFixHistory, getFixHistorySize } from './fix-history.js';
import { listFixStrategyEntries } from './fix-registry.js';

export interface AutonomousFixingSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  buildStrategyCount: number;
  autonomousBuildCount: number;
  verificationStackTokens: string[];
  uvlRows: number;
  strategyRegistryCount: number;
  registeredAt: number;
}

export interface AutonomousFixingPipelineResult {
  plan: FixPlan;
  report: FixReport;
}

let cachedSnapshot: AutonomousFixingSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

const planInputCache = new Map<string, FixPlanInput>();
let planInputCacheHits = 0;
let planInputCacheMisses = 0;

export function getDevPulseV2AutonomousFixing(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: AUTONOMOUS_FIXING_OWNER_MODULE,
    passToken: AUTONOMOUS_FIXING_PASS_TOKEN,
    phase: 19.5,
    planningOnly: true,
  };
}

export function registerAutonomousFixingWithCentralBrain(): AutonomousFixingSystemSnapshot {
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
    uvlRows:
      listVerificationStrategyCoreUvlRows().length +
      listVerificationIntelligenceUvlRows().length +
      listVerificationIntegrationUvlRows().length +
      listAutonomousFixingUvlRows().length,
    strategyRegistryCount: listFixStrategyEntries().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerAutonomousFixingWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerAutonomousFixingWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerAutonomousFixingWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerAutonomousFixingWithUvl(): { uvlRowCount: number; readOnly: true } {
  return {
    uvlRowCount: listAutonomousFixingUvlRows().length,
    readOnly: true,
  };
}

export function registerAutonomousFixingWithAutonomousBuilder(): { buildCount: number; readOnly: true } {
  return { buildCount: listAutonomousBuilds().length, readOnly: true };
}

export function registerAutonomousFixingWithBuildStrategyEngine(): { strategyCount: number; readOnly: true } {
  return { strategyCount: listBuildStrategies().length, readOnly: true };
}

export function strategyInputToFixInput(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<FixPlanInput> = {},
): FixPlanInput {
  const coordinated = coordinateVerificationPlan(strategyInput);
  const cacheKey = JSON.stringify({ strategyInput, overrides });
  const cached = planInputCache.get(cacheKey);
  if (cached) {
    planInputCacheHits += 1;
    return cached;
  }
  planInputCacheMisses += 1;

  const input: FixPlanInput = {
    failureSignals: overrides.failureSignals ?? ['upstream verification context'],
    trustScore: strategyInput.trustScore,
    verificationConfidence: coordinated.plan.confidence,
    testingConfidence: overrides.testingConfidence ?? 70,
    subsystemTouched: overrides.subsystemTouched,
    repeatFailures: strategyInput.historicalFailures,
    blastRadius: strategyInput.changeScope === 'MAJOR' ? 'PLATFORM' : 'MODULE',
    criticalSubsystem: strategyInput.taskType === 'BRAIN',
    verificationDisagreement: strategyInput.verificationDisagreement,
    world2Active: strategyInput.world2ExecutionActive,
    cloudTouched: strategyInput.cloudRuntimeTouched,
    transientFailure: overrides.transientFailure,
    policyConflict: overrides.policyConflict,
    governanceBoundary: overrides.governanceBoundary,
    ...overrides,
  };

  planInputCache.set(cacheKey, input);
  return input;
}

export function generateFixPlanFromUpstream(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<FixPlanInput> = {},
): AutonomousFixingPipelineResult {
  registerAutonomousFixingWithCentralBrain();

  const testPipeline = generateAutonomousTestPlanFromUpstream(strategyInput, {
    subsystemTouched: overrides.subsystemTouched,
  });

  const failureSignals =
    overrides.failureSignals ??
    (testPipeline.result.status === 'SIMULATED_FAIL'
      ? testPipeline.result.failureSignals
      : ['planning context — no executed failure']);

  const fixInput = strategyInputToFixInput(strategyInput, {
    ...overrides,
    failureSignals,
    testResultStatus: testPipeline.result.status,
    testingConfidence: testPipeline.plan.confidence,
  });

  const plan = buildFixPlan(fixInput);

  const category = classifyFailure(fixInput);
  const rootCause = analyzeRootCause(fixInput, category);
  const repairs = generateRepairCandidates(category, fixInput);
  const riskScore = analyzeFixRisk(fixInput, category, rootCause, repairs);
  const rollback = buildRollbackPlan(fixInput, category, rootCause, riskScore);

  const report = generateFixReport(plan, rollback);
  recordFixHistory(plan);

  return { plan, report };
}

export function getAutonomousFixingRuntimeReport(): FixRuntimeReport {
  return {
    registrySize: listFixStrategyEntries().length,
    historySize: getFixHistorySize(),
    cacheHits: planInputCacheHits,
    cacheMisses: planInputCacheMisses,
    bootstrapReuseCount,
  };
}

export function getAutonomousFixingPlanCacheStats(): { hits: number; misses: number } {
  return { hits: planInputCacheHits, misses: planInputCacheMisses };
}

export function resetAutonomousFixingForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  planInputCache.clear();
  planInputCacheHits = 0;
  planInputCacheMisses = 0;
}
