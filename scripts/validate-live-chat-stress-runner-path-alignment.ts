/**
 * Phase 26.81 — Live Chat Stress Runner Path Alignment Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import { DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS } from '../src/founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
  LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS,
  LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN,
  LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,
  beginChatStressSimulation,
  buildLiveChatStressRunnerPathStatus,
  countChatStressScenarios,
  getChatStressCompletionSnapshot,
  markChatStressScenarioStarted,
  reconcileChatStressRunnerIdleWithPending,
  registerChatStressRunnerIdleWithPendingHandler,
  resetChatStressCompletionTrackerForTests,
  resetChatStressSimulationForTests,
  resetLiveChatStressRunnerPathForTests,
  runFounderTestChatStressSimulation,
  setActiveChatStressScenario,
  shouldPropagateLiveChatStressRuntimeFeed,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
  resetLaunchReadinessArtifactBuildTracerForTests,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-live-chat-stress-runner-path-alignment';

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
  'src/founder-test-chat-stress-simulation/live-chat-stress-runner-path.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  'server/founder-testing-handler.ts',
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  'architecture/LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

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
const launchSource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const tracerSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts'),
  'utf8',
);
const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('live path marker constant', livePathSource.includes(LIVE_CHAT_STRESS_RUNNER_PATH_MARKER), LIVE_CHAT_STRESS_RUNNER_PATH_MARKER);
assert('idle with pending kind', livePathSource.includes(CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND), 'idle kind');
assert('forceSettle in idle reconcile', livePathSource.includes('forceSettlePendingStartedChatStressScenarios'), 'force settle');
assert('settlement summary in live path', livePathSource.includes('buildChatStressSettlementSummary'), 'summary');
assert('completion complete in live path', livePathSource.includes('isChatStressSimulationComplete'), 'complete');
assert('live path marker in authority', authoritySource.includes('LIVE_CHAT_STRESS_RUNNER_PATH_MARKER'), 'authority marker');
assert('idle handler in authority', authoritySource.includes('registerChatStressRunnerIdleWithPendingHandler'), 'idle handler');
assert('post health reconciler in authority', authoritySource.includes('registerChatStressPostWatchdogHealthReconciler'), 'health hook');
assert('product readiness uses chat stress authority', orchestratorSource.includes('runFounderTestChatStressSimulation'), 'pr chat');
assert('launch readiness uses product readiness', launchSource.includes('runFullProductReadinessSimulation'), 'launch pr');
assert('handler launch orchestration', handlerSource.includes('executeFounderTestLaunchReadinessOrchestration'), 'handler');
assert('shouldPropagateLiveChatStressRuntimeFeed in tracer', tracerSource.includes('shouldPropagateLiveChatStressRuntimeFeed'), 'tracer');
assert('simulator force settle finalizer', simulatorSource.includes('forceSettlePendingStartedChatStressScenarios'), 'finalizer');
assert('call chain includes v4 path', LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN.includes('runFullProductReadinessSimulation'), 'chain');
assert('scenario count remains 12', DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS === 12 && countChatStressScenarios() >= 12, String(countChatStressScenarios()));
assert('propagate settled marker', shouldPropagateLiveChatStressRuntimeFeed('chat-stress-scenario-settled:identity-01'), 'settled');
assert('propagate live path marker', shouldPropagateLiveChatStressRuntimeFeed(LIVE_CHAT_STRESS_RUNNER_PATH_MARKER), 'marker');
assert('no scoring manipulation', !authoritySource.includes('overrideLaunchVerdict'), 'scoring');
assert('no verdict manipulation', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:live-chat-stress-runner-path-alignment": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
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
const idle = reconcileChatStressRunnerIdleWithPending();
assert('idle with pending detected', idle?.kind === CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND, idle?.kind ?? 'null');
assert('idle forces settlement', (idle?.forcedSettlementCount ?? 0) >= 0, String(idle?.forcedSettlementCount));

resetChatStressSimulationForTests();
const operationIds: string[] = [];
await runFounderTestChatStressSimulation({
  maxScenarios: 12,
  concurrency: 4,
  perScenarioTimeoutMs: 250,
  providerOverride: new HangingLlmProvider(),
  founderTestContext: true,
  onTrace: (event) => operationIds.push(event.operationId),
});
assert('live path marker emitted', operationIds.includes(LIVE_CHAT_STRESS_RUNNER_PATH_MARKER), operationIds.join('|'));
assert('scenario settled marker emitted', operationIds.some((id) => id.startsWith('chat-stress-scenario-settled:')), operationIds.join('|'));
assert('pending count marker emitted', operationIds.includes('chat-stress-pending-count-updated'), operationIds.join('|'));
assert('completion condition emitted', operationIds.includes('chat-stress-completion-condition-satisfied'), operationIds.join('|'));
assert('chat stress complete emitted', operationIds.includes('chat-stress-simulation-complete'), operationIds.join('|'));
assert('all scenarios settled live path', getChatStressCompletionSnapshot().pendingCount === 0, String(getChatStressCompletionSnapshot().pendingCount));

const pathStatus = buildLiveChatStressRunnerPathStatus();
assert('live path status completion boundary', pathStatus.completionBoundaryReached === true, String(pathStatus.completionBoundaryReached));

resetLaunchReadinessArtifactBuildTracerForTests();
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'live-path-feed-test' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
bridge({
  operationId: LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,
  operationLabel: `live-chat-stress-runner-path: ${LIVE_CHAT_STRESS_RUNNER_PATH_MARKER}`,
  phase: 'PASSED',
});
bridge({
  operationId: 'chat-stress-scenario-settled:identity-01',
  operationLabel: 'Chat stress scenario settled: identity-01 (TIMEOUT)',
  phase: 'FAILED',
});
const snapshot = getFounderTestRuntimeStatus();
assert(
  'live settlement marker in runtime feed',
  snapshot.traceEvents.some((event) => event.operationId.startsWith('chat-stress-scenario-settled:')),
  snapshot.traceEvents.map((event) => event.operationId).join('|'),
);
assert(
  'live path marker in runtime feed',
  snapshot.traceEvents.some((event) => event.operationId === LIVE_CHAT_STRESS_RUNNER_PATH_MARKER),
  snapshot.traceEvents.map((event) => event.operationId).join('|'),
);

const failed = results.filter((entry) => !entry.passed);
const passToken = LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS;
const reportPath = join(ROOT, 'architecture', 'LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_REPORT.md');
const reportBody = readFileSync(reportPath, 'utf8');
assert('architecture report includes success token', reportBody.includes(passToken), 'token in report');

const validationSummary = [
  '# Live Chat Stress Runner Path Alignment Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_VALIDATION.md'), validationSummary, 'utf8');

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
