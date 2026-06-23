/**
 * Phase 26.86 — Stage 2 Chat Stress Boundary Observability Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmChatRequest, LlmChatResponse, LlmProvider } from '../src/llm-chat-brain/llm-provider-types.js';
import { loadLlmModelConfig } from '../src/llm-chat-brain/llm-provider.js';
import {
  beginChatStressSimulation,
  countChatStressScenarios,
  getChatStressCompletionSnapshot,
  hasChatStressSimulationCompletePropagated,
  isChatStressSimulationComplete,
  listChatStressScenarios,
  markChatStressScenarioSettled,
  markChatStressScenarioStarted,
  recordChatStressCompletionConditionSatisfied,
  resetChatStressCompletionPropagationForTests,
  resetChatStressCompletionTrackerForTests,
  resetChatStressSimulationForTests,
  runFounderTestChatStressSimulation,
} from '../src/founder-test-chat-stress-simulation/index.js';
import type { FounderTestRuntimeTraceEvent } from '../src/founder-test-runtime-monitor/founder-test-runtime-types.js';
import {
  STAGE2_CHAT_STRESS_BOUNDARY_OBSERVABILITY_REPAIR_V1_PASS,
  analyzeStage2CompletionGap,
  STAGE2_CHAT_STRESS_RUNTIME_FIELD_DEFAULTS,
  hasPassedTraceEvent,
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES,
  resolveMissingIntakeCompletionBoundary,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-stage2-chat-stress-boundary-observability';

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
      /* hang until per-scenario timeout */
    });
  }
}

