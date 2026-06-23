/**
 * Phase 26.87 — Founder Result Store Delivery Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessConnectedBuildExecution,
  refreshGeneratedRuntimeDevServer,
  resetConnectedBuildExecutionCounterForTests,
} from '../src/connected-build-execution/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from '../src/runtime-materialization-truth-bridge/index.js';
import {
  assessRuntimeStartupProofRepair,
  resetRuntimeStartupProofRepairModuleForTests,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeRouteReachabilityProof,
  resetRuntimeRouteReachabilityProofModuleForTests,
} from '../src/runtime-route-reachability-proof/index.js';
import {
  assessRuntimeUiRenderProof,
  resetRuntimeUiRenderProofModuleForTests,
} from '../src/runtime-ui-render-proof/index.js';
import {
  assessFounderFlowRuntimeProof,
  resetFounderFlowRuntimeProofModuleForTests,
} from '../src/founder-flow-runtime-proof/index.js';
import {
  FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS,
  assessFounderTestResultStoreDelivery,
  buildFounderTestRunHandoffPayload,
  estimateStoredFounderTestResultPayloadBytesSafely,
  getFounderTestFinalDeliveryWriteCount,
  hasFounderTestRunResult,
  persistFounderTestResultHandoff,
  peekFounderTestRunResult,
  resetFounderResultStoreDeliveryRepairForTests,
  resetFounderTestRunResultStoreForTests,
  resolveFounderTestResultStoreRunId,
  resolveStoredFounderTestReportMarkdown,
  safeStringifyFounderTestJson,
  shouldReturnCompleteResultHttp200,
  FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_EVENTS,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  handleFounderTestResultRequest,
  handleFounderTestRuntimeStatusRequest,
} from '../server/founder-testing-handler.js';
import {
  beginFounderTestRuntime,
  clearFounderTestRuntimeSessionOnlyForTests,
  finishFounderTestRuntime,
} from '../src/founder-test-runtime-monitor/founder-test-runtime-monitor.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-result-store-delivery-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function createMockResponse(): {
  res: ServerResponse;
  getStatus: () => number;
  getBody: () => Record<string, unknown> | null;
} {
  const state = { status: 0, body: null as Record<string, unknown> | null };
  const res = {
    writeHead(status: number) {
      state.status = status;
    },
    end(data: string) {
      state.body = JSON.parse(data) as Record<string, unknown>;
    },
  } as unknown as ServerResponse;
  return {
    res,
    getStatus: () => state.status,
    getBody: () => state.body,
  };
}

function mockRequest(url: string): IncomingMessage {
  return { url, method: 'GET' } as IncomingMessage;
}

const REQUIRED = [
  'src/founder-test-runtime-monitor/founder-result-store-delivery-repair.ts',
  'server/founder-testing-handler.ts',
  'scripts/validate-founder-result-store-delivery-repair.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const repairSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-result-store-delivery-repair.ts'),
  'utf8',
);
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('PASS token in repair module', repairSource.includes(FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS), 'missing');
assert('handler uses persistFounderTestResultHandoff', handlerSource.includes('persistFounderTestResultHandoff'), 'missing');
assert('persist uses bounded handoff payload', repairSource.includes('boundFounderTestResultHandoffPayloadForStorage'), 'missing');
assert('persist uses safe payload bytes', repairSource.includes('estimateStoredFounderTestResultPayloadBytesSafely'), 'missing');
assert(
  'persist avoids unsafe full stringify for existing',
  !/Buffer\.byteLength\(JSON\.stringify\(existing\)/.test(repairSource),
  'unsafe stringify',
);
assert('runtime status exposes delivery fields', handlerSource.includes('buildFounderTestRuntimeStatusDeliveryFields'), 'missing');
assert('no nested validator in repair module', !repairSource.includes('validate-'), 'nested');
assert('no writeFileSync in repair module', !repairSource.includes('writeFileSync'), 'mutates files');
assert(
  'package script registered',
  packageJson.includes(`validate:founder-result-store-delivery-repair": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');

resetFounderTestRunResultStoreForTests();
resetFounderResultStoreDeliveryRepairForTests();
resetFounderFlowRuntimeProofModuleForTests();
resetRuntimeUiRenderProofModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();
clearFounderTestRuntimeSessionOnlyForTests();

const deliveryRunId = 'founder-result-store-delivery-run';
const staleRuntimeRunId = 'stale-runtime-run-id-should-not-win';
const finalMarkdown = '# Founder Test Final Report\n\nApplication proven after result store delivery repair.';

beginFounderTestRuntime({ runId: deliveryRunId });
const completedRuntime = finishFounderTestRuntime({ state: 'COMPLETE', message: 'Founder Test Complete' });
clearFounderTestRuntimeSessionOnlyForTests();

const handoffPayload = buildFounderTestRunHandoffPayload({
  runId: staleRuntimeRunId,
  ok: true,
  runtime: { ...completedRuntime, runId: staleRuntimeRunId, state: 'COMPLETE' } as never,
  reportMarkdown: finalMarkdown,
  finalReportReady: true,
  finalReportPreparing: false,
});

const stagingWrite = persistFounderTestResultHandoff({
  phase: 'staging',
  requestedRunId: deliveryRunId,
  runtimeRunId: staleRuntimeRunId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: handoffPayload,
  errorMessage: null,
});

assert('staging write realigns runId', stagingWrite.canonicalRunId === deliveryRunId, stagingWrite.canonicalRunId);
assert('staging write runIdRealigned', stagingWrite.runIdRealigned === true, String(stagingWrite.runIdRealigned));
assert(
  'canonical runId resolves over stale runtime runId',
  resolveFounderTestResultStoreRunId({
    requestedRunId: deliveryRunId,
    runtimeRunId: staleRuntimeRunId,
  }) === deliveryRunId,
  'mismatch',
);

const completeWrite = persistFounderTestResultHandoff({
  phase: 'complete',
  requestedRunId: deliveryRunId,
  runtimeRunId: completedRuntime.runId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: buildFounderTestRunHandoffPayload({
    runId: deliveryRunId,
    ok: true,
    runtime: { ...completedRuntime, runId: deliveryRunId, state: 'COMPLETE' } as never,
    reportMarkdown: finalMarkdown,
    finalReportReady: true,
    finalReportPreparing: false,
  }),
  errorMessage: null,
});

const duplicateComplete = persistFounderTestResultHandoff({
  phase: 'complete',
  requestedRunId: deliveryRunId,
  runtimeRunId: deliveryRunId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: buildFounderTestRunHandoffPayload({
    runId: deliveryRunId,
    ok: true,
    runtime: { ...completedRuntime, runId: deliveryRunId, state: 'COMPLETE' } as never,
    reportMarkdown: finalMarkdown,
    finalReportReady: true,
    finalReportPreparing: false,
  }),
  errorMessage: null,
});

assert('COMPLETE writes final result to store', hasFounderTestRunResult(deliveryRunId), 'missing entry');
assert('duplicate complete write skipped', duplicateComplete.duplicateFinalWriteSkipped === true, 'not skipped');
assert(
  'no duplicate final delivery writes',
  getFounderTestFinalDeliveryWriteCount(deliveryRunId) === 1,
  String(getFounderTestFinalDeliveryWriteCount(deliveryRunId)),
);

const stored = peekFounderTestRunResult(deliveryRunId);
assert('final report retrievable by runId', stored != null, 'null');
assert(
  'stored markdown resolved',
  resolveStoredFounderTestReportMarkdown(stored!) === finalMarkdown,
  'markdown mismatch',
);
assert(
  'stored payload runId aligned',
  stored!.runId === deliveryRunId && stored!.payload.runId === deliveryRunId,
  String(stored!.payload.runId),
);
assert(
  'runtime payload runId aligned',
  (stored!.payload.runtime as { runId?: string }).runId === deliveryRunId,
  String((stored!.payload.runtime as { runId?: string }).runId),
);

const deliveryAssessment = assessFounderTestResultStoreDelivery({
  requestedRunId: deliveryRunId,
  runtimeRunId: deliveryRunId,
});
assert('resultStoreEntryExists=true', deliveryAssessment.resultStoreEntryExists === true, String(deliveryAssessment.resultStoreEntryExists));
assert('hasStoredResult=true', deliveryAssessment.hasStoredResult === true, String(deliveryAssessment.hasStoredResult));
assert('finalReportReady=true', deliveryAssessment.finalReportReady === true, String(deliveryAssessment.finalReportReady));
assert('finalReportDelivered=true', deliveryAssessment.finalReportDelivered === true, String(deliveryAssessment.finalReportDelivered));
assert('runIdAligned=true', deliveryAssessment.runIdAligned === true, String(deliveryAssessment.runIdAligned));

const statusMock = createMockResponse();
handleFounderTestRuntimeStatusRequest(
  mockRequest(`/api/founder-test/runtime-status?runId=${encodeURIComponent(deliveryRunId)}`),
  statusMock.res,
);
assert('runtime status HTTP 200', statusMock.getStatus() === 200, String(statusMock.getStatus()));
assert(
  'runtime status finalReportReady=true',
  statusMock.getBody()?.finalReportReady === true,
  String(statusMock.getBody()?.finalReportReady),
);
assert(
  'runtime status hasStoredResult=true',
  statusMock.getBody()?.hasStoredResult === true,
  String(statusMock.getBody()?.hasStoredResult),
);

const resultMock = createMockResponse();
handleFounderTestResultRequest(
  mockRequest(`/api/founder-test/result?runId=${encodeURIComponent(deliveryRunId)}`),
  resultMock.res,
);
assert('result endpoint HTTP 200', resultMock.getStatus() === 200, String(resultMock.getStatus()));
assert(
  'result endpoint ready=true',
  resultMock.getBody()?.ready === true,
  String(resultMock.getBody()?.ready),
);
assert(
  'result endpoint hasReportMarkdown=true',
  resultMock.getBody()?.hasReportMarkdown === true,
  String(resultMock.getBody()?.hasReportMarkdown),
);
assert(
  'complete result http200 gate',
  shouldReturnCompleteResultHttp200(stored!),
  String(shouldReturnCompleteResultHttp200(stored!)),
);

refreshGeneratedRuntimeDevServer({ projectRootDir: ROOT, workspaceId: 'build-ready-idea-1' });

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;
const startupRepair = assessRuntimeStartupProofRepair({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  skipHistoryRecording: true,
});
const routeProof = assessRuntimeRouteReachabilityProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});
const uiProof = assessRuntimeUiRenderProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

const flowProof = assessFounderFlowRuntimeProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  uiRenderProof: uiProof.report,
  filesExistOnDisk: true,
  dependenciesReady: startupRepair.report.dependencyMaterialization?.dependenciesReady ?? true,
  skipHistoryRecording: true,
});

assert(
  'founder flow sees finalReportDelivered=true',
  flowProof.report.resultStoreCheck.finalResultDelivered === true,
  String(flowProof.report.resultStoreCheck.finalResultDelivered),
);
assert(
  'founderFlowProven=true after delivery repair',
  flowProof.report.founderFlowProven === true,
  String(flowProof.report.founderFlowProven),
);

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  routeReachabilityProof: routeProof,
  uiRenderProof: uiProof,
  founderFlowRuntimeProof: flowProof,
  skipHistoryRecording: true,
});

assert(
  'APPLICATION_PROVEN after full delivery chain',
  runtimeBridge.report.finalApplicationTruth === 'APPLICATION_PROVEN',
  runtimeBridge.report.finalApplicationTruth,
);
assert(
  'failureBoundary NONE after full delivery chain',
  runtimeBridge.report.reconciliation.failureBoundary === 'NONE',
  runtimeBridge.report.reconciliation.failureBoundary,
);

const oversizedRunId = 'founder-result-store-oversized-handoff';
resetFounderTestRunResultStoreForTests();
resetFounderResultStoreDeliveryRepairForTests();

const oversizedMarkdown = '# Oversized Handoff Final Report\n\n' + 'M'.repeat(8_000);
const hugeTraceEvents = Array.from({ length: 400 }, (_, index) => ({
  readOnly: true as const,
  traceEventId: `trace-${index}`,
  operationId: `op-${index}`,
  stageId: 'REPORT_GENERATION',
  stageOrder: 11,
  stageLabel: 'Report',
  operationLabel: `Operation ${index}`,
  status: 'PASSED' as const,
  timestamp: '2026-06-23T12:00:00.000Z',
  displayTime: '12:00',
  displayLine: 'X'.repeat(12_000),
}));

const hugeExtra = {
  verificationResults: Array.from({ length: 50 }, (_, index) => ({
    id: index,
    rawOutput: 'R'.repeat(80_000),
  })),
  phaseFeedEvents: Array.from({ length: 100 }, (_, index) => ({ message: 'F'.repeat(5_000), index })),
  debugPayload: { nested: { blob: 'D'.repeat(500_000) } },
};

const oversizedWrite = persistFounderTestResultHandoff({
  phase: 'complete',
  requestedRunId: oversizedRunId,
  runtimeRunId: oversizedRunId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: buildFounderTestRunHandoffPayload({
    runId: oversizedRunId,
    ok: true,
    runtime: {
      runId: oversizedRunId,
      state: 'COMPLETE',
      traceEvents: hugeTraceEvents,
      feed: {
        readOnly: true,
        events: Array.from({ length: 200 }, (_, index) => ({
          readOnly: true as const,
          eventId: String(index),
          timestamp: '2026-06-23T12:00:00.000Z',
          displayTime: '12:00',
          message: 'E'.repeat(4_000),
          stageId: null,
          severity: 'INFO' as const,
        })),
      },
    } as never,
    reportMarkdown: oversizedMarkdown,
    founderTestLaunchReadinessReportMarkdown: oversizedMarkdown,
    founderTestLaunchReadinessAssessment: {
      report: {
        launchReadinessVerdict: 'NOT_READY',
        productReadinessScore: 42,
        blockingIssues: Array.from({ length: 20 }, (_, index) => ({ id: index, detail: 'B'.repeat(20_000) })),
        topRecommendedActions: [{ action: 'Fix launch blockers' }],
      },
    },
    extra: hugeExtra,
    finalReportReady: true,
  }),
  errorMessage: null,
});

const oversizedStored = oversizedWrite.stored;
const oversizedSerialized = safeStringifyFounderTestJson(oversizedStored);
assert(
  'oversized handoff serializes without RangeError',
  oversizedSerialized.ok === true,
  oversizedSerialized.ok ? 'ok' : oversizedSerialized.error,
);
assert(
  'oversized markdown preserved',
  resolveStoredFounderTestReportMarkdown(oversizedStored) === oversizedMarkdown,
  'markdown mismatch',
);
assert(
  'oversized traceEvents capped',
  ((oversizedStored.payload.runtime as { traceEvents?: unknown[] }).traceEvents?.length ?? 0) <=
    FOUNDER_TEST_RESULT_HANDOFF_MAX_TRACE_EVENTS,
  String((oversizedStored.payload.runtime as { traceEvents?: unknown[] }).traceEvents?.length),
);
assert(
  'oversized truncation notes recorded',
  Array.isArray(oversizedStored.payload.payloadTruncationNotes) &&
    (oversizedStored.payload.payloadTruncationNotes as unknown[]).length > 0,
  'missing notes',
);
assert(
  'oversized duplicate complete does not crash',
  persistFounderTestResultHandoff({
    phase: 'complete',
    requestedRunId: oversizedRunId,
    runtimeRunId: oversizedRunId,
    ok: true,
    completedAt: new Date().toISOString(),
    payload: oversizedStored.payload,
    errorMessage: null,
  }).duplicateFinalWriteSkipped === true,
  'duplicate path failed',
);
const safeBytes = estimateStoredFounderTestResultPayloadBytesSafely(oversizedStored);
assert(
  'oversized safe byte estimate finite',
  Number.isFinite(safeBytes) && safeBytes > oversizedMarkdown.length,
  String(safeBytes),
);

const oversizedResultMock = createMockResponse();
handleFounderTestResultRequest(
  mockRequest(`/api/founder-test/result?runId=${encodeURIComponent(oversizedRunId)}`),
  oversizedResultMock.res,
);
assert('oversized result endpoint HTTP 200', oversizedResultMock.getStatus() === 200, String(oversizedResultMock.getStatus()));
assert(
  'oversized result hasReportMarkdown=true',
  oversizedResultMock.getBody()?.hasReportMarkdown === true,
  String(oversizedResultMock.getBody()?.hasReportMarkdown),
);

const failed = results.filter((entry) => !entry.passed);

const repairReportMd = [
  '# Founder Result Store Delivery Repair Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Root Cause',
  '',
  '- Result store writes used raw `input.runId` without reconciling against runtime card / session runId, allowing stale runtime runId drift in payload.',
  '- Runtime status did not expose `finalReportReady`, `hasStoredResult`, or `resultStoreEntryExists`, so client and proof layers could not verify delivery.',
  '- Duplicate complete-phase writes could overwrite an already-delivered final result.',
  '',
  '## Repair',
  '',
  '- Added `persistFounderTestResultHandoff` with canonical runId resolution and aligned payload/runtime runIds.',
  '- Staging write before COMPLETE + single complete write with duplicate skip.',
  '- Runtime status now spreads `buildFounderTestRuntimeStatusDeliveryFields`.',
  '- Result-debug uses stored runId when present.',
  '',
  '## Proof Snapshot',
  '',
  `- canonicalRunId=${deliveryRunId}`,
  `- finalReportReady=${deliveryAssessment.finalReportReady}`,
  `- finalReportDelivered=${deliveryAssessment.finalReportDelivered}`,
  `- founderFlowProven=${flowProof.report.founderFlowProven}`,
  `- finalApplicationTruth=${runtimeBridge.report.finalApplicationTruth}`,
  `- failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
  `- finalDeliveryWriteCount=${getFounderTestFinalDeliveryWriteCount(deliveryRunId)}`,
  '',
  `Pass token: ${FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS}`,
  '',
].join('\n');

const validationMd = [
  '# Founder Result Store Delivery Validation',
  '',
  `Result: ${failed.length === 0 ? FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
].join('\n');

const afterRepairMd = [
  '# Founder Flow After Result Store Repair',
  '',
  '## Before',
  '',
  '- founderFlowProven=false',
  '- failureClass=RESULT_STORE_MISSING',
  '- finalApplicationTruth=APPLICATION_PARTIAL',
  '- failureBoundary=FOUNDER_FLOW',
  '',
  '## After delivery repair (with stored final result)',
  '',
  `- founderFlowProven=${flowProof.report.founderFlowProven}`,
  `- failureClass=${flowProof.report.failureClass}`,
  `- finalApplicationTruth=${runtimeBridge.report.finalApplicationTruth}`,
  `- failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
  `- uiRenders=${uiProof.report.uiRenders}`,
  `- resultStoreEntryExists=${deliveryAssessment.resultStoreEntryExists}`,
  `- finalReportReady=${deliveryAssessment.finalReportReady}`,
  `- finalReportDelivered=${deliveryAssessment.finalReportDelivered}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture/FOUNDER_RESULT_STORE_DELIVERY_REPAIR_REPORT.md'), repairReportMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/FOUNDER_RESULT_STORE_DELIVERY_VALIDATION.md'), validationMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/FOUNDER_FLOW_AFTER_RESULT_STORE_REPAIR.md'), afterRepairMd, 'utf8');

if (failed.length > 0) {
  console.error('Validation FAILED:');
  for (const entry of failed) console.error(`  - ${entry.name}: ${entry.detail}`);
  process.exit(1);
}

console.log(FOUNDER_RESULT_STORE_DELIVERY_REPAIR_PASS);
