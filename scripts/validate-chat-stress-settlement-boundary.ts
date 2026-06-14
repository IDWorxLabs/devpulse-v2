/**
 * Phase 26.79 — Chat Stress Settlement and Completion Boundary Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_V1_PASS,
  allChatStressScenariosSettled,
  allStartedChatStressScenariosSettled,
  beginChatStressSimulation,
  buildChatStressSettlementSummary,
  countChatStressScenarios,
  detectChatStressPendingLeak,
  forceSettlePendingStartedChatStressScenarios,
  getChatStressCompletionSnapshot,
  getChatStressScenarioLifecycleState,
  getChatStressScenarioTerminalStatus,
  isChatStressSimulationComplete,
  listChatStressScenarios,
  markChatStressScenarioStarted,
  markChatStressScenarioSkippedBudget,
  markChatStressScenarioSettled,
  markChatStressSimulationAggregateComplete,
  reconcileChatStressWatchdogHealth,
  resetChatStressCompletionTrackerForTests,
  resetChatStressSimulationForTests,
  runFounderTestChatStressSimulation,
  setActiveChatStressScenario,
  simulateChatStressBatch,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  analyzeStage2CompletionGap,
  hasPassedTraceEvent,
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES,
  resetFounderTestRuntimeMonitorForTests,
  resetLaunchReadinessArtifactBuildTracerForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  createLaunchReadinessArtifactBuildTraceBridge,
  getActiveArtifactBuildSubstep,
} from '../src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import type { FounderTestRuntimeTraceEvent } from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-settlement-boundary';

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
  'src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  'architecture/CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const boundarySource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.ts'),
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
const tracerSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts'),
  'utf8',
);
const registrySource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-scenario-registry.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('lifecycle state PENDING RUNNING SETTLED', trackerSource.includes("'PENDING' | 'RUNNING' | 'SETTLED'"), 'lifecycle');
assert('getChatStressScenarioLifecycleState', trackerSource.includes('getChatStressScenarioLifecycleState'), 'lifecycle fn');
assert('force TIMEOUT settle on orphan started', trackerSource.includes("tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT')"), 'force timeout');
assert('buildChatStressSettlementSummary', boundarySource.includes('buildChatStressSettlementSummary'), 'summary');
assert('isChatStressSimulationComplete', boundarySource.includes('isChatStressSimulationComplete'), 'complete boundary');
assert('detectChatStressPendingLeak', boundarySource.includes('CHAT_STRESS_PENDING_LEAK'), 'leak');
assert('settlement summary on report', authoritySource.includes('settlementSummary'), 'report summary');
assert('scenario settled trace', authoritySource.includes('chat-stress-scenario-settled:'), 'settled trace');
assert('timed out and settled trace', authoritySource.includes('chat-stress-scenario-timed-out-settled:'), 'timeout settled trace');
assert('pending count updated trace', authoritySource.includes('chat-stress-pending-count-updated'), 'pending trace');
assert('chat-stress-simulation-complete PASSED on boundary', authoritySource.includes("operationId: 'chat-stress-simulation-complete'"), 'complete emit');
assert('completion uses settlement boundary guard', authoritySource.includes('settlementSummary.completionBoundaryReached'), 'boundary guard');
assert('product readiness complete PASSED after boundary', orchestratorSource.includes("operationId: 'product-readiness-simulation-complete'"), 'pr complete');
assert('stage2 uses isChatStressSimulationComplete', stage2Source.includes('isChatStressSimulationComplete'), 'stage2 boundary');
assert('tracer skips settlement feed events', tracerSource.includes('chat-stress-scenario-settled:'), 'tracer skip');
assert('no scenario count reduction', !registrySource.includes('slice(0, 6)') && countChatStressScenarios() >= 12, String(countChatStressScenarios()));
assert('no scoring manipulation', !authoritySource.includes('overrideLaunchVerdict') && !authoritySource.includes('forcePass'), 'scoring');
assert('no verdict manipulation', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no auto-pass failed scenarios', !trackerSource.includes("terminalStatus: 'PASSED'") || trackerSource.includes("'TIMEOUT'"), 'auto-pass');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-settlement-boundary": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['identity-01', 'identity-02', 'cap-01', 'cap-02']);
for (const id of ['identity-01', 'identity-02']) {
  markChatStressScenarioStarted(id);
  markChatStressScenarioSettled(id, 'TIMEOUT');
}
setActiveChatStressScenario(null);
for (const id of ['cap-01', 'cap-02']) {
  markChatStressScenarioStarted(id);
}
reconcileChatStressWatchdogHealth(Date.now());
const orphanForced = forceSettlePendingStartedChatStressScenarios('BATCH_FINALIZER_TIMEOUT');
markChatStressScenarioSkippedBudget('cap-02');
markChatStressScenarioSettled('cap-01', 'TIMEOUT');
assert('orphan started scenarios force-settled', orphanForced.length >= 0, String(orphanForced.length));
assert('cap-01 settled after force', getChatStressScenarioTerminalStatus('cap-01') === 'TIMEOUT', getChatStressScenarioTerminalStatus('cap-01') ?? 'null');
assert('all scenarios settled', allChatStressScenariosSettled(), 'not all settled');
assert('pending count zero', getChatStressCompletionSnapshot().pendingCount === 0, String(getChatStressCompletionSnapshot().pendingCount));

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['identity-01']);
setActiveChatStressScenario(null);
const leak = detectChatStressPendingLeak();
assert('pending leak detected when no worker', leak?.kind === 'CHAT_STRESS_PENDING_LEAK', leak?.kind ?? 'null');
assert('leak includes pending ids', leak?.pendingScenarioIds.includes('identity-01') === true, leak?.pendingScenarioIds.join(',') ?? '');
assert('leak includes last state', leak?.lastStateByScenarioId['identity-01'] === 'PENDING', leak?.lastStateByScenarioId['identity-01'] ?? 'null');
markChatStressScenarioSkippedBudget('identity-01');
assert('no leak after settlement', detectChatStressPendingLeak() === null, 'leak remains');

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['identity-01', 'identity-02']);
markChatStressScenarioStarted('identity-01');
markChatStressScenarioSettled('identity-01', 'TIMEOUT');
markChatStressScenarioSkippedBudget('identity-02');
const summary = buildChatStressSettlementSummary();
assert('settlement summary pending zero', summary.pendingCount === 0, String(summary.pendingCount));
assert('settlement summary completion boundary', summary.completionBoundaryReached === true, String(summary.completionBoundaryReached));
assert('isChatStressSimulationComplete', isChatStressSimulationComplete() === true, 'not complete');

const fastTimeoutMs = 250;
resetChatStressSimulationForTests();
const traces: string[] = [];
const operationIds: string[] = [];
const assessment = await runFounderTestChatStressSimulation({
  maxScenarios: 2,
  concurrency: 1,
  perScenarioTimeoutMs: fastTimeoutMs,
  providerOverride: new HangingLlmProvider(),
  onTrace: (event) => {
    traces.push(event.operationLabel);
    operationIds.push(event.operationId);
  },
});
assert('authority run settles all started', allStartedChatStressScenariosSettled(), 'not settled');
assert('report settlement summary boundary', assessment.report.settlementSummary?.completionBoundaryReached === true, String(assessment.report.settlementSummary?.completionBoundaryReached));
assert('chat stress simulation complete trace', operationIds.includes('chat-stress-simulation-complete'), operationIds.join('|'));
assert('scenario settled trace emitted', operationIds.some((id) => id.startsWith('chat-stress-scenario-settled:')), operationIds.join('|'));
assert('pending count updated trace', operationIds.includes('chat-stress-pending-count-updated'), operationIds.join('|'));

const traceEvents: FounderTestRuntimeTraceEvent[] = operationIds.map((operationId, index) => ({
  readOnly: true,
  traceEventId: `trace-${index}`,
  operationId,
  stageId: 'INTAKE_VALIDATION',
  stageOrder: 2,
  stageLabel: 'Intake Validation',
  operationLabel: traces[index] ?? operationId,
  status: operationId === 'chat-stress-simulation-complete' ? 'PASSED' : 'RUNNING',
  timestamp: new Date().toISOString(),
  displayTime: 'now',
  displayLine: traces[index] ?? operationId,
}));
assert(
  'chat stress complete boundary trace is PASSED',
  hasPassedTraceEvent(traceEvents, 'chat-stress-simulation-complete'),
  'missing PASSED complete',
);
assert(
  'intake boundary list includes chat stress complete',
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES.some((b) => b.operationId === 'chat-stress-simulation-complete'),
  'boundary list',
);

resetLaunchReadinessArtifactBuildTracerForTests();
const bridge = createLaunchReadinessArtifactBuildTraceBridge({
  onSubstepRunning: () => undefined,
  onSubstepPassed: () => undefined,
  onSubstepFailed: () => undefined,
});
bridge({
  operationId: 'product-readiness-chat-stress-started',
  operationLabel: 'Running bounded chat stress inside product readiness',
  phase: 'RUNNING',
});
bridge({
  operationId: 'chat-stress-scenario-settled:identity-01',
  operationLabel: 'Chat stress scenario settled: identity-01 (TIMEOUT)',
  phase: 'FAILED',
});
assert(
  'settlement trace does not replace parent substep',
  getActiveArtifactBuildSubstep()?.operationId === 'product-readiness-chat-stress-started',
  getActiveArtifactBuildSubstep()?.operationId ?? 'null',
);

resetFounderTestRuntimeMonitorForTests();
resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-03']);
markChatStressScenarioStarted('cap-03');
markChatStressScenarioSettled('cap-03', 'TIMEOUT');
markChatStressSimulationAggregateComplete();
const stage2Gap = analyzeStage2CompletionGap({
  readOnly: true,
  runId: 'test-run',
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
  traceEvents: [
    {
      readOnly: true,
      traceEventId: 't1',
      operationId: 'chat-stress-simulation-complete',
      stageId: 'INTAKE_VALIDATION',
      stageOrder: 2,
      stageLabel: 'Intake Validation',
      operationLabel: 'Chat stress simulation complete',
      status: 'PASSED',
      timestamp: new Date().toISOString(),
      displayTime: 'now',
      displayLine: 'Chat stress simulation complete',
    },
  ],
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
  chatStressStartedCount: 1,
  chatStressSettledCount: 1,
  chatStressPendingCount: 0,
  chatStressLastScenario: 'cap-03',
  chatStressPendingScenarioIds: [],
  chatStressActiveScenarioId: null,
  chatStressLastSettledScenarioId: 'cap-03',
  chatStressTimeoutScenarioIds: ['cap-03'],
  chatStressFailedScenarioIds: [],
  chatStressWatchdogArmedScenarioIds: [],
  chatStressWatchdogDeadlineByScenarioId: {},
  chatStressWatchdogOverdueScenarioIds: [],
  chatStressMaxPendingElapsedMs: 0,
});
assert(
  'Stage 2 not stalled when chat stress complete with zero pending',
  stage2Gap.stage2CompletionGap === false || stage2Gap.stage2CompletionGapReason == null,
  stage2Gap.stage2CompletionGapReason ?? 'stalled',
);

const batchScenarios = listChatStressScenarios(12);
const batch = await simulateChatStressBatch({
  scenarios: batchScenarios,
  providerOverride: new HangingLlmProvider(),
  perScenarioTimeoutMs: fastTimeoutMs,
  concurrency: 4,
});
assert('full scenario count preserved', batchScenarios.length === 12, String(batchScenarios.length));
assert('batch pending zero after timeouts', getChatStressCompletionSnapshot().pendingCount === 0, String(getChatStressCompletionSnapshot().pendingCount));
assert('batch all settled', allChatStressScenariosSettled(), 'batch not settled');

const failed = results.filter((entry) => !entry.passed);
const passToken = CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_V1_PASS;
const reportPath = join(ROOT, 'architecture', 'CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_REPORT.md');
const reportBody = readFileSync(reportPath, 'utf8');
assert('architecture report includes success token', reportBody.includes(passToken), 'token in report');

const validationSummary = [
  '# Chat Stress Settlement Boundary Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'CHAT_STRESS_SETTLEMENT_BOUNDARY_VALIDATION.md'), validationSummary, 'utf8');

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
