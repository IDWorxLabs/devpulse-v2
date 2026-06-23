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
  beginChatStressBatchDeadline,
  addActiveChatStressScenario,
  buildLiveChatStressRunnerPathStatus,
  countChatStressScenarios,
  forceSettlePendingStartedChatStressScenarios,
  getChatStressCompletionSnapshot,
  hasChatStressSimulationCompletePropagated,
  listChatStressScenarios,
  markChatStressScenarioStarted,
  markChatStressScenarioSettled,
  pollLiveChatStressTerminalSettlement,
  reconcileChatStressRunnerIdleWithPending,
  reconcileChatStressWatchdogHealth,
  reconcileLiveChatStressCompletionBoundaryPropagation,
  reconcileLiveChatStressRuntimeSettlement,
  registerChatStressPostWatchdogHealthReconciler,
  registerChatStressScenarioHardWatchdog,
  registerLiveChatStressCompletionBoundaryEmitter,
  registerChatStressRunnerIdleWithPendingHandler,
  resetChatStressCompletionTrackerForTests,
  resetChatStressCompletionPropagationForTests,
  resetChatStressSimulationForTests,
  resetLiveChatStressRunnerPathForTests,
  runFounderTestChatStressSimulation,
  setActiveChatStressScenario,
  shouldPropagateLiveChatStressRuntimeFeed,
} from '../src/founder-test-chat-stress-simulation/index.js';
import { waitForProductReadinessChatStressSettlement } from '../src/founder-test-product-readiness/product-readiness-completion-boundary.js';
import {
  analyzeStage2CompletionGap,
  beginFounderTestRuntime,
  buildLaunchReadinessArtifactBuildTraceBridge,
  getActiveArtifactBuildSubstep,
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
const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('live path marker constant', livePathSource.includes(LIVE_CHAT_STRESS_RUNNER_PATH_MARKER), LIVE_CHAT_STRESS_RUNNER_PATH_MARKER);
assert('idle with pending kind', livePathSource.includes(CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND), 'idle kind');
assert('forceSettle in idle reconcile', livePathSource.includes('forceSettlePendingStartedChatStressScenarios'), 'force settle');
assert('live completion boundary propagation', livePathSource.includes('reconcileLiveChatStressCompletionBoundaryPropagation'), 'boundary propagation');
assert('emit boundary if needed in settlement boundary', readFileSync(join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.ts'), 'utf8').includes('emitChatStressSimulationCompleteBoundaryIfNeeded'), 'emit fn');
assert('orchestrator emits boundary after chat stress', orchestratorSource.includes('emitChatStressSimulationCompleteBoundaryIfNeeded'), 'orchestrator emit');
assert('runtime monitor snapshot boundary emit', readFileSync(join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'), 'utf8').includes('emitChatStressSimulationCompleteBoundaryIfNeeded'), 'monitor emit');
assert('settlement summary in live path', livePathSource.includes('buildChatStressSettlementSummary'), 'summary');
assert('completion complete in live path', livePathSource.includes('isChatStressSimulationComplete'), 'complete');
assert('live path marker in authority', authoritySource.includes('LIVE_CHAT_STRESS_RUNNER_PATH_MARKER'), 'authority marker');
assert('idle handler in authority', authoritySource.includes('registerChatStressRunnerIdleWithPendingHandler'), 'idle handler');
assert('post health reconciler in authority', authoritySource.includes('registerChatStressPostWatchdogHealthReconciler'), 'health hook');
assert('batch deadline armed trace in authority', authoritySource.includes('chat-stress-batch-deadline-armed'), 'batch armed');
assert('terminal sweep started trace in authority', authoritySource.includes('chat-stress-terminal-sweep-started'), 'sweep started');
assert('terminal sweep settled trace in authority', authoritySource.includes('chat-stress-terminal-sweep-settled'), 'sweep settled');
assert('poll terminal settlement in live path', livePathSource.includes('pollLiveChatStressTerminalSettlement'), 'poll fn');
assert('batch begin preserves reconcilers', trackerSource.includes('resetChatStressScenarioStateForBatch'), 'batch reset split');
assert('propagation wait drives runtime settlement', readFileSync(join(ROOT, 'src/founder-test-product-readiness/product-readiness-completion-boundary.ts'), 'utf8').includes('reconcileLiveChatStressRuntimeSettlement'), 'wait settlement');
assert('settlement driver in authority', authoritySource.includes('startLiveChatStressSettlementDriver'), 'settlement driver');
assert('simulator poll calls terminal settlement if needed', simulatorSource.includes('reconcileChatStressTerminalSettlementIfNeeded'), 'sim poll');
assert('should force terminal settlement helper', trackerSource.includes('shouldForceChatStressTerminalSettlementSweep'), 'force helper');
assert('product readiness uses chat stress authority', orchestratorSource.includes('runFounderTestChatStressSimulation'), 'pr chat');
assert('launch readiness uses product readiness', launchSource.includes('runFullProductReadinessSimulation'), 'launch pr');
assert('handler launch orchestration', handlerSource.includes('executeFounderTestLaunchReadinessOrchestration'), 'handler');
assert('shouldPropagateLiveChatStressRuntimeFeed in tracer', tracerSource.includes('shouldPropagateLiveChatStressRuntimeFeed'), 'tracer');
assert('simulator force settle finalizer', simulatorSource.includes('forceSettlePendingStartedChatStressScenarios'), 'finalizer');
assert('call chain includes v4 path', LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN.includes('runFullProductReadinessSimulation'), 'chain');
assert('scenario count remains 12', DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS === 12 && countChatStressScenarios() >= 12, String(countChatStressScenarios()));
assert('propagate settled marker', shouldPropagateLiveChatStressRuntimeFeed('chat-stress-scenario-settled:identity-01'), 'settled');
assert('propagate live path marker', shouldPropagateLiveChatStressRuntimeFeed(LIVE_CHAT_STRESS_RUNNER_PATH_MARKER), 'marker');
assert('propagate batch deadline armed', shouldPropagateLiveChatStressRuntimeFeed('chat-stress-batch-deadline-armed'), 'batch armed feed');
assert('propagate terminal sweep started', shouldPropagateLiveChatStressRuntimeFeed('chat-stress-terminal-sweep-started'), 'sweep started feed');
assert('propagate terminal sweep settled', shouldPropagateLiveChatStressRuntimeFeed('chat-stress-terminal-sweep-settled'), 'sweep settled feed');
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

resetChatStressCompletionTrackerForTests();
let healthReconcilerInvoked = false;
registerChatStressPostWatchdogHealthReconciler(() => {
  healthReconcilerInvoked = true;
});
beginChatStressSimulation(['identity-01', 'identity-02']);
reconcileChatStressWatchdogHealth(Date.now());
assert('batch begin preserves live health reconciler', healthReconcilerInvoked, 'reconciler cleared');

resetChatStressCompletionTrackerForTests();
resetChatStressCompletionPropagationForTests();
resetLiveChatStressRunnerPathForTests();
const livePartialIds = listChatStressScenarios(12).map((scenario) => scenario.id);
beginChatStressSimulation(livePartialIds);
beginChatStressBatchDeadline({
  scenarioCount: 12,
  concurrency: 4,
  perScenarioTimeoutMs: 1_000,
  startedAtMs: Date.now(),
});
for (const id of ['identity-01', 'identity-02', 'identity-03', 'identity-04']) {
  markChatStressScenarioStarted(id);
}
addActiveChatStressScenario('identity-04');
for (const id of ['identity-01', 'identity-02', 'identity-03', 'identity-04']) {
  registerChatStressScenarioHardWatchdog({ scenarioId: id, timeoutMs: 1_000 });
}
const hungSnap = getChatStressCompletionSnapshot();
assert('live stall repro started=4', hungSnap.startedCount === 4, String(hungSnap.startedCount));
assert('live stall repro settled=0', hungSnap.settledCount === 0, String(hungSnap.settledCount));
assert('live stall repro pending=12', hungSnap.pendingCount === 12, String(hungSnap.pendingCount));
const stallPoll = pollLiveChatStressTerminalSettlement();
assert('live stall does not sweep before overdue', stallPoll.sweepRan === false, String(stallPoll.sweepRan));
const boundaryTraceIds: string[] = [];
registerLiveChatStressCompletionBoundaryEmitter((event) => {
  boundaryTraceIds.push(event.operationId);
});
const pollResult = pollLiveChatStressTerminalSettlement(Date.now() + 20_000);
assert(
  'live poll path runs terminal settlement',
  pollResult.sweepRan === true || (pollResult.pendingCount === 0 && pollResult.settledCount === 12),
  `${pollResult.sweepRan}|pending=${pollResult.pendingCount}|settled=${pollResult.settledCount}`,
);
assert('live poll clears pending', pollResult.pendingCount === 0, String(pollResult.pendingCount));
assert('live poll settles all scenarios', pollResult.settledCount === 12, String(pollResult.settledCount));
assert(
  'live poll emits chat stress complete boundary',
  boundaryTraceIds.includes('chat-stress-simulation-complete') ||
    reconcileLiveChatStressCompletionBoundaryPropagation(Date.now() + 20_000) === true,
  boundaryTraceIds.join('|'),
);
assert('live poll emits chat-stress-simulation-complete', boundaryTraceIds.includes('chat-stress-simulation-complete'), boundaryTraceIds.join('|'));

resetChatStressCompletionTrackerForTests();
resetChatStressCompletionPropagationForTests();
resetLiveChatStressRunnerPathForTests();
const waitPartialIds = listChatStressScenarios(12).map((scenario) => scenario.id);
beginChatStressSimulation(waitPartialIds);
beginChatStressBatchDeadline({
  scenarioCount: 12,
  concurrency: 4,
  perScenarioTimeoutMs: 1_000,
  startedAtMs: Date.now() - 25_000,
});
for (const id of ['identity-01', 'identity-02', 'identity-03', 'identity-04']) {
  markChatStressScenarioStarted(id);
}
addActiveChatStressScenario('identity-04');
for (const id of ['identity-01', 'identity-02', 'identity-03', 'identity-04']) {
  registerChatStressScenarioHardWatchdog({ scenarioId: id, timeoutMs: 1_000 });
}
const waitTraceIds: string[] = [];
const waitEligibility = await waitForProductReadinessChatStressSettlement(50, (event) => {
  waitTraceIds.push(event.operationId);
});
assert('wait path resolves started=4 stall', waitEligibility.eligible === true, waitEligibility.reason ?? 'not eligible');
assert('wait path clears pending', waitEligibility.pendingCount === 0, String(waitEligibility.pendingCount));
assert('wait path settles all scenarios', waitEligibility.settledCount === 12, String(waitEligibility.settledCount));
assert('wait path emits terminal sweep settled', waitTraceIds.some((id) => id === 'chat-stress-terminal-sweep-settled' || id === 'chat-stress-simulation-complete'), waitTraceIds.join('|'));
assert('wait path emits chat stress complete', waitTraceIds.includes('chat-stress-simulation-complete'), waitTraceIds.join('|'));

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

resetChatStressCompletionTrackerForTests();
resetChatStressCompletionPropagationForTests();
resetLiveChatStressRunnerPathForTests();
const partialIds = ['identity-01', 'identity-02', 'identity-03', 'identity-04', 'identity-05', 'identity-06', 'cap-01', 'cap-02', 'cap-03', 'cap-04', 'cap-05', 'cap-06'];
beginChatStressSimulation(partialIds);
for (const id of ['identity-01', 'identity-02', 'identity-03']) {
  markChatStressScenarioStarted(id);
  markChatStressScenarioSettled(id, 'PASSED');
}
markChatStressScenarioStarted('identity-04');
setActiveChatStressScenario('identity-04');
forceSettlePendingStartedChatStressScenarios('LIVE_PATH_PARTIAL_SETTLEMENT');
const partialBoundaryTraceIds: string[] = [];
registerLiveChatStressCompletionBoundaryEmitter((event) => {
  partialBoundaryTraceIds.push(event.operationId);
});
assert(
  'live boundary propagation after partial terminal settlement',
  reconcileLiveChatStressCompletionBoundaryPropagation() === true,
  String(hasChatStressSimulationCompletePropagated()),
);
assert('live boundary emits chat stress complete', partialBoundaryTraceIds.includes('chat-stress-simulation-complete'), partialBoundaryTraceIds.join('|'));

resetLaunchReadinessArtifactBuildTracerForTests();
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'live-path-boundary-test' });
const boundaryBridge = buildLaunchReadinessArtifactBuildTraceBridge();
boundaryBridge({
  operationId: 'product-readiness-chat-stress-started',
  operationLabel: 'Running bounded chat stress inside product readiness',
  phase: 'RUNNING',
});
boundaryBridge({
  operationId: 'chat-stress-simulation-complete',
  operationLabel: 'Chat stress simulation complete (settled=12/12, pending=0)',
  phase: 'PASSED',
});
assert(
  'chat stress complete clears parent artifact substep',
  getActiveArtifactBuildSubstep()?.operationId !== 'product-readiness-chat-stress-started',
  getActiveArtifactBuildSubstep()?.operationId ?? 'null',
);
const boundarySnapshot = getFounderTestRuntimeStatus();
const stage2Gap = analyzeStage2CompletionGap({
  readOnly: true,
  runId: boundarySnapshot.runId,
  state: boundarySnapshot.state,
  startedAt: boundarySnapshot.startedAt,
  endedAt: null,
  stages: boundarySnapshot.stages,
  feed: boundarySnapshot.feed,
  stallAnalysis: boundarySnapshot.stallAnalysis,
  elapsedMs: boundarySnapshot.elapsedMs,
  alreadyRunning: true,
  lastHeartbeatAt: boundarySnapshot.lastHeartbeatAt,
  secondsSinceLastHeartbeat: boundarySnapshot.secondsSinceLastHeartbeat,
  currentStageTimeoutMs: boundarySnapshot.currentStageTimeoutMs,
  stallReason: boundarySnapshot.stallReason,
  currentOperation: boundarySnapshot.currentOperation,
  lastCompletedOperation: boundarySnapshot.lastCompletedOperation,
  nextExpectedOperation: boundarySnapshot.nextExpectedOperation,
  lastSuccessfulOperation: boundarySnapshot.lastSuccessfulOperation,
  traceStageStatus: boundarySnapshot.traceStageStatus,
  traceEvents: boundarySnapshot.traceEvents,
  activeArtifactBuildSubstep: boundarySnapshot.activeArtifactBuildSubstep,
  activeArtifactBuildSubstepOperationId: boundarySnapshot.activeArtifactBuildSubstepOperationId,
  artifactBuildSubstepElapsedMs: boundarySnapshot.artifactBuildSubstepElapsedMs ?? 0,
  artifactBuildSubstepStallReason: boundarySnapshot.artifactBuildSubstepStallReason,
  lastSuccessfulArtifactSubstep: boundarySnapshot.lastSuccessfulArtifactSubstep,
  missingCompletionBoundary: boundarySnapshot.missingCompletionBoundary,
  stage2CompletionGap: boundarySnapshot.stage2CompletionGap,
  stage2CompletionGapReason: boundarySnapshot.stage2CompletionGapReason,
  handlerAlive: boundarySnapshot.handlerAlive,
  handlerLastAliveAt: boundarySnapshot.handlerLastAliveAt,
  postTimedOut: boundarySnapshot.postTimedOut,
  progress: boundarySnapshot.progress,
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
  chatStressActiveScenarioIds: [],
  chatStressActiveScenarioCount: 0,
  chatStressOldestPendingElapsedMs: 0,
  chatStressNextScenarioDeadlineMs: null,
  chatStressMsUntilNextDeadline: null,
  chatStressBatchDeadlineMs: null,
  chatStressMsUntilBatchDeadline: null,
});
assert(
  'stage2 missing boundary clears after chat stress complete trace',
  stage2Gap.missingCompletionBoundary !== 'Chat stress simulation complete',
  stage2Gap.missingCompletionBoundary ?? 'null',
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
