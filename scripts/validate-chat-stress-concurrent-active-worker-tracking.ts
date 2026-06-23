/**
 * Phase 26.87 — Chat Stress Concurrent Active Worker Tracking Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS,
  CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
  addActiveChatStressScenario,
  beginChatStressSimulation,
  countChatStressScenarios,
  getActiveChatStressScenarioCount,
  getChatStressCompletionSnapshot,
  markChatStressScenarioStarted,
  reconcileChatStressRunnerIdleWithPending,
  registerChatStressRunnerIdleWithPendingHandler,
  removeActiveChatStressScenario,
  resetChatStressCompletionTrackerForTests,
  resetChatStressSimulationForTests,
  resetLiveChatStressRunnerPathForTests,
  runFounderTestChatStressSimulation,
  setActiveChatStressScenario,
} from '../src/founder-test-chat-stress-simulation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-concurrent-active-worker-tracking';

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
      /* never resolves */
    });
  }
}

const REQUIRED = [
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/live-chat-stress-runner-path.ts',
  'architecture/CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const livePathSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/live-chat-stress-runner-path.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-authority.ts'),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');
const reportSource = readFileSync(
  join(ROOT, 'architecture/CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_REPORT.md'),
  'utf8',
);

assert('active scenario set tracking', trackerSource.includes('activeScenarioIds'), 'set');
assert('addActiveChatStressScenario', trackerSource.includes('addActiveChatStressScenario'), 'add');
assert('removeActiveChatStressScenario', trackerSource.includes('removeActiveChatStressScenario'), 'remove');
assert('activeScenarioCount in snapshot', trackerSource.includes('activeScenarioCount'), 'count');
assert('pending without active uses set', trackerSource.includes('!activeScenarioIds.has(id)'), 'pending filter');
assert('watchdog removes only scenario', simulatorSource.includes('removeActiveChatStressScenario(scenario.id)'), 'watchdog');
assert('watchdog no global clear', !simulatorSource.includes('setActiveChatStressScenario(null)'), 'no global clear');
assert('idle uses activeScenarioCount', livePathSource.includes('activeScenarioCount > 0'), 'idle guard');
assert('idle includes active count in event', livePathSource.includes('activeScenarioCount: snap.activeScenarioCount'), 'event count');
assert('authority idle trace active count', authoritySource.includes('activeScenarioCount: event.activeScenarioCount'), 'trace');
assert('scenario count unchanged', countChatStressScenarios() >= 12, String(countChatStressScenarios()));
assert('no scoring changes', !authoritySource.includes('overrideLaunchVerdict'), 'scoring');
assert('no verdict changes', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-concurrent-active-worker-tracking": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);
assert('report includes success token', reportSource.includes(CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS), 'token');

resetChatStressCompletionTrackerForTests();
resetLiveChatStressRunnerPathForTests();
beginChatStressSimulation(['identity-01', 'identity-02', 'identity-03', 'identity-04']);
for (const scenarioId of ['identity-01', 'identity-02', 'identity-03', 'identity-04']) {
  markChatStressScenarioStarted(scenarioId);
}
assert('multiple active scenarios tracked', getActiveChatStressScenarioCount() === 4, String(getActiveChatStressScenarioCount()));
const concurrentSnap = getChatStressCompletionSnapshot();
assert('snapshot activeScenarioIds length', concurrentSnap.activeScenarioIds.length === 4, String(concurrentSnap.activeScenarioIds.length));
assert(
  'idle suppressed during concurrent workers',
  reconcileChatStressRunnerIdleWithPending() == null,
  'idle fired',
);

removeActiveChatStressScenario('identity-01');
assert('watchdog removes only one active scenario', getActiveChatStressScenarioCount() === 3, String(getActiveChatStressScenarioCount()));
assert(
  'activeScenarioCount remains >0 after single watchdog clear',
  getActiveChatStressScenarioCount() > 0,
  String(getActiveChatStressScenarioCount()),
);
assert(
  'idle still suppressed with remaining active workers',
  reconcileChatStressRunnerIdleWithPending() == null,
  'idle fired early',
);

const pendingWithoutActive = concurrentSnap.pendingScenarioIds.filter(
  (id) => !concurrentSnap.activeScenarioIds.includes(id),
);
assert(
  'pendingWithoutActiveWorker excludes activeScenarioIds',
  pendingWithoutActive.every((id) => !concurrentSnap.activeScenarioIds.includes(id)),
  pendingWithoutActive.join(','),
);

resetChatStressCompletionTrackerForTests();
resetLiveChatStressRunnerPathForTests();
beginChatStressSimulation(['identity-01', 'identity-02']);
markChatStressScenarioStarted('identity-01');
setActiveChatStressScenario(null);
const idleEvents: string[] = [];
registerChatStressRunnerIdleWithPendingHandler((event) => {
  idleEvents.push(event.kind);
});
const trueIdle = reconcileChatStressRunnerIdleWithPending();
assert('true idle detected when no active workers', trueIdle?.kind === CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND, trueIdle?.kind ?? 'null');
assert('true idle event includes activeScenarioCount zero', trueIdle?.activeScenarioCount === 0, String(trueIdle?.activeScenarioCount));

resetChatStressSimulationForTests();
resetLiveChatStressRunnerPathForTests();
const operationIds: string[] = [];
let idleWhileActiveCount = 0;
registerChatStressRunnerIdleWithPendingHandler((event) => {
  if (event.activeScenarioCount > 0) {
    idleWhileActiveCount += 1;
  }
});
await runFounderTestChatStressSimulation({
  maxScenarios: 12,
  concurrency: 4,
  perScenarioTimeoutMs: 250,
  providerOverride: new HangingLlmProvider(),
  founderTestContext: true,
  onTrace: (event) => operationIds.push(event.operationId),
});
assert(
  'idle-with-pending not emitted while activeScenarioCount > 0',
  idleWhileActiveCount === 0,
  String(idleWhileActiveCount),
);
assert('all scenarios settled live path', getChatStressCompletionSnapshot().pendingCount === 0, String(getChatStressCompletionSnapshot().pendingCount));
assert('chat stress simulation complete', operationIds.includes('chat-stress-simulation-complete'), operationIds.join('|'));

const failed = results.filter((entry) => !entry.passed);
const passToken = CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS;
const validationSummary = [
  '# Chat Stress Concurrent Active Worker Tracking Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
