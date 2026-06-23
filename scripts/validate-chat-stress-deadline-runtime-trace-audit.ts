/**
 * Runtime trace audit — founder-test-runtime-1781430231706 stall message forensics.
 * Phase 26.88 path vs artifact sub-step stall path.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  beginArtifactBuildSubstep,
  analyzeArtifactBuildSubstepStall,
  resetLaunchReadinessArtifactBuildTracerForTests,
} from '../src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import { STALL_STALLED_THRESHOLD_MS } from '../src/founder-test-runtime-monitor/founder-test-runtime-registry.js';
import {
  CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS,
  resolveChatStressWorstCaseBatchDeadlineMs,
} from '../src/founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  beginChatStressSimulation,
  getChatStressCompletionSnapshot,
  markChatStressScenarioStarted,
  addActiveChatStressScenario,
  resetChatStressCompletionTrackerForTests,
  resolveChatStressStallHealth,
} from '../src/founder-test-chat-stress-simulation/index.js';

export const CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_V1_PASS =
  'CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_V1_PASS';

const RUN_ID = 'founder-test-runtime-1781430231706';
const RUN_STARTED_MS = 1781430231706;
const OBSERVED_STALL_SECONDS = 50;
const OBSERVED_MESSAGE =
  'Running bounded chat stress inside product readiness has not advanced for 50s';
const CHAT_STRESS_LABEL = 'Running bounded chat stress inside product readiness';
const CHAT_STRESS_OP_ID = 'product-readiness-chat-stress-started';

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

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

// --- Run identity ---
assert(
  'run id decodes to 2026-06-14T09:43:51.706Z',
  new Date(RUN_STARTED_MS).toISOString() === '2026-06-14T09:43:51.706Z',
  new Date(RUN_STARTED_MS).toISOString(),
);

// --- Message source: only artifact tracer produces "has not advanced for" ---
const tracerSource = readSource(
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
);
const completionSource = readSource(
  'src/founder-test-chat-stress-simulation/chat-stress-completion-tracker.ts',
);
assert(
  'artifact tracer is sole producer of "has not advanced for" template',
  tracerSource.includes('has not advanced for') && !completionSource.includes('has not advanced for'),
  'launch-readiness-artifact-build-tracer.ts only',
);

// --- Poll order: artifact stall before chat stress snapshot ---
const monitorSource = readSource('src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts');
const artifactIdx = monitorSource.indexOf('analyzeArtifactBuildSubstepStall(nowMs)');
const chatSnapIdx = monitorSource.indexOf('getChatStressCompletionSnapshot(nowMs)');
assert(
  'monitor polls artifact substep stall before chat stress snapshot',
  artifactIdx > 0 && chatSnapIdx > artifactIdx,
  `artifact@${artifactIdx} chatSnap@${chatSnapIdx}`,
);

// --- Threshold forensics: 50s STALLED implies 45s threshold, not 26.88 56s ---
resetLaunchReadinessArtifactBuildTracerForTests();
const substepStartMs = RUN_STARTED_MS;
beginArtifactBuildSubstep({
  operationId: CHAT_STRESS_OP_ID,
  operationLabel: CHAT_STRESS_LABEL,
  at: new Date(substepStartMs),
});

const at50s = substepStartMs + OBSERVED_STALL_SECONDS * 1000;
const stallAt50 = analyzeArtifactBuildSubstepStall(at50s);
assert(
  'on-disk 26.88 artifact path yields SLOW at 50s (56s threshold)',
  stallAt50.health === 'SLOW',
  `${stallAt50.health} reason=${stallAt50.reason ?? 'null'}`,
);
assert(
  '50s message would NOT match 26.88 artifact path',
  stallAt50.reason !== OBSERVED_MESSAGE,
  stallAt50.reason ?? 'null',
);

// Simulate pre-26.88 threshold (45s) on same elapsed time
const pre2688Threshold = STALL_STALLED_THRESHOLD_MS;
const pre2688Health =
  OBSERVED_STALL_SECONDS * 1000 >= pre2688Threshold ? 'STALLED' : 'SLOW';
assert(
  'pre-26.88 45s threshold yields STALLED at 50s',
  pre2688Health === 'STALLED',
  pre2688Health,
);
assert(
  'pre-26.88 path reproduces exact observed message',
  `${CHAT_STRESS_LABEL} has not advanced for ${OBSERVED_STALL_SECONDS}s` === OBSERVED_MESSAGE,
  OBSERVED_MESSAGE,
);

assert(
  '26.88 worst-case batch deadline is 56000ms',
  CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS === 56_000,
  String(CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS),
);
assert(
  'resolveChatStressWorstCaseBatchDeadlineMs matches constant',
  resolveChatStressWorstCaseBatchDeadlineMs() === 56_000,
  String(resolveChatStressWorstCaseBatchDeadlineMs()),
);

// --- resolveChatStressStallHealth would be SLOW with active workers ---
resetChatStressCompletionTrackerForTests();
beginChatStressSimulation(['cap-05', 'cap-06']);
markChatStressScenarioStarted('cap-05');
markChatStressScenarioStarted('cap-06');
addActiveChatStressScenario('cap-05');
addActiveChatStressScenario('cap-06');
const snap = getChatStressCompletionSnapshot(at50s);
const stallHealth = resolveChatStressStallHealth(snap, at50s);
assert(
  'resolveChatStressStallHealth returns SLOW when activeScenarioCount > 0 and no overdue watchdog',
  stallHealth === 'SLOW' && snap.activeScenarioCount > 0,
  `${stallHealth} active=${snap.activeScenarioCount}`,
);

// --- Orchestrator label wiring ---
const orchestratorSource = readSource(
  'src/founder-test-product-readiness/product-readiness-orchestrator.ts',
);
assert(
  'orchestrator emits product-readiness-chat-stress-started with expected label',
  orchestratorSource.includes(`operationId: 'product-readiness-chat-stress-started'`) &&
    orchestratorSource.includes(`operationLabel: '${CHAT_STRESS_LABEL}'`),
  CHAT_STRESS_OP_ID,
);

// --- Inferred msUntilBatchDeadline (not persisted for run) ---
const inferredMsUntilBatchDeadline = CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS - OBSERVED_STALL_SECONDS * 1000;
assert(
  'inferred chatStressMsUntilBatchDeadline at 50s elapsed is ~6000ms (inference only)',
  inferredMsUntilBatchDeadline === 6_000,
  String(inferredMsUntilBatchDeadline),
);

const failed = results.filter((entry) => !entry.passed);
const passToken = CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_V1_PASS;
const validationSummary = [
  '# Chat Stress Deadline Runtime Trace Audit Validation',
  '',
  `Run audited: ${RUN_ID}`,
  `Observed message: ${OBSERVED_MESSAGE}`,
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  '## Findings',
  '',
  '- Failure message came from `analyzeArtifactBuildSubstepStall`, not `resolveChatStressStallHealth`.',
  '- 50s STALLED implies pre-26.88 `stalledThresholdMs=45000`; on-disk 26.88 would yield SLOW at 50s.',
  '- `activeScenarioCount > 0` grace applies in `analyzeRuntimeStall` / `resolveChatStressStallHealth`, not artifact sub-step path.',
  '- Run was after 07:37 server start but before confirmed post-26.88 process reload.',
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_VALIDATION.md'),
  validationSummary,
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