const REQUIRED = [
  'src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-authority.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.ts',
  'src/founder-test-chat-stress-simulation/chat-stress-settlement-boundary.ts',
  'architecture/STAGE2_CHAT_STRESS_BOUNDARY_OBSERVABILITY_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const stage2Source = readFileSync(join(ROOT, 'src/founder-test-runtime-monitor/stage2-completion-tracker.ts'), 'utf8');
const authoritySource = readFileSync(join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-authority.ts'), 'utf8');
const propagationSource = readFileSync(
  join(ROOT, 'src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.ts'),
  'utf8',
);
const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-product-readiness/product-readiness-orchestrator.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');
const reportSource = readFileSync(
  join(ROOT, 'architecture/STAGE2_CHAT_STRESS_BOUNDARY_OBSERVABILITY_REPAIR_REPORT.md'),
  'utf8',
);

assert('stage2 settlement bridge', stage2Source.includes('isChatStressSimulationCompleteBoundarySatisfied'), 'bridge helper');
assert('stage2 chat-only bridge guard', stage2Source.includes("operationId === 'chat-stress-simulation-complete'"), 'chat-only');
assert('early boundary persistence in propagation', propagationSource.includes('isChatStressSimulationComplete'), 'propagation bridge');
assert('settlement boundary trace in authority', authoritySource.includes('chat-stress-boundary-satisfied-by-settlement'), 'trace');
assert('scenario count unchanged', countChatStressScenarios() >= 12, String(countChatStressScenarios()));
assert('no scoring changes', !authoritySource.includes('overrideLaunchVerdict') && !orchestratorSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic changes', !orchestratorSource.includes('setLaunchVerdictOverride'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`execSync('npm run validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:stage2-chat-stress-boundary-observability": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);
assert('report includes success token', reportSource.includes(STAGE2_CHAT_STRESS_BOUNDARY_OBSERVABILITY_REPAIR_V1_PASS), 'token');

const emptyTrace: FounderTestRuntimeTraceEvent[] = [];

resetChatStressCompletionTrackerForTests();
resetChatStressCompletionPropagationForTests();
const twelveScenarios = listChatStressScenarios(12);
assert('twelve scenarios preserved', twelveScenarios.length === 12, String(twelveScenarios.length));
beginChatStressSimulation(twelveScenarios.map((entry) => entry.id));
for (const scenario of twelveScenarios) {
  markChatStressScenarioStarted(scenario.id);
  markChatStressScenarioSettled(scenario.id, 'TIMEOUT');
}
const settledSnap = getChatStressCompletionSnapshot();
assert('settled=12', settledSnap.settledCount === 12, String(settledSnap.settledCount));
assert('pending=0', settledSnap.pendingCount === 0, String(settledSnap.pendingCount));
assert('isChatStressSimulationComplete true', isChatStressSimulationComplete(), String(isChatStressSimulationComplete()));
assert(
  'stage2 recognizes settlement without trace/registry',
  hasPassedTraceEvent(emptyTrace, 'chat-stress-simulation-complete'),
  'boundary not satisfied',
);
const missingAfterSettlement = resolveMissingIntakeCompletionBoundary(emptyTrace);
assert(
  'settled=12 pending=0 does not missing chat boundary',
  missingAfterSettlement !== 'Chat stress simulation complete',
  missingAfterSettlement ?? 'null',
);
assert(
  'only chat-stress-simulation-complete bridged by settlement',
  hasPassedTraceEvent(emptyTrace, 'product-readiness-simulation-complete') === false,
  'product readiness incorrectly bridged',
);
assert(
  'launch readiness assessment not bridged by settlement',
  hasPassedTraceEvent(emptyTrace, 'launch-readiness-assessment-complete') === false,
  'launch assessment incorrectly bridged',
);

resetChatStressCompletionTrackerForTests();
resetChatStressCompletionPropagationForTests();
beginChatStressSimulation(twelveScenarios.map((entry) => entry.id));
for (const scenario of twelveScenarios) {
  markChatStressScenarioStarted(scenario.id);
  markChatStressScenarioSettled(scenario.id, 'TIMEOUT');
}
recordChatStressCompletionConditionSatisfied();
assert(
  'recordChatStressCompletionConditionSatisfied persists chat boundary',
  hasChatStressSimulationCompletePropagated(),
  'registry miss',
);
assert(
  'post-settlement registry satisfies stage2 before aggregate complete trace',
  hasPassedTraceEvent([], 'chat-stress-simulation-complete'),
  'post-settlement gap',
);

resetFounderTestRuntimeMonitorForTests();
const stage2Gap = analyzeStage2CompletionGap({
  readOnly: true,
  runId: 'settlement-bridge-test',
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
  nextExpectedOperation: 'Product readiness simulation complete',
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
    totalStages: 11,
    completedStages: 1,
    remainingStages: 9,
    percentComplete: 10,
    elapsedMs: 5000,
    estimatedRemainingMs: null,
  },
  chatStressStartedCount: settledSnap.startedCount,
  chatStressSettledCount: settledSnap.settledCount,
  chatStressPendingCount: settledSnap.pendingCount,
  chatStressLastScenario: settledSnap.lastScenarioId,
  chatStressPendingScenarioIds: settledSnap.pendingScenarioIds,
  chatStressActiveScenarioId: settledSnap.activeScenarioId,
  chatStressLastSettledScenarioId: settledSnap.lastSettledScenarioId,
  chatStressTimeoutScenarioIds: settledSnap.timeoutScenarioIds,
  chatStressFailedScenarioIds: settledSnap.failedScenarioIds,
  chatStressWatchdogArmedScenarioIds: settledSnap.chatStressWatchdogArmedScenarioIds,
  chatStressWatchdogDeadlineByScenarioId: settledSnap.chatStressWatchdogDeadlineByScenarioId,
  chatStressWatchdogOverdueScenarioIds: settledSnap.chatStressWatchdogOverdueScenarioIds,
  chatStressMaxPendingElapsedMs: settledSnap.chatStressMaxPendingElapsedMs,
  ...STAGE2_CHAT_STRESS_RUNTIME_FIELD_DEFAULTS,
});
assert(
  'post-settlement delay cannot trigger missing chat boundary',
  stage2Gap.missingCompletionBoundary !== 'Chat stress simulation complete',
  stage2Gap.missingCompletionBoundary ?? 'null',
);
assert(
  'intake boundary list unchanged',
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES[0]?.operationId === 'chat-stress-simulation-complete',
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES[0]?.operationId ?? 'missing',
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
const settlementTraceIndex = operationIds.indexOf('chat-stress-boundary-satisfied-by-settlement');
const completeTraceIndex = operationIds.indexOf('chat-stress-simulation-complete');
assert('settlement boundary trace emitted', settlementTraceIndex >= 0, operationIds.join('|'));
assert(
  'settlement trace precedes aggregate complete trace',
  settlementTraceIndex >= 0 && completeTraceIndex >= 0 && settlementTraceIndex < completeTraceIndex,
  `${settlementTraceIndex}|${completeTraceIndex}`,
);

const failed = results.filter((entry) => !entry.passed);
const passToken = STAGE2_CHAT_STRESS_BOUNDARY_OBSERVABILITY_REPAIR_V1_PASS;
const validationSummary = [
  '# Stage 2 Chat Stress Boundary Observability Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'STAGE2_CHAT_STRESS_BOUNDARY_OBSERVABILITY_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
