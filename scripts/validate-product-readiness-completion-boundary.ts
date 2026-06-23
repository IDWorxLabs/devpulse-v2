/**
 * Phase 26.89 — Product Readiness Completion Boundary V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  PRODUCT_READINESS_COMPLETION_BOUNDARY_V1_PASS,
  PRODUCT_READINESS_COMPLETION_CHECK,
  PRODUCT_READINESS_COMPLETED,
  PRODUCT_READINESS_FORCED_COMPLETION,
  CHAT_STRESS_TERMINAL_STATUSES,
  resolveProductReadinessCompletionEligibility,
  forceCompleteProductReadiness,
  resetProductReadinessSimulationForTests,
  resetProductReadinessFixtureCacheForTests,
  runFullProductReadinessSimulation,
} from '../src/founder-test-product-readiness/index.js';
import {
  beginChatStressSimulation,
  getChatStressCompletionSnapshot,
  markChatStressScenarioSkippedBudget,
  markChatStressScenarioStarted,
  resetChatStressSimulationForTests,
  tryMarkChatStressScenarioSettled,
  recoverFounderTestChatStressSimulationFromSettlement,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  hasProductReadinessSimulationCompletePropagated,
  resetChatStressCompletionPropagationForTests,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
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
      /* never resolves — batch settlement race must still complete */
    });
  }
}

const REQUIRED = [
  'src/founder-test-product-readiness/product-readiness-completion-boundary.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const boundarySource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-completion-boundary.ts'),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
  'utf8',
);
const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);

assert('diagnostic PRODUCT_READINESS_COMPLETION_CHECK', boundarySource.includes(PRODUCT_READINESS_COMPLETION_CHECK), 'missing');
assert('diagnostic PRODUCT_READINESS_COMPLETED', boundarySource.includes(PRODUCT_READINESS_COMPLETED), 'missing');
assert('diagnostic PRODUCT_READINESS_FORCED_COMPLETION', boundarySource.includes(PRODUCT_READINESS_FORCED_COMPLETION), 'missing');
assert('forceCompleteProductReadiness exported', orchestratorSource.includes('export function forceCompleteProductReadiness'), 'missing');
assert('batch settlement race', simulatorSource.includes('waitForAllScenariosSettled'), 'missing');
assert(
  'SKIPPED_BUDGET marks started',
  trackerSource.includes("terminalStatus: 'SKIPPED_BUDGET'") &&
    trackerSource.includes('markChatStressScenarioSkippedBudget') &&
    !trackerSource.includes('started: false,\n    settled: true,\n    terminalStatus: \'SKIPPED_BUDGET\''),
  'started flag',
);

for (const terminal of ['PASSED', 'FAILED', 'TIMEOUT', 'SKIPPED_BUDGET']) {
  assert(`terminal status ${terminal} in tracker`, trackerSource.includes(`'${terminal}'`), terminal);
}

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
beginChatStressSimulation(['cap-01', 'cap-02', 'cap-03', 'cap-04', 'cap-05']);
markChatStressScenarioStarted('cap-01');
tryMarkChatStressScenarioSettled('cap-01', 'PASSED');
markChatStressScenarioStarted('cap-02');
tryMarkChatStressScenarioSettled('cap-02', 'FAILED');
markChatStressScenarioStarted('cap-03');
tryMarkChatStressScenarioSettled('cap-03', 'TIMEOUT');
markChatStressScenarioSkippedBudget('cap-04');
markChatStressScenarioSkippedBudget('cap-05');

