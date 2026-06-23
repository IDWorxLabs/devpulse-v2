/**
 * Founder Test non-blocking chat stress — bounded evidence window, never blocks report generation.
 */

import { createHash } from 'node:crypto';
import { evaluateChatStressRuns } from './chat-response-evaluator.js';
import { runFounderTestChatStressSimulation } from './chat-stress-authority.js';
import {
  getChatStressCompletionSnapshot,
  listChatStressOrderedScenarioIds,
} from './chat-stress-completion-tracker.js';
import {
  recordChatStressCompletionConditionSatisfied,
  recordChatStressDegradedIncomplete,
  recordChatStressSimulationCompleteEmitted,
} from './chat-stress-completion-propagation.js';
import {
  buildRepeatedFailurePatterns,
  deriveRecommendedChatImprovements,
} from './chat-stress-report-builder.js';
import type {
  ChatStressCategory,
  ChatStressEvaluation,
  ChatStressSimulationReport,
  RunChatStressSimulationInput,
} from './chat-stress-simulation-types.js';
import {
  buildChatStressSettlementSummary,
  isChatStressSimulationComplete,
} from './chat-stress-settlement-boundary.js';
import { materializeMissingChatStressRuns } from './chat-stress-timeout-run-materialization.js';
import { listChatStressScenarios } from './chat-stress-scenario-registry.js';
import {
  FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS,
  resolveEffectiveChatStressMaxScenarios,
} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';

export const CHAT_STRESS_NON_BLOCKING_FOUNDER_TEST_V1_PASS =
  'CHAT_STRESS_NON_BLOCKING_FOUNDER_TEST_V1_PASS';

export const CHAT_STRESS_DEGRADED_INCOMPLETE_OPERATION_ID = 'chat-stress-degraded-incomplete';

const DEGRADED_INCOMPLETE_REPORT_NOTE =
  'Chat stress did not fully complete inside the Founder Test runtime budget, so this section is degraded.';

function nextRunId(): string {
  return `chat-stress-nb-${createHash('sha256').update(String(Date.now())).digest('hex').slice(0, 10)}`;
}

