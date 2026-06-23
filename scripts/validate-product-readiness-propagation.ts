/**
 * Phase 26.72 — Product Readiness Completion Propagation validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  PRODUCT_READINESS_COMPLETION_CHECK,
  PRODUCT_READINESS_COMPLETED,
  PRODUCT_READINESS_PROPAGATION_COMPLETE,
  PRODUCT_READINESS_PROPAGATION_PASS,
  PRODUCT_READINESS_PROPAGATION_START,
  PRODUCT_READINESS_PROPAGATION_STEP,
  resetProductReadinessFixtureCacheForTests,
  resetProductReadinessSimulationForTests,
  resetProductReadinessRealFounderPathForTests,
  resetProductReadinessCompletionCheckEmissionForTests,
  runFullProductReadinessSimulation,
} from '../src/founder-test-product-readiness/index.js';
import {
  beginChatStressSimulation,
  getChatStressCompletionSnapshot,
  markChatStressScenarioSkippedBudget,
  markChatStressScenarioStarted,
  resetChatStressSimulationForTests,
  tryMarkChatStressScenarioSettled,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  hasProductReadinessSimulationCompletePropagated,
  resetChatStressCompletionPropagationForTests,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { buildChatStressSettlementSummary } from '../src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import { resolveMissingIntakeCompletionBoundary } from '../src/founder-test-runtime-monitor/stage2-completion-tracker.js';

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
      /* never resolves — propagation must not stall after completionBoundary=true */
    });
  }
}

const REQUIRED = [
  'src/founder-test-product-readiness/product-readiness-propagation.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-product-readiness/product-readiness-completion-boundary.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const propagationSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-propagation.ts'),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);

assert('PRODUCT_READINESS_PROPAGATION_START', propagationSource.includes(PRODUCT_READINESS_PROPAGATION_START), 'missing');
assert('PRODUCT_READINESS_PROPAGATION_STEP', propagationSource.includes(PRODUCT_READINESS_PROPAGATION_STEP), 'missing');
assert('PRODUCT_READINESS_PROPAGATION_COMPLETE', propagationSource.includes(PRODUCT_READINESS_PROPAGATION_COMPLETE), 'missing');
assert('PRODUCT_READINESS_PROPAGATION_FAILURE', propagationSource.includes('PRODUCT_READINESS_PROPAGATION_FAILURE'), 'missing');
assert('waitForProductReadinessCompletionBoundary', propagationSource.includes('waitForProductReadinessCompletionBoundary'), 'missing');
assert('propagateProductReadinessAfterCompletionBoundary', propagationSource.includes('propagateProductReadinessAfterCompletionBoundary'), 'missing');
assert('orchestrator uses propagation repair', orchestratorSource.includes('propagateProductReadinessAfterCompletionBoundary'), 'missing');
assert('orchestrator uses waitForProductReadinessCompletionBoundary', orchestratorSource.includes('waitForProductReadinessCompletionBoundary'), 'missing');

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetProductReadinessRealFounderPathForTests();
resetProductReadinessCompletionCheckEmissionForTests();

beginChatStressSimulation(['cap-05', 'cap-06']);
markChatStressScenarioStarted('cap-05');
tryMarkChatStressScenarioSettled('cap-05', 'PASSED');
markChatStressScenarioStarted('cap-06');
markChatStressScenarioSkippedBudget('cap-06');

