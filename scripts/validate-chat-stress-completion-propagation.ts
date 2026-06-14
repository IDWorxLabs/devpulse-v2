/**
 * Phase 26.80 — Chat Stress Completion Propagation Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  CHAT_STRESS_COMPLETION_PROPAGATION_REPAIR_V1_PASS,
  buildChatStressSettlementSummary,
  getChatStressCompletionPropagationSnapshot,
  hasChatStressSimulationCompletePropagated,
  hasIntakeValidationCompletionBoundaryInRegistry,
  hasPlanningGateStartedPropagated,
  hasProductReadinessSimulationCompletePropagated,
  resetChatStressCompletionPropagationForTests,
  resetChatStressSimulationForTests,
  runFounderTestChatStressSimulation,
  recordIntakeCompletionBoundaryOperation,
} from '../src/founder-test-chat-stress-simulation/index.js';
import { runFullProductReadinessSimulation } from '../src/founder-test-product-readiness/product-readiness-orchestrator.js';
import {
  appendRuntimeTraceEvent,
  analyzeStage2CompletionGap,
  buildLaunchReadinessArtifactBuildTraceBridge,
  beginFounderTestRuntime,
  getFounderTestRuntimeStatus,
  hasPassedTraceEvent,
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES,
  MAX_FOUNDER_TEST_TRACE_EVENTS,
  PINNED_RUNTIME_TRACE_OPERATION_IDS,
  resetFounderTestRuntimeMonitorForTests,
  resetLaunchReadinessArtifactBuildTracerForTests,
  resetRuntimeTraceCounterForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import type { FounderTestRuntimeTraceEvent } from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-completion-propagation';

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
  'src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  'src/founder-test-runtime-monitor/runtime-trace-builder.ts',
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  'architecture/CHAT_STRESS_COMPLETION_PROPAGATION_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const propagationSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.ts'),
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
const stage2Source = readFileSync(join(ROOT, 'src/founder-test-runtime-monitor/stage2-completion-tracker.ts'), 'utf8');
const traceBuilderSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/runtime-trace-builder.ts'),
  'utf8',
);
const tracerSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('completion propagation registry', propagationSource.includes('recordIntakeCompletionBoundaryOperation'), 'registry');
assert('completion condition satisfied trace', authoritySource.includes('chat-stress-completion-condition-satisfied'), 'condition trace');
assert('complete emitted trace', authoritySource.includes('chat-stress-simulation-complete-emitted'), 'complete emitted');
assert('product readiness emitted trace', orchestratorSource.includes('product-readiness-simulation-complete-emitted'), 'pr emitted');
assert('stage2 registry fallback', stage2Source.includes('hasIntakeValidationCompletionBoundaryInRegistry'), 'registry fallback');
assert('pinned trace operation ids', traceBuilderSource.includes('PINNED_RUNTIME_TRACE_OPERATION_IDS'), 'pinned traces');
assert('skips runtime trace propagation', tracerSource.includes('skipsRuntimeTracePropagation'), 'skip verbose');
assert('intake complete emitted handler', handlerSource.includes('intake-validation-complete-emitted'), 'intake emitted');
assert('planning gate started handler', handlerSource.includes('planning-gate-started'), 'planning started');
assert('no scoring changes', !authoritySource.includes('overrideLaunchVerdict'), 'scoring');
assert('no verdict changes', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-completion-propagation": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetChatStressCompletionPropagationForTests();
resetChatStressSimulationForTests();
const fastTimeoutMs = 250;
const operationIds: string[] = [];
await runFounderTestChatStressSimulation({
  maxScenarios: 12,
  concurrency: 4,
  perScenarioTimeoutMs: fastTimeoutMs,
  providerOverride: new HangingLlmProvider(),
  onTrace: (event) => operationIds.push(event.operationId),
});
const settlement = buildChatStressSettlementSummary();
assert('settled all scenarios', settlement.pendingCount === 0, String(settlement.pendingCount));
assert('completion condition satisfied trace', operationIds.includes('chat-stress-completion-condition-satisfied'), operationIds.join('|'));
assert('chat stress complete trace', operationIds.includes('chat-stress-simulation-complete'), operationIds.join('|'));
assert('chat stress complete emitted trace', operationIds.includes('chat-stress-simulation-complete-emitted'), operationIds.join('|'));
assert('propagation registry chat complete', hasChatStressSimulationCompletePropagated(), 'registry');

resetChatStressCompletionPropagationForTests();
resetChatStressSimulationForTests();
const prOperationIds: string[] = [];
const chatForPr = await runFounderTestChatStressSimulation({
  maxScenarios: 2,
  concurrency: 1,
  perScenarioTimeoutMs: fastTimeoutMs,
  providerOverride: new HangingLlmProvider(),
});
await runFullProductReadinessSimulation({
  skipChatStressSimulation: true,
  chatStressSimulation: chatForPr.report,
  founderTestContext: true,
  onSimulationTrace: (event) => prOperationIds.push(event.operationId),
});
assert('product readiness complete trace', prOperationIds.includes('product-readiness-simulation-complete'), prOperationIds.join('|'));
assert('product readiness emitted trace', prOperationIds.includes('product-readiness-simulation-complete-emitted'), prOperationIds.join('|'));
assert('propagation registry product complete', hasProductReadinessSimulationCompletePropagated(), 'registry');

resetRuntimeTraceCounterForTests();
let events: FounderTestRuntimeTraceEvent[] = [];
for (let index = 0; index < MAX_FOUNDER_TEST_TRACE_EVENTS + 20; index += 1) {
  const result = appendRuntimeTraceEvent({
    events,
    operationId: `noise-event-${index}`,
    operationLabel: `Noise ${index}`,
    status: 'RUNNING',
    stageId: 'INTAKE_VALIDATION',
  });
  events = result.events;
}
const pinnedResult = appendRuntimeTraceEvent({
  events,
  operationId: 'chat-stress-simulation-complete',
  operationLabel: 'Chat stress simulation complete',
  status: 'PASSED',
  stageId: 'INTAKE_VALIDATION',
});
events = pinnedResult.events;
assert(
  'pinned chat stress complete survives buffer trim',
  events.some((event) => event.operationId === 'chat-stress-simulation-complete' && event.status === 'PASSED'),
  events.map((event) => event.operationId).slice(-10).join('|'),
);
assert(
  'pinned operation ids include chat complete',
  PINNED_RUNTIME_TRACE_OPERATION_IDS.has('chat-stress-simulation-complete'),
  'missing pin',
);

resetLaunchReadinessArtifactBuildTracerForTests();
resetFounderTestRuntimeMonitorForTests();
resetChatStressCompletionPropagationForTests();
beginFounderTestRuntime({ runId: 'propagation-bridge-test' });
const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
bridge({
  operationId: 'chat-stress-scenario-settled:identity-01',
  operationLabel: 'Chat stress scenario settled: identity-01 (TIMEOUT)',
  phase: 'PASSED',
});
bridge({
  operationId: 'chat-stress-simulation-complete',
  operationLabel: 'Chat stress simulation complete',
  phase: 'PASSED',
});
const snapshot = getFounderTestRuntimeStatus();
assert(
  'settlement trace propagates to runtime feed (live path)',
  snapshot.traceEvents.some((event) => event.operationId.startsWith('chat-stress-scenario-settled:')),
  snapshot.traceEvents.map((event) => event.operationId).join('|'),
);
assert(
  'completion boundary propagated to runtime',
  snapshot.traceEvents.some((event) => event.operationId === 'chat-stress-simulation-complete'),
  snapshot.traceEvents.map((event) => event.operationId).join('|'),
);

assert(
  'intake boundary list unchanged',
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES[0]?.operationId === 'chat-stress-simulation-complete',
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES[0]?.operationId ?? 'missing',
);

resetFounderTestRuntimeMonitorForTests();
resetChatStressCompletionPropagationForTests();
recordIntakeCompletionBoundaryOperation('chat-stress-simulation-complete');
const traceEvents: FounderTestRuntimeTraceEvent[] = [];
assert(
  'registry satisfies stage2 boundary without trace event',
  hasPassedTraceEvent(traceEvents, 'chat-stress-simulation-complete'),
  'registry miss',
);
const propagationSnap = getChatStressCompletionPropagationSnapshot();
assert('propagation snapshot readable', propagationSnap.chatStressSimulationCompleteEmitted === true, String(propagationSnap.chatStressSimulationCompleteEmitted));

resetFounderTestRuntimeMonitorForTests();
const stage2Gap = analyzeStage2CompletionGap({
  readOnly: true,
  runId: 'propagation-test',
  state: 'RUNNING',
  startedAt: new Date().toISOString(),
  endedAt: null,
  stages: [
    {
      readOnly: true,
      stageId: 'INTAKE_VALIDATION',
      label: 'Intake Validation',
      order: 2,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: null,
      lastHeartbeatAt: new Date().toISOString(),
    },
  ],
  feed: { readOnly: true, events: [] },
  stallAnalysis: {
    readOnly: true,
    health: 'HEALTHY',
    currentStageId: 'INTAKE_VALIDATION',
    stageElapsedMs: 1000,
    stageAverageMs: null,
    warningMessage: null,
    stallReason: null,
    currentStageTimeoutMs: null,
    secondsSinceLastHeartbeat: 0,
  },
  elapsedMs: 1000,
  alreadyRunning: true,
  lastHeartbeatAt: new Date().toISOString(),
  secondsSinceLastHeartbeat: 0,
  currentStageTimeoutMs: null,
  stallReason: null,
  currentOperation: null,
  lastCompletedOperation: null,
  nextExpectedOperation: null,
  lastSuccessfulOperation: null,
  traceStageStatus: 'RUNNING',
  traceEvents: [],
  activeArtifactBuildSubstep: null,
  activeArtifactBuildSubstepOperationId: null,
  artifactBuildSubstepElapsedMs: 0,
  artifactBuildSubstepStallReason: null,
  lastSuccessfulArtifactSubstep: null,
  missingCompletionBoundary: null,
  stage2CompletionGap: false,
  stage2CompletionGapReason: null,
  handlerAlive: true,
  handlerLastAliveAt: new Date().toISOString(),
  postTimedOut: false,
  progress: {
    readOnly: true,
    currentStage: 'INTAKE_VALIDATION',
    currentStageLabel: 'Intake Validation',
    currentStageOrder: 2,
    totalStages: 8,
    completedStages: 1,
    remainingStages: 7,
    percentComplete: 12,
    elapsedMs: 1000,
    estimatedRemainingMs: null,
  },
  chatStressStartedCount: 12,
  chatStressSettledCount: 12,
  chatStressPendingCount: 0,
  chatStressLastScenario: 'cap-06',
  chatStressPendingScenarioIds: [],
  chatStressActiveScenarioId: null,
  chatStressLastSettledScenarioId: 'cap-06',
  chatStressTimeoutScenarioIds: [],
  chatStressFailedScenarioIds: [],
  chatStressWatchdogArmedScenarioIds: [],
  chatStressWatchdogDeadlineByScenarioId: {},
  chatStressWatchdogOverdueScenarioIds: [],
  chatStressMaxPendingElapsedMs: 0,
});
assert(
  'stage2 not stalled on chat pending when registry has chat complete',
  stage2Gap.stage2CompletionGapReason == null ||
    !stage2Gap.stage2CompletionGapReason.includes('pending scenarios'),
  stage2Gap.stage2CompletionGapReason ?? 'ok',
);

assert('planning gate propagation helper exists', handlerSource.includes('recordPlanningGateStarted'), 'handler');

const failed = results.filter((entry) => !entry.passed);
const passToken = CHAT_STRESS_COMPLETION_PROPAGATION_REPAIR_V1_PASS;
const reportPath = join(ROOT, 'architecture', 'CHAT_STRESS_COMPLETION_PROPAGATION_REPAIR_REPORT.md');
const reportBody = readFileSync(reportPath, 'utf8');
assert('architecture report includes success token', reportBody.includes(passToken), 'token in report');

const validationSummary = [
  '# Chat Stress Completion Propagation Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'CHAT_STRESS_COMPLETION_PROPAGATION_VALIDATION.md'), validationSummary, 'utf8');

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