function averageScore(scores: number[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function buildCategoryScores(
  evaluations: ChatStressEvaluation[],
): Record<ChatStressCategory, number> {
  const buckets = new Map<ChatStressCategory, number[]>();
  for (const evaluation of evaluations) {
    const existing = buckets.get(evaluation.category) ?? [];
    existing.push(evaluation.score);
    buckets.set(evaluation.category, existing);
  }
  const result = {} as Record<ChatStressCategory, number>;
  for (const [category, scores] of buckets) {
    result[category] = averageScore(scores);
  }
  return result;
}

function emitTrace(
  input: Pick<RunChatStressSimulationInput, 'onTrace'>,
  event: {
    operationId: string;
    operationLabel: string;
    phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';
    errorMessage?: string;
  },
): void {
  input.onTrace?.(event);
}

export function emitChatStressDegradedIncompleteBoundary(
  input: Pick<RunChatStressSimulationInput, 'onTrace'>,
  pendingScenarioIds: readonly string[],
  nowMs = Date.now(),
): void {
  const snap = getChatStressCompletionSnapshot(nowMs);
  const pendingIds = pendingScenarioIds.length ? pendingScenarioIds : snap.pendingScenarioIds;
  const summary = buildChatStressSettlementSummary(nowMs);
  const at = new Date(nowMs);

  recordChatStressDegradedIncomplete(at);

  emitTrace(input, {
    operationId: CHAT_STRESS_DEGRADED_INCOMPLETE_OPERATION_ID,
    operationLabel: `Chat stress DEGRADED_INCOMPLETE (started=${summary.startedCount} settled=${summary.settledCount} pending=${summary.pendingCount})`,
    phase: 'BUDGET_EXCEEDED',
    errorMessage: pendingIds.length ? `Pending scenarios: ${pendingIds.join(', ')}` : undefined,
  });

  emitTrace(input, {
    operationId: 'chat-stress-simulation-complete',
    operationLabel: `Chat stress simulation complete — DEGRADED_INCOMPLETE (settled=${summary.settledCount}, pending=${summary.pendingCount})`,
    phase: 'PASSED',
    errorMessage: DEGRADED_INCOMPLETE_REPORT_NOTE,
  });

  recordChatStressSimulationCompleteEmitted(at);
  emitTrace(input, {
    operationId: 'chat-stress-simulation-complete-emitted',
    operationLabel: 'Chat stress simulation complete emitted (degraded incomplete)',
    phase: 'PASSED',
  });
}

export function buildDegradedIncompleteChatStressReport(input: {
  maxScenarios?: number;
  elapsedMs: number;
  pendingScenarioIds?: readonly string[];
}): ChatStressSimulationReport {
  const context = 'founder-test' as const;
  const scenariosRequested = resolveEffectiveChatStressMaxScenarios(input.maxScenarios, context);
  const registryScenarios = listChatStressScenarios(scenariosRequested);
  const orderedIds = [...listChatStressOrderedScenarioIds()];
  const scenarios =
    orderedIds.length > 0
      ? orderedIds
          .map(
            (id) =>
              registryScenarios.find((scenario) => scenario.id === id) ??
              listChatStressScenarios(scenariosRequested + orderedIds.length).find(
                (scenario) => scenario.id === id,
              ),
          )
          .filter((scenario): scenario is (typeof registryScenarios)[number] => scenario != null)
      : registryScenarios;

  const snap = getChatStressCompletionSnapshot();
  const pendingScenarioIds =
    input.pendingScenarioIds ?? snap.pendingScenarioIds;
  const settlementSummary = buildChatStressSettlementSummary();
  const runs = materializeMissingChatStressRuns({
    scenarios,
    runs: [],
    perScenarioTimeoutMs: FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS,
  });
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
  const budgetNotes = [
    DEGRADED_INCOMPLETE_REPORT_NOTE,
    `Settlement snapshot: started=${snap.startedCount} settled=${snap.settledCount} pending=${snap.pendingCount}.`,
    pendingScenarioIds.length
      ? `Pending scenario IDs: ${pendingScenarioIds.join(', ')}.`
      : 'No pending scenario IDs recorded.',
    'Launch risk: chat stress evidence is incomplete — do not treat chat readiness as fully validated.',
  ];

  const report: ChatStressSimulationReport = {
    readOnly: true,
    advisoryOnly: true,
    runId: nextRunId(),
    generatedAt: new Date().toISOString(),
    totalScenarios: scenarios.length,
    scenariosRequested,
    scenariosExecuted: runs.filter((run) => !run.skipped).length,
    scenariosSkipped: runs.filter((run) => run.skipped).length,
    scenariosTimedOut: runs.filter((run) => run.timedOut).length,
    passedCount,
    failedCount,
    weakCount,
    overallScore,
    chatBlocksLaunchReadiness: true,
    selfEvolutionRequired: true,
    runtimeHealth: 'DEGRADED_INCOMPLETE',
    budgetElapsedMs: input.elapsedMs,
    degradedPartialResult: true,
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
  return report;
}

export interface ChatStressNonBlockingResult {
  readOnly: true;
  report: ChatStressSimulationReport;
  completedInWindow: boolean;
  degradedIncomplete: boolean;
}

/**
 * Run chat stress for at most FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS, then continue Founder Test.
 * Never awaits hung workers, settlement sweeps, or completion boundaries after the window elapses.
 */
export async function runChatStressNonBlockingForFounderTest(
  input: RunChatStressSimulationInput & { maxScenarios?: number; budgetMs?: number; nonBlockingBudgetMs?: number },
): Promise<ChatStressNonBlockingResult> {
  const windowMs = input.nonBlockingBudgetMs ?? FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS;
  const startedAt = Date.now();

  emitTrace(input, {
    operationId: 'chat-stress-non-blocking-started',
    operationLabel: `Chat stress non-blocking window started (${windowMs}ms)`,
    phase: 'RUNNING',
  });

  const chatTask = runFounderTestChatStressSimulation({
    ...input,
    founderTestContext: true,
    budgetMs: Math.min(input.budgetMs ?? windowMs, windowMs + 2_000),
    perScenarioTimeoutMs: input.perScenarioTimeoutMs,
  })
    .then((assessment) => ({ kind: 'complete' as const, assessment }))
    .catch(() => ({ kind: 'complete' as const, assessment: null }));

  const windowTask = new Promise<{ kind: 'window_elapsed' }>((resolve) => {
    setTimeout(() => resolve({ kind: 'window_elapsed' }), windowMs);
  });

  const raced = await Promise.race([chatTask, windowTask]);
  const elapsedMs = Date.now() - startedAt;

  if (raced.kind === 'complete' && raced.assessment?.report) {
    const snap = getChatStressCompletionSnapshot();
    const fullyComplete =
      snap.pendingCount === 0 && isChatStressSimulationComplete();
    if (fullyComplete && !raced.assessment.report.degradedPartialResult) {
      emitTrace(input, {
        operationId: 'chat-stress-non-blocking-complete',
        operationLabel: `Chat stress completed within ${elapsedMs}ms window`,
        phase: 'PASSED',
      });
      return {
        readOnly: true,
        report: raced.assessment.report,
        completedInWindow: true,
        degradedIncomplete: false,
      };
    }
    if (snap.pendingCount > 0 || elapsedMs >= windowMs) {
      const report = buildDegradedIncompleteChatStressReport({
        maxScenarios: input.maxScenarios,
        elapsedMs,
        pendingScenarioIds: snap.pendingScenarioIds,
      });
      emitChatStressDegradedIncompleteBoundary(input, snap.pendingScenarioIds);
      return {
        readOnly: true,
        report,
        completedInWindow: false,
        degradedIncomplete: true,
      };
    }
    if (snap.settledCount > 0 && raced.assessment.report.scenariosExecuted > 0) {
      const report = {
        ...raced.assessment.report,
        degradedPartialResult: true,
        runtimeHealth:
          raced.assessment.report.runtimeHealth === 'HEALTHY'
            ? ('DEGRADED_INCOMPLETE' as const)
            : raced.assessment.report.runtimeHealth,
        budgetNotes: [
          ...raced.assessment.report.budgetNotes,
          ...(snap.pendingCount > 0
            ? [
                DEGRADED_INCOMPLETE_REPORT_NOTE,
                `Pending at batch return: ${snap.pendingScenarioIds.join(', ') || snap.pendingCount}.`,
              ]
            : []),
        ],
        chatBlocksLaunchReadiness:
          raced.assessment.report.chatBlocksLaunchReadiness || snap.pendingCount > 0,
      };
      if (snap.pendingCount > 0) {
        emitChatStressDegradedIncompleteBoundary(input, snap.pendingScenarioIds);
      }
      return {
        readOnly: true,
        report,
        completedInWindow: true,
        degradedIncomplete: snap.pendingCount > 0 || report.degradedPartialResult,
      };
    }
  }

  void chatTask;
  const snap = getChatStressCompletionSnapshot();
  const report = buildDegradedIncompleteChatStressReport({
    maxScenarios: input.maxScenarios,
    elapsedMs,
    pendingScenarioIds: snap.pendingScenarioIds,
  });
  emitChatStressDegradedIncompleteBoundary(input, snap.pendingScenarioIds);
  emitTrace(input, {
    operationId: 'chat-stress-non-blocking-window-elapsed',
    operationLabel: `Chat stress non-blocking window elapsed (${elapsedMs}ms) — continuing Founder Test`,
    phase: 'BUDGET_EXCEEDED',
  });

  return {
    readOnly: true,
    report,
    completedInWindow: false,
    degradedIncomplete: true,
  };
}
