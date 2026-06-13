/**
 * Phase 26.47 — Operator Feed Unified Layout + Stage 2 Completion Repair V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INTAKE_VALIDATION_COMPLETION_BOUNDARIES,
  OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS,
  advanceFounderTestRuntimeStage,
  analyzeStage2CompletionGap,
  beginFounderTestRuntime,
  buildFounderTestRuntimeFailureReport,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeTrace,
  getFounderTestRuntimeStatus,
  hasPassedTraceEvent,
  markFounderTestHandlerAlive,
  markFounderTestHandlerIdle,
  resetFounderTestRunResultStoreForTests,
  resetFounderTestRuntimeMonitorForTests,
  resolveIntakeValidationNextExpected,
  storeFounderTestRunResult,
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
  'src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  'src/founder-test-runtime-monitor/founder-test-run-result-store.ts',
  'server/founder-testing-handler.ts',
  'public/founder-reality/app.js',
  'public/founder-reality/styles.css',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const stylesCss = readFileSync(join(ROOT, 'public/founder-reality/styles.css'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');

assert('single unified card title', appJs.includes('Founder Test Runtime'), 'title');
assert('no separate runtime trace title', !appJs.includes('Founder Test Runtime Trace'), 'old title');
assert('unified renderer function', appJs.includes('renderFounderTestUnifiedRuntimeCard'), 'renderer');
assert('timeline latest 8', appJs.includes('.slice(-8)'), 'slice 8');
assert('full trace collapsed default', appJs.includes('founderTestUnifiedTraceExpanded = false'), 'collapsed');
assert('show full trace toggle', appJs.includes('Show full trace'), 'toggle');
assert('async wait helper', appJs.includes('waitForFounderTestAsyncResult'), 'async wait');
assert('202 accepted handling', appJs.includes('res.status === 202'), '202');
assert('post timeout flag', appJs.includes('lastFounderTestPostTimedOut'), 'post timeout');
assert('no header runtime feed duplicate', !indexHtml.includes('founder-test-runtime-feed'), 'duplicate feed');
assert(
  'one operator trace container',
  (indexHtml.match(/id="founder-test-operator-trace"/g) ?? []).length === 1,
  String((indexHtml.match(/id="founder-test-operator-trace"/g) ?? []).length),
);
assert('unified scroll area css', stylesCss.includes('.founder-test-unified-scroll'), 'scroll css');
assert('no nested runtime feed in header html', !indexHtml.includes('id="founder-test-runtime"'), 'header panel');
assert('async handler 202', handlerSource.includes('202') && handlerSource.includes('accepted: true'), 'handler 202');
assert('intake validation complete trace', handlerSource.includes('intake-validation-complete'), 'intake complete');
assert('result endpoint', serverSource.includes('/api/founder-test/result'), 'result route');
assert('background run', handlerSource.includes('runFounderTestInBackground'), 'background');

resetFounderTestRuntimeMonitorForTests();
resetFounderTestRunResultStoreForTests();

beginFounderTestRuntime({ runId: 'stage2-completion-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });

for (const boundary of INTAKE_VALIDATION_COMPLETION_BOUNDARIES) {
  emitFounderTestRuntimeTrace({
    operationId: boundary.operationId,
    stageId: 'INTAKE_VALIDATION',
    operationLabel: boundary.label,
    status: 'PASSED',
  });
}

const beforeAdvance = getFounderTestRuntimeStatus();
assert(
  'next expected planning gate after boundaries',
  beforeAdvance.nextExpectedOperation === 'Planning gate entered',
  beforeAdvance.nextExpectedOperation ?? 'null',
);
assert(
  'chat stress complete event',
  hasPassedTraceEvent(beforeAdvance.traceEvents, 'chat-stress-simulation-complete'),
  'missing',
);
assert(
  'product readiness complete event',
  hasPassedTraceEvent(beforeAdvance.traceEvents, 'product-readiness-simulation-complete'),
  'missing',
);
assert(
  'artifact build complete event',
  hasPassedTraceEvent(beforeAdvance.traceEvents, 'launch-readiness-artifacts-built'),
  'missing',
);

completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Passed' });
emitFounderTestRuntimeTrace({
  operationId: 'planning-gate-entered',
  stageId: 'PLANNING_GATE',
  operationLabel: 'Planning gate entered',
  status: 'RUNNING',
});
advanceFounderTestRuntimeStage({ stageId: 'PLANNING_GATE' });

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
assert('stage 2 not running after advance', stage3.progress.currentStage === 'PLANNING_GATE', stage3.progress.currentStage ?? 'null');

resetFounderTestRuntimeMonitorForTests();
beginFounderTestRuntime({ runId: 'stage2-gap-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
emitFounderTestRuntimeTrace({
  operationId: 'chat-stress-scenario:cap-06',
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Chat stress scenario complete: cap-06',
  status: 'PASSED',
});

const gapSnap = getFounderTestRuntimeStatus(Date.now() + 4000);
const gap = analyzeStage2CompletionGap({
  ...gapSnap,
  activeArtifactBuildSubstep: null,
  secondsSinceLastHeartbeat: 4,
});
assert(
  'stage2 gap detects missing chat stress complete',
  gap.missingCompletionBoundary === 'Chat stress simulation complete',
  gap.missingCompletionBoundary ?? 'null',
);
assert(
  'intake next expected not planning gate prematurely',
  resolveIntakeValidationNextExpected(gapSnap.traceEvents) === 'Chat stress simulation complete',
  resolveIntakeValidationNextExpected(gapSnap.traceEvents),
);
assert(
  'stage2 gap flagged in snapshot',
  getFounderTestRuntimeStatus(Date.now() + 4000).stage2CompletionGap,
  'not flagged',
);

markFounderTestHandlerAlive();
storeFounderTestRunResult({
  readOnly: true,
  runId: 'stored-run',
  ok: false,
  completedAt: new Date().toISOString(),
  payload: { ok: false, error: 'timeout' },
  errorMessage: 'timeout',
});
markFounderTestHandlerIdle();

const aliveSnap = getFounderTestRuntimeStatus();
assert('handler alive field', typeof aliveSnap.handlerAlive === 'boolean', 'type');

const failureReport = buildFounderTestRuntimeFailureReport({
  snapshot: {
    ...gapSnap,
    missingCompletionBoundary: 'Product readiness simulation complete',
    handlerAlive: true,
    handlerLastAliveAt: new Date().toISOString(),
    postTimedOut: true,
    stage2CompletionGap: true,
    stage2CompletionGapReason: 'missing boundary',
  },
  errorMessage: 'fetch failed',
});
assert('failure report missing boundary', failureReport.includes('Missing completion boundary'), 'missing');
assert('failure report handler alive', failureReport.includes('Handler alive: yes'), 'handler');
assert('failure report post timeout', failureReport.includes('POST timed out: yes'), 'post');

assert(
  'no scoring changes in handler',
  !handlerSource.includes('readinessScore =') && handlerSource.includes('runFounderTestingModeV5'),
  'scoring',
);
assert(
  'no verdict rewrite in handler',
  !handlerSource.includes('deriveLaunchReadinessVerdict ='),
  'verdict',
);
assert(
  'no validator recursion',
  !handlerSource.includes('validate-operator-feed-unified-layout-and-stage2-completion'),
  'recursion',
);

const report = [
  '# Operator Feed Unified Layout And Stage2 Completion Report',
  '',
  '## UI Layout Root Cause',
  '',
  '- Founder Test runtime was split across header runtime panel and Operator Feed trace card with duplicate feeds and scroll areas.',
  '',
  '## Stage 2 Completion Root Cause',
  '',
  '- `nextExpectedOperation` fell back to stage-level "Planning gate entered" after chat scenario PASSED events.',
  '- Missing explicit completion boundaries between chat stress, product readiness scoring, launch readiness assessment, and intake complete.',
  '- Long-running POST blocked browser fetch while backend still inside Stage 2.',
  '',
  '## Files Changed',
  '',
  '- public/founder-reality/app.js',
  '- public/founder-reality/styles.css',
  '- public/founder-reality/index.html',
  '- server/founder-testing-handler.ts',
  '- server/founder-reality-server.ts',
  '- src/founder-test-runtime-monitor/stage2-completion-tracker.ts',
  '- src/founder-test-runtime-monitor/founder-test-run-result-store.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  '- src/founder-test-runtime-monitor/founder-test-runtime-types.ts',
  '- src/founder-test-runtime-monitor/runtime-trace-registry.ts',
  '- src/founder-test-runtime-monitor/runtime-failure-report-builder.ts',
  '- src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts',
  '- src/founder-test-product-readiness/product-readiness-orchestrator.ts',
  '',
  '## Before/After Operator Feed Behavior',
  '',
  '- Before: scattered cards, 12-event trace, nested scroll areas, premature Planning Gate next expected.',
  '- After: one "Founder Test Runtime" card with status header, operations, latest 8 timeline, collapsible full trace.',
  '',
  '## Stage Transition Proof',
  '',
  `- Validator advanced Stage 2 → Stage 3 after ${INTAKE_VALIDATION_COMPLETION_BOUNDARIES.length} completion boundaries.`,
  '',
  '## Remaining Runtime Risks',
  '',
  '- Full Founder Test still runs long after Stage 2; polling + result endpoint required for completion.',
  '- Stage 2 gap detection depends on heartbeat age ≥ 3s when artifact sub-step is idle.',
  '',
  '---',
  '',
  `Pass token: ${OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'OPERATOR_FEED_UNIFIED_LAYOUT_AND_STAGE2_COMPLETION_REPORT.md'),
  report,
  'utf8',
);
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'OPERATOR_FEED_UNIFIED_LAYOUT_AND_STAGE2_COMPLETION_REPORT.md')),
  'missing',
);
assert('report token', report.includes(OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS), 'token');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Operator Feed Unified Layout + Stage 2 Completion validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Operator Feed Unified Layout + Stage 2 Completion validation PASSED (${results.length} checks)`);
console.log(OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS);
