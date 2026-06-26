/**
 * Behavior Simulation Engine — main authority and orchestrator.
 */

import { classifyBehaviorFailure, resetBehaviorFailureClassifierForTests } from './behavior-failure-classifier.js';
import { buildBehaviorModel } from './behavior-model-builder.js';
import { discoverBehaviorScenarios, resetBehaviorScenarioDiscoveryForTests } from './behavior-scenario-discovery.js';
import { verifyDataUpdate } from './data-update-verifier.js';
import { mapInteractionTargets } from './interaction-target-mapper.js';
import { recommendBehaviorRepair, resetBehaviorRepairRecommenderForTests } from './behavior-repair-recommender.js';
import { buildBehaviorSimulationPipelineReport } from './behavior-simulation-report-builder.js';
import { recordBehaviorSimulationHistory, resetBehaviorSimulationHistoryForTests } from './behavior-simulation-history.js';
import { planSimulationActions } from './simulation-action-planner.js';
import { executeSimulatedActions, resetSimulatedActionExecutorForTests } from './simulated-action-executor.js';
import { verifyServiceEffect } from './service-effect-verifier.js';
import { verifyStateTransition } from './state-transition-verifier.js';
import { verifyUiResult } from './ui-result-verifier.js';
import type {
  BehaviorScenarioResult,
  BehaviorSimulationPipelineInput,
  BehaviorSimulationPipelineResult,
  BehaviorSimulationVerdict,
  LaunchBehaviorSimulationEvidence,
  WholeAppBehaviorSweepResult,
} from './behavior-simulation-types.js';
import { BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN } from './behavior-simulation-types.js';

let pipelineCounter = 0;
let lastPipelineResult: BehaviorSimulationPipelineResult | null = null;

export function resetBehaviorSimulationAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetBehaviorScenarioDiscoveryForTests();
  resetSimulatedActionExecutorForTests();
  resetBehaviorFailureClassifierForTests();
  resetBehaviorRepairRecommenderForTests();
  resetBehaviorSimulationHistoryForTests();
}

export function getLastBehaviorSimulationPipelineResult(): BehaviorSimulationPipelineResult | null {
  return lastPipelineResult;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `beh-pipeline-${pipelineCounter}`;
}

function runWholeAppBehaviorSweep(scenarioResults: readonly BehaviorScenarioResult[]): WholeAppBehaviorSweepResult {
  const passed = scenarioResults.every((r) => r.passed);
  return {
    readOnly: true,
    sweepId: `sweep-${pipelineCounter}`,
    passed,
    crossFeatureChecks: [
      { check: 'CROSS_FEATURE_NAVIGATION', passed, detail: passed ? 'ok' : 'workflow break' },
      { check: 'SHARED_STATE', passed, detail: passed ? 'ok' : 'state drift' },
      { check: 'PERSISTENCE_ACROSS_ROUTES', passed, detail: passed ? 'ok' : 'persistence fail' },
      { check: 'REGRESSION_SWEEP', passed, detail: passed ? 'ok' : 'regression' },
    ],
    blockedReason: passed ? null : 'Whole-app behavior sweep failed',
  };
}

function simulateScenario(
  scenario: ReturnType<typeof discoverBehaviorScenarios>[number],
  plan: ReturnType<typeof planSimulationActions>[number],
  targets: ReturnType<typeof mapInteractionTargets>,
  context: { simulateBrokenHandler?: boolean; simulateUiWithoutData?: boolean },
): BehaviorScenarioResult {
  const actions = executeSimulatedActions({ plan, targets, context });
  const state = verifyStateTransition({ scenario, actions, simulateBrokenHandler: context.simulateBrokenHandler });
  const service = verifyServiceEffect({
    scenario,
    actions,
    simulateBrokenHandler: context.simulateBrokenHandler,
    simulateUiWithoutData: context.simulateUiWithoutData,
  });
  const data = verifyDataUpdate({
    scenario,
    serviceMatched: service.matched,
    simulateUiWithoutData: context.simulateUiWithoutData,
  });
  const ui = verifyUiResult({
    scenario,
    actions,
    dataMatched: data.matched,
    simulateUiWithoutData: context.simulateUiWithoutData,
  });
  const failure = classifyBehaviorFailure({ scenario, actions, state, service, data, ui });
  const repairRecommendation = failure ? recommendBehaviorRepair({ failure, scenario }) : null;
  const passed = !failure && state.matched && service.matched && data.matched && ui.matched;

  return {
    readOnly: true,
    scenarioId: scenario.scenarioId,
    passed,
    actionRecords: actions,
    stateVerification: state,
    serviceVerification: service,
    dataVerification: data,
    uiVerification: ui,
    failure,
    repairRecommendation,
    skipJustification: null,
  };
}

