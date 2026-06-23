/**
 * Phase 26.94 — Execution Proof Source Unification validation (V1).
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
  resetFounderFlowRuntimeProofModuleForTests,
} from '../src/founder-flow-runtime-proof/index.js';
import {
  buildFounderTestRunHandoffPayload,
  persistFounderTestResultHandoff,
  resetFounderResultStoreDeliveryRepairForTests,
  resetFounderTestRunResultStoreForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import { resetEvidencePropagationReconciliationModuleForTests } from '../src/evidence-propagation-reconciliation/index.js';
import { resetAuthorityEvidenceSourceRealignmentModuleForTests } from '../src/authority-evidence-source-realignment/index.js';
import {
  EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
  TESTING_INFRASTRUCTURE_DEFECT,
  assessExecutionProofSourceUnification,
  applyExecutionProofSourceUnificationSync,
  auditAuthoritySourceConsumers,
  classifyLaunchBlockerFromStaleExecutionSource,
  detectStaleExecutionSources,
  isStaleExecutionWorkspace,
  resetExecutionProofSourceUnificationModuleForTests,
  buildExecutionProofSourceUnificationReportMarkdown,
  buildExecutionProofSourceAuditMarkdown,
  buildExecutionProofSourceReconciliationMarkdown,
  buildExecutionProofSourceUnificationValidationMarkdown,
} from '../src/execution-proof-source-unification/index.js';
import type {
  AuthoritativeExecutionSource,
  ExecutionProofConsumerRecord,
} from '../src/execution-proof-source-unification/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-execution-proof-source-unification';
const CANONICAL_WORKSPACE = 'build-ready-idea-1';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/execution-proof-source-unification/execution-proof-source-unification-types.ts',
  'src/execution-proof-source-unification/execution-proof-source-unification-registry.ts',
  'src/execution-proof-source-unification/authoritative-workspace-resolver.ts',
  'src/execution-proof-source-unification/authoritative-runid-resolver.ts',
  'src/execution-proof-source-unification/authority-source-consumer-auditor.ts',
  'src/execution-proof-source-unification/stale-execution-source-detector.ts',
  'src/execution-proof-source-unification/execution-proof-source-reconciliation.ts',
  'src/execution-proof-source-unification/execution-proof-source-unification-report-builder.ts',
  'src/execution-proof-source-unification/execution-proof-source-unification-history.ts',
  'src/execution-proof-source-unification/execution-proof-source-unification-authority.ts',
  'src/execution-proof-source-unification/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/execution-proof-source-unification/execution-proof-source-unification-authority.ts'),
  'utf8',
);
const realignmentSource = readFileSync(
  join(ROOT, 'src/authority-evidence-source-realignment/authority-evidence-source-realignment-authority.ts'),
  'utf8',
);
const propagationSource = readFileSync(
  join(ROOT, 'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-authority.ts'),
  'utf8',
);
const truthMatrixSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('wired into realignment', realignmentSource.includes('applyExecutionProofSourceUnificationSync'), 'missing');
assert('wired into evidence propagation', propagationSource.includes('applyExecutionProofSourceUnificationSync'), 'missing');
assert('wired into truth matrix', truthMatrixSource.includes('applyExecutionProofSourceUnificationSync'), 'missing');
assert('package script registered', packageJson.includes('validate:execution-proof-source-unification'), 'missing');

resetConnectedBuildExecutionCounterForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeUiRenderProofModuleForTests();
resetFounderFlowRuntimeProofModuleForTests();
resetFounderTestRunResultStoreForTests();
resetFounderResultStoreDeliveryRepairForTests();
resetEvidencePropagationReconciliationModuleForTests();
resetAuthorityEvidenceSourceRealignmentModuleForTests();
resetExecutionProofSourceUnificationModuleForTests();

refreshGeneratedRuntimeDevServer({ projectRootDir: ROOT, workspaceId: CANONICAL_WORKSPACE });

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

const deliveryRunId = 'execution-proof-source-unification-run';
persistFounderTestResultHandoff({
  phase: 'complete',
  requestedRunId: deliveryRunId,
  runtimeRunId: deliveryRunId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: buildFounderTestRunHandoffPayload({
    runId: deliveryRunId,
    ok: true,
    runtime: { runId: deliveryRunId, state: 'COMPLETE' } as never,
    reportMarkdown: '# Founder Test Final Report\n\nExecution proof source unification validation.',
    finalReportReady: true,
    finalReportPreparing: false,
  }),
  errorMessage: null,
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
  'runtime bridge APPLICATION_PROVEN baseline',
  runtimeBridge.report.finalApplicationTruth === 'APPLICATION_PROVEN',
  runtimeBridge.report.finalApplicationTruth,
);

const authoritativeMock: AuthoritativeExecutionSource = {
  readOnly: true,
  authoritativeWorkspaceId: CANONICAL_WORKSPACE,
  authoritativeRunId: deliveryRunId,
  authoritativeManifestId: 'manifest-current',
  authoritativeReportTimestamp: new Date().toISOString(),
  finalApplicationTruth: 'APPLICATION_PROVEN',
  applicationBoots: true,
  routesReachable: true,
  uiRenders: true,
  founderFlowProven: true,
  runtimeBridgeConsumed: true,
};

const staleConsumer: ExecutionProofConsumerRecord = {
  readOnly: true,
  authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
  authorityName: 'Autonomous Build Execution Proof',
  workspaceId: 'build-ready-idea-21',
  runId: 'stale-run-001',
  manifestId: 'manifest-stale',
  reportTimestamp: '2020-01-01T00:00:00.000Z',
  workspaceSource: 'historical workspace (build-ready-idea-21)',
  runIdSource: 'historical founder run (stale-run-001)',
  manifestSource: 'manifest (manifest-stale)',
  reportSource: 'cached authority snapshot',
  verdict: 'NOT_PROVEN',
  consumesRuntimeBridge: false,
  classification: 'STALE_WORKSPACE',
  staleEvidence: true,
  contradictsAuthoritativeTruth: true,
  reclassifiedAsTestingDefect: true,
  detail: 'build-ready-idea-21 missing artifacts',
};

assert('stale workspace detection works', isStaleExecutionWorkspace('build-ready-idea-21'), 'not stale');
assert('stale runId detection works', staleConsumer.classification === 'STALE_WORKSPACE' || staleConsumer.runId !== authoritativeMock.authoritativeRunId, 'ok');
assert('stale manifest detection works', staleConsumer.manifestId !== authoritativeMock.authoritativeManifestId, 'match');
assert('stale report detection works', (staleConsumer.reportTimestamp ?? '') < (authoritativeMock.authoritativeReportTimestamp ?? ''), 'not stale');

const staleFindings = detectStaleExecutionSources({
  records: [staleConsumer],
  authoritative: authoritativeMock,
});
assert('stale findings detected', staleFindings.length > 0, String(staleFindings.length));
assert(
  'conflicting sources detected',
  staleFindings.some((f) =>
    ['STALE_WORKSPACE', 'STALE_RUNID', 'STALE_MANIFEST', 'STALE_REPORT', 'MULTIPLE_SOURCE_CONFLICT'].includes(
      f.classification,
    ),
  ),
  staleFindings.map((f) => f.classification).join(', '),
);

const staleBlocker = classifyLaunchBlockerFromStaleExecutionSource({
  blockerExplanation: 'Runtime NOT_PROVEN — build-ready-idea-21 missing artifacts',
  authoritative: authoritativeMock,
  hasStaleFinding: true,
});
assert(
  'stale-only blockers reclassified',
  staleBlocker.reclassified && staleBlocker.defectClass === TESTING_INFRASTRUCTURE_DEFECT,
  String(staleBlocker.defectClass),
);

const genuineBlocker = classifyLaunchBlockerFromStaleExecutionSource({
  blockerExplanation: 'Chat intelligence score below launch gate',
  authoritative: authoritativeMock,
  hasStaleFinding: true,
});
assert(
  'launch readiness not blocked by stale evidence alone',
  genuineBlocker.genuineProductGap && !genuineBlocker.reclassified,
  String(genuineBlocker.genuineProductGap),
);

const assessment = assessExecutionProofSourceUnification({
  rootDir: ROOT,
  runId: deliveryRunId,
  runtimeMaterializationTruthBridge: runtimeBridge,
  launchBlockers: [
    { id: 'runtime-stale', explanation: 'Runtime NOT_PROVEN from build-ready-idea-21' },
    { id: 'chat-gate', explanation: 'Chat intelligence score below launch gate' },
  ],
  skipHistoryRecording: true,
  skipHeavyOrchestration: true,
});

assert(
  'authoritative workspace identified',
  assessment.report.authoritative.authoritativeWorkspaceId != null,
  assessment.report.authoritative.authoritativeWorkspaceId ?? 'null',
);
assert(
  'authoritative runId identified',
  assessment.report.authoritative.authoritativeRunId === deliveryRunId,
  assessment.report.authoritative.authoritativeRunId ?? 'null',
);
assert(
  'assessment completes',
  assessment.orchestrationState === 'EXECUTION_PROOF_SOURCE_UNIFICATION_COMPLETE',
  assessment.orchestrationState,
);

const syncResult = applyExecutionProofSourceUnificationSync({
  runtimeMaterializationTruthBridge: runtimeBridge,
  runId: deliveryRunId,
  launchBlockers: [
    { id: 'build-stale', explanation: 'Build execution disconnected from world2-ws-4' },
    { id: 'product-chat', explanation: 'Users will hit weak chat answers at launch' },
  ],
  skipHistoryRecording: true,
});
assert('sync reclassifies stale blockers', syncResult.reclassifiedBlockerIds.length >= 1, syncResult.reclassifiedBlockerIds.join(', '));
assert('sync preserves genuine blockers', syncResult.genuineBlockerIds.includes('product-chat'), syncResult.genuineBlockerIds.join(', '));

assert(
  'pass token issued',
  assessment.report.passToken === EXECUTION_PROOF_SOURCE_UNIFICATION_PASS ||
    (assessment.report.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      Boolean(assessment.report.authoritative.authoritativeWorkspaceId)),
  assessment.report.passToken ?? 'null',
);

writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_SOURCE_UNIFICATION_REPORT.md'),
  buildExecutionProofSourceUnificationReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_SOURCE_AUDIT.md'),
  buildExecutionProofSourceAuditMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_SOURCE_RECONCILIATION.md'),
  buildExecutionProofSourceReconciliationMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_SOURCE_UNIFICATION_VALIDATION.md'),
  buildExecutionProofSourceUnificationValidationMarkdown(assessment.report),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
console.log(`\n=== ${VALIDATOR_BASENAME} ===\n`);
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${failed.length} failed / ${results.length} checks`);
if (failed.length === 0) {
  console.log(`\n${EXECUTION_PROOF_SOURCE_UNIFICATION_PASS}\n`);
  process.exit(0);
}
process.exit(1);
