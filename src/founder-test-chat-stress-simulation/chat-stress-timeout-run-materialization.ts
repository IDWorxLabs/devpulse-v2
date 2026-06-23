/**
 * Chat stress timeout run result materialization (V1).
 * Ensures every started scenario has a terminal run object when watchdog forces TIMEOUT.
 */

import type {
  ChatStressScenarioDefinition,
  ChatStressScenarioRun,
  ChatStressScenarioRunStatus,
} from './chat-stress-simulation-types.js';
import {
  getChatStressScenarioTerminalStatus,
  isChatStressScenarioSettled,
  listChatStressOrderedScenarioIds,
  listStartedChatStressScenarioIds,
  tryMarkChatStressScenarioSettled,
  type ChatStressScenarioTerminalStatus,
} from './chat-stress-completion-tracker.js';

export const CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_V1_PASS =
  'CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_V1_PASS';

export const CHAT_STRESS_TIMEOUT_RUN_REASON = 'Scenario timed out';

export const CHAT_STRESS_TIMEOUT_RUN_STATUS: ChatStressScenarioRunStatus = 'TIMEOUT';

export function buildChatStressTimeoutRunResult(input: {
  scenario: ChatStressScenarioDefinition;
  durationMs: number;
  reason?: string;
}): ChatStressScenarioRun {
  const reason = input.reason ?? CHAT_STRESS_TIMEOUT_RUN_REASON;
  return {
    readOnly: true,
    scenarioId: input.scenario.id,
    category: input.scenario.category,
    prompt: input.scenario.prompt,
    draftResponse: '',
    finalAnswer: `[Simulation timeout — scenario "${input.scenario.id}" (${input.scenario.category}) did not complete within ${input.durationMs}ms: ${reason}]`,
    brainPath: 'command-center-brain+llm-chat-brain',
    usedLlm: false,
    fallbackUsed: true,
    contextIncluded: false,
    judgeScore: null,
    durationMs: input.durationMs,
    timedOut: true,
    skipped: false,
    skipReason: reason,
    status: CHAT_STRESS_TIMEOUT_RUN_STATUS,
    passed: false,
    terminal: true,
  };
}

function mapTerminalStatusToRunStatus(
  terminal: ChatStressScenarioTerminalStatus,
): ChatStressScenarioRunStatus {
  switch (terminal) {
    case 'TIMEOUT':
      return 'TIMEOUT';
    case 'ERROR':
    case 'FAILED':
      return 'FAILED';
    case 'SKIPPED_BUDGET':
    case 'SKIPPED_WITH_REASON':
      return 'SKIPPED';
    default:
      return 'PASSED';
  }
}

export function buildChatStressSkippedRunResult(input: {
  scenario: ChatStressScenarioDefinition;
  reason: string;
}): ChatStressScenarioRun {
  return {
    readOnly: true,
    scenarioId: input.scenario.id,
    category: input.scenario.category,
    prompt: input.scenario.prompt,
    draftResponse: '',
    finalAnswer: `[Skipped — ${input.reason}]`,
    brainPath: 'command-center-brain+llm-chat-brain',
    usedLlm: false,
    fallbackUsed: true,
    contextIncluded: false,
    judgeScore: null,
    durationMs: 0,
    timedOut: false,
    skipped: true,
    skipReason: input.reason,
    status: 'SKIPPED',
    passed: false,
    terminal: true,
  };
}

export function buildChatStressErrorRunResult(input: {
  scenario: ChatStressScenarioDefinition;
  reason: string;
}): ChatStressScenarioRun {
  return {
    readOnly: true,
    scenarioId: input.scenario.id,
    category: input.scenario.category,
    prompt: input.scenario.prompt,
    draftResponse: '',
    finalAnswer: `[Simulation error — ${input.reason}]`,
    brainPath: 'command-center-brain+llm-chat-brain',
    usedLlm: false,
    fallbackUsed: true,
    contextIncluded: false,
    judgeScore: null,
    durationMs: 0,
    timedOut: false,
    skipped: false,
    skipReason: input.reason,
    status: 'ERROR',
    passed: false,
    terminal: true,
  };
}

export function materializeMissingChatStressRuns(input: {
  scenarios: readonly ChatStressScenarioDefinition[];
  runs: readonly ChatStressScenarioRun[];
  perScenarioTimeoutMs: number;
}): ChatStressScenarioRun[] {
  const scenarioById = new Map(input.scenarios.map((scenario) => [scenario.id, scenario]));
  const runById = new Map(input.runs.map((run) => [run.scenarioId, run]));
  const out = [...input.runs];

  const scenarioIdsToMaterialize = new Set([
    ...listStartedChatStressScenarioIds(),
    ...listChatStressOrderedScenarioIds().filter((scenarioId) => isChatStressScenarioSettled(scenarioId)),
  ]);

  for (const scenarioId of scenarioIdsToMaterialize) {
    if (runById.has(scenarioId)) continue;

    const scenario = scenarioById.get(scenarioId);
    if (!scenario) continue;

    const terminal = getChatStressScenarioTerminalStatus(scenarioId);
    let materialized: ChatStressScenarioRun;

    if (terminal === 'SKIPPED_BUDGET' || terminal === 'SKIPPED_WITH_REASON') {
      materialized = buildChatStressSkippedRunResult({
        scenario,
        reason: terminal === 'SKIPPED_BUDGET' ? 'SIMULATION_BUDGET_EXCEEDED' : 'SKIPPED_WITH_REASON',
      });
    } else if (terminal === 'ERROR' || terminal === 'FAILED') {
      materialized = buildChatStressErrorRunResult({
        scenario,
        reason: terminal === 'ERROR' ? 'Scenario error' : 'Scenario failed',
      });
    } else {
      materialized = buildChatStressTimeoutRunResult({
        scenario,
        durationMs: input.perScenarioTimeoutMs,
        reason: CHAT_STRESS_TIMEOUT_RUN_REASON,
      });
      if (!isChatStressScenarioSettled(scenarioId)) {
        tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT');
      }
    }

    materialized = {
      ...materialized,
      status: mapTerminalStatusToRunStatus(terminal ?? 'TIMEOUT'),
      passed: false,
      terminal: true,
    };

    out.push(materialized);
    runById.set(scenarioId, materialized);
  }

  return out.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId));
}

export function countStartedChatStressRuns(runs: readonly ChatStressScenarioRun[]): number {
  const startedIds = new Set(listStartedChatStressScenarioIds());
  return runs.filter((run) => startedIds.has(run.scenarioId)).length;
}
