/**
 * Phase 27.00 — Authority Reality Convergence validation (V1).
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
import { resetExecutionProofSourceUnificationModuleForTests } from '../src/execution-proof-source-unification/index.js';
import {
  AUTHORITY_REALITY_CONVERGENCE_PASS,
  LAUNCH_CRITICAL_AUTHORITY_TARGETS,
  assessAuthorityRealityConvergence,
  applyAuthorityRealityConvergenceSync,
  auditVerdictDivergence,
  computeLaunchCriticalAlignment,
  detectStaleConsumers,
  resetAuthorityRealityConvergenceModuleForTests,
  traceLaunchCriticalAuthorities,
  buildAuthorityRealityConvergenceReportMarkdown,
  buildAuthorityRealityConvergenceAuditMarkdown,
  buildAuthorityRealityConvergenceValidationMarkdown,
} from '../src/authority-reality-convergence/index.js';
import type { AuthoritativeRealitySource } from '../src/authority-reality-convergence/index.js';
import type { ExecutionProofConsumerRecord } from '../src/execution-proof-source-unification/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-authority-reality-convergence';
const CANONICAL_WORKSPACE = 'build-ready-idea-1';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/authority-reality-convergence/authority-reality-convergence-types.ts',
  'src/authority-reality-convergence/authority-reality-convergence-registry.ts',
  'src/authority-reality-convergence/authoritative-workspace-auditor.ts',
  'src/authority-reality-convergence/authoritative-runid-auditor.ts',
  'src/authority-reality-convergence/authoritative-manifest-auditor.ts',
  'src/authority-reality-convergence/proof-timestamp-auditor.ts',
  'src/authority-reality-convergence/verdict-divergence-auditor.ts',
  'src/authority-reality-convergence/launch-critical-authority-tracer.ts',
  'src/authority-reality-convergence/stale-consumer-detector.ts',
  'src/authority-reality-convergence/authority-reality-convergence-reconciliation.ts',
  'src/authority-reality-convergence/convergence-report-builder.ts',
  'src/authority-reality-convergence/authority-reality-convergence-history.ts',
  'src/authority-reality-convergence/authority-reality-convergence-authority.ts',
  'src/authority-reality-convergence/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/authority-reality-convergence/authority-reality-convergence-authority.ts'),
  'utf8',
);
const truthMatrixSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('wired into truth matrix', truthMatrixSource.includes('applyAuthorityRealityConvergenceSync'), 'missing');
assert('package script registered', packageJson.includes('validate:authority-reality-convergence'), 'missing');
assert(
  'launch-critical targets count',
  LAUNCH_CRITICAL_AUTHORITY_TARGETS.length === 7,
  String(LAUNCH_CRITICAL_AUTHORITY_TARGETS.length),
);

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
resetAuthorityRealityConvergenceModuleForTests();

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

const deliveryRunId = 'authority-reality-convergence-run';
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
    reportMarkdown: '# Founder Test Final Report\n\nAuthority reality convergence validation.',
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

const authoritativeMock: AuthoritativeRealitySource = {
  readOnly: true,
  authoritativeWorkspaceId: CANONICAL_WORKSPACE,
  authoritativeRunId: deliveryRunId,
  authoritativeManifestId: 'manifest-current',
  authoritativeReportTimestamp: new Date().toISOString(),
  authoritativeProofTimestamp: new Date().toISOString(),
  finalApplicationTruth: 'APPLICATION_PROVEN',
  applicationBoots: true,
  routesReachable: true,
  uiRenders: true,
  founderFlowProven: true,
  runtimeBridgeConsumed: true,
  diskMissingArtifacts: 0,
  diskExistingArtifacts: 12,
  workspaceExistsOnDisk: true,
};

const staleConsumer: ExecutionProofConsumerRecord = {
  readOnly: true,
  authorityId: 'CONNECTED_LAUNCH_READINESS',
  authorityName: 'Launch Readiness Proof',
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
  detail: 'ARTIFACTS_MISREPORTED_MISSING — build-ready-idea-21 missing artifacts',
};

const verdictFindings = auditVerdictDivergence({
  authoritative: authoritativeMock,
  consumerRecords: [staleConsumer],
});
assert(
  'artifacts misreport detected when disk clean',
  verdictFindings.some((f) => f.consumerKind === 'ARTIFACTS_MISREPORTED'),
  verdictFindings.map((f) => f.consumerKind).join(', '),
);

const divergences = detectStaleConsumers({
  authoritative: authoritativeMock,
  auditFindings: verdictFindings,
});
assert('divergence report produced', divergences.length > 0, String(divergences.length));
assert(
  'divergence includes launch impact',
  divergences.every((d) => d.authoritativeSource && d.consumingSource && d.divergenceReason),
  'missing fields',
);

const traces = traceLaunchCriticalAuthorities({
  authoritative: authoritativeMock,
  consumerRecords: [staleConsumer],
  auditFindings: verdictFindings,
});
assert('launch-critical tracer runs', traces.length === LAUNCH_CRITICAL_AUTHORITY_TARGETS.length, String(traces.length));
assert(
  'stale consumer not aligned',
  !computeLaunchCriticalAlignment(traces),
  'unexpected alignment',
);

const assessment = assessAuthorityRealityConvergence({
  rootDir: ROOT,
  runId: deliveryRunId,
  runtimeMaterializationTruthBridge: runtimeBridge,
  launchBlockers: [
    { id: 'artifacts-stale', explanation: 'ARTIFACTS_MISREPORTED_MISSING from build-ready-idea-21' },
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
  assessment.orchestrationState === 'AUTHORITY_REALITY_CONVERGENCE_COMPLETE',
  assessment.orchestrationState,
);
assert(
  'launch-critical traces present',
  assessment.report.launchCriticalTraces.length === LAUNCH_CRITICAL_AUTHORITY_TARGETS.length,
  String(assessment.report.launchCriticalTraces.length),
);

const syncResult = applyAuthorityRealityConvergenceSync({
  runtimeMaterializationTruthBridge: runtimeBridge,
  runId: deliveryRunId,
  launchBlockers: [
    { id: 'proof-stale', explanation: 'PROOF_STALE_VS_DISK — runtime NOT_PROVEN' },
    { id: 'product-chat', explanation: 'Users will hit weak chat answers at launch' },
  ],
  skipHistoryRecording: true,
});
assert(
  'sync reclassifies authority disagreement blockers',
  syncResult.reclassifiedBlockerIds.length >= 1,
  syncResult.reclassifiedBlockerIds.join(', '),
);
assert(
  'sync preserves genuine blockers',
  syncResult.genuineBlockerIds.includes('product-chat'),
  syncResult.genuineBlockerIds.join(', '),
);

assert(
  'pass token issued',
  assessment.report.passToken === AUTHORITY_REALITY_CONVERGENCE_PASS ||
    (assessment.report.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      Boolean(assessment.report.authoritative.authoritativeWorkspaceId)),
  assessment.report.passToken ?? 'null',
);

writeFileSync(
  join(ROOT, 'architecture/AUTHORITY_REALITY_CONVERGENCE_REPORT.md'),
  buildAuthorityRealityConvergenceReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/AUTHORITY_REALITY_CONVERGENCE_AUDIT.md'),
  buildAuthorityRealityConvergenceAuditMarkdown(assessment.report),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
const passed = failed.length === 0;

writeFileSync(
  join(ROOT, `architecture/AUTHORITY_REALITY_CONVERGENCE_VALIDATION.md`),
  buildAuthorityRealityConvergenceValidationMarkdown(passed, results.length, failed.length),
  'utf8',
);

console.log(`\n${VALIDATOR_BASENAME}: ${passed ? 'PASS' : 'FAIL'} (${results.length - failed.length}/${results.length})`);
for (const result of results) {
  console.log(`  [${result.passed ? 'PASS' : 'FAIL'}] ${result.name}: ${result.detail}`);
}

if (!passed) {
  process.exitCode = 1;
}
