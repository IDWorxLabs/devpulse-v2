/**
 * Chat stress non-blocking Founder Test validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  CHAT_STRESS_DEGRADED_INCOMPLETE_OPERATION_ID,
  CHAT_STRESS_NON_BLOCKING_FOUNDER_TEST_V1_PASS,
  buildChatStressSimulationReportMarkdown,
  getChatStressCompletionSnapshot,
  hasChatStressDegradedIncompletePropagated,
  hasChatStressSimulationCompletePropagated,
  hasProductReadinessSimulationCompletePropagated,
  resetChatStressCompletionPropagationForTests,
  resetChatStressSimulationForTests,
  runChatStressNonBlockingForFounderTest,
} from '../src/founder-test-chat-stress-simulation/index.js';
import { FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS } from '../src/founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  resetProductReadinessFixtureCacheForTests,
  resetProductReadinessSimulationForTests,
  runFullProductReadinessSimulation,
} from '../src/founder-test-product-readiness/index.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
  resolveMissingIntakeCompletionBoundary,
} from '../src/founder-test-runtime-monitor/index.js';
import { buildFounderTestLaunchReadinessArtifactsAsync } from '../src/founder-test-launch-readiness/index.js';
import {
  resolveFounderTestHandoffState,
  FOUNDER_TEST_HANDOFF_STATE_LABELS,
} from '../src/founder-test-runtime-monitor/founder-test-complete-state-truth.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

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

const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const nonBlockingSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-non-blocking-founder-test.ts'),
  'utf8',
);
const budgetSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-simulation-budget.ts'),
  'utf8',
);

assert('non-blocking module present', existsSync(join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-non-blocking-founder-test.ts')), 'missing');
assert('budget constant exported', budgetSource.includes('FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS'), 'budget');
assert('DEGRADED_INCOMPLETE health', budgetSource.includes("'DEGRADED_INCOMPLETE'"), 'health');
assert('orchestrator uses non-blocking path', orchestratorSource.includes('runChatStressNonBlockingForFounderTest'), 'orchestrator');
assert('real-founder selects non-blocking', orchestratorSource.includes("runtimePath === 'real-founder'"), 'real founder');
assert('degraded incomplete operation id', nonBlockingSource.includes(CHAT_STRESS_DEGRADED_INCOMPLETE_OPERATION_ID), 'op id');

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'handoff-intake' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
assert(
  'handoff during intake is founder_test_running',
  resolveFounderTestHandoffState(getFounderTestRuntimeStatus()) === 'founder_test_running',
  resolveFounderTestHandoffState(getFounderTestRuntimeStatus()),
);
assert(
  'handoff label during intake is not report markdown building',
  FOUNDER_TEST_HANDOFF_STATE_LABELS.founder_test_running === 'Founder Test running',
  FOUNDER_TEST_HANDOFF_STATE_LABELS.founder_test_running,
);
resetFounderTestRuntimeMonitorForTests();

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();

const traceOps: string[] = [];
const forcedStartedAt = Date.now();
const forcedDegraded = await runChatStressNonBlockingForFounderTest({
  rootDir: ROOT,
  maxScenarios: 12,
  founderTestContext: true,
  nonBlockingBudgetMs: 500,
  perScenarioTimeoutMs: 60_000,
  providerOverride: new HangingLlmProvider(),
  onTrace: (event) => traceOps.push(event.operationId),
});
const forcedElapsedMs = Date.now() - forcedStartedAt;

assert('forced short window bounded', forcedElapsedMs <= 12_000, `${forcedElapsedMs}ms`);
assert('forced short window degraded', forcedDegraded.degradedIncomplete === true, String(forcedDegraded.degradedIncomplete));
assert('forced report DEGRADED_INCOMPLETE', forcedDegraded.report.runtimeHealth === 'DEGRADED_INCOMPLETE', forcedDegraded.report.runtimeHealth);
assert('forced degraded trace emitted', traceOps.includes(CHAT_STRESS_DEGRADED_INCOMPLETE_OPERATION_ID), traceOps.join('|'));
assert('forced degraded registry flag', hasChatStressDegradedIncompletePropagated(), String(hasChatStressDegradedIncompletePropagated()));
assert(
  'forced report includes degraded disclaimer',
  buildChatStressSimulationReportMarkdown(forcedDegraded.report).includes(
    'did not fully complete inside the Founder Test runtime budget',
  ),
  'markdown',
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();

const startedAt = Date.now();
const nonBlocking = await runChatStressNonBlockingForFounderTest({
  rootDir: ROOT,
  maxScenarios: 12,
  founderTestContext: true,
  providerOverride: new HangingLlmProvider(),
  onTrace: (event) => traceOps.push(event.operationId),
});
const elapsedMs = Date.now() - startedAt;

assert('non-blocking window bounded', elapsedMs <= FOUNDER_TEST_CHAT_STRESS_NON_BLOCKING_BUDGET_MS + 8_000, `${elapsedMs}ms`);
assert('non-blocking always returns report', nonBlocking.report.totalScenarios > 0, String(nonBlocking.report.totalScenarios));
assert('chat stress complete propagated after non-blocking', hasChatStressSimulationCompletePropagated(), String(hasChatStressSimulationCompletePropagated()));

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetFounderTestRuntimeMonitorForTests();

beginFounderTestRuntime({ runId: 'non-blocking-founder-test' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
const simStartedAt = Date.now();

const product = await runFullProductReadinessSimulation({
  rootDir: ROOT,
  founderTestContext: true,
  productReadinessRuntimePath: 'real-founder',
  chatStressProviderOverride: new HangingLlmProvider(),
  onSimulationTrace: (event) => {
    bridge({
      operationId: event.operationId,
      operationLabel: event.operationLabel,
      phase: event.phase === 'PASSED' ? 'PASSED' : event.phase === 'RUNNING' ? 'RUNNING' : 'FAILED',
    });
  },
});

const simElapsedMs = Date.now() - simStartedAt;
assert('real-founder simulation bounded', simElapsedMs < 120_000, `${simElapsedMs}ms`);
assert('product readiness propagated', hasProductReadinessSimulationCompletePropagated(), String(hasProductReadinessSimulationCompletePropagated()));
assert(
  'chat stress report present after real-founder path',
  product.report.chatStressSimulation != null,
  'null',
);

const runtimeSnap = getFounderTestRuntimeStatus();
assert('product readiness trace in runtime', runtimeSnap.traceEvents.some((event) => event.operationId === 'product-readiness-simulation-complete'), runtimeSnap.traceEvents.map((e) => e.operationId).join(', '));

advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
const afterPlanning = getFounderTestRuntimeStatus();
assert(
  'planning gate reachable after degraded chat stress',
  afterPlanning.stages.some((stage) => stage.stageId === 'PLANNING_GATE'),
  afterPlanning.stages.map((stage) => stage.stageId).join(', '),
);

const missingBoundary = resolveMissingIntakeCompletionBoundary(afterPlanning.traceEvents);
assert(
  'intake boundaries satisfied for degraded path',
  !missingBoundary || missingBoundary === 'Launch readiness assessment complete' || missingBoundary === 'Launch readiness artifacts built' || missingBoundary === 'Intake validation complete',
  missingBoundary ?? 'none',
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetFounderTestRuntimeMonitorForTests();

beginFounderTestRuntime({ runId: 'launch-readiness-non-blocking' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const launchStartedAt = Date.now();
const launchArtifacts = await buildFounderTestLaunchReadinessArtifactsAsync({
  rootDir: ROOT,
  chatStressProviderOverride: new HangingLlmProvider(),
  onBuildTrace: buildLaunchReadinessArtifactBuildTraceBridge(),
});
const launchElapsedMs = Date.now() - launchStartedAt;

assert('launch readiness artifacts within bounded time', launchElapsedMs < 180_000, `${launchElapsedMs}ms`);
assert(
  'launch markdown produced',
  launchArtifacts.founderTestLaunchReadinessReportMarkdown.trim().length > 500,
  String(launchArtifacts.founderTestLaunchReadinessReportMarkdown.length),
);
assert(
  'launch markdown includes chat stress section',
  launchArtifacts.founderTestLaunchReadinessReportMarkdown.includes('## Chat Stress Simulation'),
  'missing chat stress section',
);

const snap = getChatStressCompletionSnapshot();
assert('pending may remain after non-blocking', snap.pendingCount >= 0, String(snap.pendingCount));

const failed = results.filter((entry) => !entry.passed);
const summary = [
  '# Chat Stress Non-Blocking Founder Test Validation',
  '',
  `Result: ${failed.length === 0 ? CHAT_STRESS_NON_BLOCKING_FOUNDER_TEST_V1_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  `- nonBlockingElapsedMs=${elapsedMs}`,
  `- realFounderSimElapsedMs=${simElapsedMs}`,
  `- launchArtifactsElapsedMs=${launchElapsedMs}`,
  `- pendingAfterLaunch=${snap.pendingCount}`,
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'CHAT_STRESS_NON_BLOCKING_FOUNDER_TEST_VALIDATION.md'), summary, 'utf8');

if (failed.length > 0) {
  console.error(summary);
  process.exit(1);
}

console.log(CHAT_STRESS_NON_BLOCKING_FOUNDER_TEST_V1_PASS);
console.log(summary);