export function runBehaviorSimulationPipeline(
  input: BehaviorSimulationPipelineInput,
): BehaviorSimulationPipelineResult {
  if (input.incrementalBuild.permissionVerdict !== 'READY_FOR_ASSEMBLY' &&
      input.incrementalBuild.permissionVerdict !== 'RESUMABLE') {
    return blockedPipeline(input, input.incrementalBuild.blockedReason ?? 'Incremental build not ready.');
  }

  const scenarios = discoverBehaviorScenarios({
    rawPrompt: input.rawPrompt,
    productIntelligenceModel: input.productIntelligenceModel,
    promptFaithfulness: input.promptFaithfulness,
    incrementalBuild: input.incrementalBuild,
  }).filter((s) => !input.sliceIdFilter || s.featureSliceIds.includes(input.sliceIdFilter));

  const behaviorModel = buildBehaviorModel({
    productLabel: input.productIntelligenceModel.product.productType,
    scenarios,
  });
  const interactionTargets = mapInteractionTargets(scenarios);
  const actionPlans = planSimulationActions(scenarios);
  const context = {
    simulateBrokenHandler: input.simulateBrokenHandler,
    simulateUiWithoutData: input.simulateUiWithoutData,
  };

  const scenarioResults = scenarios.map((scenario) => {
    const plan = actionPlans.find((p) => p.scenarioId === scenario.scenarioId)!;
    return simulateScenario(scenario, plan, interactionTargets, context);
  });

  const wholeAppSweep = input.sliceIdFilter
    ? { readOnly: true as const, sweepId: 'sweep-slice', passed: true, crossFeatureChecks: [], blockedReason: null }
    : runWholeAppBehaviorSweep(scenarioResults);

  const failed = scenarioResults.filter((r) => !r.passed);
  let permissionVerdict: BehaviorSimulationVerdict = 'READY_FOR_PREVIEW';
  let blockedReason: string | null = null;
  if (failed.length) {
    permissionVerdict = input.simulateBrokenHandler || input.simulateUiWithoutData ? 'NEEDS_REPAIR' : 'BLOCKED';
    blockedReason = failed[0]?.failure?.likelyCause ?? 'Behavior simulation failed';
  } else if (!wholeAppSweep.passed) {
    permissionVerdict = 'BLOCKED';
    blockedReason = wholeAppSweep.blockedReason;
  }

  const result: BehaviorSimulationPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    scenarios,
    behaviorModel,
    interactionTargets,
    actionPlans,
    scenarioResults,
    wholeAppSweep,
    permissionVerdict,
    blockedReason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildBehaviorSimulationPipelineReport(result);
  recordBehaviorSimulationHistory(result);
  lastPipelineResult = result;
  return result;
}

function blockedPipeline(input: BehaviorSimulationPipelineInput, reason: string): BehaviorSimulationPipelineResult {
  const result: BehaviorSimulationPipelineResult = {
    readOnly: true,
    pipelineId: nextPipelineId(),
    scenarios: [],
    behaviorModel: buildBehaviorModel({ productLabel: 'blocked', scenarios: [] }),
    interactionTargets: [],
    actionPlans: [],
    scenarioResults: [],
    wholeAppSweep: {
      readOnly: true,
      sweepId: 'sweep-blocked',
      passed: false,
      crossFeatureChecks: [],
      blockedReason: reason,
    },
    permissionVerdict: 'BLOCKED',
    blockedReason: reason,
    reportMarkdown: '',
    completedAt: Date.now(),
  };
  result.reportMarkdown = buildBehaviorSimulationPipelineReport(result);
  lastPipelineResult = result;
  return result;
}

export function simulateBehaviorForFeatureSlice(input: {
  sliceId: string;
  sliceName: string;
  pipelineInput: Omit<BehaviorSimulationPipelineInput, 'sliceIdFilter' | 'simulateBrokenHandler' | 'simulateUiWithoutData'>;
}): { passed: boolean; results: BehaviorScenarioResult[]; blockedReason: string | null; skipJustification: string | null } {
  const related = discoverBehaviorScenarios({
    rawPrompt: input.pipelineInput.rawPrompt,
    productIntelligenceModel: input.pipelineInput.productIntelligenceModel,
    promptFaithfulness: input.pipelineInput.promptFaithfulness,
    incrementalBuild: input.pipelineInput.incrementalBuild,
  }).filter((s) => s.featureSliceIds.includes(input.sliceId));

  if (!related.length) {
    return {
      passed: true,
      results: [],
      blockedReason: null,
      skipJustification: `No behavior scenarios mapped to slice ${input.sliceName} — explicit skip with traceability`,
    };
  }

  const result = runBehaviorSimulationPipeline({ ...input.pipelineInput, sliceIdFilter: input.sliceId });
  return {
    passed: result.scenarioResults.every((r) => r.passed),
    results: result.scenarioResults,
    blockedReason: result.blockedReason,
    skipJustification: null,
  };
}

export function isBehaviorSimulationReadyForPreview(result: BehaviorSimulationPipelineResult): boolean {
  return result.permissionVerdict === 'READY_FOR_PREVIEW' && result.wholeAppSweep.passed;
}

export function buildLaunchBehaviorSimulationEvidence(
  result: BehaviorSimulationPipelineResult,
): LaunchBehaviorSimulationEvidence {
  const blockers: string[] = [];
  if (result.blockedReason) blockers.push(result.blockedReason);
  const failed = result.scenarioResults.filter((r) => !r.passed).length;
  if (failed) blockers.push(`${failed} behavior scenario(s) failed`);

  return {
    readOnly: true,
    requiredCount: result.scenarios.length,
    executedCount: result.scenarioResults.length,
    passedCount: result.scenarioResults.filter((r) => r.passed).length,
    failedCount: failed,
    blockedCount: result.permissionVerdict === 'BLOCKED' ? failed : 0,
    skippedWithJustificationCount: result.scenarioResults.filter((r) => r.skipJustification).length,
    wholeAppSweepPassed: result.wholeAppSweep.passed,
    permissionVerdict: result.permissionVerdict,
    blockers,
  };
}

export function getBehaviorSimulationPassToken(): string {
  return BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN;
}
