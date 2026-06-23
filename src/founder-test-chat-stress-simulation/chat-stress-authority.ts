/**

 * Phase 26.4 — Founder Test chat stress simulation authority.

 * Phase 26.46 — Bounded execution with honest partial/degraded results.

 * Phase 26.51 — Completion barrier before aggregate complete event.

 */



import { createHash } from 'node:crypto';

import {

  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,

  createSimulationBudgetTracker,

  resolveEffectiveChatStressMaxScenarios,

  resolveChatStressSimulationStalledThresholdMs,

  SIMULATION_BUDGET_MS,

} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';

import {

  markChatStressSimulationAggregateComplete,

  registerChatStressPostWatchdogHealthReconciler,

  registerChatStressBatchDeadlineArmedHandler,

  registerChatStressTerminalSettlementSweepHandler,

  resetChatStressCompletionTrackerForTests,

  forceSettlePendingStartedChatStressScenarios,

  listChatStressOrderedScenarioIds,

  getChatStressCompletionSnapshot,

  type ChatStressScenarioTerminalStatus,

} from './chat-stress-completion-tracker.js';

import { resetChatStressCompletionPropagationForTests } from './chat-stress-completion-propagation.js';

import {

  buildChatStressSettlementSummary,

  detectChatStressPendingLeak,

  isChatStressSimulationComplete,

} from './chat-stress-settlement-boundary.js';

import {

  recordChatStressCompletionConditionSatisfied,

  recordChatStressSimulationCompleteEmitted,

  recordIntakeCompletionBoundaryOperation,

} from './chat-stress-completion-propagation.js';

import {

  CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,

  LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,

  reconcileChatStressRunnerIdleWithPending,

  registerChatStressRunnerIdleWithPendingHandler,

  registerLiveChatStressCompletionBoundaryEmitter,

  reconcileLiveChatStressSettlementAndBoundary,

  registerLiveChatStressRuntimeTraceHandler,

  startLiveChatStressSettlementDriver,

  stopLiveChatStressSettlementDriver,

  resetLiveChatStressRunnerPathForTests,

} from './live-chat-stress-runner-path.js';

import { evaluateChatStressRuns } from './chat-response-evaluator.js';

import { simulateChatStressBatch, type ChatStressBatchResult } from './chat-response-simulator.js';

import {

  buildChatStressSimulationReportMarkdown,

  buildRepeatedFailurePatterns,

  deriveRecommendedChatImprovements,

} from './chat-stress-report-builder.js';

import { listChatStressCategories, listChatStressScenarios } from './chat-stress-scenario-registry.js';

import type {

  ChatStressCategory,

  ChatStressSimulationAssessment,

  ChatStressSimulationReport,

  RunChatStressSimulationInput,

} from './chat-stress-simulation-types.js';

import { CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD } from './chat-stress-simulation-types.js';
import {
  materializeMissingChatStressRuns,
} from './chat-stress-timeout-run-materialization.js';
import { PRODUCT_READINESS_FORCED_COMPLETION } from '../founder-test-product-readiness/product-readiness-completion-boundary.js';



let runCounter = 0;



export function resetChatStressSimulationForTests(): void {

  runCounter = 0;

  resetChatStressCompletionTrackerForTests();

  resetChatStressCompletionPropagationForTests();

  resetLiveChatStressRunnerPathForTests();

}



function nextRunId(): string {

  runCounter += 1;

  return `chat-stress-${runCounter}-${Date.now()}`;

}



function averageScore(scores: number[]): number {

  if (!scores.length) return 0;

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

}



function buildCategoryScores(

  evaluations: ReturnType<typeof evaluateChatStressRuns>,

): Record<ChatStressCategory, number> {

  const buckets = new Map<ChatStressCategory, number[]>();

  for (const category of listChatStressCategories()) {

    buckets.set(category, []);

  }

  for (const evaluation of evaluations) {

    buckets.get(evaluation.category)?.push(evaluation.score);

  }

  const out = {} as Record<ChatStressCategory, number>;

  for (const [category, scores] of buckets.entries()) {

    out[category] = averageScore(scores);

  }

  return out;

}



