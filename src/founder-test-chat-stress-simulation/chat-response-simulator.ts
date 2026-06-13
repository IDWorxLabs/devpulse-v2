/**
 * Phase 26.4 — Chat response simulator using the same brain path as the UI.
 * Phase 26.51 — Bounded batch with Promise.allSettled completion barrier.
 * Phase 26.44 — finally-based settlement + hard timeout for hanging scenarios.
 * Phase 26.54 — hard watchdog timer independent of provider promise (cap-05).
 */

import { processBrainRequest } from '../command-center-brain/index.js';
import { generateLlmBackedChatResponseAsync } from '../llm-chat-brain/index.js';
import type { LlmProvider } from '../llm-chat-brain/llm-provider-types.js';
import {
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_SOFT_WARNING_MS,
  withScenarioTimeout,
} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  beginChatStressSimulation,
  CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON,
  forceSettlePendingStartedChatStressScenarios,
  isChatStressScenarioSettled,
  markChatStressScenarioSkippedBudget,
  markChatStressScenarioStarted,
  clearActiveChatStressScenarioIfMatches,
  registerChatStressScenarioHardWatchdog,
  resolveChatStressScenarioTerminalStatus,
  setActiveChatStressScenario,
  tryMarkChatStressScenarioSettled,
  type ChatStressScenarioTerminalStatus,
} from './chat-stress-completion-tracker.js';
import type { ChatStressScenarioDefinition, ChatStressScenarioRun } from './chat-stress-simulation-types.js';
import {
  buildChatStressErrorRunResult,
  buildChatStressSkippedRunResult,
  buildChatStressTimeoutRunResult,
  CHAT_STRESS_TIMEOUT_RUN_REASON,
  materializeMissingChatStressRuns,
} from './chat-stress-timeout-run-materialization.js';

function buildTimeoutRun(
  scenario: ChatStressScenarioDefinition,
  timeoutMs: number,
  reason: string,
): ChatStressScenarioRun {
  return buildChatStressTimeoutRunResult({
    scenario,
    durationMs: timeoutMs,
    reason: reason.includes('Scenario timed out') ? CHAT_STRESS_TIMEOUT_RUN_REASON : reason,
  });
}

function buildErrorRun(scenario: ChatStressScenarioDefinition, err: unknown): ChatStressScenarioRun {
  const message = err instanceof Error ? err.message : 'chat stress scenario failed';
  return buildChatStressErrorRunResult({ scenario, reason: message });
}

function buildSkippedRun(
  scenario: ChatStressScenarioDefinition,
  reason: string,
): ChatStressScenarioRun {
  return buildChatStressSkippedRunResult({ scenario, reason });
}

export async function simulateChatStressResponse(input: {
  scenario: ChatStressScenarioDefinition;
  rootDir?: string;
  providerOverride?: LlmProvider;
  perScenarioTimeoutMs?: number;
  onScenarioSoftWarning?: (scenario: ChatStressScenarioDefinition, elapsedMs: number) => void;
}): Promise<ChatStressScenarioRun | null> {
  if (isChatStressScenarioSettled(input.scenario.id)) {
    return null;
  }

  const started = Date.now();
  const rootDir = input.rootDir ?? process.cwd();
  const prompt = input.scenario.prompt;
  const timeoutMs = input.perScenarioTimeoutMs ?? CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS;
  const softWarningMs = Math.min(CHAT_STRESS_SCENARIO_SOFT_WARNING_MS, timeoutMs - 1);

  let softTimer: ReturnType<typeof setTimeout> | undefined;
  if (softWarningMs > 0 && input.onScenarioSoftWarning) {
    softTimer = setTimeout(() => {
      input.onScenarioSoftWarning?.(input.scenario, Date.now() - started);
    }, softWarningMs);
  }

  try {
    const run = await withScenarioTimeout(
      (async () => {
        if (isChatStressScenarioSettled(input.scenario.id)) {
          return null;
        }

        const brainResult = processBrainRequest({
          message: prompt,
          timestamp: Date.now(),
        });

        const llmResult = await generateLlmBackedChatResponseAsync({
          message: prompt,
          draftResponse: brainResult.brainResponse,
          rootDir,
          providerOverride: input.providerOverride,
        });

        if (isChatStressScenarioSettled(input.scenario.id)) {
          return null;
        }

        return {
          readOnly: true as const,
          scenarioId: input.scenario.id,
          category: input.scenario.category,
          prompt,
          draftResponse: brainResult.brainResponse,
          finalAnswer: llmResult.finalAnswer,
          brainPath: 'command-center-brain+llm-chat-brain' as const,
          usedLlm: llmResult.metadata.usedLlm,
          fallbackUsed: llmResult.metadata.fallbackUsed,
          contextIncluded: llmResult.metadata.contextIncluded,
          judgeScore: llmResult.metadata.judgeScore,
          durationMs: Date.now() - started,
          timedOut: false,
          skipped: false,
          skipReason: null,
        };
      })(),
      timeoutMs,
      `chat-stress:${input.scenario.id}`,
    );
    return run;
  } catch (err) {
    if (isChatStressScenarioSettled(input.scenario.id)) {
      return null;
    }
    const message = err instanceof Error ? err.message : 'chat stress scenario failed';
    if (/timed out/i.test(message)) {
      return buildTimeoutRun(input.scenario, timeoutMs, message);
    }
    return buildErrorRun(input.scenario, err);
  } finally {
    if (softTimer) clearTimeout(softTimer);
  }
}

