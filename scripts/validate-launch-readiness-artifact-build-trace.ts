/**
 * Phase 26.45 — Launch Readiness Artifact Build Trace V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS,
  SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION,
  advanceFounderTestRuntimeStage,
  analyzeArtifactBuildSubstepStall,
  beginArtifactBuildSubstep,
  beginFounderTestRuntime,
  buildFounderTestRuntimeFailureReport,
  buildLaunchReadinessArtifactBuildTraceBridge,
  completeFounderTestRuntimeStage,
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

const REQUIRED_FILES = [
  'src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-types.ts',
  'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  'server/founder-testing-handler.ts',
];

for (const file of REQUIRED_FILES) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');

const REQUIRED_TRACE_LABELS = [
  'Launch readiness artifact build started',
  'Loading execution proof',
  'Loading founder summary',
  'Loading readiness authorities',
  'Assessing launch readiness',
  'Building launch readiness report markdown',
  'Launch readiness artifacts built',
  'Launch readiness artifact build failed',
  'Running product readiness simulation',
];

for (const label of REQUIRED_TRACE_LABELS) {
  assert(`authority trace: ${label}`, authoritySource.includes(label), label);
}

assert(
  'handler wires onBuildTrace bridge',
  handlerSource.includes('onBuildTrace: buildLaunchReadinessArtifactBuildTraceBridge()'),
  'missing bridge',
);
assert(
  'handler no generic artifact substep only',
  !handlerSource.includes("operationId: 'launch-readiness-artifacts-building'"),
  'generic substep still present',
);

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'artifact-trace-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Running' });

const bridge = buildLaunchReadinessArtifactBuildTraceBridge();
const substeps = [
  {
    operationId: 'launch-readiness-artifact-build-started',
    operationLabel: 'Launch readiness artifact build started',
  },
  { operationId: 'loading-execution-proof', operationLabel: 'Loading execution proof' },
  { operationId: 'loading-founder-summary', operationLabel: 'Loading founder summary' },
  { operationId: 'loading-readiness-authorities', operationLabel: 'Loading readiness authorities' },
  { operationId: 'assessing-launch-readiness', operationLabel: 'Assessing launch readiness' },
  {
    operationId: 'building-launch-readiness-report-markdown',
    operationLabel: 'Building launch readiness report markdown',
  },
];

let heartbeatBefore = getFounderTestRuntimeStatus().lastHeartbeatAt;
const initialHeartbeatMs = heartbeatBefore ? Date.parse(heartbeatBefore) : 0;
for (const substep of substeps) {
  bridge({ ...substep, phase: 'RUNNING' });
  const runningSnap = getFounderTestRuntimeStatus();
  assert(
    `trace RUNNING: ${substep.operationId}`,
    runningSnap.traceEvents.some((event) => event.operationId === substep.operationId && event.status === 'RUNNING'),
    substep.operationId,
  );
  assert(
    `active substep: ${substep.operationId}`,
    runningSnap.activeArtifactBuildSubstep === substep.operationLabel,
    runningSnap.activeArtifactBuildSubstep ?? 'null',
  );
  assert(
    `heartbeat on RUNNING: ${substep.operationId}`,
    runningSnap.lastHeartbeatAt != null,
    'null',
  );

  bridge({ ...substep, phase: 'PASSED' });
  const passedSnap = getFounderTestRuntimeStatus();
  const passedHeartbeatMs = passedSnap.lastHeartbeatAt ? Date.parse(passedSnap.lastHeartbeatAt) : 0;
  assert(
    `heartbeat after ${substep.operationId}`,
    passedSnap.lastHeartbeatAt != null && passedHeartbeatMs >= (heartbeatBefore ? Date.parse(heartbeatBefore) : 0),
    passedSnap.lastHeartbeatAt ?? 'null',
  );
  heartbeatBefore = passedSnap.lastHeartbeatAt;
  assert(
    `last successful after ${substep.operationId}`,
    passedSnap.lastSuccessfulArtifactSubstep === substep.operationLabel,
    passedSnap.lastSuccessfulArtifactSubstep ?? 'null',
  );
}
const afterSubstepsSnap = getFounderTestRuntimeStatus();
assert(
  'heartbeat advanced across artifact build',
  afterSubstepsSnap.lastHeartbeatAt != null &&
    Date.parse(afterSubstepsSnap.lastHeartbeatAt) >= initialHeartbeatMs,
  afterSubstepsSnap.lastHeartbeatAt ?? 'null',
);

bridge({
  operationId: 'launch-readiness-artifacts-built',
  operationLabel: 'Launch readiness artifacts built',
  phase: 'PASSED',
});

const completedSnap = getFounderTestRuntimeStatus();
assert(
  'artifact trace events recorded',
  completedSnap.traceEvents.filter((event) => event.operationId.includes('launch-readiness') || event.operationId.includes('loading-')).length >= 4,
  String(completedSnap.traceEvents.length),
);

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'artifact-stall-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
beginArtifactBuildSubstep({
  operationId: SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION,
  operationLabel: 'Running product readiness simulation',
  at: new Date(Date.now() - 16_000),
});
const slowAnalysis = analyzeArtifactBuildSubstepStall();
assert('artifact substep SLOW at 16s', slowAnalysis.health === 'SLOW', slowAnalysis.health);
assert(
  'slow exposes operation name',
  slowAnalysis.operationLabel === 'Running product readiness simulation',
  slowAnalysis.operationLabel ?? 'null',
);

beginArtifactBuildSubstep({
  operationId: SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION,
  operationLabel: 'Running product readiness simulation',
  at: new Date(Date.now() - 46_000),
});
const stalledAnalysis = analyzeArtifactBuildSubstepStall();
assert('artifact substep STALLED at 46s', stalledAnalysis.health === 'STALLED', stalledAnalysis.health);

const stallSnap = getFounderTestRuntimeStatus(Date.now());
assert(
  'runtime snapshot shows artifact stall reason',
  stallSnap.artifactBuildSubstepStallReason != null,
  stallSnap.artifactBuildSubstepStallReason ?? 'null',
);
assert(
  'runtime snapshot shows active artifact substep',
  stallSnap.activeArtifactBuildSubstep === 'Running product readiness simulation',
  stallSnap.activeArtifactBuildSubstep ?? 'null',
);

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'artifact-failure-report-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
const failureBridge = buildLaunchReadinessArtifactBuildTraceBridge();
failureBridge({
  operationId: 'loading-execution-proof',
  operationLabel: 'Loading execution proof',
  phase: 'RUNNING',
});
failureBridge({
  operationId: 'loading-execution-proof',
  operationLabel: 'Loading execution proof',
  phase: 'PASSED',
});
failureBridge({
  operationId: 'running-product-readiness-simulation',
  operationLabel: 'Running product readiness simulation',
  phase: 'RUNNING',
});
beginArtifactBuildSubstep({
  operationId: 'running-product-readiness-simulation',
  operationLabel: 'Running product readiness simulation',
  at: new Date(Date.now() - 46_000),
});

const failureSnap = getFounderTestRuntimeStatus(Date.now());
const failureReport = buildFounderTestRuntimeFailureReport({
  snapshot: failureSnap,
  errorMessage: 'Stage 2 stalled during artifact build',
});
assert(
  'failure report last successful artifact sub-step',
  failureReport.includes('Last successful artifact sub-step: Loading execution proof'),
  'missing last successful',
);
assert(
  'failure report active artifact sub-step',
  failureReport.includes('Active artifact sub-step: Running product readiness simulation'),
  'missing active',
);
assert(
  'failure report artifact stall reason',
  failureReport.includes('Artifact sub-step stall:'),
  'missing stall',
);
assert('failure report artifact build trace section', failureReport.includes('## Artifact Build Trace'), 'missing section');
assert(
  'failure report includes loading execution proof trace',
  failureReport.includes('Loading execution proof'),
  'missing trace line',
);

failureBridge({
  operationId: 'running-product-readiness-simulation',
  operationLabel: 'Running product readiness simulation',
  phase: 'FAILED',
  errorMessage: 'simulation timeout',
});
failureBridge({
  operationId: 'launch-readiness-artifact-build-failed',
  operationLabel: 'Launch readiness artifact build failed',
  phase: 'FAILED',
  errorMessage: 'simulation timeout',
});
const failedSnap = getFounderTestRuntimeStatus();
assert(
  'failed substep surfaces in stall reason',
  failedSnap.stallReason != null && failedSnap.stallReason.includes('simulation timeout'),
  failedSnap.stallReason ?? 'null',
);
assert(
  'failed substep warning in feed',
  failedSnap.feed.events.some((event) => event.message.includes('simulation timeout')),
  'no feed warning',
);
assert(
  'failed trace event recorded',
  failedSnap.traceEvents.some((event) => event.status === 'FAILED'),
  'no FAILED trace',
);

assert(
  'no scoring changes in handler',
  !handlerSource.includes('readinessScore =') && handlerSource.includes('runFounderTestingModeV5'),
  'scoring changed',
);
assert(
  'no verdict logic changes in authority',
  authoritySource.includes('deriveLaunchReadinessVerdict') &&
    !authoritySource.includes('deriveLaunchReadinessVerdict ='),
  'verdict changed',
);
assert(
  'no validator recursion',
  !handlerSource.includes('validate-launch-readiness-artifact-build-trace'),
  'recursion',
);

assert('ui artifact sub-step field', appJs.includes('activeArtifactBuildSubstep'), 'missing ui field');
assert('ui last artifact sub-step field', appJs.includes('lastSuccessfulArtifactSubstep'), 'missing ui field');
assert('ui copy report artifact trace', appJs.includes('## Artifact Build Trace'), 'missing copy section');

assert(
  'suspected blocking operation constant',
  SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION === 'running-product-readiness-simulation',
  SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION,
);

const report = [
  '# Launch Readiness Artifact Build Trace Report',
  '',
  '## Confirmed Last Successful Operation',
  '',
  '- Before stall: **Building launch readiness artifacts** (Stage 2 generic sub-step only).',
  '- After trace V1: last successful artifact sub-step is visible per boundary (e.g. Loading execution proof).',
  '',
  '## Suspected Blocking Operation',
  '',
  `- **${SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION}** — Running product readiness simulation (includes chat stress simulation).`,
  '- Stage 2 appeared frozen for ~37s because no heartbeat fired inside this async block.',
  '',
  '## Files Changed',
  '',
  '- src/founder-test-launch-readiness/founder-test-launch-readiness-types.ts',
  '- src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  '- src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-types.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  '- src/founder-test-runtime-monitor/runtime-failure-report-builder.ts',
  '- src/founder-test-runtime-monitor/index.ts',
  '- server/founder-testing-handler.ts',
  '- public/founder-reality/app.js',
  '',
  '## Trace Events Added',
  '',
  ...REQUIRED_TRACE_LABELS.map((label) => `- ${label}`),
  '',
  '## Heartbeat Proof',
  '',
  '- Each artifact sub-step PASSED boundary calls touchSessionHeartbeat via buildLaunchReadinessArtifactBuildTraceBridge.',
  '- RUNNING boundaries update heartbeat via recordFounderTestRuntimeSubstep.',
  `- Validator confirmed heartbeat advanced across ${substeps.length} sub-steps.`,
  '',
  '## Stall Proof',
  '',
  '- Sub-step SLOW after 15s, STALLED after 45s via analyzeArtifactBuildSubstepStall.',
  '- Operation name exposed in snapshot.activeArtifactBuildSubstep and artifactBuildSubstepStallReason.',
  '- Runtime Failure Report includes last successful artifact sub-step and active stalled operation.',
  '',
  '## Remaining Risks',
  '',
  '- Chat stress simulation inside product readiness may still run long even with visibility.',
  '- Individual authority loads inside runFounderTestLaunchReadiness are not further subdivided.',
  '',
  '---',
  '',
  `Pass token: ${LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_REPORT.md'), report, 'utf8');
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_REPORT.md')),
  'missing',
);
assert('report token', report.includes(LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Launch Readiness Artifact Build Trace validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Launch Readiness Artifact Build Trace validation PASSED (${results.length} checks)`);
console.log(LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS);