function terminalTracePhase(

  terminalStatus: ChatStressScenarioTerminalStatus,

): 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED' {

  if (terminalStatus === 'SKIPPED_BUDGET') return 'BUDGET_EXCEEDED';

  if (terminalStatus === 'TIMEOUT' || terminalStatus === 'ERROR' || terminalStatus === 'FAILED') {

    return 'FAILED';

  }

  return 'PASSED';

}



function terminalTraceLabel(scenarioId: string, terminalStatus: ChatStressScenarioTerminalStatus): string {

  switch (terminalStatus) {

    case 'TIMEOUT':

      return `Chat stress scenario timed out: ${scenarioId}`;

    case 'SKIPPED_BUDGET':

      return `Chat stress scenario skipped (budget): ${scenarioId}`;

    case 'ERROR':

      return `Chat stress scenario error: ${scenarioId}`;

    case 'FAILED':

      return `Chat stress scenario failed: ${scenarioId}`;

    default:

      return `Chat stress scenario complete: ${scenarioId}`;

  }

}



function emitTrace(

  input: RunChatStressSimulationInput,

  event: {

    operationId: string;

    operationLabel: string;

    phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';

    errorMessage?: string;

  },

): void {

  input.onTrace?.(event);

}



export async function runFounderTestChatStressSimulation(

  input: RunChatStressSimulationInput = {},

): Promise<ChatStressSimulationAssessment> {

  const context = input.founderTestContext === false ? 'full' : 'founder-test';

  const scenariosRequested = resolveEffectiveChatStressMaxScenarios(input.maxScenarios, context);

  const scenarios = listChatStressScenarios(scenariosRequested);

  const budgetMs = input.budgetMs ?? SIMULATION_BUDGET_MS;
  const concurrency = input.concurrency ?? 4;

  const budget = createSimulationBudgetTracker({
    budgetMs,
    startedAtMs: Date.now(),
    stalledThresholdMs: resolveChatStressSimulationStalledThresholdMs({
      scenarioCount: scenarios.length,
      concurrency,
      perScenarioTimeoutMs: input.perScenarioTimeoutMs ?? CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
    }),
  });

  const budgetNotes: string[] = [

    `Bounded chat stress: ${scenarios.length}/${scenariosRequested} requested scenarios (founder-test default cap applies when unset).`,

  ];



  emitTrace(input, {

    operationId: 'chat-stress-simulation-started',

    operationLabel: `Chat stress simulation started (${scenarios.length} scenarios)`,

    phase: 'RUNNING',

  });



  let unregisterHealthReconciler: (() => void) | null = null;
  let stopLiveSettlementDriver: (() => void) | null = null;
  let terminalSweepStartedEmitted = false;

  if (context === 'founder-test') {

    emitTrace(input, {

      operationId: LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,

      operationLabel: `live-chat-stress-runner-path: ${LIVE_CHAT_STRESS_RUNNER_PATH_MARKER}`,

      phase: 'PASSED',

    });

    registerLiveChatStressRuntimeTraceHandler((event) => {
      emitTrace(input, {
        operationId: event.operationId,
        operationLabel: event.operationLabel,
        phase: event.phase === 'PASSED' ? 'PASSED' : event.phase === 'RUNNING' ? 'RUNNING' : 'FAILED',
        errorMessage: event.errorMessage,
      });
    });

    registerChatStressBatchDeadlineArmedHandler((armed) => {
      emitTrace(input, {
        operationId: 'chat-stress-batch-deadline-armed',
        operationLabel: `Chat stress batch deadline armed (${armed.batchDeadlineMs}ms)`,
        phase: 'RUNNING',
        errorMessage: `endsAtMs=${armed.batchEndsAtMs} scenarios=${armed.scenarioCount} concurrency=${armed.concurrency}`,
      });
    });

    registerChatStressTerminalSettlementSweepHandler((sweep) => {
      if (sweep.forcedCount === 0) {
        if (terminalSweepStartedEmitted) return;
        terminalSweepStartedEmitted = true;
        emitTrace(input, {
          operationId: 'chat-stress-terminal-sweep-started',
          operationLabel: `Chat stress terminal sweep started (${sweep.reason})`,
          phase: 'RUNNING',
          errorMessage: `settled=${sweep.settledCount} pending=${sweep.pendingCount}`,
        });
        return;
      }
      emitTrace(input, {
        operationId: 'chat-stress-terminal-sweep-settled',
        operationLabel: `Chat stress terminal sweep settled (${sweep.settledCount}/${sweep.settledCount + sweep.pendingCount})`,
        phase: sweep.pendingCount === 0 ? 'PASSED' : 'SLOW',
        errorMessage: `forced=${sweep.forcedCount} pending=${sweep.pendingCount} reason=${sweep.reason}`,
      });
    });

    registerChatStressRunnerIdleWithPendingHandler((event) => {

      emitTrace(input, {

        operationId: 'chat-stress-runner-idle-with-pending',

        operationLabel: CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,

        phase: 'SLOW',

        errorMessage: JSON.stringify({

          pendingScenarioIds: event.pendingScenarioIds,

          pendingWithoutActiveWorkerScenarioIds: event.pendingWithoutActiveWorkerScenarioIds,

          activeScenarioIds: event.activeScenarioIds,

          activeScenarioCount: event.activeScenarioCount,

          forcedSettlementCount: event.forcedSettlementCount,

        }),

      });

    });

    registerLiveChatStressCompletionBoundaryEmitter((event) => {
      emitTrace(input, {
        operationId: event.operationId,
        operationLabel: event.operationLabel,
        phase: event.phase,
      });
    });

    unregisterHealthReconciler = registerChatStressPostWatchdogHealthReconciler(

      (nowMs) => reconcileLiveChatStressSettlementAndBoundary(nowMs),

    );

    stopLiveSettlementDriver = startLiveChatStressSettlementDriver(250);

  }

  let lastHealth = budget.snapshot().health;

  let batch;

  try {

  batch = await simulateChatStressBatch({

    scenarios,

    rootDir: input.rootDir,

    providerOverride: input.providerOverride,

    concurrency: input.concurrency ?? 4,

    perScenarioTimeoutMs: input.perScenarioTimeoutMs ?? CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,

    budgetMs,

    budgetStartedAtMs: budget.snapshot().startedAtMs,

    onScenarioStart: (scenario) => {

      const snap = budget.snapshot();

      if (snap.health === 'SIMULATION_SLOW' && lastHealth === 'HEALTHY') {

        lastHealth = snap.health;

        emitTrace(input, {

          operationId: 'chat-stress-simulation-slow',

          operationLabel: snap.reason ?? 'Chat stress simulation slow',

          phase: 'SLOW',

        });

      }

      if (snap.health === 'SIMULATION_STALLED' && lastHealth !== 'SIMULATION_STALLED') {

        lastHealth = snap.health;

        emitTrace(input, {

          operationId: 'chat-stress-simulation-stalled',

          operationLabel: snap.reason ?? 'Chat stress simulation stalled',

          phase: 'STALLED',

        });

      }

      emitTrace(input, {

        operationId: `chat-stress-scenario:${scenario.id}`,

        operationLabel: `Running chat stress scenario: ${scenario.id}`,

        phase: 'RUNNING',

      });

    },

    onScenarioComplete: (run, terminalStatus) => {

      emitTrace(input, {

        operationId: `chat-stress-scenario-settled:${run.scenarioId}`,

        operationLabel: `Chat stress scenario settled: ${run.scenarioId} (${terminalStatus})`,

        phase: terminalTracePhase(terminalStatus),

        errorMessage: run.skipReason ?? undefined,

      });

      if (terminalStatus === 'TIMEOUT') {

        emitTrace(input, {

          operationId: `chat-stress-scenario-timed-out-settled:${run.scenarioId}`,

          operationLabel: `Chat stress scenario timed out and settled: ${run.scenarioId}`,

          phase: 'FAILED',

          errorMessage: run.skipReason ?? 'TIMEOUT',

        });

      }

      emitTrace(input, {

        operationId: `chat-stress-scenario:${run.scenarioId}`,

        operationLabel: terminalTraceLabel(run.scenarioId, terminalStatus),

        phase: terminalTracePhase(terminalStatus),

        errorMessage: run.skipReason ?? undefined,

      });

      const settlementSnap = buildChatStressSettlementSummary();

      emitTrace(input, {

        operationId: 'chat-stress-pending-count-updated',

        operationLabel: `Chat stress pending count updated: ${settlementSnap.pendingCount}`,

        phase: 'RUNNING',

        errorMessage: `settled=${settlementSnap.settledCount}/${settlementSnap.totalScenarios}`,

      });

      reconcileChatStressRunnerIdleWithPending();

    },

    onScenarioSoftWarning: (scenario, elapsedMs) => {

      emitTrace(input, {

        operationId: `chat-stress-scenario-slow:${scenario.id}`,

        operationLabel: `Chat stress scenario slow (${Math.round(elapsedMs / 1000)}s): ${scenario.id}`,

        phase: 'SLOW',

      });

    },

    onScenarioWatchdogArmed: (scenario, deadlineMs) => {

      emitTrace(input, {

        operationId: `chat-stress-watchdog-armed:${scenario.id}`,

        operationLabel: `Chat stress watchdog armed: ${scenario.id}`,

        phase: 'RUNNING',

        errorMessage: `deadlineMs=${deadlineMs}`,

      });

    },

    onScenarioWatchdogFired: (scenario) => {

      emitTrace(input, {

        operationId: `chat-stress-watchdog-fired:${scenario.id}`,

        operationLabel: `Chat stress watchdog timeout fired: ${scenario.id}`,

        phase: 'FAILED',

      });

    },

    onScenarioWatchdogTimeout: (scenario, run) => {

      emitTrace(input, {

        operationId: `chat-stress-scenario:${scenario.id}`,

        operationLabel: `Chat stress scenario timeout: ${scenario.id}`,

        phase: 'FAILED',

        errorMessage: run.skipReason ?? 'HARD_WATCHDOG_TIMEOUT',

      });

    },

    onScenarioDuplicateIgnored: (scenarioId) => {

      emitTrace(input, {

        operationId: `chat-stress-scenario-duplicate-ignored:${scenarioId}`,

        operationLabel: `Chat stress scenario duplicate ignored: ${scenarioId}`,

        phase: 'SLOW',

      });

    },

  });

  } finally {

    stopLiveSettlementDriver?.();

    stopLiveChatStressSettlementDriver();

    registerChatStressRunnerIdleWithPendingHandler(null);

    registerLiveChatStressCompletionBoundaryEmitter(null);

    registerLiveChatStressRuntimeTraceHandler(null);

    registerChatStressBatchDeadlineArmedHandler(null);

    registerChatStressTerminalSettlementSweepHandler(null);

    unregisterHealthReconciler?.();

  }



  const settlementSummary = buildChatStressSettlementSummary();

  if (!settlementSummary.completionBoundaryReached) {

    const leak = detectChatStressPendingLeak();

    if (leak) {

      emitTrace(input, {

        operationId: 'chat-stress-pending-leak',

        operationLabel: 'CHAT_STRESS_PENDING_LEAK',

        phase: 'FAILED',

        errorMessage: JSON.stringify({

          pendingScenarioIds: leak.pendingScenarioIds,

          lastState: leak.lastStateByScenarioId,

          lastUpdateTime: leak.lastUpdateTimeByScenarioId,

        }),

      });

    }

    throw new Error('Chat stress completion boundary violated — aggregate complete before all scenarios settled');

  }



  recordChatStressCompletionConditionSatisfied();

  emitTrace(input, {

    operationId: 'chat-stress-completion-condition-satisfied',

    operationLabel: `Chat stress completion condition satisfied (settled=${settlementSummary.settledCount}, pending=${settlementSummary.pendingCount})`,

    phase: 'PASSED',

  });

  if (isChatStressSimulationComplete()) {

    emitTrace(input, {

      operationId: 'chat-stress-boundary-satisfied-by-settlement',

      operationLabel: `Chat stress boundary satisfied by settlement (settled=${settlementSummary.settledCount}, pending=${settlementSummary.pendingCount})`,

      phase: 'PASSED',

    });

  }



  budgetNotes.push(...batch.budgetNotes);

  const finalBudget = budget.snapshot();

  const degradedPartialResult =

    batch.budgetExceeded ||

    batch.scenariosSkipped > 0 ||

    batch.scenariosTimedOut > 0 ||

    finalBudget.health === 'SIMULATION_BUDGET_EXCEEDED';



  if (degradedPartialResult) {

    budgetNotes.push(

      'Partial/degraded chat stress result — scoring uses executed scenarios only; skipped/timed-out cases are disclosed.',

    );

    emitTrace(input, {

      operationId: 'chat-stress-simulation-budget-exceeded',

      operationLabel: finalBudget.reason ?? 'Chat stress simulation budget exceeded',

      phase: 'BUDGET_EXCEEDED',

    });

  }



  const runs = batch.runs;

  const evaluations = evaluateChatStressRuns({ scenarios, runs });

  const executedEvaluations = evaluations.filter((entry) => {

    const run = runs.find((candidate) => candidate.scenarioId === entry.scenarioId);

    return run != null && !run.skipped;

  });

  const overallScore = averageScore(

    (executedEvaluations.length ? executedEvaluations : evaluations).map((entry) => entry.score),

  );

  const passedCount = evaluations.filter((entry) => entry.passed).length;

  const failedCount = evaluations.filter((entry) => !entry.passed && !entry.weak).length;

  const weakCount = evaluations.filter((entry) => entry.weak).length;

  const sorted = [...evaluations].sort((a, b) => b.score - a.score);

  const missingCapabilities = [

    ...new Set(

      evaluations

        .filter((entry) => !entry.passed)

        .map((entry) => entry.missingCapability)

        .filter((entry): entry is string => Boolean(entry)),

    ),

  ];



  const repeatedFailurePatterns = buildRepeatedFailurePatterns(evaluations);

  const chatBlocksLaunchReadiness =

    overallScore < CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD || degradedPartialResult;

  const selfEvolutionRequired =

    chatBlocksLaunchReadiness ||

    missingCapabilities.some((entry) => /identity|weakness|honesty|tone/i.test(entry)) ||

    repeatedFailurePatterns.some((entry) => /legacy|identity|overclaim/i.test(entry.pattern));



  const report: ChatStressSimulationReport = {

    readOnly: true,

    advisoryOnly: true,

    runId: nextRunId(),

    generatedAt: new Date().toISOString(),

    totalScenarios: scenarios.length,

    scenariosRequested,

    scenariosExecuted: batch.scenariosExecuted,

    scenariosSkipped: batch.scenariosSkipped,

    scenariosTimedOut: batch.scenariosTimedOut,

    passedCount,

    failedCount,

    weakCount,

    overallScore,

    chatBlocksLaunchReadiness,

    selfEvolutionRequired,

    runtimeHealth: finalBudget.health,

    budgetElapsedMs: finalBudget.elapsedMs,

    degradedPartialResult,

    budgetNotes,

    strongestAnswers: sorted.slice(0, 5),

    worstAnswers: sorted.slice(-5).reverse(),

    weakAnswers: evaluations.filter((entry) => entry.weak),

    failedAnswers: evaluations.filter((entry) => !entry.passed && !entry.weak),

    repeatedFailurePatterns,

    missingCapabilities,

    recommendedNextChatImprovements: [],

    categoryScores: buildCategoryScores(evaluations),

    evaluations,

    scenarioRuns: runs,

    settlementSummary,

  };



  report.recommendedNextChatImprovements = deriveRecommendedChatImprovements(report);

  if (degradedPartialResult) {

    report.recommendedNextChatImprovements.unshift(

      'Re-run full chat stress simulation outside Founder Test time budget to validate skipped/timed-out scenarios.',

    );

  }



  markChatStressSimulationAggregateComplete();



  recordIntakeCompletionBoundaryOperation('chat-stress-simulation-complete');

  emitTrace(input, {

    operationId: 'chat-stress-simulation-complete',

    operationLabel: degradedPartialResult

      ? `Chat stress simulation complete (partial: ${batch.scenariosExecuted}/${scenarios.length} executed)`

      : `Chat stress simulation complete (${passedCount}/${scenarios.length} passed)`,

    phase: 'PASSED',

  });

  recordChatStressSimulationCompleteEmitted();

  emitTrace(input, {

    operationId: 'chat-stress-simulation-complete-emitted',

    operationLabel: 'Chat stress simulation complete emitted',

    phase: 'PASSED',

  });



  return {

    readOnly: true,

    advisoryOnly: true,

    report,

  };

}



