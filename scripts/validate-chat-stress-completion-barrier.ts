/**
 * Phase 26.51 — Chat Stress Completion Barrier Repair V1 validation.
 * Phase 26.55 — Validator alignment with cap-05 watchdog stall copy.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS,
  allStartedChatStressScenariosSettled,
  beginChatStressSimulation,
  formatChatStressPendingStallReason,
  getChatStressCompletionSnapshot,
  markChatStressScenarioSettled,
  markChatStressScenarioStarted,
  markChatStressScenarioSkippedBudget,
  markChatStressSimulationAggregateComplete,
  registerChatStressScenarioHardWatchdog,
  resetChatStressCompletionTrackerForTests,
  resolveChatStressScenarioTerminalStatus,
  setActiveChatStressScenario,
  shouldFlagChatStressPendingStage2Gap,
  getChatStressScenarioTerminalStatus,
} from '../src/founder-test-chat-stress-simulation/index.js';
import {
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
} from '../src/founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  analyzeStage2CompletionGap,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import { createLaunchReadinessArtifactBuildTraceBridge, getActiveArtifactBuildSubstep } from '../src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import { resetLaunchReadinessArtifactBuildTracerForTests } from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-stress-completion-barrier';

export const CHAT_STRESS_COMPLETION_BARRIER_VALIDATOR_ALIGNMENT_V1_PASS =
  'CHAT_STRESS_COMPLETION_BARRIER_VALIDATOR_ALIGNMENT_V1_PASS';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
  'src/founder-test-chat-stress-simulation/chat-response-simulator.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  'src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const simulatorSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-response-simulator.ts'),
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
const tracerSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts'),
  'utf8',
);
const stage2Source = readFileSync(join(ROOT, 'src/founder-test-runtime-monitor/stage2-completion-tracker.ts'), 'utf8');
const trackerSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts'),
  'utf8',
);
const runtimeTypesSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-types.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('Promise.allSettled barrier', simulatorSource.includes('Promise.allSettled'), 'allSettled');
assert('completion tracker wired', simulatorSource.includes('beginChatStressSimulation'), 'tracker');
assert('terminal status resolver', simulatorSource.includes('resolveChatStressScenarioTerminalStatus'), 'terminal');
assert('aggregate complete guard', authoritySource.includes('allStartedChatStressScenariosSettled'), 'guard');
assert('chat-stress-simulation-complete emit', authoritySource.includes("'chat-stress-simulation-complete'"), 'complete');
assert('terminal trace labels', authoritySource.includes('SKIPPED_BUDGET'), 'skipped budget label');
assert('product readiness waits for chat', orchestratorSource.includes('await runFounderTestChatStressSimulation'), 'await');
assert('product readiness complete after chat', orchestratorSource.indexOf('product-readiness-simulation-complete') > orchestratorSource.indexOf('runFounderTestChatStressSimulation'), 'order');
assert('scenario traces skip artifact mutation', tracerSource.includes('chat-stress-scenario:'), 'skip scenario');
assert('parent substep preserved', tracerSource.includes('chat-stress-simulation-complete'), 'parent');
assert('stage2 uses pending stall formatter', stage2Source.includes('formatChatStressPendingStallReason'), 'formatter wired');
assert('canonical pending stall prefix', trackerSource.includes('waiting on pending scenarios'), 'pending prefix');
assert('canonical watchdog stall suffix', trackerSource.includes('watchdog will force TIMEOUT'), 'watchdog suffix');
assert('watchdog health sweep', trackerSource.includes('reconcileChatStressWatchdogHealth'), 'health sweep');
assert('stage2 stall grace gate', stage2Source.includes('shouldFlagChatStressPendingStage2Gap'), 'grace gate');
assert('chatStressStartedCount field', runtimeTypesSource.includes('chatStressStartedCount'), 'started count');
assert('chatStressPendingScenarioIds field', runtimeTypesSource.includes('chatStressPendingScenarioIds'), 'pending ids');
assert('no scoring changes', !authoritySource.includes('overrideLaunchVerdict') && !orchestratorSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic changes', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:chat-stress-completion-barrier": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-01', 'cap-02', 'cap-03']);
markChatStressScenarioStarted('cap-01');
markChatStressScenarioSettled('cap-01', 'PASSED');
markChatStressScenarioStarted('cap-02');
const midSnap = getChatStressCompletionSnapshot();
assert('mid-run pending count', midSnap.pendingCount === 2, String(midSnap.pendingCount));
assert('mid-run pending ids include cap-02', midSnap.pendingScenarioIds.includes('cap-02'), midSnap.pendingScenarioIds.join(','));
assert('mid-run not aggregate complete', midSnap.aggregateComplete === false, String(midSnap.aggregateComplete));
assert('mid-run not all settled', allStartedChatStressScenariosSettled() === false, 'settled early');

markChatStressScenarioSettled('cap-02', 'TIMEOUT');
markChatStressScenarioSkippedBudget('cap-03');
markChatStressSimulationAggregateComplete();
const finalSnap = getChatStressCompletionSnapshot();
assert('all scenarios settled', allStartedChatStressScenariosSettled(), 'not settled');
assert('zero pending after settle', finalSnap.pendingCount === 0, String(finalSnap.pendingCount));

const timeoutTerminal = resolveChatStressScenarioTerminalStatus({ timedOut: true, skipped: false });
const budgetTerminal = resolveChatStressScenarioTerminalStatus({ skipped: true, skipReason: 'SIMULATION_BUDGET_EXCEEDED' });
assert('TIMEOUT terminal mapping', timeoutTerminal === 'TIMEOUT', timeoutTerminal);
assert('SKIPPED_BUDGET terminal mapping', budgetTerminal === 'SKIPPED_BUDGET', budgetTerminal);

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
  operationId: 'chat-stress-scenario:cap-01',
  operationLabel: 'Running chat stress scenario: cap-01',
  phase: 'RUNNING',
});
const activeAfterScenarioStart = getActiveArtifactBuildSubstep();
assert(
  'active sub-step not replaced by scenario trace',
  activeAfterScenarioStart?.operationId === 'product-readiness-chat-stress-started',
  activeAfterScenarioStart?.operationId ?? 'null',
);
bridge({
  operationId: 'chat-stress-scenario:cap-01',
  operationLabel: 'Chat stress scenario complete: cap-01',
  phase: 'PASSED',
});
const activeAfterScenarioComplete = getActiveArtifactBuildSubstep();
assert(
  'active sub-step not cleared by scenario complete',
  activeAfterScenarioComplete?.operationId === 'product-readiness-chat-stress-started',
  activeAfterScenarioComplete?.operationId ?? 'null',
);
bridge({
  operationId: 'product-readiness-chat-stress-complete',
  operationLabel: 'Chat stress complete',
  phase: 'PASSED',
});
assert('parent cleared after product readiness chat complete', getActiveArtifactBuildSubstep() === null, 'still active');

resetFounderTestRuntimeMonitorForTests();
resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-02', 'cap-03']);
markChatStressScenarioStarted('cap-02');
registerChatStressScenarioHardWatchdog({
  scenarioId: 'cap-02',
  timeoutMs: 1,
  onFired: () => undefined,
});
markChatStressScenarioStarted('cap-03');
setActiveChatStressScenario(null);
registerChatStressScenarioHardWatchdog({
  scenarioId: 'cap-03',
  timeoutMs: 60_000,
  onFired: () => undefined,
});
await new Promise((resolve) => setTimeout(resolve, 25));
const earlyPendingSnap = getChatStressCompletionSnapshot();
assert('overdue cap-02 force-settled', getChatStressScenarioTerminalStatus('cap-02') === 'TIMEOUT', getChatStressScenarioTerminalStatus('cap-02') ?? 'null');
assert('cap-03 still pending before grace', earlyPendingSnap.pendingScenarioIds.includes('cap-03'), earlyPendingSnap.pendingScenarioIds.join(','));
assert(
  'Stage 2 not stalled before hard timeout + grace',
  shouldFlagChatStressPendingStage2Gap({
    pendingCount: earlyPendingSnap.pendingCount,
    chatStressWatchdogOverdueScenarioIds: [],
    chatStressMaxPendingElapsedMs: 14_000,
    hardTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
    graceMs: CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
    secondsSinceLastHeartbeat: 5,
  }) === false,
  String(earlyPendingSnap.chatStressMaxPendingElapsedMs),
);
assert(
  'Stage 2 stalls when grace exceeded',
  shouldFlagChatStressPendingStage2Gap({
    pendingCount: 1,
    chatStressWatchdogOverdueScenarioIds: [],
    chatStressMaxPendingElapsedMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS + CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
    hardTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
    graceMs: CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
    secondsSinceLastHeartbeat: 5,
  }) === true,
  'grace gate',
);
const pendingStallCopy = formatChatStressPendingStallReason({
  ...earlyPendingSnap,
  pendingScenarioIds: ['cap-02', 'cap-03'],
  pendingCount: 2,
  pendingWithoutActiveWorkerScenarioIds: ['cap-03'],
  activeScenarioId: null,
});
assert('pending stall lists cap-03', pendingStallCopy.includes('cap-03'), pendingStallCopy);
assert(
  'pending stall flags when watchdog overdue',
  shouldFlagChatStressPendingStage2Gap({
    pendingCount: 1,
    chatStressWatchdogOverdueScenarioIds: ['cap-03'],
    chatStressMaxPendingElapsedMs: earlyPendingSnap.chatStressMaxPendingElapsedMs,
    hardTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
    graceMs: CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
    secondsSinceLastHeartbeat: 5,
  }) === true,
  earlyPendingSnap.chatStressWatchdogOverdueScenarioIds.join(','),
);
const gap = analyzeStage2CompletionGap({
  readOnly: true,
  runId: 'gap-run',
  state: 'RUNNING',
  startedAt: new Date().toISOString(),
  endedAt: null,
  progress: {
    readOnly: true,
    currentStage: 'INTAKE_VALIDATION',
    currentStageLabel: 'Intake Validation',
    currentStageOrder: 2,
    totalStages: 11,
    completedStages: 1,
    remainingStages: 9,
    percentComplete: 10,
    elapsedMs: 5000,
    estimatedRemainingMs: null,
  },
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
    stageElapsedMs: 5000,
    stageAverageMs: null,
    warningMessage: null,
    stallReason: null,
    currentStageTimeoutMs: null,
    secondsSinceLastHeartbeat: 5,
  },
  elapsedMs: 5000,
  alreadyRunning: true,
  lastHeartbeatAt: new Date().toISOString(),
  secondsSinceLastHeartbeat: 5,
  currentStageTimeoutMs: null,
  stallReason: null,
  currentOperation: null,
  lastCompletedOperation: null,
  nextExpectedOperation: 'Chat stress simulation complete',
  lastSuccessfulOperation: null,
  traceStageStatus: 'RUNNING',
  traceEvents: [],
  activeArtifactBuildSubstep: 'Running bounded chat stress inside product readiness',
  activeArtifactBuildSubstepOperationId: 'product-readiness-chat-stress-started',
  artifactBuildSubstepElapsedMs: 5000,
  artifactBuildSubstepStallReason: null,
  lastSuccessfulArtifactSubstep: null,
  missingCompletionBoundary: null,
  stage2CompletionGap: false,
  stage2CompletionGapReason: null,
  handlerAlive: true,
  handlerLastAliveAt: new Date().toISOString(),
  postTimedOut: false,
  chatStressStartedCount: 1,
  chatStressSettledCount: 0,
  chatStressPendingCount: 2,
  chatStressLastScenario: 'cap-02',
  chatStressPendingScenarioIds: ['cap-02', 'cap-03'],
  chatStressActiveScenarioId: 'cap-02',
  chatStressLastSettledScenarioId: null,
  chatStressTimeoutScenarioIds: [],
  chatStressFailedScenarioIds: [],
  chatStressWatchdogArmedScenarioIds: earlyPendingSnap.chatStressWatchdogArmedScenarioIds,
  chatStressWatchdogDeadlineByScenarioId: earlyPendingSnap.chatStressWatchdogDeadlineByScenarioId,
  chatStressWatchdogOverdueScenarioIds: earlyPendingSnap.chatStressWatchdogOverdueScenarioIds,
  chatStressMaxPendingElapsedMs: earlyPendingSnap.chatStressMaxPendingElapsedMs,
});
assert(
  'analyzeStage2 gap false before grace while cap-03 pending',
  gap.stage2CompletionGap === false,
  gap.stage2CompletionGapReason ?? 'null',
);

resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-05', 'cap-06']);
markChatStressScenarioStarted('cap-05');
const cap05Snap = getChatStressCompletionSnapshot();
const cap05Stall = formatChatStressPendingStallReason(cap05Snap);
assert(
  'cap-05 orphan pending stall copy',
  cap05Stall.includes('cap-05') && cap05Stall.includes('watchdog will force TIMEOUT'),
  cap05Stall,
);

const runtimeSnap = getFounderTestRuntimeStatus();
assert('runtime snapshot exposes chat stress counts', typeof runtimeSnap.chatStressPendingCount === 'number', 'type');

const report = [
  '# Chat Stress Completion Barrier Repair Report',
  '',
  '## Root Cause',
  '',
  '- Per-scenario artifact sub-step traces cleared `activeArtifactBuildSubstep` after the first scenario completed.',
  '- Concurrent worker pool could leave started scenarios unsettled while aggregate completion was attempted.',
  '- Stage 2 stall reason only reported missing completion boundary, not pending scenario IDs.',
  '',
  '## Concurrency / Completion Barrier Fix',
  '',
  '- Batch simulator uses indexed worker pool + `Promise.allSettled` and tracks every scenario to a terminal status.',
  '- Aggregate `chat-stress-simulation-complete` fires only after `allStartedChatStressScenariosSettled()`.',
  '- Artifact tracer ignores per-scenario chat stress traces for sub-step mutation.',
  '',
  '## Scenario Lifecycle Proof',
  '',
  '- Terminal statuses: PASSED, FAILED, TIMEOUT, SKIPPED_BUDGET, ERROR.',
  '- Per-scenario timeout via `withScenarioTimeout`; budget overflow assigns SKIPPED_BUDGET.',
  '',
  '## Runtime Snapshot Proof',
  '',
  '- Snapshot fields: chatStressStartedCount, chatStressSettledCount, chatStressPendingCount, chatStressLastScenario, chatStressPendingScenarioIds.',
  '',
  '## Validation Results',
  '',
  `- Validator checks: ${results.length}`,
  '',
  '## Validator Alignment (Phase 26.55)',
  '',
  '- Stall reasons use `formatChatStressPendingStallReason` with watchdog suffix for orphan pending scenarios.',
  '',
  '## Remaining Risks',
  '',
  '- Live LLM latency can still consume budget before all scenarios start.',
  '- Partial/degraded chat stress results remain honest when budget forces SKIPPED_BUDGET.',
  '',
  '---',
  '',
  `Pass token: ${CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS}`,
  `Alignment token: ${CHAT_STRESS_COMPLETION_BARRIER_VALIDATOR_ALIGNMENT_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'CHAT_STRESS_COMPLETION_BARRIER_REPAIR_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture/CHAT_STRESS_COMPLETION_BARRIER_REPAIR_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Chat Stress Completion Barrier validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Chat Stress Completion Barrier validation PASSED (${results.length} checks)`);
console.log(CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS);
console.log(CHAT_STRESS_COMPLETION_BARRIER_VALIDATOR_ALIGNMENT_V1_PASS);