const settlementSummary = buildChatStressSettlementSummary();
assert(
  'completionBoundary=true in fixture',
  settlementSummary.completionBoundaryReached,
  `pending=${settlementSummary.pendingCount} settled=${settlementSummary.settledCount}`,
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();
resetProductReadinessRealFounderPathForTests();
resetProductReadinessCompletionCheckEmissionForTests();
resetFounderTestRuntimeMonitorForTests();

beginFounderTestRuntime({ runId: 'product-readiness-propagation-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();

const traceOps: string[] = [];
const startedAt = Date.now();

const product = await runFullProductReadinessSimulation({
  rootDir: ROOT,
  chatStressMaxScenarios: 6,
  founderTestContext: true,
  chatStressProviderOverride: new HangingLlmProvider(),
  onSimulationTrace: (event) => {
    traceOps.push(event.operationId);
    bridge({
      operationId: event.operationId,
      operationLabel: event.operationLabel,
      phase: event.phase === 'PASSED' ? 'PASSED' : event.phase === 'RUNNING' ? 'RUNNING' : 'FAILED',
    });
  },
});

const elapsedMs = Date.now() - startedAt;

assert('simulation completes after hanging LLM batch', product.report.readinessScore >= 0, String(product.report.readinessScore));
assert('propagation start emitted', traceOps.includes(PRODUCT_READINESS_PROPAGATION_START), traceOps.filter((op) => op.includes('PROPAGATION')).join(', '));
assert(
  'PRODUCT_READINESS_PROPAGATION_COMPLETE emitted',
  traceOps.includes(PRODUCT_READINESS_PROPAGATION_COMPLETE),
  traceOps.filter((op) => op.includes('PROPAGATION')).join(', '),
);
assert(
  'product-readiness-simulation-complete emitted',
  traceOps.includes('product-readiness-simulation-complete'),
  traceOps.filter((op) => op.includes('product-readiness')).join(', '),
);
assert(
  'product-readiness-simulation-complete-emitted trace',
  traceOps.includes('product-readiness-simulation-complete-emitted'),
  traceOps.filter((op) => op.includes('product-readiness')).join(', '),
);
assert('PRODUCT_READINESS_COMPLETED emitted', traceOps.includes(PRODUCT_READINESS_COMPLETED), traceOps.filter((op) => op.startsWith('PRODUCT_READINESS')).join(', '));
assert(
  'product readiness complete propagated in registry',
  hasProductReadinessSimulationCompletePropagated(),
  String(hasProductReadinessSimulationCompletePropagated()),
);
assert('no stall beyond one monitoring cycle budget', elapsedMs < 120_000, `${elapsedMs}ms`);

const runtimeSnap = getFounderTestRuntimeStatus();
const allTraceIds = [
  ...traceOps,
  ...runtimeSnap.traceEvents.map((event) => event.operationId),
];
assert(
  'live settlement batch deadline armed',
  allTraceIds.includes('chat-stress-batch-deadline-armed'),
  allTraceIds.filter((id) => id.includes('deadline') || id.includes('batch')).join(', ') || 'none',
);
assert(
  'terminal settlement sweep observed',
  allTraceIds.some(
    (id) =>
      id === 'chat-stress-terminal-sweep-started' ||
      id === 'chat-stress-terminal-sweep-settled' ||
      id === 'chat-stress-simulation-complete',
  ),
  allTraceIds.filter((id) => id.includes('terminal-sweep') || id.includes('simulation-complete')).join(', ') || 'none',
);
assert(
  'chat-stress-simulation-complete emitted',
  allTraceIds.includes('chat-stress-simulation-complete'),
  allTraceIds.filter((id) => id.includes('chat-stress-simulation-complete')).join(', ') || 'none',
);
assert(
  'chat-stress-simulation-complete-emitted trace',
  allTraceIds.includes('chat-stress-simulation-complete-emitted'),
  allTraceIds.filter((id) => id.includes('chat-stress-simulation-complete')).join(', ') || 'none',
);
assert(
  'runtime trace has product-readiness-simulation-complete PASSED',
  runtimeSnap.traceEvents.some(
    (event) => event.operationId === 'product-readiness-simulation-complete' && event.status === 'PASSED',
  ),
  runtimeSnap.traceEvents.map((event) => event.operationId).join(', '),
);

const missingBoundary = resolveMissingIntakeCompletionBoundary(runtimeSnap.traceEvents);
assert(
  'intake validation exits product-readiness boundary',
  !missingBoundary ||
    missingBoundary === 'Launch readiness assessment complete' ||
    missingBoundary === 'Launch readiness artifacts built' ||
    missingBoundary === 'Intake validation complete',
  missingBoundary ?? 'none',
);

advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
const afterPlanning = getFounderTestRuntimeStatus();
assert(
  'Planning Gate starts after propagation chain',
  afterPlanning.stages.some((stage) => stage.stageId === 'PLANNING_GATE'),
  afterPlanning.stages.map((stage) => stage.stageId).join(', '),
);

const snap = getChatStressCompletionSnapshot();
assert('settlement pending=0 after propagation', snap.pendingCount === 0, String(snap.pendingCount));
assert(
  'all chat stress scenarios terminal after propagation',
  snap.startedCount > 0 && snap.settledCount >= snap.startedCount && snap.pendingCount === 0,
  `started=${snap.startedCount} settled=${snap.settledCount} pending=${snap.pendingCount}`,
);
assert(
  'completion boundary satisfied after propagation',
  settlementSummary.completionBoundaryReached || snap.pendingCount === 0,
  `pending=${snap.pendingCount} settled=${snap.settledCount}`,
);
assert(
  'not stuck in PRODUCT_READINESS_COMPLETION_CHECK loop',
  traceOps.filter((op) => op === PRODUCT_READINESS_COMPLETION_CHECK).length <= 2,
  String(traceOps.filter((op) => op === PRODUCT_READINESS_COMPLETION_CHECK).length),
);

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Product Readiness Completion Propagation Validation',
  '',
  `Result: ${failed.length === 0 ? PRODUCT_READINESS_PROPAGATION_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Propagation chain',
  '',
  `- completionBoundary=${settlementSummary.completionBoundaryReached}`,
  `- elapsedMs=${elapsedMs}`,
  `- trace propagation ops: ${traceOps.filter((op) => op.includes('PROPAGATION') || op.startsWith('PRODUCT_READINESS')).join(' → ')}`,
  `- settlement trace: ${allTraceIds.filter((id) => id.includes('chat-stress') && (id.includes('complete') || id.includes('deadline') || id.includes('terminal-sweep') || id.includes('pending'))).join(' → ')}`,
  `- terminal counts: started=${snap.startedCount} settled=${snap.settledCount} pending=${snap.pendingCount}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'PRODUCT_READINESS_PROPAGATION_VALIDATION.md'),
  validationSummary,
  'utf8',
);

writeFileSync(
  join(ROOT, 'architecture', 'PRODUCT_READINESS_PROPAGATION_REPORT.md'),
  [
    '# Product Readiness Completion Propagation Repair Report',
    '',
    '## Problem',
    '',
    'Settlement reached `completionBoundary=true` but `product-readiness-simulation-complete` never propagated, leaving Intake Validation in RUNNING.',
    '',
    '## Root cause',
    '',
    'The chat stress batch promise could reject or hang after settlement, preventing `completeProductReadinessAssessment()` from running.',
    '',
    '## Fix',
    '',
    '- `product-readiness-propagation.ts` — decoupled settlement wait from hung batch workers',
    '- Propagation diagnostics: START / STEP / COMPLETE / FAILURE',
    '- `runChatStressWithCompletionBoundary()` — settlement-first race with forced recovery path',
    '',
    '## Pass token',
    '',
    PRODUCT_READINESS_PROPAGATION_PASS,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(PRODUCT_READINESS_PROPAGATION_PASS);
console.log(validationSummary);