export interface ChatStressBatchResult {
  runs: ChatStressScenarioRun[];
  scenariosExecuted: number;
  scenariosSkipped: number;
  scenariosTimedOut: number;
  budgetExceeded: boolean;
  budgetNotes: string[];
}

export async function simulateChatStressBatch(input: {
  scenarios: ChatStressScenarioDefinition[];
  rootDir?: string;
  providerOverride?: LlmProvider;
  concurrency?: number;
  perScenarioTimeoutMs?: number;
  budgetMs?: number;
  budgetStartedAtMs?: number;
  onScenarioStart?: (scenario: ChatStressScenarioDefinition) => void;
  onScenarioSoftWarning?: (scenario: ChatStressScenarioDefinition, elapsedMs: number) => void;
  onScenarioWatchdogArmed?: (scenario: ChatStressScenarioDefinition, deadlineMs: number) => void;
  onScenarioWatchdogFired?: (scenario: ChatStressScenarioDefinition) => void;
  onScenarioWatchdogTimeout?: (scenario: ChatStressScenarioDefinition, run: ChatStressScenarioRun) => void;
  onScenarioDuplicateIgnored?: (scenarioId: string, terminalStatus: ChatStressScenarioTerminalStatus) => void;
  onScenarioComplete?: (
    run: ChatStressScenarioRun,
    terminalStatus: ChatStressScenarioTerminalStatus,
  ) => void;
}): Promise<ChatStressBatchResult> {
  const concurrency = Math.max(1, input.concurrency ?? 4);
  const budgetMs = input.budgetMs ?? Number.POSITIVE_INFINITY;
  const budgetStartedAtMs = input.budgetStartedAtMs ?? Date.now();
  const perScenarioTimeoutMs = input.perScenarioTimeoutMs ?? CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS;
  const runs: ChatStressScenarioRun[] = [];
  const budgetNotes: string[] = [];
  let scenariosSkipped = 0;
  let scenariosTimedOut = 0;
  let budgetExceeded = false;

  beginChatStressSimulation(input.scenarios.map((scenario) => scenario.id));

  function budgetRemainingMs(): number {
    return budgetMs - (Date.now() - budgetStartedAtMs);
  }

  function recordRunStats(run: ChatStressScenarioRun): void {
    if (run.timedOut) scenariosTimedOut += 1;
    if (run.skipped) scenariosSkipped += 1;
  }

  function settleScenario(
    scenario: ChatStressScenarioDefinition,
    run: ChatStressScenarioRun,
  ): boolean {
    const terminalStatus = resolveChatStressScenarioTerminalStatus(run);
    const result = tryMarkChatStressScenarioSettled(scenario.id, terminalStatus);
    if (!result.accepted) {
      input.onScenarioDuplicateIgnored?.(scenario.id, terminalStatus);
      return false;
    }
    recordRunStats(run);
    runs.push(run);
    input.onScenarioComplete?.(run, terminalStatus);
    return true;
  }

  function pushMaterializedRun(
    scenario: ChatStressScenarioDefinition,
    run: ChatStressScenarioRun,
    onTimeout?: (scenario: ChatStressScenarioDefinition, run: ChatStressScenarioRun) => void,
  ): void {
    if (runs.some((existing) => existing.scenarioId === scenario.id)) return;
    if (!isChatStressScenarioSettled(scenario.id)) {
      settleScenario(scenario, run);
      return;
    }
    recordRunStats(run);
    runs.push(run);
    const terminalStatus = resolveChatStressScenarioTerminalStatus(run);
    input.onScenarioComplete?.(run, terminalStatus);
    if (run.timedOut) {
      onTimeout?.(scenario, run);
    }
  }

  function forceWatchdogTimeout(scenario: ChatStressScenarioDefinition): void {
    if (isChatStressScenarioSettled(scenario.id) && runs.some((run) => run.scenarioId === scenario.id)) {
      return;
    }
    setActiveChatStressScenario(null);
    const timeoutRun = buildTimeoutRun(
      scenario,
      perScenarioTimeoutMs,
      CHAT_STRESS_TIMEOUT_RUN_REASON,
    );
    if (settleScenario(scenario, timeoutRun)) {
      input.onScenarioWatchdogTimeout?.(scenario, timeoutRun);
      return;
    }
    pushMaterializedRun(scenario, timeoutRun, input.onScenarioWatchdogTimeout);
  }

  let nextIndex = 0;

  async function runOneScenario(scenario: ChatStressScenarioDefinition): Promise<void> {
    markChatStressScenarioStarted(scenario.id);
    setActiveChatStressScenario(scenario.id);
    input.onScenarioStart?.(scenario);

    registerChatStressScenarioHardWatchdog({
      scenarioId: scenario.id,
      timeoutMs: perScenarioTimeoutMs,
      onArmed: (_scenarioId, deadlineMs) => {
        input.onScenarioWatchdogArmed?.(scenario, deadlineMs);
      },
      onFired: () => {
        input.onScenarioWatchdogFired?.(scenario);
        forceWatchdogTimeout(scenario);
      },
    });

    let settled = false;
    try {
      if (budgetExceeded || budgetRemainingMs() <= 0) {
        budgetExceeded = true;
        const skipped = buildSkippedRun(scenario, 'SIMULATION_BUDGET_EXCEEDED');
        if (settleScenario(scenario, skipped)) {
          settled = true;
        }
        return;
      }

      const run = await simulateChatStressResponse({
        scenario,
        rootDir: input.rootDir,
        providerOverride: input.providerOverride,
        perScenarioTimeoutMs,
        onScenarioSoftWarning: input.onScenarioSoftWarning,
      });

      if (run == null || isChatStressScenarioSettled(scenario.id)) {
        settled = isChatStressScenarioSettled(scenario.id);
        return;
      }

      if (settleScenario(scenario, run)) {
        settled = true;
      }
    } catch (err) {
      if (!settled && !isChatStressScenarioSettled(scenario.id)) {
        const errorRun = buildErrorRun(scenario, err);
        if (settleScenario(scenario, errorRun)) {
          settled = true;
        }
      }
    } finally {
      if (!settled && !isChatStressScenarioSettled(scenario.id)) {
        const forced = buildTimeoutRun(
          scenario,
          perScenarioTimeoutMs,
          'Scenario worker exited without settlement',
        );
        if (settleScenario(scenario, forced)) {
          settled = true;
        }
      }
      clearActiveChatStressScenarioIfMatches(scenario.id);
    }
  }

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= input.scenarios.length) return;

      const scenario = input.scenarios[index]!;
      if (budgetRemainingMs() <= 0) budgetExceeded = true;

      if (budgetExceeded) {
        const skipped = buildSkippedRun(scenario, 'SIMULATION_BUDGET_EXCEEDED');
        markChatStressScenarioSkippedBudget(scenario.id);
        scenariosSkipped += 1;
        runs.push(skipped);
        input.onScenarioComplete?.(skipped, 'SKIPPED_BUDGET');
        continue;
      }

      await runOneScenario(scenario);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, input.scenarios.length) }, () => worker());
  await Promise.allSettled(workers);

  const forcedSettlements = forceSettlePendingStartedChatStressScenarios(
    CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON,
  );
  for (const forced of forcedSettlements) {
    const scenario = input.scenarios.find((entry) => entry.id === forced.scenarioId);
    if (!scenario) continue;
    if (runs.some((run) => run.scenarioId === forced.scenarioId)) continue;

    const timeoutRun = buildTimeoutRun(
      scenario,
      perScenarioTimeoutMs,
      forced.reason.includes('BATCH_FINALIZER') ? CHAT_STRESS_TIMEOUT_RUN_REASON : forced.reason,
    );
    pushMaterializedRun(scenario, timeoutRun, input.onScenarioWatchdogTimeout);
    budgetNotes.push(`Force-settled pending scenario ${forced.scenarioId}: ${forced.reason}`);
  }

  const finalRuns = materializeMissingChatStressRuns({
    scenarios: input.scenarios,
    runs,
    perScenarioTimeoutMs,
  });
  for (const run of finalRuns) {
    if (runs.some((existing) => existing.scenarioId === run.scenarioId)) continue;
    const scenario = input.scenarios.find((entry) => entry.id === run.scenarioId);
    if (!scenario) continue;
    pushMaterializedRun(scenario, run, input.onScenarioWatchdogTimeout);
    budgetNotes.push(`Materialized missing run for started scenario ${run.scenarioId}`);
  }

  const resolvedRuns = materializeMissingChatStressRuns({
    scenarios: input.scenarios,
    runs,
    perScenarioTimeoutMs,
  });

  if (budgetRemainingMs() <= 0) budgetExceeded = true;

  if (budgetExceeded) {
    budgetNotes.push(
      `Chat stress batch stopped with ${scenariosSkipped} scenario(s) skipped due to SIMULATION_BUDGET_EXCEEDED.`,
    );
  }
  const timedOutCount = resolvedRuns.filter((run) => run.timedOut).length;
  if (timedOutCount > 0) {
    budgetNotes.push(`${timedOutCount} scenario(s) hit per-scenario timeout guards.`);
  }

  return {
    runs: resolvedRuns,
    scenariosExecuted: resolvedRuns.filter((run) => !run.skipped).length,
    scenariosSkipped: resolvedRuns.filter((run) => run.skipped).length,
    scenariosTimedOut: timedOutCount,
    budgetExceeded,
    budgetNotes,
  };
}
