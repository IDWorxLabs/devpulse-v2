/**
 * Phase 26.88 — Chat Stress Hard Deadline and Stall Threshold Alignment V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  STALL_STALLED_THRESHOLD_MS,
} from '../src/founder-test-runtime-monitor/founder-test-runtime-registry.js';
import { analyzeRuntimeStall } from '../src/founder-test-runtime-monitor/runtime-stall-detector.js';
import {
  CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS,
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
  CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS,
  DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  resolveChatStressWorstCaseBatchDeadlineMs,
} from '../src/founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  beginChatStressBatchDeadline,
  beginChatStressSimulation,
  countChatStressScenarios,
  getChatStressCompletionSnapshot,
  isChatStressBatchFinalizerCompleted,
  markChatStressScenarioStarted,
  addActiveChatStressScenario,
  reconcileChatStressBatchDeadlineFinalizer,
  resetChatStressCompletionTrackerForTests,
  resetChatStressSimulationForTests,
  resolveChatStressStallHealth,
  runFounderTestChatStressSimulation,
  shouldFlagChatStressPendingStage2Gap,
} from '../src/founder-test-chat-stress-simulation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-deadline-stall-alignment';

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
  'src/founder-test-product-readiness/product-readiness-simulation-budget.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
  'src/founder-test-runtime-monitor/runtime-stall-detector.ts',
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  'architecture/CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const budgetSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-simulation-budget.ts'),
  'utf8',
);
const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const stallSource = readFileSync(join(ROOT, 'src/founder-test-runtime-monitor/runtime-stall-detector.ts'), 'utf8');
const tracerSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts'),
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
  join(ROOT, 'architecture/CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_REPORT.md'),
  'utf8',
);

const worstCase = resolveChatStressWorstCaseBatchDeadlineMs({
  scenarioCount: 12,
  concurrency: 4,
  perScenarioTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
});

assert('worst-case batch deadline computed', worstCase === CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS, String(worstCase));
assert(
  'stall threshold not earlier than worst-case batch deadline',
  STALL_STALLED_THRESHOLD_MS < worstCase || tracerSource.includes('resolveChatStressWorstCaseBatchDeadlineMs'),
  `${STALL_STALLED_THRESHOLD_MS}|${worstCase}`,
);
assert('batch deadline finalizer', trackerSource.includes('reconcileChatStressBatchDeadlineFinalizer'), 'finalizer');
assert('active scenario grace in shouldFlag', trackerSource.includes('activeScenarioCount'), 'grace');
assert('resolveChatStressStallHealth', trackerSource.includes('resolveChatStressStallHealth'), 'stall health');
assert('deadline snapshot fields', trackerSource.includes('msUntilBatchDeadline'), 'snapshot');
assert('runtime stall chat context', stallSource.includes('intakeChatStressContext'), 'context');
assert('artifact tracer chat deadline', tracerSource.includes('resolveChatStressWorstCaseBatchDeadlineMs'), 'tracer');
assert('authority aligned stalled threshold', authoritySource.includes('resolveChatStressSimulationStalledThresholdMs'), 'authority');
assert('scenario count unchanged', countChatStressScenarios() >= 12, String(countChatStressScenarios()));
assert('no scoring changes', !authoritySource.includes('overrideLaunchVerdict'), 'scoring');
assert('no verdict changes', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-deadline-stall-alignment": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);
assert('report includes success token', reportSource.includes(CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS), 'token');

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-05', 'cap-06']);
beginChatStressBatchDeadline({ scenarioCount: 12, concurrency: 4, perScenarioTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS });
markChatStressScenarioStarted('cap-05');
addActiveChatStressScenario('cap-05');
markChatStressScenarioStarted('cap-06');
addActiveChatStressScenario('cap-06');
const activeSnap = getChatStressCompletionSnapshot();
assert(
  'active pending produces SLOW not STALLED before deadline',
  resolveChatStressStallHealth(activeSnap) === 'SLOW',
  resolveChatStressStallHealth(activeSnap),
);
assert(
  'stage2 gap not flagged with active workers',
  shouldFlagChatStressPendingStage2Gap({
    pendingCount: activeSnap.pendingCount,
    activeScenarioCount: activeSnap.activeScenarioCount,
    chatStressWatchdogOverdueScenarioIds: [],
    chatStressMaxPendingElapsedMs: activeSnap.chatStressMaxPendingElapsedMs,
    hardTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
    graceMs: CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
    secondsSinceLastHeartbeat: 5,
    msUntilBatchDeadline: activeSnap.msUntilBatchDeadline,
  }) === false,
  'flagged early',
);

const intakeStage = {
  readOnly: true as const,
  stageId: 'INTAKE_VALIDATION',
  label: 'Intake Validation',
  order: 2,
  status: 'RUNNING' as const,
  startedAt: new Date(Date.now() - 46_000).toISOString(),
  endedAt: null,
  durationMs: null,
  lastHeartbeatAt: new Date().toISOString(),
};
const runtimeStall = analyzeRuntimeStall({
  stages: [intakeStage],
  now: Date.now(),
  intakeChatStressContext: {
    pendingCount: 2,
    activeScenarioCount: 2,
    msUntilBatchDeadline: 10_000,
    hasActiveOverdueWatchdog: false,
  },
});
assert(
  'runtime stall downgraded to SLOW with active chat workers inside batch deadline',
  runtimeStall.health === 'SLOW',
  runtimeStall.health,
);

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-05', 'cap-06']);
const batchStartedAtMs = Date.now() - worstCase - 1;
beginChatStressBatchDeadline({
  scenarioCount: 2,
  concurrency: 1,
  perScenarioTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  startedAtMs: batchStartedAtMs,
});
markChatStressScenarioStarted('cap-05');
markChatStressScenarioStarted('cap-06');
const forced = reconcileChatStressBatchDeadlineFinalizer(Date.now());
assert('batch deadline finalizer runs', forced === true, String(forced));
assert('batch finalizer clears pending', getChatStressCompletionSnapshot().pendingCount === 0, String(getChatStressCompletionSnapshot().pendingCount));
assert('batch finalizer marked complete', isChatStressBatchFinalizerCompleted(), 'not complete');

resetChatStressSimulationForTests();
await runFounderTestChatStressSimulation({
  maxScenarios: DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  concurrency: 4,
  perScenarioTimeoutMs: 250,
  providerOverride: new HangingLlmProvider(),
  founderTestContext: true,
});
const finalSnap = getChatStressCompletionSnapshot();
assert('live run completes all scenarios', finalSnap.pendingCount === 0, String(finalSnap.pendingCount));
assert('live run exposes batch deadline ms', finalSnap.batchDeadlineMs != null && finalSnap.batchDeadlineMs > 0, String(finalSnap.batchDeadlineMs));

const failed = results.filter((entry) => !entry.passed);
const passToken = CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS;
const validationSummary = [
  '# Chat Stress Deadline Stall Alignment Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
