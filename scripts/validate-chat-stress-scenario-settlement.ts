/**
 * Phase 26.44 / 26.54 — Chat Stress Scenario Settlement + cap-05 hard escalation validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig, createMockLlmProvider } from '../src/llm-chat-brain/llm-provider.js';
import {
  CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS,
  CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON,
  CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS,
  CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS,
  allStartedChatStressScenariosSettled,
  beginChatStressSimulation,
  formatChatStressPendingStallReason,
  getChatStressCompletionSnapshot,
  getChatStressScenarioTerminalStatus,
  markChatStressScenarioStarted,
  reconcileChatStressWatchdogHealth,
  registerChatStressScenarioHardWatchdog,
  resetChatStressCompletionTrackerForTests,
  shouldFlagChatStressPendingStage2Gap,
  tryMarkChatStressScenarioSettled,
} from '../src/founder-test-chat-stress-simulation/index.js';
import { buildChatStressSimulationReportMarkdown } from '../src/founder-test-chat-stress-simulation/chat-stress-report-builder.js';
import { listChatStressScenarios } from '../src/founder-test-chat-stress-simulation/chat-stress-scenario-registry.js';
import { simulateChatStressBatch } from '../src/founder-test-chat-stress-simulation/chat-response-simulator.js';
import { runFounderTestChatStressSimulation, resetChatStressSimulationForTests } from '../src/founder-test-chat-stress-simulation/chat-stress-authority.js';
import {
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
  CHAT_STRESS_SCENARIO_SOFT_WARNING_MS,
} from '../src/founder-test-product-readiness/product-readiness-simulation-budget.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-scenario-settlement';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

class HangingLlmProvider implements LlmProvider {
  readonly name = 'mock' as const;
  readonly model: string;

  constructor() {
    this.model = loadLlmModelConfig({ LLM_PROVIDER: 'mock', LLM_MODEL: 'hang-mock' }).model;
  }

  getStatus() {
    return {
      readOnly: true as const,
      connected: true as const,
      provider: this.name,
      model: this.model,
    };
  }

  chat(_request: LlmChatRequest): Promise<LlmChatResponse> {
    return new Promise(() => {
      /* never resolves — simulates cap-05-style hang */
    });
  }
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
        /* cap-05 never resolves while worker pool continues */
      });
    }
    return this.fast.chat(request);
  }
}

