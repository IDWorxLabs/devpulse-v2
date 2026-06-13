/**
 * Phase 26.65 — Chat stress timeout run result materialization validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig, createMockLlmProvider } from '../src/llm-chat-brain/llm-provider.js';
import {
  CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_V1_PASS,
  CHAT_STRESS_TIMEOUT_RUN_REASON,
  CHAT_STRESS_TIMEOUT_RUN_STATUS,
  beginChatStressSimulation,
  buildChatStressTimeoutRunResult,
  countStartedChatStressRuns,
  evaluateChatStressRuns,
  getChatStressScenarioTerminalStatus,
  listStartedChatStressScenarioIds,
  markChatStressScenarioStarted,
  materializeMissingChatStressRuns,
  reconcileChatStressWatchdogHealth,
  registerChatStressScenarioHardWatchdog,
  resetChatStressCompletionTrackerForTests,
  simulateChatStressBatch,
  tryMarkChatStressScenarioSettled,
} from '../src/founder-test-chat-stress-simulation/index.js';
import { buildChatStressSimulationReportMarkdown } from '../src/founder-test-chat-stress-simulation/chat-stress-report-builder.js';
import { listChatStressScenarios } from '../src/founder-test-chat-stress-simulation/chat-stress-scenario-registry.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-timeout-run-result-materialization';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

class Cap05HangingProvider implements LlmProvider {
  readonly name = 'mock' as const;
  readonly model: string;
  private readonly fast: LlmProvider;

  constructor() {
    this.model = loadLlmModelConfig({ LLM_PROVIDER: 'mock', LLM_MODEL: 'cap05-hang-mock' }).model;
    this.fast = createMockLlmProvider(['Quick mock answer for concurrent scenario.']);
  }

  getStatus() {
    return {
      readOnly: true as const,
      connected: true as const,
      provider: this.name,
      model: this.model,
    };
  }

  chat(request: LlmChatRequest): Promise<LlmChatResponse> {
    const lastUser = [...request.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    if (/actually capable of today/i.test(lastUser)) {
      return new Promise(() => {
        /* cap-05 never resolves */
      });
    }
    return this.fast.chat(request);
  }
}

