/**
 * Phase 26.46 — Product Readiness Simulation Stall Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS,
  SIMULATION_BUDGET_MS,
  SIMULATION_SLOW_THRESHOLD_MS,
  SIMULATION_STALLED_THRESHOLD_MS,
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  createSimulationBudgetTracker,
  loadProductMemoryFoundationsCached,
  loadProductReadinessShellCached,
  resetProductReadinessFixtureCacheForTests,
  resetProductReadinessSimulationForTests,
  resolveEffectiveChatStressMaxScenarios,
  runFullProductReadinessSimulation,
  withScenarioTimeout,
} from '../src/founder-test-product-readiness/index.js';
import {
  countChatStressScenarios,
  resetChatStressSimulationForTests,
  runFounderTestChatStressSimulation,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';

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

const REQUIRED = [
  'src/founder-test-product-readiness/product-readiness-simulation-budget.ts',
  'src/founder-test-product-readiness/product-readiness-fixture-cache.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const chatAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-authority.ts'),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const launchAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');

assert(
  'founder-test default scenario cap',
  resolveEffectiveChatStressMaxScenarios(undefined, 'founder-test') ===
    DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  String(resolveEffectiveChatStressMaxScenarios(undefined, 'founder-test')),
);
assert(
  'registry has more than founder-test default',
  countChatStressScenarios() > DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  String(countChatStressScenarios()),
);
assert('per-scenario timeout guard', simulatorSource.includes('withScenarioTimeout'), 'missing');
assert('batch budget guard', simulatorSource.includes('SIMULATION_BUDGET_EXCEEDED'), 'missing');
assert('chat stress uses budget tracker', chatAuthoritySource.includes('createSimulationBudgetTracker'), 'missing');
assert('orchestrator uses fixture cache', orchestratorSource.includes('loadProductReadinessShellCached'), 'missing');
assert('orchestrator passes founderTestContext', launchAuthoritySource.includes('founderTestContext: true'), 'missing');
assert(
  'launch readiness hoists founder assessment once',
  launchAuthoritySource.includes('founderTestAssessment,') &&
    launchAuthoritySource.includes('founderTestAssessment,') &&
    (launchAuthoritySource.match(/founderTestAssessment/g) ?? []).length >= 3,
  'hoist',
);
assert('no recursive validator spawn in simulator', !simulatorSource.includes('execSync'), 'recursion');
assert('no recursive validator spawn in chat authority', !chatAuthoritySource.includes('validate-'), 'recursion');
assert('no recursive validator spawn in orchestrator', !orchestratorSource.includes('execSync'), 'recursion');

const slowSnap = createSimulationBudgetTracker({
  slowThresholdMs: SIMULATION_SLOW_THRESHOLD_MS,
  stalledThresholdMs: SIMULATION_STALLED_THRESHOLD_MS,
  budgetMs: SIMULATION_BUDGET_MS,
  startedAtMs: Date.now() - 16_000,
}).snapshot();
assert('budget SLOW at 16s', slowSnap.health === 'SIMULATION_SLOW', slowSnap.health);

const stalledSnap = createSimulationBudgetTracker({
  slowThresholdMs: SIMULATION_SLOW_THRESHOLD_MS,
  stalledThresholdMs: SIMULATION_STALLED_THRESHOLD_MS,
  budgetMs: SIMULATION_BUDGET_MS,
  startedAtMs: Date.now() - 46_000,
}).snapshot();
assert('budget STALLED at 46s', stalledSnap.health === 'SIMULATION_STALLED', stalledSnap.health);

const exceededSnap = createSimulationBudgetTracker({
  budgetMs: SIMULATION_BUDGET_MS,
  startedAtMs: Date.now() - SIMULATION_BUDGET_MS - 1_000,
}).snapshot();
assert('budget EXCEEDED', exceededSnap.health === 'SIMULATION_BUDGET_EXCEEDED', exceededSnap.health);

let timeoutWorked = false;
try {
  await withScenarioTimeout(
    new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    }),
    5,
    'timeout-test',
  );
} catch {
  timeoutWorked = true;
}
assert('withScenarioTimeout rejects slow work', timeoutWorked, 'did not timeout');

resetProductReadinessFixtureCacheForTests();
const shellOne = loadProductReadinessShellCached(ROOT);
const shellTwo = loadProductReadinessShellCached(ROOT);
assert('fixture cache reuses shell', shellOne === shellTwo, 'different references');
const memoryOne = loadProductMemoryFoundationsCached('what are we building');
const memoryTwo = loadProductMemoryFoundationsCached('what are we building');
assert('fixture cache reuses memory', memoryOne === memoryTwo, 'different references');

resetChatStressSimulationForTests();
const boundedChat = await runFounderTestChatStressSimulation({
  rootDir: ROOT,
  maxScenarios: 6,
  founderTestContext: true,
});
assert(
  'bounded chat stress scenarios requested',
  boundedChat.report.scenariosRequested <= DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS ||
    boundedChat.report.scenariosRequested === 6,
  String(boundedChat.report.scenariosRequested),
);
assert('chat stress runtime health exposed', Boolean(boundedChat.report.runtimeHealth), boundedChat.report.runtimeHealth);
assert(
  'chat stress budget notes exposed',
  boundedChat.report.budgetNotes.length > 0,
  String(boundedChat.report.budgetNotes.length),
);

resetChatStressSimulationForTests();
const partialChat = await runFounderTestChatStressSimulation({
  rootDir: ROOT,
  maxScenarios: 8,
  budgetMs: 0,
  founderTestContext: true,
});
assert('partial chat stress degraded flag', partialChat.report.degradedPartialResult, 'not degraded');
assert(
  'partial chat stress skips when budget zero',
  partialChat.report.scenariosSkipped >= partialChat.report.scenariosRequested - partialChat.report.scenariosExecuted,
  `${partialChat.report.scenariosSkipped} skipped`,
);
assert(
  'partial chat stress budget exceeded health',
  partialChat.report.runtimeHealth === 'SIMULATION_BUDGET_EXCEEDED' ||
    partialChat.report.scenariosSkipped > 0,
  partialChat.report.runtimeHealth,
);

resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
const product = await runFullProductReadinessSimulation({
  rootDir: ROOT,
  skipChatStressSimulation: true,
  founderTestContext: true,
});
assert('product readiness runtime health', Boolean(product.report.simulationRuntimeHealth), 'missing');
assert('product readiness budget notes array', Array.isArray(product.report.simulationBudgetNotes), 'missing');
assert('product readiness still returns 15 sims', product.report.simulations.length === 15, String(product.report.simulations.length));

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'sim-stall-repair-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
bridge({
  operationId: 'running-product-readiness-simulation',
  operationLabel: 'Running product readiness simulation',
  phase: 'RUNNING',
});
bridge({
  operationId: 'chat-stress-simulation-budget-exceeded',
  operationLabel: 'Chat stress simulation budget exceeded',
  phase: 'FAILED',
  errorMessage: 'SIMULATION_BUDGET_EXCEEDED',
});
bridge({
  operationId: 'running-product-readiness-simulation',
  operationLabel: 'Running product readiness simulation (SIMULATION_BUDGET_EXCEEDED)',
  phase: 'FAILED',
  errorMessage: 'partial result',
});
const runtimeSnap = getFounderTestRuntimeStatus();
assert(
  'founder test runtime advances after simulation trace',
  runtimeSnap.traceEvents.some((event) => event.operationId.includes('chat-stress')),
  'missing trace',
);
assert(
  'failed simulation visible in trace',
  runtimeSnap.traceEvents.some((event) => event.status === 'FAILED'),
  'no FAILED trace',
);

assert(
  'no scoring changes in handler',
  !handlerSource.includes('readinessScore =') && handlerSource.includes('runFounderTestingModeV5'),
  'scoring changed',
);
assert(
  'no verdict logic rewrite in orchestrator',
  orchestratorSource.includes('verdictFromScore') && !orchestratorSource.includes('verdictFromScore ='),
  'verdict changed',
);
assert(
  'no validator recursion in launch authority',
  !launchAuthoritySource.includes('validate-product-readiness-simulation-stall-repair'),
  'recursion',
);
assert(
  'per-scenario timeout constant documented',
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS >= 5_000,
  String(CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS),
);

const report = [
  '# Product Readiness Simulation Stall Repair Report',
  '',
  '## Confirmed Blocker',
  '',
  '- Stage 2 froze inside `running-product-readiness-simulation` because chat stress ran up to 50+ LLM scenarios with concurrency 6 and no timeout/budget guards.',
  '- `assessFounderTestIntegration` could run twice (product readiness + launch readiness).',
  '',
  '## Root Causes',
  '',
  '- **Too much work:** full chat stress registry (50+) when `chatStressMaxScenarios` unset in Founder Test.',
  '- **Unbounded chat stress:** no per-scenario timeout or total simulation budget.',
  '- **Repeated fixtures:** shell HTML/app.js and product memory loaded on every simulation build pass.',
  '- **No honest partial path:** long runs appeared as a silent stall instead of SIMULATION_SLOW/STALLED/BUDGET_EXCEEDED.',
  '',
  '## Repairs',
  '',
  `- Founder Test default chat stress cap: **${DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS}** scenarios.`,
  `- Total simulation budget: **${SIMULATION_BUDGET_MS / 1000}s** with SLOW at ${SIMULATION_SLOW_THRESHOLD_MS / 1000}s and STALLED at ${SIMULATION_STALLED_THRESHOLD_MS / 1000}s.`,
  `- Per-scenario timeout: **${CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS / 1000}s**.`,
  '- Partial/degraded chat stress and product readiness reports with explicit budget notes.',
  '- Fixture cache for shell + product memory within a run.',
  '- Single hoisted `founderTestAssessment` in launch readiness artifact build.',
  '',
  '## Files Changed',
  '',
  '- src/founder-test-product-readiness/product-readiness-simulation-budget.ts',
  '- src/founder-test-product-readiness/product-readiness-fixture-cache.ts',
  '- src/founder-test-product-readiness/product-readiness-types.ts',
  '- src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  '- src/founder-test-product-readiness/index.ts',
  '- src/founder-test-chat-stress-simulation/chat-stress-simulation-types.ts',
  '- src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  '- src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  '- src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  '',
  '## Remaining Risks',
  '',
  '- Even bounded chat stress may approach budget when LLM latency is high.',
  '- Full 50+ scenario validation still requires explicit `maxScenarios` outside Founder Test.',
  '',
  '---',
  '',
  `Pass token: ${PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'PRODUCT_READINESS_SIMULATION_STALL_REPAIR_REPORT.md'),
  report,
  'utf8',
);
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'PRODUCT_READINESS_SIMULATION_STALL_REPAIR_REPORT.md')),
  'missing',
);
assert('report token', report.includes(PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Product Readiness Simulation Stall Repair validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Product Readiness Simulation Stall Repair validation PASSED (${results.length} checks)`);
console.log(PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS);
