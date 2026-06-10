/**
 * Autonomous Testing — orchestration and read-only integrations.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/trust-engine-authority.js';
import {
  listVerificationIntegrationUvlRows,
  listVerificationIntelligenceUvlRows,
  listVerificationStrategyCoreUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { listBuildStrategies } from '../build-strategy-engine/build-strategy-manager.js';
import { listAutonomousBuilds } from '../autonomous-builder/autonomous-builder-manager.js';
import { getDevPulseV2VerificationStrategyCore } from '../verification-strategy-core/index.js';
import { getDevPulseV2VerificationIntelligence } from '../verification-intelligence/index.js';
import { getDevPulseV2VerificationIntegration } from '../verification-integration/index.js';
import { coordinateVerificationPlan } from '../verification-integration/verification-plan-coordinator.js';
import type { VerificationStrategyInput } from '../verification-strategy-core/verification-strategy-types.js';
import type {
  AutonomousTestPlan,
  AutonomousTestPlanInput,
  AutonomousTestReport,
  AutonomousTestResult,
  AutonomousTestRuntimeReport,
} from './autonomous-testing-types.js';
import {
  AUTONOMOUS_TESTING_OWNER_MODULE,
  AUTONOMOUS_TESTING_PASS_TOKEN,
} from './autonomous-testing-types.js';
import { buildAutonomousTestPlan } from './autonomous-test-planner.js';
import { createAutonomousTestResultModel } from './autonomous-test-result-model.js';
import { generateAutonomousTestReport } from './autonomous-test-reporting.js';
import { recordAutonomousTestHistory } from './autonomous-test-history.js';
import { listAutonomousTestDepthEntries } from './autonomous-test-registry.js';
import { getAutonomousTestPlanCacheStats } from './autonomous-test-planner.js';
import { getAutonomousTestOptimizerReductions } from './autonomous-test-suite-builder.js';
import { getAutonomousTestHistorySize } from './autonomous-test-history.js';

export interface AutonomousTestingSystemSnapshot {
  centralBrainSystems: number;
  projectVaultProjects: number;
  trustScore: number | null;
  world2SystemCount: number;
  buildStrategyCount: number;
  autonomousBuildCount: number;
  verificationStackTokens: string[];
  uvlRows: number;
  depthRegistryCount: number;
  registeredAt: number;
}

let cachedSnapshot: AutonomousTestingSystemSnapshot | null = null;
let bootstrapReuseCount = 0;

export function getDevPulseV2AutonomousTesting(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  planningOnly: true;
} {
  return {
    ownerModule: AUTONOMOUS_TESTING_OWNER_MODULE,
    passToken: AUTONOMOUS_TESTING_PASS_TOKEN,
    phase: 19.4,
    planningOnly: true,
  };
}

export function registerAutonomousTestingWithCentralBrain(): AutonomousTestingSystemSnapshot {
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
      listVerificationIntegrationUvlRows().length,
    depthRegistryCount: listAutonomousTestDepthEntries().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerAutonomousTestingWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerAutonomousTestingWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerAutonomousTestingWithWorld2Coordinator(): { world2SystemCount: number; readOnly: true } {
  const summaries = readAllSystemSummaries();
  return {
    world2SystemCount: summaries.filter(
      (s) => s.systemId.includes('world2') || s.summary.toLowerCase().includes('world 2'),
    ).length,
    readOnly: true,
  };
}

export function registerAutonomousTestingWithUvl(): { uvlRowCount: number; readOnly: true } {
  return {
    uvlRowCount:
      listVerificationStrategyCoreUvlRows().length +
      listVerificationIntelligenceUvlRows().length +
      listVerificationIntegrationUvlRows().length,
    readOnly: true,
  };
}

export function strategyInputToTestInput(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<AutonomousTestPlanInput> = {},
): AutonomousTestPlanInput {
  const coordinated = coordinateVerificationPlan(strategyInput);
  return {
    projectContext: strategyInput.projectContext,
    verificationStrategy: coordinated.strategy.strategy,
    verificationPlanType: coordinated.plan.type,
    verificationReadiness: coordinated.readiness.state,
    verificationConfidence: coordinated.plan.confidence,
    verificationRiskScore: coordinated.plan.riskScore,
    trustScore: strategyInput.trustScore,
    changeScope: strategyInput.changeScope,
    executionMode: strategyInput.executionMode,
    historicalFailures: strategyInput.historicalFailures,
    repeatFailuresDetected: strategyInput.repeatFailuresDetected,
    verificationDisagreement: strategyInput.verificationDisagreement,
    releaseReady: strategyInput.releaseReady,
    world2ExecutionActive: strategyInput.world2ExecutionActive,
    cloudRuntimeTouched: strategyInput.cloudRuntimeTouched,
    brainChanged: strategyInput.brainChanged,
    routingChanged: strategyInput.routingChanged,
    dataModelChanged: strategyInput.dataModelChanged,
    uiChanged: strategyInput.taskType === 'UI_CHANGE',
    buildStrategyChanged: overrides.buildStrategyChanged,
    verificationSystemChanged: strategyInput.taskType === 'BRAIN' || overrides.verificationSystemChanged,
    trustChanged: strategyInput.trustScore < 60,
    blastRadius: strategyInput.changeScope === 'MAJOR' ? 'PLATFORM' : 'MODULE',
    subsystemTouched: overrides.subsystemTouched,
    ...overrides,
  };
}

export interface AutonomousTestingPipelineResult {
  plan: AutonomousTestPlan;
  result: AutonomousTestResult;
  report: AutonomousTestReport;
}

export function generateAutonomousTestPlanFromUpstream(
  strategyInput: VerificationStrategyInput,
  overrides: Partial<AutonomousTestPlanInput> = {},
): AutonomousTestingPipelineResult {
  registerAutonomousTestingWithCentralBrain();
  const testInput = strategyInputToTestInput(strategyInput, overrides);
  const plan = buildAutonomousTestPlan(testInput);
  const result = createAutonomousTestResultModel(plan);
  const report = generateAutonomousTestReport(plan, result);
  recordAutonomousTestHistory(plan, result);
  return { plan, result, report };
}

export function getAutonomousTestingRuntimeReport(): AutonomousTestRuntimeReport {
  const cache = getAutonomousTestPlanCacheStats();
  return {
    registrySize: listAutonomousTestDepthEntries().length,
    historySize: getAutonomousTestHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
    optimizerReductions: getAutonomousTestOptimizerReductions(),
  };
}

export function resetAutonomousTestingForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
}
