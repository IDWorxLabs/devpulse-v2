/**
 * Phase 27.01 — Execution Proof Contradiction Elimination validation (V1).
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
import { resetAuthorityRealityConvergenceModuleForTests } from '../src/authority-reality-convergence/index.js';
import {
  CONTRADICTION_AUDIT_TARGETS,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
  TESTING_INFRASTRUCTURE_DEFECT,
  assessExecutionProofContradictionElimination,
  applyExecutionProofContradictionEliminationSync,
  classifyContradictionRootCause,
  detectExecutionProofContradictions,
  isContradictoryVerdict,
  reclassifyContradiction,
  resetExecutionProofContradictionEliminationModuleForTests,
  traceAuthorityVerdicts,
  buildExecutionProofContradictionEliminationReportMarkdown,
  buildExecutionProofContradictionAuditMarkdown,
  buildExecutionProofContradictionRootCauseMarkdown,
  buildExecutionProofContradictionValidationMarkdown,
} from '../src/execution-proof-contradiction-elimination/index.js';
import type {
  AuthoritativeContradictionContext,
  AuthorityVerdictTrace,
} from '../src/execution-proof-contradiction-elimination/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-execution-proof-contradiction-elimination';
const CANONICAL_WORKSPACE = 'build-ready-idea-1';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/execution-proof-contradiction-elimination/execution-proof-contradiction-elimination-types.ts',
  'src/execution-proof-contradiction-elimination/execution-proof-contradiction-elimination-registry.ts',
  'src/execution-proof-contradiction-elimination/authority-verdict-tracer.ts',
  'src/execution-proof-contradiction-elimination/workspace-source-tracer.ts',
  'src/execution-proof-contradiction-elimination/runid-source-tracer.ts',
  'src/execution-proof-contradiction-elimination/manifest-source-tracer.ts',
  'src/execution-proof-contradiction-elimination/timestamp-source-tracer.ts',
  'src/execution-proof-contradiction-elimination/execution-proof-contradiction-detector.ts',
  'src/execution-proof-contradiction-elimination/contradiction-root-cause-classifier.ts',
  'src/execution-proof-contradiction-elimination/execution-proof-contradiction-report-builder.ts',
  'src/execution-proof-contradiction-elimination/execution-proof-contradiction-history.ts',
  'src/execution-proof-contradiction-elimination/execution-proof-contradiction-elimination-authority.ts',
  'src/execution-proof-contradiction-elimination/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/execution-proof-contradiction-elimination/execution-proof-contradiction-elimination-authority.ts'),
  'utf8',
);
const truthMatrixSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert(
  'wired into truth matrix',
  truthMatrixSource.includes('applyExecutionProofContradictionEliminationSync'),
  'missing',
);
assert(
  'package script registered',
  packageJson.includes('validate:execution-proof-contradiction-elimination'),
  'missing',
);
assert(
  'audit targets count',
  CONTRADICTION_AUDIT_TARGETS.length === 10,
  String(CONTRADICTION_AUDIT_TARGETS.length),
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
resetExecutionProofContradictionEliminationModuleForTests();

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

const deliveryRunId = 'execution-proof-contradiction-elimination-run';
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
    reportMarkdown: '# Founder Test Final Report\n\nExecution proof contradiction elimination validation.',
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

const authoritativeMock: AuthoritativeContradictionContext = {
  readOnly: true,
  applicationProven: true,
  authoritativeWorkspaceId: CANONICAL_WORKSPACE,
  authoritativeRunId: deliveryRunId,
  authoritativeManifestId: 'manifest-current',
  authoritativeProofTimestamp: new Date().toISOString(),
  diskMissingArtifacts: 0,
  diskExistingArtifacts: 12,
  runtimeBridgeVerdict: 'APPLICATION_PROVEN',
  convergencePassed: true,
  unificationPassed: true,
};

const staleTrace: AuthorityVerdictTrace = {
  readOnly: true,
  authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
  authorityName: 'Autonomous Build Execution Proof',
  dimension: 'BUILD',
  workspaceId: CANONICAL_WORKSPACE,
  runId: deliveryRunId,
  manifestId: 'manifest-current',
  proofTimestamp: authoritativeMock.authoritativeProofTimestamp,
  verdict: 'PARTIAL',
  proofLevel: 'PARTIAL',
  sourceFile: 'src/autonomous-build-execution-proof/autonomous-build-execution-proof-authority.ts',
  sourceChain: 'AUTONOMOUS_BUILD_EXECUTION_PROOF → timestamp:cached(2020-01-01T00:00:00.000Z)',
  consumesRuntimeBridge: false,
  detail: 'ARTIFACTS_MISREPORTED_MISSING cached verdict',
};

assert('contradictory verdict detection', isContradictoryVerdict('PARTIAL'), 'PARTIAL');
assert('contradictory verdict detection NOT_PROVEN', isContradictoryVerdict('NOT_PROVEN'), 'NOT_PROVEN');

const rootCause = classifyContradictionRootCause({
  trace: staleTrace,
  authoritative: authoritativeMock,
});
assert(
  'root cause classified',
  rootCause === 'STALE_VERDICT_CACHE' || rootCause === 'STALE_REPORT_REFERENCE',
  rootCause,
);

const reclassification = reclassifyContradiction({
  rootCause,
  authoritative: authoritativeMock,
  trace: staleTrace,
});
assert(
  'reclassified as testing infrastructure defect',
  reclassification === TESTING_INFRASTRUCTURE_DEFECT,
  reclassification,
);

const mockContradictions = detectExecutionProofContradictions({
  traces: [staleTrace],
  authoritative: authoritativeMock,
});
assert('contradiction detector finds stale verdict', mockContradictions.length >= 1, String(mockContradictions.length));

const assessment = assessExecutionProofContradictionElimination({
  rootDir: ROOT,
  runId: deliveryRunId,
  runtimeMaterializationTruthBridge: runtimeBridge,
  launchBlockers: [
    { id: 'build-partial', explanation: 'BUILD=PARTIAL from stale autonomous chain' },
    { id: 'misreport', explanation: 'ARTIFACTS_MISREPORTED_MISSING after convergence' },
    { id: 'chat-gate', explanation: 'Chat intelligence score below launch gate' },
  ],
  skipHistoryRecording: true,
  skipHeavyOrchestration: true,
});

assert('all authorities traced', assessment.report.allAuthoritiesTraced, String(assessment.report.allAuthoritiesTraced));
assert(
  'authority traces present',
  assessment.report.authorityTraces.length >= CONTRADICTION_AUDIT_TARGETS.length,
  String(assessment.report.authorityTraces.length),
);
assert(
  'assessment completes',
  assessment.orchestrationState === 'EXECUTION_PROOF_CONTRADICTION_ELIMINATION_COMPLETE',
  assessment.orchestrationState,
);
assert(
  'truth matrix misreport suppression enabled',
  assessment.report.elimination.truthMatrixMisreportSuppressed,
  String(assessment.report.elimination.truthMatrixMisreportSuppressed),
);

const syncResult = applyExecutionProofContradictionEliminationSync({
  runtimeMaterializationTruthBridge: runtimeBridge,
  runId: deliveryRunId,
  launchBlockers: [
    { id: 'proof-stale', explanation: 'PROOF_STALE_VS_DISK — runtime NOT_PROVEN' },
    { id: 'product-chat', explanation: 'Users will hit weak chat answers at launch' },
  ],
  skipHistoryRecording: true,
});
assert(
  'sync reclassifies execution contradiction blockers',
  syncResult.reclassifiedBlockerIds.includes('proof-stale'),
  syncResult.reclassifiedBlockerIds.join(', '),
);
assert(
  'sync preserves genuine blockers',
  syncResult.genuineBlockerIds.includes('product-chat'),
  syncResult.genuineBlockerIds.join(', '),
);

assert(
  'pass token issued',
  assessment.report.passToken === EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
  assessment.report.passToken ?? 'null',
);

writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_CONTRADICTION_ELIMINATION_REPORT.md'),
  buildExecutionProofContradictionEliminationReportMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_CONTRADICTION_AUDIT.md'),
  buildExecutionProofContradictionAuditMarkdown(assessment.report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_CONTRADICTION_ROOT_CAUSE.md'),
  buildExecutionProofContradictionRootCauseMarkdown(assessment.report),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
const passed = failed.length === 0;

writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_CONTRADICTION_VALIDATION.md'),
  buildExecutionProofContradictionValidationMarkdown(passed, results.length, failed.length),
  'utf8',
);

console.log(`\n${VALIDATOR_BASENAME}: ${passed ? 'PASS' : 'FAIL'} (${results.length - failed.length}/${results.length})`);
for (const result of results) {
  console.log(`  [${result.passed ? 'PASS' : 'FAIL'}] ${result.name}: ${result.detail}`);
}

if (!passed) {
  process.exitCode = 1;
}