const snap = getChatStressCompletionSnapshot();
const eligibility = resolveProductReadinessCompletionEligibility(snap, 5);
assert(
  'SKIPPED_BUDGET counts toward settlement eligibility',
  eligibility.eligible && snap.pendingCount === 0,
  `${eligibility.eligible} pending=${snap.pendingCount}`,
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();

const product = await runFullProductReadinessSimulation({
  rootDir: ROOT,
  chatStressMaxScenarios: 4,
  founderTestContext: true,
  onSimulationTrace: () => {},
});
assert(
  'full simulation emits product readiness complete propagation',
  hasProductReadinessSimulationCompletePropagated(),
  String(hasProductReadinessSimulationCompletePropagated()),
);
assert('product readiness returns report', product.report.readinessScore >= 0, String(product.report.readinessScore));

resetFounderTestRuntimeMonitorForTests();
resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
resetProductReadinessFixtureCacheForTests();

beginFounderTestRuntime({ runId: 'product-readiness-completion-boundary-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();

const traceOps: string[] = [];
await runFullProductReadinessSimulation({
  rootDir: ROOT,
  chatStressMaxScenarios: 6,
  founderTestContext: true,
  onSimulationTrace: (event) => {
    traceOps.push(event.operationId);
    bridge({
      operationId: event.operationId,
      operationLabel: event.operationLabel,
      phase: event.phase === 'PASSED' ? 'PASSED' : event.phase === 'RUNNING' ? 'RUNNING' : 'FAILED',
      errorMessage: event.errorMessage,
    });
  },
});

const runtimeSnap = getFounderTestRuntimeStatus();
assert(
  'trace includes product-readiness-simulation-complete',
  traceOps.includes('product-readiness-simulation-complete'),
  traceOps.filter((op) => op.includes('product-readiness')).join(', '),
);
assert(
  'trace includes PRODUCT_READINESS_COMPLETED diagnostic',
  traceOps.includes(PRODUCT_READINESS_COMPLETED),
  traceOps.filter((op) => op.startsWith('PRODUCT_READINESS')).join(', '),
);
assert(
  'runtime registry has product readiness complete boundary',
  runtimeSnap.traceEvents.some(
    (event) =>
      event.operationId === 'product-readiness-simulation-complete' && event.status === 'PASSED',
  ),
  runtimeSnap.traceEvents.map((event) => event.operationId).join(', '),
);

const missingBeforeStage3 = resolveMissingIntakeCompletionBoundary(runtimeSnap.traceEvents);
assert(
  'intake validation boundaries satisfied after product readiness (chat stress + product readiness at minimum)',
  !missingBeforeStage3 ||
    missingBeforeStage3 === 'Launch readiness assessment complete' ||
    missingBeforeStage3 === 'Launch readiness artifacts built' ||
    missingBeforeStage3 === 'Intake validation complete',
  missingBeforeStage3 ?? 'none',
);

advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });
const afterStage3 = getFounderTestRuntimeStatus();
assert(
  'Stage 3 PLANNING_GATE begins after intake product readiness chain',
  afterStage3.stages.some((stage) => stage.stageId === 'PLANNING_GATE'),
  afterStage3.stages.map((stage) => stage.stageId).join(', '),
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
beginChatStressSimulation(['cap-05', 'cap-06']);
markChatStressScenarioStarted('cap-05');
tryMarkChatStressScenarioSettled('cap-05', 'PASSED');
markChatStressScenarioStarted('cap-06');
markChatStressScenarioSkippedBudget('cap-06');
const recovered = await recoverFounderTestChatStressSimulationFromSettlement({
  rootDir: ROOT,
  maxScenarios: 12,
  founderTestContext: true,
});
assert('settlement recovery builds report', recovered != null, 'null');
assert(
  'settlement recovery last scenario SKIPPED_BUDGET',
  Boolean(recovered?.report.scenarioRuns.some((run) => run.scenarioId === 'cap-06' && run.skipped)),
  String(recovered?.report.scenariosSkipped),
);

resetChatStressSimulationForTests();
resetChatStressCompletionPropagationForTests();
resetProductReadinessSimulationForTests();
beginChatStressSimulation(['hang-01']);
markChatStressScenarioStarted('hang-01');
tryMarkChatStressScenarioSettled('hang-01', 'TIMEOUT');

const forcedAssessment = forceCompleteProductReadiness({
  rootDir: ROOT,
  founderTest: {
    readOnly: true,
    score: { overall: 50, categories: {} },
    run: { authorityResults: [] },
  } as never,
  chatStress: recovered?.report ?? null,
  budget: {
    snapshot: () => ({
      readOnly: true,
      startedAtMs: Date.now(),
      elapsedMs: 1000,
      budgetMs: 60_000,
      health: 'HEALTHY',
      reason: null,
      budgetExceeded: false,
    }),
  } as never,
  simulationBudgetNotes: ['forced test'],
  onSimulationTrace: (event) => {
    traceOps.push(event.operationId);
  },
});
assert('forceCompleteProductReadiness returns assessment', forcedAssessment.report != null, 'null');
assert(
  'forceCompleteProductReadiness emits forced diagnostic',
  traceOps.includes(PRODUCT_READINESS_FORCED_COMPLETION),
  traceOps.filter((op) => op.startsWith('PRODUCT_READINESS')).join(', '),
);

const failed = results.filter((entry) => !entry.passed);
const passToken = PRODUCT_READINESS_COMPLETION_BOUNDARY_V1_PASS;
const validationSummary = [
  '# Product Readiness Completion Boundary Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  `Terminal statuses tracked: ${CHAT_STRESS_TERMINAL_STATUSES.join(', ')}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Runtime trace chain (representative run)',
  '',
  ...traceOps
    .filter(
      (op) =>
        op.includes('chat-stress') ||
        op.includes('product-readiness') ||
        op.startsWith('PRODUCT_READINESS'),
    )
    .slice(0, 24)
    .map((op) => `- ${op}`),
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'PRODUCT_READINESS_COMPLETION_BOUNDARY_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