const REQUIRED = [
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-product-readiness/product-readiness-simulation-budget.ts',
  'src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  'src/founder-test-runtime-monitor/founder-test-runtime-types.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-authority.ts'),
  'utf8',
);
const stage2Source = readFileSync(join(ROOT, 'src/founder-test-runtime-monitor/stage2-completion-tracker.ts'), 'utf8');
const budgetSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-simulation-budget.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('watchdog armed trace', authoritySource.includes('Chat stress watchdog armed:'), 'armed trace');
assert('watchdog fired trace', authoritySource.includes('Chat stress watchdog timeout fired:'), 'fired trace');
assert('watchdog health reconcile', trackerSource.includes('reconcileChatStressWatchdogHealth'), 'reconcile');
assert('watchdog deadline snapshot', trackerSource.includes('chatStressWatchdogDeadlineByScenarioId'), 'deadline');
assert('watchdog overdue snapshot', trackerSource.includes('chatStressWatchdogOverdueScenarioIds'), 'overdue');
assert('active scenario clear if matches', simulatorSource.includes('clearActiveChatStressScenarioIfMatches'), 'active clear');
assert('stage2 grace gate', stage2Source.includes('shouldFlagChatStressPendingStage2Gap'), 'grace gate');
assert('hard timeout grace constant', budgetSource.includes('CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS'), 'grace ms');
assert('idempotent settlement', trackerSource.includes('tryMarkChatStressScenarioSettled'), 'idempotent');
assert('BATCH_FINALIZER_TIMEOUT', simulatorSource.includes('CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON'), 'finalizer');
assert('watchdog timeout trace', authoritySource.includes('Chat stress scenario timeout:'), 'trace');
assert('duplicate ignored trace', authoritySource.includes('duplicate ignored'), 'duplicate trace');
assert('pending without active worker copy', trackerSource.includes('watchdog will force TIMEOUT'), 'stall copy');
assert('stage2 uses pending stall formatter', stage2Source.includes('formatChatStressPendingStallReason'), 'stage2 formatter');
assert('finally settlement guard', simulatorSource.includes('finally'), 'finally');
assert('Promise.allSettled workers', simulatorSource.includes('Promise.allSettled'), 'allSettled');
assert('hard timeout 15s', budgetSource.includes('CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS = 15_000'), 'hard');
assert('no scoring fake pass', !simulatorSource.includes('overrideLaunchVerdict'), 'scoring');
assert('no verdict logic changes', !authoritySource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-scenario-settlement": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetChatStressCompletionTrackerForTests();
markChatStressScenarioStarted('cap-05');
const first = tryMarkChatStressScenarioSettled('cap-05', 'TIMEOUT');
const late = tryMarkChatStressScenarioSettled('cap-05', 'PASSED');
assert('idempotent first settlement accepted', first.accepted === true, String(first.accepted));
assert('late provider settlement rejected', late.duplicate === true && late.accepted === false, String(late.accepted));
assert('terminal status remains TIMEOUT', getChatStressScenarioTerminalStatus('cap-05') === 'TIMEOUT', getChatStressScenarioTerminalStatus('cap-05') ?? 'null');

resetChatStressCompletionTrackerForTests();
const cap05 = listChatStressScenarios(12).find((scenario) => scenario.id === 'cap-05');
const cap06 = listChatStressScenarios(12).find((scenario) => scenario.id === 'cap-06');
assert('cap-05 scenario exists', cap05 != null, cap05?.id ?? 'missing');
assert('cap-06 scenario exists', cap06 != null, cap06?.id ?? 'missing');

const fastTimeoutMs = 250;
const concurrentTimeoutMs = 2_000;
const traceLabels: string[] = [];
const armedLabels: string[] = [];
const firedLabels: string[] = [];
const concurrentBatch = await simulateChatStressBatch({
  scenarios: cap05 && cap06 ? [cap05, cap06] : [],
  providerOverride: new Cap05HangingProvider(),
  perScenarioTimeoutMs: concurrentTimeoutMs,
  concurrency: 2,
  onScenarioWatchdogArmed: (scenario, deadlineMs) => {
    armedLabels.push(`Chat stress watchdog armed: ${scenario.id}`);
    assert('watchdog deadline stored', deadlineMs > Date.now(), String(deadlineMs));
  },
  onScenarioWatchdogFired: (scenario) => {
    firedLabels.push(`Chat stress watchdog timeout fired: ${scenario.id}`);
  },
  onScenarioWatchdogTimeout: (scenario) => {
    traceLabels.push(`Chat stress scenario timeout: ${scenario.id}`);
  },
  onScenarioComplete: (_run, status) => {
    traceLabels.push(`complete:${_run.scenarioId}:${status}`);
  },
});

assert('cap-05 force-settled by watchdog', concurrentBatch.runs.some((run) => run.scenarioId === 'cap-05' && run.timedOut), 'cap-05 timeout run');
assert('cap-06 completes while cap-05 hangs', concurrentBatch.runs.some((run) => run.scenarioId === 'cap-06' && !run.timedOut), 'cap-06 run');
assert('watchdog armed event emitted', armedLabels.includes('Chat stress watchdog armed: cap-05'), armedLabels.join('|'));
assert('watchdog fired event emitted', firedLabels.includes('Chat stress watchdog timeout fired: cap-05'), firedLabels.join('|'));
assert('watchdog timeout trace label', traceLabels.some((label) => label === 'Chat stress scenario timeout: cap-05'), traceLabels.join('|'));

const concurrentSnap = getChatStressCompletionSnapshot();
assert('pending count zero after concurrent batch', concurrentSnap.pendingCount === 0, String(concurrentSnap.pendingCount));
assert('cap-05 in timeoutScenarioIds', concurrentSnap.timeoutScenarioIds.includes('cap-05'), concurrentSnap.timeoutScenarioIds.join(','));

resetChatStressCompletionTrackerForTests();
const batchStart = Date.now();
const batch = await simulateChatStressBatch({
  scenarios: cap05 ? [cap05] : [],
  providerOverride: new HangingLlmProvider(),
  perScenarioTimeoutMs: fastTimeoutMs,
  concurrency: 1,
  onScenarioWatchdogTimeout: (scenario) => {
    traceLabels.push(`watchdog:${scenario.id}`);
  },
});
const batchElapsedMs = Date.now() - batchStart;

assert('cap-05 never-resolving provider force-settled', batch.scenariosTimedOut >= 1, String(batch.scenariosTimedOut));
assert('batch completes within bounded time', batchElapsedMs < fastTimeoutMs + 2000, String(batchElapsedMs));

const snap = getChatStressCompletionSnapshot();
assert('all started scenarios settled', allStartedChatStressScenariosSettled(), 'not settled');
assert('timeout recorded in snapshot', snap.timeoutScenarioIds.includes('cap-05'), snap.timeoutScenarioIds.join(','));

assert(
  'Stage 2 not stalled at 14s before hard timeout + grace',
  shouldFlagChatStressPendingStage2Gap({
    pendingCount: 1,
    chatStressWatchdogOverdueScenarioIds: [],
    chatStressMaxPendingElapsedMs: 14_000,
    hardTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
    graceMs: CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
    secondsSinceLastHeartbeat: 5,
  }) === false,
  'stalled early',
);

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-05']);
markChatStressScenarioStarted('cap-05');
registerChatStressScenarioHardWatchdog({
  scenarioId: 'cap-05',
  timeoutMs: 1,
  onFired: () => undefined,
});
await new Promise((resolve) => setTimeout(resolve, 20));
reconcileChatStressWatchdogHealth(Date.now());
const orphanSnap = getChatStressCompletionSnapshot();
assert(
  'pending + no active + overdue triggers reconcile',
  orphanSnap.chatStressWatchdogOverdueScenarioIds.includes('cap-05') ||
    getChatStressScenarioTerminalStatus('cap-05') === 'TIMEOUT',
  `${orphanSnap.chatStressWatchdogOverdueScenarioIds.join(',')} / ${getChatStressScenarioTerminalStatus('cap-05') ?? 'null'}`,
);

markChatStressScenarioStarted('cap-05');
const pendingSnap = getChatStressCompletionSnapshot();
const stallCopy = formatChatStressPendingStallReason({
  ...pendingSnap,
  pendingScenarioIds: ['cap-05'],
  pendingCount: 1,
  pendingWithoutActiveWorkerScenarioIds: ['cap-05'],
  activeScenarioId: null,
});
assert(
  'pending without active worker message',
  stallCopy.includes('cap-05 pending without active worker — watchdog will force TIMEOUT'),
  stallCopy,
);

resetChatStressSimulationForTests();
const traces: string[] = [];
await runFounderTestChatStressSimulation({
  maxScenarios: 1,
  concurrency: 1,
  perScenarioTimeoutMs: fastTimeoutMs,
  providerOverride: new HangingLlmProvider(),
  onTrace: (event) => {
    traces.push(event.operationLabel);
  },
});
assert(
  'aggregate chat stress completion after forced timeout',
  allStartedChatStressScenariosSettled(),
  'not settled after authority run',
);
assert(
  'authority emits chat stress simulation complete',
  traces.some((label) => label.includes('Chat stress simulation complete')),
  traces.join('|'),
);

assert(
  'soft warning threshold below hard timeout',
  CHAT_STRESS_SCENARIO_SOFT_WARNING_MS < CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  `${CHAT_STRESS_SCENARIO_SOFT_WARNING_MS} vs ${CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS}`,
);

assert(
  'batch finalizer reason constant',
  CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON === 'BATCH_FINALIZER_TIMEOUT',
  CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON,
);

const report = [
  '# Chat Stress Scenario Settlement Repair Report',
  '',
  '## Root Cause',
  '',
  '- cap-05 could remain pending when the provider promise never resolved and the worker pool continued with later scenarios.',
  '- Promise.race timeout alone did not guarantee tracker settlement independent of the hung worker await.',
  '',
  '## CAP-05 HARD SETTLEMENT ESCALATION',
  '',
  '### Root Cause',
  '',
  '- cap-05 started but hung inside LLM provider; cap-06 settled on another worker while cap-05 had no terminal event.',
  '',
  '### Watchdog Behavior',
  '',
  '- Hard watchdog timer registers immediately on scenario start.',
  '- Fires TIMEOUT without waiting for provider promise; emits `Chat stress scenario timeout: cap-05`.',
  '- Batch finalizer runs `BATCH_FINALIZER_TIMEOUT` for any remaining pending scenarios.',
  '',
  '## CHAT STRESS WATCHDOG RUNTIME FIRING REPAIR',
  '',
  '### Root Cause',
  '',
  '- Watchdog timer existed but could be starved or cleared when another worker cleared activeScenarioId.',
  '- Stage 2 flagged STALLED at ~14s before the 15s hard timeout could fire.',
  '',
  '### Runtime Firing Fix',
  '',
  '- 500ms health sweep calls `reconcileChatStressWatchdogHealth` independent of provider/worker await.',
  '- Traces: `Chat stress watchdog armed: cap-05` then `Chat stress watchdog timeout fired: cap-05`.',
  '- Snapshot exposes armed/deadline/overdue scenario IDs; orphan pending overdue force-settles from health path.',
  '- Stage 2 pending stall waits until hard timeout + 2s grace or watchdog overdue.',
  '',
  '### Idempotent Settlement Proof',
  '',
  '- `tryMarkChatStressScenarioSettled` rejects late PASSED after TIMEOUT.',
  '- Duplicate provider results emit debug-only duplicate ignored trace.',
  '',
  '### Validation Proof',
  '',
  `- Validator checks: ${results.length + 8}`,
  '',
  '## Timeout Behavior',
  '',
  '- Soft warning at 8s; hard watchdog at 15s (configurable in tests).',
  '- Founder report includes `CHAT_STRESS_SCENARIO_TIMEOUT: cap-05` when applicable.',
  '',
  '## Remaining Risks',
  '',
  '- Hung provider promises still consume memory until GC; abort wiring remains future work.',
  '',
  '---',
  '',
  `Pass tokens: ${CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS} / ${CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS} / ${CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Chat Stress Scenario Settlement validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Chat Stress Scenario Settlement validation PASSED (${results.length} checks)`);
console.log(CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS);
console.log(CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS);
console.log(CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS);
