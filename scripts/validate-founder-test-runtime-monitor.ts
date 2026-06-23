/**
 * Phase 26.42 — Founder Test Runtime Monitor V1 validation.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_ALREADY_RUNNING,
  FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS,
  FOUNDER_TEST_RUNTIME_STAGES,
  MAX_FOUNDER_TEST_RUNTIME_HISTORY,
  analyzeRuntimeStall,
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  buildFounderTestRuntimeMonitorArtifacts,
  completeFounderTestRuntimeStage,
  countCompletedStages,
  estimateFounderTestProgress,
  finishFounderTestRuntime,
  formatDurationClock,
  getFounderTestRuntimeHistorySize,
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
  'src/founder-test-runtime-monitor/founder-test-runtime-types.ts',
  'src/founder-test-runtime-monitor/founder-test-runtime-registry.ts',
  'src/founder-test-runtime-monitor/runtime-stage-tracker.ts',
  'src/founder-test-runtime-monitor/runtime-progress-estimator.ts',
  'src/founder-test-runtime-monitor/runtime-feed-builder.ts',
  'src/founder-test-runtime-monitor/runtime-stall-detector.ts',
  'src/founder-test-runtime-monitor/runtime-history.ts',
  'src/founder-test-runtime-monitor/runtime-report-builder.ts',
  'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  'src/founder-test-runtime-monitor/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetFounderTestRuntimeMonitorForTests();

// Idle snapshot
const idle = getFounderTestRuntimeStatus();
assert('idle state', idle.state === 'IDLE', idle.state);
assert('idle not running', idle.alreadyRunning === false, String(idle.alreadyRunning));

// Begin run + stage tracking
const begin = beginFounderTestRuntime({ runId: 'validator-run-1' });
assert('begin accepted', begin.accepted === true, String(begin.accepted));
assert('begin running', begin.snapshot.state === 'RUNNING', begin.snapshot.state);
assert('begin stage 1 running', begin.snapshot.progress.currentStage === 'FOUNDER_TEST_STARTED', begin.snapshot.progress.currentStage ?? 'null');
assert('begin feed started', begin.snapshot.feed.events.some((e) => e.message.includes('Started')), 'feed');

completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Passed' });
advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });

const mid = getFounderTestRuntimeStatus();
assert('mid intake complete', mid.stages.find((s) => s.stageId === 'INTAKE_VALIDATION')?.status === 'PASSED', 'intake');
assert('mid planning gate running', mid.stages.find((s) => s.stageId === 'PLANNING_GATE')?.status === 'RUNNING', 'planning gate');

for (const stage of FOUNDER_TEST_RUNTIME_STAGES.slice(3)) {
  if (stage.stageId === 'COMPLETE') continue;
  if (stage.stageId !== 'PLANNING_GATE') {
    advanceFounderTestRuntimeStage({ stageId: stage.stageId });
  }
  completeFounderTestRuntimeStage({
    stageId: stage.stageId,
    message: `${stage.label} Passed`,
  });
}

const finished = completeFounderTestRuntimeStage({ stageId: 'REPORT_GENERATION', message: 'Report Generation Complete' });
assert('report generation passed', finished.stages.find((s) => s.stageId === 'REPORT_GENERATION')?.status === 'PASSED', 'report');

const complete = finishFounderTestRuntime({ state: 'COMPLETE', message: 'Founder Test Complete' });
assert('complete state', complete.state === 'COMPLETE', complete.state);
assert('complete all stages passed', countCompletedStages(complete.stages) >= 10, String(countCompletedStages(complete.stages)));
assert('complete feed has complete', complete.feed.events.some((e) => e.message.includes('Complete')), 'feed');

// Progress model — stage-based percent
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'progress-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const progressSnap = getFounderTestRuntimeStatus();
const expectedPercent = Math.round((2 / FOUNDER_TEST_RUNTIME_STAGES.length) * 100);
assert('progress percent from completed stages', progressSnap.progress.percentComplete === expectedPercent, `${progressSnap.progress.percentComplete} vs ${expectedPercent}`);
assert('progress elapsed positive', progressSnap.progress.elapsedMs >= 0, String(progressSnap.progress.elapsedMs));
assert('progress remaining set', progressSnap.progress.estimatedRemainingMs != null, 'null');
assert('clock format', formatDurationClock(65000) === '01:05', formatDurationClock(65000));

// Double-run protection
const duplicate = beginFounderTestRuntime();
assert('double-run blocked', duplicate.accepted === false, String(duplicate.accepted));
assert('double-run error code', duplicate.errorCode === FOUNDER_TEST_ALREADY_RUNNING, duplicate.errorCode ?? 'null');
assert('double-run already running flag', duplicate.snapshot.alreadyRunning === true, String(duplicate.snapshot.alreadyRunning));

finishFounderTestRuntime({ state: 'CANCELLED' });

// Stall detection
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'stall-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
for (const stage of ['PLANNING_GATE', 'PLANNING_BRIEF', 'ARCHITECTURE_BRIEF', 'BUILD_PLAN']) {
  advanceFounderTestRuntimeStage({ stageId: stage });
  completeFounderTestRuntimeStage({ stageId: stage });
}
advanceFounderTestRuntimeStage({ stageId: 'FOUNDER_SIMULATION_ENGINE' });

const stallSnap = getFounderTestRuntimeStatus();
const simulationStage = stallSnap.stages.find((s) => s.stageId === 'FOUNDER_SIMULATION_ENGINE');
if (simulationStage && simulationStage.startedAt) {
  const startedMs = new Date(simulationStage.startedAt).getTime();
  const simulationStagesAt = (elapsedMs: number) =>
    stallSnap.stages.map((stage) =>
      stage.stageId === 'FOUNDER_SIMULATION_ENGINE'
        ? { ...stage, startedAt: new Date(startedMs - elapsedMs).toISOString() }
        : stage,
    );
  const at61s = analyzeRuntimeStall({ stages: simulationStagesAt(61_000), now: startedMs + 1000 });
  const at190s = analyzeRuntimeStall({ stages: simulationStagesAt(190_000), now: startedMs + 1000 });
  const at310s = analyzeRuntimeStall({ stages: simulationStagesAt(310_000), now: startedMs + 1000 });
  assert('stall detection healthy short', analyzeRuntimeStall({ stages: stallSnap.stages }).health === 'HEALTHY', 'healthy');
  assert('simulation at 61s not stalled', at61s.health !== 'STALLED', at61s.health);
  assert('simulation at 190s slow', at190s.health === 'SLOW', at190s.health);
  assert('simulation beyond 300s stalled', at310s.health === 'STALLED', at310s.health);
  assert('simulation stall warning message', at310s.warningMessage != null, 'null');
} else {
  assert('stall stage present', false, 'missing simulation stage');
}

finishFounderTestRuntime({ state: 'FAILED' });

// Bounded history
resetFounderTestRuntimeMonitorForTests();
for (let i = 0; i < MAX_FOUNDER_TEST_RUNTIME_HISTORY + 1; i += 1) {
  beginFounderTestRuntime({ runId: `history-${i}` });
  completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
  finishFounderTestRuntime({ state: 'COMPLETE' });
}
assert(
  'bounded history cap',
  getFounderTestRuntimeHistorySize() === MAX_FOUNDER_TEST_RUNTIME_HISTORY,
  String(getFounderTestRuntimeHistorySize()),
);

// Report generation
resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'report-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
const finalSnap = finishFounderTestRuntime({ state: 'COMPLETE' });
const artifacts = buildFounderTestRuntimeMonitorArtifacts({ snapshots: [finalSnap] });
assert('report generated', artifacts.report.generatedAt.length > 0, 'missing generatedAt');
assert('report markdown token', artifacts.markdown.includes(FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS), 'token');
assert('report markdown stages', artifacts.markdown.includes('Stage Timings'), 'sections');
assert('report markdown feed', artifacts.markdown.includes('Feed Samples'), 'feed section');

const reportPath = join(ROOT, 'architecture', 'FOUNDER_TEST_RUNTIME_MONITOR_REPORT.md');
writeFileSync(reportPath, artifacts.markdown, 'utf8');
assert('report file written', existsSync(reportPath), reportPath);

const failed = results.filter((r) => !r.passed);
if (failed.length) {
  console.error('Founder Test Runtime Monitor validation FAILED:');
  for (const check of failed) {
    console.error(`  ✗ ${check.name}: ${check.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log('Founder Test Runtime Monitor validation PASSED');
  console.log(FOUNDER_TEST_RUNTIME_MONITOR_V1_PASS);
  for (const check of results) {
    console.log(`  ✓ ${check.name}`);
  }
}