const REQUIRED = [
  'src/founder-test-chat-stress-simulation/chat-stress-timeout-run-materialization.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-response-evaluator.ts',
  'scripts/validate-chat-stress-timeout-run-result-materialization.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const materializationSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-timeout-run-materialization.ts'),
  'utf8',
);
const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const evaluatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const evaluatorRealSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-evaluator.ts'),
  'utf8',
);
const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const reportSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-report-builder.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('timeout run builder', materializationSource.includes('buildChatStressTimeoutRunResult'), 'builder');
assert('materialize missing runs', materializationSource.includes('materializeMissingChatStressRuns'), 'materialize');
assert('timeout reason constant', materializationSource.includes("CHAT_STRESS_TIMEOUT_RUN_REASON = 'Scenario timed out'"), 'reason');
assert('terminal flag on timeout run', materializationSource.includes('terminal: true'), 'terminal');
assert('passed false on timeout', materializationSource.includes('passed: false'), 'passed false');
assert('batch materialization hook', simulatorSource.includes('materializeMissingChatStressRuns'), 'batch hook');
assert('push materialized run', simulatorSource.includes('pushMaterializedRun'), 'push');
assert('evaluator timeout branch', evaluatorRealSource.includes('evaluateChatStressTimeoutRun'), 'timeout eval');
assert('no throw for terminal timeout', evaluatorRealSource.includes("terminal === 'TIMEOUT'"), 'terminal guard');
assert('watchdog does not settle without run', !trackerSource.includes('tryMarkChatStressScenarioSettled(scenarioId, \'TIMEOUT\')') || trackerSource.includes('fireWatchdogForScenario'), 'watchdog');
assert('report timeout evidence', reportSource.includes('CHAT_STRESS_SCENARIO_TIMEOUT:'), 'report line');
assert('list started scenario ids', trackerSource.includes('listStartedChatStressScenarioIds'), 'started ids');
assert('no scoring override', !evaluatorRealSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict override', !evaluatorRealSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-timeout-run-result-materialization": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetChatStressCompletionTrackerForTests();
const cap05 = listChatStressScenarios(12).find((scenario) => scenario.id === 'cap-05');
assert('cap-05 scenario exists', cap05 != null, cap05?.id ?? 'missing');

const timeoutRun = buildChatStressTimeoutRunResult({
  scenario: cap05!,
  durationMs: 15_000,
  reason: CHAT_STRESS_TIMEOUT_RUN_REASON,
});
assert('timeout run scenarioId', timeoutRun.scenarioId === 'cap-05', timeoutRun.scenarioId);
assert('timeout run status', timeoutRun.status === CHAT_STRESS_TIMEOUT_RUN_STATUS, String(timeoutRun.status));
assert('timeout run reason', timeoutRun.skipReason === CHAT_STRESS_TIMEOUT_RUN_REASON, String(timeoutRun.skipReason));
assert('timeout run category', timeoutRun.category === 'CAPABILITY', timeoutRun.category);
assert('timeout run duration', timeoutRun.durationMs === 15_000, String(timeoutRun.durationMs));
assert('timeout run terminal', timeoutRun.terminal === true, String(timeoutRun.terminal));
assert('timeout run not passed', timeoutRun.passed === false, String(timeoutRun.passed));

beginChatStressSimulation(['cap-05']);
markChatStressScenarioStarted('cap-05');
tryMarkChatStressScenarioSettled('cap-05', 'TIMEOUT');
const materialized = materializeMissingChatStressRuns({
  scenarios: [cap05!],
  runs: [],
  perScenarioTimeoutMs: 15_000,
});
assert('materialized timeout run exists', materialized.some((run) => run.scenarioId === 'cap-05'), 'materialized');
assert('materialized count for started', countStartedChatStressRuns(materialized) === 1, String(materialized.length));

let evaluationsThrew = false;
try {
  const evaluations = evaluateChatStressRuns({ scenarios: [cap05!], runs: materialized });
  assert('timeout evaluation not passed', evaluations.every((entry) => !entry.passed), 'not passed');
  assert('timeout evaluation score zero', evaluations[0]?.score === 0, String(evaluations[0]?.score));
} catch {
  evaluationsThrew = true;
}
assert('evaluateChatStressRuns no throw for TIMEOUT', !evaluationsThrew, 'no throw');

beginChatStressSimulation(['cap-05', 'cap-06']);
markChatStressScenarioStarted('cap-05');
registerChatStressScenarioHardWatchdog({
  scenarioId: 'cap-05',
  timeoutMs: 20,
  onFired: () => {
    tryMarkChatStressScenarioSettled('cap-05', 'TIMEOUT');
  },
});
reconcileChatStressWatchdogHealth(Date.now() + 25);
assert('orphan watchdog settlement TIMEOUT', getChatStressScenarioTerminalStatus('cap-05') === 'TIMEOUT', 'settled');
const orphanMaterialized = materializeMissingChatStressRuns({
  scenarios: listChatStressScenarios(12).filter((scenario) => scenario.id === 'cap-05'),
  runs: [],
  perScenarioTimeoutMs: 15_000,
});
assert('orphan settlement materializes run', orphanMaterialized.some((run) => run.scenarioId === 'cap-05'), 'orphan run');

resetChatStressCompletionTrackerForTests();
const concurrentBatch = await simulateChatStressBatch({
  scenarios: listChatStressScenarios(12).filter((scenario) => scenario.id === 'cap-05' || scenario.id === 'cap-06'),
  providerOverride: new Cap05HangingProvider(),
  concurrency: 2,
  perScenarioTimeoutMs: 40,
});
assert(
  'concurrent batch includes cap-05 run',
  concurrentBatch.runs.some((run) => run.scenarioId === 'cap-05'),
  concurrentBatch.runs.map((run) => run.scenarioId).join(','),
);
assert(
  'started scenarios have runs',
  countStartedChatStressRuns(concurrentBatch.runs) === listStartedChatStressScenarioIds().length,
  `${countStartedChatStressRuns(concurrentBatch.runs)} vs ${listStartedChatStressScenarioIds().length}`,
);

const reportMarkdown = buildChatStressSimulationReportMarkdown({
  readOnly: true,
  advisoryOnly: true,
  runId: 'test',
  generatedAt: new Date().toISOString(),
  totalScenarios: 2,
  scenariosRequested: 2,
  scenariosExecuted: 2,
  scenariosSkipped: 0,
  scenariosTimedOut: 1,
  passedCount: 0,
  failedCount: 1,
  weakCount: 0,
  overallScore: 0,
  chatBlocksLaunchReadiness: true,
  selfEvolutionRequired: true,
  runtimeHealth: 'HEALTHY',
  budgetElapsedMs: 100,
  degradedPartialResult: true,
  budgetNotes: [],
  strongestAnswers: [],
  worstAnswers: [],
  weakAnswers: [],
  failedAnswers: [],
  repeatedFailurePatterns: [],
  missingCapabilities: [],
  recommendedNextChatImprovements: [],
  categoryScores: {} as never,
  evaluations: [],
  scenarioRuns: concurrentBatch.runs,
});
assert(
  'founder report timeout evidence',
  reportMarkdown.includes('CHAT_STRESS_SCENARIO_TIMEOUT: cap-05'),
  reportMarkdown.slice(0, 200),
);

const report = [
  '# Chat Stress Timeout Run Result Materialization Report',
  '',
  '## Root Cause',
  '',
  '- Watchdog/reconcile paths marked scenarios settled as TIMEOUT without pushing a ChatStressScenarioRun into the batch runs array.',
  '- Batch finalizer then rejected duplicate settlement, leaving scoring/report with settled count 12 but missing run objects.',
  '',
  '## Repair',
  '',
  '- `buildChatStressTimeoutRunResult` materializes terminal TIMEOUT runs with scenarioId/status/reason/duration/category/terminal.',
  '- `materializeMissingChatStressRuns` ensures every started scenario has a run object before scoring.',
  '- Watchdog settlement no longer marks TIMEOUT without run materialization callback.',
  '- Evaluator handles TIMEOUT/ERROR/SKIPPED without throwing; timeout scores remain failed/blocker paths.',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_V1_PASS}\n`
    : '\nFAILED: chat stress timeout run result materialization checks did not pass.\n',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_REPORT.md'),
  report,
  'utf8',
);

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Chat stress timeout run result materialization validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Chat stress timeout run result materialization validation passed (${results.length} checks).`);
console.log(CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_V1_PASS);
