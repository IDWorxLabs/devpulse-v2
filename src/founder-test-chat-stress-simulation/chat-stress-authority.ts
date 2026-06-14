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

  SIMULATION_BUDGET_MS,

} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';

import {

  markChatStressSimulationAggregateComplete,

  registerChatStressPostWatchdogHealthReconciler,

  resetChatStressCompletionTrackerForTests,

  type ChatStressScenarioTerminalStatus,

} from './chat-stress-completion-tracker.js';

import { resetChatStressCompletionPropagationForTests } from './chat-stress-completion-propagation.js';

import {

  buildChatStressSettlementSummary,

  detectChatStressPendingLeak,

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

  resetLiveChatStressRunnerPathForTests,

} from './live-chat-stress-runner-path.js';

import { evaluateChatStressRuns } from './chat-response-evaluator.js';

import { simulateChatStressBatch } from './chat-response-simulator.js';

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

  const budget = createSimulationBudgetTracker({ budgetMs, startedAtMs: Date.now() });

  const budgetNotes: string[] = [

    `Bounded chat stress: ${scenarios.length}/${scenariosRequested} requested scenarios (founder-test default cap applies when unset).`,

  ];



  emitTrace(input, {

    operationId: 'chat-stress-simulation-started',

    operationLabel: `Chat stress simulation started (${scenarios.length} scenarios)`,

    phase: 'RUNNING',

  });



  let unregisterHealthReconciler: (() => void) | null = null;

  if (context === 'founder-test') {

    emitTrace(input, {

      operationId: LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,

      operationLabel: `live-chat-stress-runner-path: ${LIVE_CHAT_STRESS_RUNNER_PATH_MARKER}`,

      phase: 'PASSED',

    });

    registerChatStressRunnerIdleWithPendingHandler((event) => {

      emitTrace(input, {

        operationId: 'chat-stress-runner-idle-with-pending',

        operationLabel: CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,

        phase: 'SLOW',

        errorMessage: JSON.stringify({

          pendingScenarioIds: event.pendingScenarioIds,

          pendingWithoutActiveWorkerScenarioIds: event.pendingWithoutActiveWorkerScenarioIds,

          forcedSettlementCount: event.forcedSettlementCount,

        }),

      });

    });

    unregisterHealthReconciler = registerChatStressPostWatchdogHealthReconciler(

      reconcileChatStressRunnerIdleWithPending,

    );

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

    registerChatStressRunnerIdleWithPendingHandler(null);

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



export function buildChatStressSimulationCacheKey(report: ChatStressSimulationReport): string {

  const digest = createHash('sha256')

    .update([report.runId, report.overallScore, report.totalScenarios].join('|'))

    .digest('hex')

    .slice(0, 12);

  return `chat-stress:${digest}`;

}



export function formatChatStressSimulationSummary(report: ChatStressSimulationReport): string {

  const partial = report.degradedPartialResult

    ? ` PARTIAL (${report.scenariosExecuted}/${report.scenariosRequested} executed).`

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