/** Recover chat stress assessment when settlement tracker is complete but batch workers have not returned. */
export async function recoverFounderTestChatStressSimulationFromSettlement(
  input: RunChatStressSimulationInput = {},
): Promise<ChatStressSimulationAssessment | null> {
  if (!isChatStressSimulationComplete()) {
    const snap = getChatStressCompletionSnapshot();
    const eligible =
      snap.pendingCount === 0 &&
      snap.startedCount > 0 &&
      snap.settledCount >= snap.startedCount;
    if (!eligible) return null;
  }

  const context = input.founderTestContext === false ? 'full' : 'founder-test';
  const scenariosRequested = resolveEffectiveChatStressMaxScenarios(input.maxScenarios, context);
  const registryScenarios = listChatStressScenarios(scenariosRequested);
  const orderedIds = [...listChatStressOrderedScenarioIds()];
  const fullRegistry = listChatStressScenarios(
    Math.max(scenariosRequested, orderedIds.length, registryScenarios.length),
  );
  const scenarios =
    orderedIds.length > 0
      ? orderedIds
          .map(
            (id) =>
              fullRegistry.find((scenario) => scenario.id === id) ??
              registryScenarios.find((scenario) => scenario.id === id),
          )
          .filter((scenario): scenario is (typeof registryScenarios)[number] => scenario != null)
      : registryScenarios;
  const perScenarioTimeoutMs = input.perScenarioTimeoutMs ?? CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS;
  const budgetMs = input.budgetMs ?? SIMULATION_BUDGET_MS;
  const budget = createSimulationBudgetTracker({
    budgetMs,
    startedAtMs: Date.now(),
    stalledThresholdMs: resolveChatStressSimulationStalledThresholdMs({
      scenarioCount: scenarios.length,
      concurrency: input.concurrency ?? 4,
      perScenarioTimeoutMs,
    }),
  });
  const budgetNotes = [
    `Recovered chat stress from settlement tracker (${PRODUCT_READINESS_FORCED_COMPLETION}).`,
  ];

  forceSettlePendingStartedChatStressScenarios(PRODUCT_READINESS_FORCED_COMPLETION);
  const settlementSummary = buildChatStressSettlementSummary();
  const runs = materializeMissingChatStressRuns({
    scenarios,
    runs: [],
    perScenarioTimeoutMs,
  });
  const batch: ChatStressBatchResult = {
    runs,
    scenariosExecuted: runs.filter((run) => !run.skipped).length,
    scenariosSkipped: runs.filter((run) => run.skipped).length,
    scenariosTimedOut: runs.filter((run) => run.timedOut).length,
    budgetExceeded: runs.some((run) => run.skipReason?.includes('BUDGET')),
    budgetNotes: [
      `Settlement recovery: ${settlementSummary.settledCount}/${settlementSummary.totalScenarios} settled.`,
    ],
  };

  recordChatStressCompletionConditionSatisfied();
  emitTrace(input, {
    operationId: 'chat-stress-completion-condition-satisfied',
    operationLabel: `Chat stress completion condition satisfied (recovered: settled=${settlementSummary.settledCount}, pending=${settlementSummary.pendingCount})`,
    phase: 'PASSED',
  });

  budgetNotes.push(...batch.budgetNotes);
  const finalBudget = budget.snapshot();
  const degradedPartialResult =
    batch.budgetExceeded ||
    batch.scenariosSkipped > 0 ||
    batch.scenariosTimedOut > 0 ||
    finalBudget.health === 'SIMULATION_BUDGET_EXCEEDED';

  const evaluations = evaluateChatStressRuns({ scenarios, runs: batch.runs });
  const executedEvaluations = evaluations.filter((entry) => {
    const run = batch.runs.find((candidate) => candidate.scenarioId === entry.scenarioId);
    return run != null && !run.skipped;
  });
  const overallScore = averageScore(
    (executedEvaluations.length ? executedEvaluations : evaluations).map((entry) => entry.score),
  );
  const passedCount = evaluations.filter((entry) => entry.passed).length;
  const failedCount = evaluations.filter((entry) => !entry.passed && !entry.weak).length;
  const weakCount = evaluations.filter((entry) => entry.weak).length;
  const sorted = [...evaluations].sort((a, b) => b.score - a.score);
  const missingCapabilities = [
    ...new Set(
      evaluations
        .filter((entry) => !entry.passed)
        .map((entry) => entry.missingCapability)
        .filter((entry): entry is string => Boolean(entry)),
    ),
  ];
  const repeatedFailurePatterns = buildRepeatedFailurePatterns(evaluations);
  const chatBlocksLaunchReadiness =
    overallScore < CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD || degradedPartialResult;
  const selfEvolutionRequired =
    chatBlocksLaunchReadiness ||
    missingCapabilities.some((entry) => /identity|weakness|honesty|tone/i.test(entry)) ||
    repeatedFailurePatterns.some((entry) => /legacy|identity|overclaim/i.test(entry.pattern));

  const report: ChatStressSimulationReport = {
    readOnly: true,
    advisoryOnly: true,
    runId: nextRunId(),
    generatedAt: new Date().toISOString(),
    totalScenarios: scenarios.length,
    scenariosRequested,
    scenariosExecuted: batch.scenariosExecuted,
    scenariosSkipped: batch.scenariosSkipped,
    scenariosTimedOut: batch.scenariosTimedOut,
    passedCount,
    failedCount,
    weakCount,
    overallScore,
    chatBlocksLaunchReadiness,
    selfEvolutionRequired,
    runtimeHealth: finalBudget.health,
    budgetElapsedMs: finalBudget.elapsedMs,
    degradedPartialResult,
    budgetNotes,
    strongestAnswers: sorted.slice(0, 5),
    worstAnswers: sorted.slice(-5).reverse(),
    weakAnswers: evaluations.filter((entry) => entry.weak),
    failedAnswers: evaluations.filter((entry) => !entry.passed && !entry.weak),
    repeatedFailurePatterns,
    missingCapabilities,
    recommendedNextChatImprovements: [],
    categoryScores: buildCategoryScores(evaluations),
    evaluations,
    scenarioRuns: batch.runs,
    settlementSummary,
  };

  report.recommendedNextChatImprovements = deriveRecommendedChatImprovements(report);
  markChatStressSimulationAggregateComplete();
  recordIntakeCompletionBoundaryOperation('chat-stress-simulation-complete');
  emitTrace(input, {
    operationId: 'chat-stress-simulation-complete',
    operationLabel: `Chat stress simulation complete (recovered: ${passedCount}/${scenarios.length} passed)`,
    phase: 'PASSED',
  });
  recordChatStressSimulationCompleteEmitted();
  emitTrace(input, {
    operationId: 'chat-stress-simulation-complete-emitted',
    operationLabel: 'Chat stress simulation complete emitted',
    phase: 'PASSED',
  });

  return {
    readOnly: true,
    advisoryOnly: true,
    report,
  };
}



export function buildChatStressSimulationCacheKey(report: ChatStressSimulationReport): string {

  const digest = createHash('sha256')

    .update([report.runId, report.overallScore, report.totalScenarios].join('|'))

    .digest('hex')

    .slice(0, 12);

  return `chat-stress:${digest}`;

}



export function formatChatStressSimulationSummary(report: ChatStressSimulationReport): string {

  const partial = report.degradedPartialResult
    ? report.runtimeHealth === 'DEGRADED_INCOMPLETE'
      ? ` DEGRADED_INCOMPLETE (${report.settlementSummary?.settledCount ?? report.scenariosExecuted}/${report.scenariosRequested} settled).`
      : ` PARTIAL (${report.scenariosExecuted}/${report.scenariosRequested} executed).`
    : '';

  return (

    `Chat Stress Simulation: ${report.overallScore}/100 — ` +

    `${report.passedCount}/${report.totalScenarios} passed, ${report.failedCount} failed, ${report.weakCount} weak.` +

    partial +

    ` Runtime: ${report.runtimeHealth}. ` +

    `Chat blocks launch readiness: ${report.chatBlocksLaunchReadiness ? 'YES' : 'NO'}.`

  );

}



export { buildChatStressSimulationReportMarkdown };


