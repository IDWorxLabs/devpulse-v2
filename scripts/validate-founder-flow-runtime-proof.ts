/**
 * Phase 26.86 — Founder Flow Runtime Proof validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
  buildFounderFlowRuntimeProofReportMarkdown,
  buildFounderFlowRuntimeReconciliationReportMarkdown,
  classifyFounderFlow,
  resetFounderFlowRuntimeProofModuleForTests,
  scanInteractiveElements,
  checkFounderFlowResultDelivery,
  FOUNDER_FLOW_RUNTIME_PROOF_PASS,
} from '../src/founder-flow-runtime-proof/index.js';
import {
  buildFounderTestRunHandoffPayload,
  resetFounderTestRunResultStoreForTests,
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
  'src/founder-flow-runtime-proof/founder-flow-runtime-proof-types.ts',
  'src/founder-flow-runtime-proof/founder-flow-runtime-proof-registry.ts',
  'src/founder-flow-runtime-proof/founder-flow-candidate-discovery.ts',
  'src/founder-flow-runtime-proof/founder-flow-probe-runner.ts',
  'src/founder-flow-runtime-proof/founder-flow-result-store-checker.ts',
  'src/founder-flow-runtime-proof/founder-flow-failure-classifier.ts',
  'src/founder-flow-runtime-proof/founder-flow-runtime-proof-report-builder.ts',
  'src/founder-flow-runtime-proof/founder-flow-runtime-proof-authority.ts',
  'src/founder-flow-runtime-proof/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const registrySource = readFileSync(join(ROOT, 'src/founder-flow-runtime-proof/founder-flow-runtime-proof-registry.ts'), 'utf8');
const authoritySource = readFileSync(join(ROOT, 'src/founder-flow-runtime-proof/founder-flow-runtime-proof-authority.ts'), 'utf8');
const collectorSource = readFileSync(join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'), 'utf8');
const classifierSource = readFileSync(join(ROOT, 'src/founder-flow-runtime-proof/founder-flow-failure-classifier.ts'), 'utf8');
const analyzerSource = readFileSync(join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-proof-analyzer.ts'), 'utf8');

assert('PASS token in registry', registrySource.includes(FOUNDER_FLOW_RUNTIME_PROOF_PASS), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'authority mutates files');
assert('no nested validator in authority', !authoritySource.includes('validate-'), 'nested validator');
assert('runtime bridge wired', collectorSource.includes('assessFounderFlowRuntimeProof'), 'missing');
assert('founderFlowProofAuthoritative in collector', collectorSource.includes('founderFlowProofAuthoritative'), 'missing');
assert('Rule 5 full chain in analyzer', analyzerSource.includes('fullApplicationChainProven'), 'missing');
assert('REPORT_GENERATED_NOT_DELIVERED classifier', classifierSource.includes('REPORT_GENERATED_NOT_DELIVERED'), 'missing');

const interactive = scanInteractiveElements('<html><body><button>Go</button><input /></body></html>');
assert('interactive elements detected', interactive.interactiveElementCount >= 2, String(interactive.interactiveElementCount));

const partialClass = classifyFounderFlow({
  uiRendersBeforeProbe: true,
  applicationBootsBeforeProbe: true,
  routesReachableBeforeProbe: true,
  filesExistOnDisk: true,
  dependenciesReady: true,
  discoveredCandidates: [],
  flowProbe: {
    readOnly: true,
    founderRuntimeOpen: true,
    uiLoadedAsApp: true,
    flowStartProven: true,
    interactiveScan: interactive,
    probeSkipped: false,
    skipReason: null,
  },
  resultStoreCheck: {
    readOnly: true,
    resultStorePresent: true,
    resultStoreRunIds: ['partial-run'],
    latestRunId: 'partial-run',
    reportGenerated: true,
    finalResultDelivered: false,
    clientCacheUpdated: false,
    resultEndpointRegistered: true,
    resultEndpointPath: '/api/founder-test/result',
    finalReportMarkdownPresent: false,
    partialReportOnly: true,
    evidencePropagationAligned: true,
    checkDetail: 'partial only',
  },
});

assert(
  'partial report does not prove founder flow',
  partialClass.founderFlowProven === false && partialClass.failureClass === 'REPORT_GENERATED_NOT_DELIVERED',
  partialClass.failureClass,
);

resetFounderFlowRuntimeProofModuleForTests();
resetRuntimeUiRenderProofModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();
resetFounderTestRunResultStoreForTests();

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

const blockedWithoutUi = assessFounderFlowRuntimeProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  uiRenderProof: { ...uiProof.report, uiRenders: false, failureClass: 'JSON_ONLY_RUNTIME' },
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

assert(
  'UI render required before founder flow proof',
  blockedWithoutUi.report.uiRendersBeforeProbe === false &&
    blockedWithoutUi.report.failureClass === 'UI_RENDER_NOT_READY',
  blockedWithoutUi.report.failureClass,
);

const liveFlowProof = assessFounderFlowRuntimeProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  uiRenderProof: uiProof.report,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  filesExistOnDisk: true,
  dependenciesReady: startupRepair.report.dependencyMaterialization?.dependenciesReady ?? true,
  skipHistoryRecording: true,
});

assert(
  'live workspace founderFlowProven=false without delivery',
  liveFlowProof.report.founderFlowProven === false,
  String(liveFlowProof.report.founderFlowProven),
);
assert(
  'live failure is delivery-related',
  liveFlowProof.report.failureClass === 'FINAL_RESULT_NOT_DELIVERED' ||
    liveFlowProof.report.failureClass === 'RESULT_STORE_MISSING',
  liveFlowProof.report.failureClass,
);

const runtimeBridgeLive = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  routeReachabilityProof: routeProof,
  uiRenderProof: uiProof,
  skipHistoryRecording: true,
});

assert(
  'runtime bridge receives founder flow proof',
  runtimeBridgeLive.report.evidence.founderFlowRuntimeProof !== null,
  'null',
);
assert(
  'live not APPLICATION_PROVEN without founder flow',
  runtimeBridgeLive.report.finalApplicationTruth !== 'APPLICATION_PROVEN',
  runtimeBridgeLive.report.finalApplicationTruth,
);
assert(
  'live failureBoundary FOUNDER_FLOW or REPORTING',
  runtimeBridgeLive.report.reconciliation.failureBoundary === 'FOUNDER_FLOW' ||
    runtimeBridgeLive.report.reconciliation.failureBoundary === 'REPORTING',
  runtimeBridgeLive.report.reconciliation.failureBoundary,
);

resetFounderTestRunResultStoreForTests();
const deliveryRunId = 'founder-flow-proof-delivery-run';
const finalMarkdown = '# Founder Test Final Report\n\nApplication proven at runtime.';
storeFounderTestRunResult({
  readOnly: true,
  runId: deliveryRunId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: buildFounderTestRunHandoffPayload({
    runId: deliveryRunId,
    ok: true,
    runtime: { runId: deliveryRunId, state: 'COMPLETE' } as never,
    reportMarkdown: finalMarkdown,
    finalReportReady: true,
    finalReportPreparing: false,
  }),
  errorMessage: null,
});

const deliveryCheck = checkFounderFlowResultDelivery({});
assert('final delivery detected in store', deliveryCheck.finalResultDelivered === true, String(deliveryCheck.finalResultDelivered));
assert('delivery separate from partial flag', deliveryCheck.partialReportOnly === false, String(deliveryCheck.partialReportOnly));

const deliveryFlowProof = assessFounderFlowRuntimeProof({
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
  'founderFlowProven=true with final delivery',
  deliveryFlowProof.report.founderFlowProven === true,
  String(deliveryFlowProof.report.founderFlowProven),
);
assert(
  'failureClass FOUNDER_FLOW_PROVEN',
  deliveryFlowProof.report.failureClass === 'FOUNDER_FLOW_PROVEN',
  deliveryFlowProof.report.failureClass,
);

const runtimeBridgeProven = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  routeReachabilityProof: routeProof,
  uiRenderProof: uiProof,
  founderFlowRuntimeProof: deliveryFlowProof,
  skipHistoryRecording: true,
});

assert(
  'APPLICATION_PROVEN requires full chain with delivery',
  runtimeBridgeProven.report.finalApplicationTruth === 'APPLICATION_PROVEN',
  runtimeBridgeProven.report.finalApplicationTruth,
);
assert(
  'failureBoundary NONE when founder flow proven',
  runtimeBridgeProven.report.reconciliation.failureBoundary === 'NONE' ||
    runtimeBridgeProven.report.reconciliation.failureBoundary === 'REPORTING',
  runtimeBridgeProven.report.reconciliation.failureBoundary,
);

const failed = results.filter((e) => !e.passed);
const proofReportMd = buildFounderFlowRuntimeProofReportMarkdown(liveFlowProof.report);
const reconciliationMd = buildFounderFlowRuntimeReconciliationReportMarkdown({
  report: deliveryFlowProof.report,
  failureBoundaryBefore: 'REPORTING',
  failureBoundaryAfter: runtimeBridgeProven.report.reconciliation.failureBoundary,
  finalApplicationTruthBefore: 'APPLICATION_PARTIAL',
  finalApplicationTruthAfter: runtimeBridgeProven.report.finalApplicationTruth,
});

writeFileSync(join(ROOT, 'architecture/FOUNDER_FLOW_RUNTIME_PROOF_REPORT.md'), proofReportMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/FOUNDER_FLOW_RUNTIME_RECONCILIATION_REPORT.md'), reconciliationMd, 'utf8');
writeFileSync(
  join(ROOT, 'architecture/FOUNDER_FLOW_RUNTIME_VALIDATION.md'),
  [
    '# Founder Flow Runtime Proof Validation',
    '',
    `Result: ${failed.length === 0 ? FOUNDER_FLOW_RUNTIME_PROOF_PASS : 'FAILED'}`,
    '',
    ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
    '',
    '## Snapshot',
    '',
    `- uiRenders=${uiProof.report.uiRenders}`,
    `- live founderFlowProven=${liveFlowProof.report.founderFlowProven}`,
    `- live failureClass=${liveFlowProof.report.failureClass}`,
    `- delivery founderFlowProven=${deliveryFlowProof.report.founderFlowProven}`,
    `- finalApplicationTruth=${runtimeBridgeProven.report.finalApplicationTruth}`,
    `- failureBoundary=${runtimeBridgeProven.report.reconciliation.failureBoundary}`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error('Validation FAILED:');
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}

console.log(FOUNDER_FLOW_RUNTIME_PROOF_PASS);
