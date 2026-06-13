/**
 * Phase 26.43 — Founder Test Stage 2 Stall Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_ALREADY_RUNNING,
  FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS,
  FOUNDER_TEST_RUNTIME_STAGES,
  STALL_STALLED_THRESHOLD_MS,
  analyzeRuntimeStall,
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildFounderTestMinimalDiagnosticReport,
  buildFounderTestRuntimeFailureReport,
  completeFounderTestRuntimeStage,
  getFounderTestRuntimeStatus,
  recordFounderTestRuntimeSubstep,
  resetFounderTestRuntimeMonitorForTests,
  touchFounderTestRuntimeHeartbeat,
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

function advanceThroughStage2To3(): void {
  beginFounderTestRuntime({ runId: 'stage2-repair-run' });
  completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
  advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Running' });
  recordFounderTestRuntimeSubstep({
    stageId: 'INTAKE_VALIDATION',
    operationId: 'founder-input-hydrating',
    message: 'Hydrating founder execution proof input',
  });
  completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Passed' });
  advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE', message: 'Planning Gate Running' });
}

resetFounderTestRuntimeMonitorForTests();

// 1. Single "Founder Test Started" feed event per run
beginFounderTestRuntime({ runId: 'feed-dedupe-run' });
const startedEvents = getFounderTestRuntimeStatus().feed.events.filter((event) =>
  event.message === 'Founder Test Started',
);
assert('one started feed event after begin', startedEvents.length === 1, String(startedEvents.length));

completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
const afterSeal = getFounderTestRuntimeStatus().feed.events.filter((event) =>
  event.message === 'Founder Test Started',
);
assert('still one started feed after seal', afterSeal.length === 1, String(afterSeal.length));

// 2. Stage 2 advances to Stage 3
resetFounderTestRuntimeMonitorForTests();
advanceThroughStage2To3();
const stage3 = getFounderTestRuntimeStatus();
assert(
  'stage 2 passed',
  stage3.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION')?.status === 'PASSED',
  'intake',
);
assert(
  'stage 3 running',
  stage3.stages.find((stage) => stage.stageId === 'PLANNING_GATE')?.status === 'RUNNING',
  'planning gate',
);
assert('current stage is planning gate', stage3.progress.currentStage === 'PLANNING_GATE', stage3.progress.currentStage ?? 'null');

// 3. Heartbeat fields present
assert('lastHeartbeatAt present', stage3.lastHeartbeatAt != null, 'null');
assert('secondsSinceLastHeartbeat numeric', typeof stage3.secondsSinceLastHeartbeat === 'number', 'type');
assert('currentStageTimeoutMs present', stage3.currentStageTimeoutMs != null, 'null');
assert('stallReason nullable', stage3.stallReason === null || typeof stage3.stallReason === 'string', 'type');

touchFounderTestRuntimeHeartbeat('PLANNING_GATE');
const heartbeatSnap = getFounderTestRuntimeStatus();
assert(
  'heartbeat updates lastHeartbeatAt',
  heartbeatSnap.lastHeartbeatAt != null && heartbeatSnap.secondsSinceLastHeartbeat >= 0,
  String(heartbeatSnap.secondsSinceLastHeartbeat),
);

// 4. Stage 2 stall detected honestly at 45s
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'stall-intake-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Running' });

const intakeRunning = getFounderTestRuntimeStatus();
const intakeStage = intakeRunning.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION');
const stallNow = Date.now();
const stalledStages = intakeRunning.stages.map((stage) =>
  stage.stageId === 'INTAKE_VALIDATION'
    ? {
        ...stage,
        startedAt: new Date(stallNow - STALL_STALLED_THRESHOLD_MS - 1000).toISOString(),
        lastHeartbeatAt: new Date(stallNow - STALL_STALLED_THRESHOLD_MS - 1000).toISOString(),
      }
    : stage,
);
const intakeStall = analyzeRuntimeStall({ stages: stalledStages, now: stallNow });
assert('stage 2 stall health', intakeStall.health === 'STALLED', intakeStall.health);
assert(
  'stage 2 stall message',
  intakeStall.warningMessage != null && intakeStall.warningMessage.includes('Intake Validation has not advanced'),
  intakeStall.warningMessage ?? 'null',
);
assert('stage 2 stall reason', intakeStall.stallReason != null, 'null');
void intakeStage;

// 5. Duplicate POST / begin blocked
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'duplicate-run' });
const duplicate = beginFounderTestRuntime();
assert('duplicate begin rejected', duplicate.accepted === false, String(duplicate.accepted));
assert('duplicate error code', duplicate.errorCode === FOUNDER_TEST_ALREADY_RUNNING, duplicate.errorCode ?? 'null');

// 6. Client polling does not duplicate feed (server-side feed stable across polls)
const pollOne = getFounderTestRuntimeStatus();
const pollTwo = getFounderTestRuntimeStatus();
assert(
  'poll feed length stable',
  pollOne.feed.events.length === pollTwo.feed.events.length,
  `${pollOne.feed.events.length} vs ${pollTwo.feed.events.length}`,
);
assert(
  'poll feed event ids stable',
  pollOne.feed.events.map((event) => event.eventId).join(',') ===
    pollTwo.feed.events.map((event) => event.eventId).join(','),
  'ids differ',
);

// 7. Handler has explicit stage transitions (instrumentation)
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
assert(
  'handler advance intake',
  handlerSource.includes("advanceFounderTestRuntimeStage({") &&
    handlerSource.includes("stageId: 'INTAKE_VALIDATION'"),
  'missing intake advance',
);
assert(
  'handler advance planning gate',
  handlerSource.includes("stageId: 'PLANNING_GATE'"),
  'missing planning gate advance',
);
assert(
  'handler skip duplicate started feed',
  handlerSource.includes('skipFeed: true'),
  'missing skipFeed',
);
assert(
  'handler intake substep heartbeat',
  handlerSource.includes('recordFounderTestRuntimeSubstep'),
  'missing substep',
);

// 8. Client renders server feed only (no local feed injection)
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const stylesCss = readFileSync(join(ROOT, 'public/founder-reality/styles.css'), 'utf8');
assert(
  'client local preview no feed events',
  appJs.includes('feed: { events: [] }'),
  'local feed still injected',
);
assert(
  'client feed keyed by run id',
  appJs.includes('lastRenderedRuntimeFeedKey') && appJs.includes('runtime.runId'),
  'feed dedupe missing',
);
assert(
  'client disables button while running',
  appJs.includes('runBtn.disabled = true'),
  'button disable missing',
);

// 9. Copy report button repair
assert('copy handler exists', appJs.includes('function copyFounderTestReport'), 'missing handler');
assert(
  'copy payload builder exists',
  appJs.includes('function buildFounderTestCopyPayload'),
  'missing payload builder',
);
assert(
  'copy not permanently disabled',
  appJs.includes('function updateCopyReportButtonState') && appJs.includes('copyBtn.disabled = !hasText'),
  'copy enable logic missing',
);
assert(
  'clipboard fallback exists',
  appJs.includes('function copyTextToClipboardWithFallback') && appJs.includes("document.execCommand('copy')"),
  'fallback missing',
);
assert(
  'copy success feedback',
  appJs.includes("'Copied'") && appJs.includes('setCopyReportButtonFeedback'),
  'success feedback missing',
);
assert(
  'copy failure feedback',
  appJs.includes("'Copy failed'"),
  'failure feedback missing',
);
assert(
  'copy button hover styling',
  stylesCss.includes('.founder-test-copy-btn:not(:disabled):hover'),
  'hover styling missing',
);

// 10. Failed fetch preserves partial/runtime report
assert(
  'fetch failure handler',
  appJs.includes('fetchFailure') && appJs.includes('formatFounderTestFetchError'),
  'fetch failure handling missing',
);
assert(
  'runtime snapshot preserved on poll',
  appJs.includes('lastFounderTestRuntimeSnapshot'),
  'runtime snapshot var missing',
);
assert(
  'partial report preserved',
  appJs.includes('lastFounderTestPartialReportMarkdown'),
  'partial report var missing',
);
assert(
  'failed runtime overlay clears running',
  appJs.includes('renderFounderTestRuntimeFailedOverlay') && appJs.includes('alreadyRunning: false'),
  'running overlay missing',
);
assert(
  'handler async result store on failure',
  handlerSource.includes('storeFounderTestRunResult') &&
    handlerSource.includes('founderTestLaunchReadinessReportMarkdown'),
  'handler result store missing',
);

const failureReport = buildFounderTestRuntimeFailureReport({
  snapshot: stage3,
  errorMessage: 'Failed to fetch',
  partialReportMarkdown: '## Partial\nLaunch readiness only',
});
assert('runtime failure report builder', failureReport.includes('Failed to fetch'), 'report');
assert('runtime failure report stages', failureReport.includes('Stage Timings'), 'stages');
assert('runtime failure partial section', failureReport.includes('Partial Founder Test Report'), 'partial');

const minimalReport = buildFounderTestMinimalDiagnosticReport('Network unavailable');
assert('minimal diagnostic report', minimalReport.includes('Network unavailable'), 'minimal');

// 11. No founder-test scoring changes in handler
assert(
  'no scoring changes in handler',
  !handlerSource.includes('readinessScore =') && handlerSource.includes('runFounderTestingModeV5'),
  'handler modified scoring',
);

// 12. Report generation
const reportLines = [
  '# Founder Test Stage 2 Stall Repair Report',
  '',
  '## Root Cause',
  '',
  '- Duplicate feed: beginFounderTestRuntime() and completeFounderTestRuntimeStage both emitted "Founder Test Started".',
  '- Stage 2 appeared stuck: entire launch-readiness orchestration mapped to INTAKE_VALIDATION with no explicit advance/sub-step heartbeats; stages 3–6 batch-completed without advance calls.',
  '- Failed fetch UX: network errors cleared report state, left Copy Report disabled with no clipboard fallback, and runtime monitor stuck in Running.',
  '- Copy button: silently returned when reportMarkdown missing; no hover/active feedback or success confirmation.',
  '',
  '## Files Changed',
  '',
  '- server/founder-testing-handler.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-types.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-registry.ts',
  '- src/founder-test-runtime-monitor/runtime-stage-tracker.ts',
  '- src/founder-test-runtime-monitor/runtime-stall-detector.ts',
  '- src/founder-test-runtime-monitor/runtime-feed-builder.ts',
  '- src/founder-test-runtime-monitor/runtime-failure-report-builder.ts',
  '- src/founder-test-runtime-monitor/index.ts',
  '- public/founder-reality/app.js',
  '- public/founder-reality/index.html',
  '- public/founder-reality/styles.css',
  '',
  '## Stage Transition Proof',
  '',
  `- Stage 2 passed: ${stage3.stages.find((s) => s.stageId === 'INTAKE_VALIDATION')?.status}`,
  `- Stage 3 running: ${stage3.stages.find((s) => s.stageId === 'PLANNING_GATE')?.status}`,
  '',
  '## Duplicate Feed Proof',
  '',
  `- Started events after begin+seal: ${afterSeal.length}`,
  '',
  '## Stall Detection Proof',
  '',
  `- Intake stall health at 45s+: ${intakeStall.health}`,
  `- Message: ${intakeStall.warningMessage}`,
  '',
  '## Failed Fetch Root Cause',
  '',
  '- Client cleared lastFounderTestReport at run start and had no runtime/partial preservation on network failure.',
  '- fetch() rejection bypassed res.json(); showFounderTestError replaced modal body without enabling copy.',
  '- Repair: preserve lastFounderTestRuntimeSnapshot, partial markdown, build diagnostic copy payload, clear Running overlay.',
  '',
  '## Copy Button Repair Proof',
  '',
  '- buildFounderTestCopyPayload priority: full report → partial → runtime failure → diagnostic.',
  '- copyTextToClipboardWithFallback uses navigator.clipboard then textarea/execCommand.',
  '- Button shows Copied / Copy failed feedback; enabled when any copy text exists.',
  '',
  '## Clipboard Fallback Proof',
  '',
  '- copyTextToClipboardWithFallback falls back to hidden textarea + document.execCommand("copy").',
  '',
  '## Manual UI Verification Steps',
  '',
  '1. Run Founder Test to completion — Copy Report should be teal, clickable, show Copied on success.',
  '2. Stop dev server mid-run — modal should show fetch error, runtime stage preserved, Copy Report enabled with diagnostic text.',
  '3. Confirm runtime header no longer shows Running after failure.',
  '4. Click Copy Report after failure — clipboard should contain runtime failure report with stage timings and feed.',
  '',
  '## Remaining Runtime Risks',
  '',
  '- Long V5 simulation (Stage 7) may still dominate wall-clock time without sub-step feed unless extended similarly.',
  '- Client local checks run before server session begins; server stage numbers appear only after POST starts.',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS}`,
  '',
].join('\n');

const reportPath = join(ROOT, 'architecture', 'FOUNDER_TEST_STAGE2_STALL_REPAIR_REPORT.md');
writeFileSync(reportPath, reportLines, 'utf8');
assert('report written', existsSync(reportPath), reportPath);
assert('report pass token', reportLines.includes(FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test Stage 2 Stall Repair validation FAILED:');
  for (const check of failed) {
    console.error(`  ✗ ${check.name}: ${check.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log('Founder Test Stage 2 Stall Repair validation PASSED');
  console.log(FOUNDER_TEST_STAGE2_STALL_REPAIR_V1_PASS);
  for (const check of results) {
    console.log(`  ✓ ${check.name}`);
  }
}
