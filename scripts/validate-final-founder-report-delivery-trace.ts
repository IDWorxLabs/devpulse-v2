/**
 * Phase 27.07 — Final Founder Report Delivery Trace validation (diagnostic only).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FINAL_FOUNDER_REPORT_DELIVERY_TRACE_PASS,
  analyzeDeliveryTraceRun,
  buildDeliveryTraceReport,
  buildDeliveryTraceValidationMarkdown,
  completeDeliveryTraceBoundary,
  enterDeliveryTraceBoundary,
  failDeliveryTraceBoundary,
  getDeliveryTraceRunSnapshot,
  resetFinalFounderReportDeliveryTraceForTests,
  startFinalFounderReportDeliveryTrace,
  traceReportGenerationComplete,
  traceResultRetrievalApi,
  traceResultStoreWrite,
  writeFinalFounderReportDeliveryTraceReport,
} from '../src/final-founder-report-delivery-trace/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-final-founder-report-delivery-trace';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/final-founder-report-delivery-trace/final-founder-report-delivery-trace-types.ts',
  'src/final-founder-report-delivery-trace/final-founder-report-delivery-trace-registry.ts',
  'src/final-founder-report-delivery-trace/final-founder-report-delivery-trace-recorder.ts',
  'src/final-founder-report-delivery-trace/final-founder-report-delivery-trace-analyzer.ts',
  'src/final-founder-report-delivery-trace/final-founder-report-delivery-trace-report-builder.ts',
  'src/final-founder-report-delivery-trace/final-founder-report-delivery-trace-hooks.ts',
  'src/final-founder-report-delivery-trace/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const storeSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-result-store-delivery-repair.ts'),
  'utf8',
);
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
const appSource = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('handler starts delivery trace', handlerSource.includes('startFinalFounderReportDeliveryTrace'), 'missing');
assert('handler traces runtime stages', handlerSource.includes('traceDeliveryStageEnter'), 'missing');
assert('handler traces report generation', handlerSource.includes('traceReportGenerationComplete'), 'missing');
assert('handler traces result retrieval', handlerSource.includes('traceResultRetrievalApi'), 'missing');
assert('handler writes trace report', handlerSource.includes('writeFinalFounderReportDeliveryTraceReport'), 'missing');
assert('handler exposes client trace route handler', handlerSource.includes('handleFounderTestClientDeliveryTraceRequest'), 'missing');
assert('handler debug includes deliveryTrace', handlerSource.includes('getDeliveryTraceSummaryForDebug'), 'missing');
assert('result store traces write boundary', storeSource.includes('traceResultStoreWrite'), 'missing');
assert('server wires client trace route', serverSource.includes('/api/founder-test/delivery-trace-client'), 'missing');
assert('client posts delivery trace events', appSource.includes('postFounderTestDeliveryTraceClientEvent'), 'missing');
assert('client traces CLIENT_CACHE', appSource.includes("boundaryId: 'CLIENT_CACHE'"), 'missing');
assert('client traces FOUNDER_REPORT_RENDER', appSource.includes("boundaryId: 'FOUNDER_REPORT_RENDER'"), 'missing');
assert(
  'package script registered',
  packageJson.includes(`validate:final-founder-report-delivery-trace": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);
assert(
  'no new authority module added',
  !existsSync(join(ROOT, 'src/final-founder-report-delivery-trace-authority')),
  'unexpected authority',
);

resetFinalFounderReportDeliveryTraceForTests();
const runId = 'delivery-trace-validator-run';
startFinalFounderReportDeliveryTrace(runId);

const SERVER_BOUNDARIES = [
  'FOUNDER_TEST_START',
  'INTAKE_VALIDATION',
  'PLANNING_GATE',
  'PLANNING_BRIEF',
  'ARCHITECTURE_BRIEF',
  'BUILD_PLAN',
  'FOUNDER_SIMULATION_ENGINE',
  'CROSS_SYSTEM_ORCHESTRATION_PROOF',
  'EXECUTION_READINESS_GATE',
] as const;

for (const boundaryId of SERVER_BOUNDARIES) {
  enterDeliveryTraceBoundary({ runId, boundaryId });
  completeDeliveryTraceBoundary({ runId, boundaryId, outputExists: true, outputSize: 256 });
}

traceReportGenerationComplete(runId, {
  reportObjectExists: true,
  reportMarkdownExists: true,
  reportMarkdownLength: 4096,
  launchBlockerBoardExists: true,
  serializationSucceeded: true,
  outputSize: 4096,
});

traceResultStoreWrite(runId, {
  storeWriteAttempted: true,
  storeWriteSucceeded: true,
  storedRunId: runId,
  storedPayloadBytes: 8192,
  storedReportLength: 4096,
  phase: 'complete',
});

traceResultRetrievalApi(runId, {
  lookupRunId: runId,
  lookupSuccess: true,
  payloadFound: true,
  reportFound: true,
  reportMarkdownFound: false,
  httpStatus: 202,
  exception: 'reportMarkdown missing in metadata response',
});

const markdown = writeFinalFounderReportDeliveryTraceReport({ runId, rootDir: ROOT });
const retrievalFailReport = buildDeliveryTraceReport(getDeliveryTraceRunSnapshot(runId));

assert('trace report file written', existsSync(join(ROOT, 'architecture/FINAL_FOUNDER_REPORT_DELIVERY_TRACE.md')), 'missing');
assert('trace report mentions verdict', markdown.includes('The final Founder Test report stops at'), 'missing verdict');
assert(
  'analyzer finds RESULT_RETRIEVAL_API as first failed boundary',
  retrievalFailReport.analysis.firstFailedBoundary === 'RESULT_RETRIEVAL_API',
  String(retrievalFailReport.analysis.firstFailedBoundary),
);

resetFinalFounderReportDeliveryTraceForTests();
const clientFailRunId = 'delivery-trace-client-fail-run';
startFinalFounderReportDeliveryTrace(clientFailRunId);

for (const boundaryId of [
  ...SERVER_BOUNDARIES,
  'REPORT_GENERATION',
  'RESULT_STORE_WRITE',
  'RESULT_RETRIEVAL_API',
] as const) {
  enterDeliveryTraceBoundary({ runId: clientFailRunId, boundaryId });
  completeDeliveryTraceBoundary({ runId: clientFailRunId, boundaryId, outputExists: true, outputSize: 256 });
}

enterDeliveryTraceBoundary({ runId: clientFailRunId, boundaryId: 'CLIENT_CACHE' });
failDeliveryTraceBoundary({
  runId: clientFailRunId,
  boundaryId: 'CLIENT_CACHE',
  exception: 'Failed to fetch',
  missingArtifact: 'report markdown',
});

const clientFailReport = buildDeliveryTraceReport(getDeliveryTraceRunSnapshot(clientFailRunId));
assert(
  'analyzer produces concrete stop verdict',
  clientFailReport.analysis.verdict.includes('stops at CLIENT_CACHE') &&
    clientFailReport.analysis.verdict.includes('Failed to fetch'),
  clientFailReport.analysis.verdict,
);

const allPassed = results.every((entry) => entry.passed);
const passToken = allPassed ? FINAL_FOUNDER_REPORT_DELIVERY_TRACE_PASS : null;

writeFileSync(
  join(ROOT, 'architecture/FINAL_FOUNDER_REPORT_DELIVERY_TRACE_VALIDATION.md'),
  buildDeliveryTraceValidationMarkdown(results, passToken),
  'utf8',
);

if (!allPassed) {
  console.error('Final founder report delivery trace validation failed:');
  for (const entry of results.filter((item) => !item.passed)) {
    console.error(`- ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(passToken);
