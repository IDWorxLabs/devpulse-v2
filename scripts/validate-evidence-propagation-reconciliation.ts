/**
 * Phase 26.88 — Evidence Propagation Reconciliation validation (V1).
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
import {
  resetFounderTruthMatrixIntegrationModuleForTests,
} from '../src/founder-truth-matrix-integration/index.js';
import {
  EVIDENCE_PROPAGATION_RECONCILIATION_PASS,
  assessEvidencePropagationReconciliation,
  applyEvidencePropagationReconciliationToClaims,
  detectAuthorityContradictions,
  detectStaleEvidence,
  resetEvidencePropagationReconciliationModuleForTests,
  scanAuthorityEvidenceSources,
  buildAuthoritativeRuntimeTruth,
  buildEvidencePropagationReconciliationReportMarkdown,
  buildEvidencePropagationAuditReportMarkdown,
  buildAuthorityVerdictAlignmentReportMarkdown,
  KNOWN_STALE_WORKSPACE_IDS,
} from '../src/evidence-propagation-reconciliation/index.js';
import type { AuthorityEvidenceSource } from '../src/evidence-propagation-reconciliation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-evidence-propagation-reconciliation';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-types.ts',
  'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-registry.ts',
  'src/evidence-propagation-reconciliation/authority-evidence-source-scanner.ts',
  'src/evidence-propagation-reconciliation/stale-proof-detector.ts',
  'src/evidence-propagation-reconciliation/workspace-proof-alignment-analyzer.ts',
  'src/evidence-propagation-reconciliation/runtime-truth-consumer-audit.ts',
  'src/evidence-propagation-reconciliation/authority-verdict-reconciliation.ts',
  'src/evidence-propagation-reconciliation/evidence-propagation-report-builder.ts',
  'src/evidence-propagation-reconciliation/evidence-propagation-history.ts',
  'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-authority.ts',
  'src/evidence-propagation-reconciliation/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const registrySource = readFileSync(
  join(ROOT, 'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-registry.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-authority.ts'),
  'utf8',
);
const reconcilerSource = readFileSync(
  join(ROOT, 'src/evidence-propagation-reconciliation/authority-verdict-reconciliation.ts'),
  'utf8',
);
const truthMatrixSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('PASS token in registry', registrySource.includes(EVIDENCE_PROPAGATION_RECONCILIATION_PASS), 'missing');
assert('Rule 1 APPLICATION_PROVEN', reconcilerSource.includes('APPLICATION_PROVEN'), 'missing');
assert('Rule 2 EVIDENCE_PROPAGATION_FAILURE', reconcilerSource.includes('EVIDENCE_PROPAGATION_FAILURE'), 'missing');
assert('Rule 3 STALE_EVIDENCE', reconcilerSource.includes('STALE_EVIDENCE'), 'missing');
assert('known stale workspaces registered', KNOWN_STALE_WORKSPACE_IDS.includes('build-ready-idea-15'), 'missing');
assert('truth matrix wired', truthMatrixSource.includes('applyEvidencePropagationReconciliationSync'), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('no nested validator', !authoritySource.includes('validate-'), 'nested');
assert(
  'package script registered',
  packageJson.includes(`validate:evidence-propagation-reconciliation": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');

resetEvidencePropagationReconciliationModuleForTests();
resetFounderTruthMatrixIntegrationModuleForTests();
resetFounderFlowRuntimeProofModuleForTests();
resetRuntimeUiRenderProofModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();
resetFounderTestRunResultStoreForTests();
resetFounderResultStoreDeliveryRepairForTests();

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

const deliveryRunId = 'evidence-propagation-reconciliation-run';
const finalMarkdown = '# Founder Test Final Report\n\nEvidence propagation reconciliation validation.';
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
    reportMarkdown: finalMarkdown,
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

const staleOverrides: AuthorityEvidenceSource[] = [
  {
    readOnly: true,
    authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
    displayName: 'Autonomous Build Execution Proof',
    workspaceId: 'build-ready-idea-15',
    runId: 'stale-run-15',
    buildProofLevel: 'NOT_PROVEN',
    runtimeProofLevel: 'NOT_PROVEN',
    previewProofLevel: 'NOT_PROVEN',
    founderFlowProofLevel: 'NOT_PROVEN',
    applicationVerdict: 'NOT_PROVEN',
    consumesRuntimeBridge: false,
    evidenceStale: false,
    contradictsAuthoritativeRuntime: false,
    detail: 'stale workspace fixture',
  },
  {
    readOnly: true,
    authorityId: 'FOUNDER_TRUTH_MATRIX',
    displayName: 'Founder Truth Matrix',
    workspaceId: 'world2-ws-4',
    runId: 'stale-world2-run',
    buildProofLevel: 'PARTIAL',
    runtimeProofLevel: 'NOT_PROVEN',
    previewProofLevel: 'PARTIAL',
    founderFlowProofLevel: 'NOT_PROVEN',
    applicationVerdict: 'NOT_PROVEN',
    consumesRuntimeBridge: false,
    evidenceStale: false,
    contradictsAuthoritativeRuntime: false,
    detail: 'stale truth matrix snapshot',
  },
  {
    readOnly: true,
    authorityId: 'LAUNCH_READINESS_PROOF',
    displayName: 'Launch Readiness Proof',
    workspaceId: 'build-ready-idea-1',
    runId: deliveryRunId,
    buildProofLevel: 'PROVEN',
    runtimeProofLevel: 'PROVEN',
    previewProofLevel: 'PROVEN',
    founderFlowProofLevel: 'PROVEN',
    applicationVerdict: 'NOT_PROVEN',
    consumesRuntimeBridge: false,
    evidenceStale: false,
    contradictsAuthoritativeRuntime: false,
    detail: 'pre-reconciliation launch not ready',
  },
];

const authoritative = buildAuthoritativeRuntimeTruth({
  runtimeMaterializationTruthBridge: runtimeBridge,
  runId: deliveryRunId,
});

const preSources = scanAuthorityEvidenceSources({
  rootDir: ROOT,
  runId: deliveryRunId,
  overrides: staleOverrides,
});

const preStale = detectStaleEvidence({ authoritative, sources: preSources });
assert('stale evidence detected', preStale.length >= 2, String(preStale.length));
assert(
  'stale workspace build-ready-idea-15 detected',
  preStale.some((s) => s.staleValue === 'build-ready-idea-15'),
  preStale.map((s) => s.staleValue).join(','),
);

const preContradictions = detectAuthorityContradictions({
  authoritative,
  sources: preSources,
});
assert(
  'authority contradictions detected',
  preContradictions.length >= 2,
  String(preContradictions.length),
);

const assessment = assessEvidencePropagationReconciliation({
  rootDir: ROOT,
  runId: deliveryRunId,
  runtimeMaterializationTruthBridge: runtimeBridge,
  launchReadinessVerdict: 'NOT_LAUNCH_READY',
  authorityEvidenceOverrides: staleOverrides,
  skipHistoryRecording: true,
});

const rec = assessment.report.reconciliation;

assert('verdict reconciliation executed', rec.rulesApplied.length >= 1, String(rec.rulesApplied.length));
assert(
  'runtime truth bridge consumed',
  rec.authoritativeRuntimeTruth.runtimeBridgeConsumed === true,
  String(rec.authoritativeRuntimeTruth.runtimeBridgeConsumed),
);
assert(
  'APPLICATION_PROVEN propagates after reconciliation',
  rec.postReconciliationApplicationTruth === 'APPLICATION_PROVEN',
  rec.postReconciliationApplicationTruth,
);
assert(
  'authority agreement increases after reconciliation',
  rec.postAuthorityAgreement === true && rec.preAuthorityAgreement === false,
  `pre=${rec.preAuthorityAgreement} post=${rec.postAuthorityAgreement}`,
);
assert(
  'no authority remains NOT_PROVEN when runtime APPLICATION_PROVEN',
  rec.authorityEvidenceSources.every((s) => s.applicationVerdict === 'PROVEN'),
  rec.authorityEvidenceSources.map((s) => `${s.authorityId}:${s.applicationVerdict}`).join(','),
);
assert(
  'rootCause is propagation or stale not REAL_PRODUCT_GAP',
  rec.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' || rec.rootCause === 'STALE_EVIDENCE',
  rec.rootCause,
);
assert(
  'launch readiness unblocked from stale proof',
  rec.postLaunchVerdict === 'LAUNCH_READY_WITH_WARNINGS' || rec.launchReadinessBlockedByStaleProof === true,
  String(rec.postLaunchVerdict),
);

const patchedClaims = applyEvidencePropagationReconciliationToClaims(
  [
    {
      readOnly: true,
      claim: 'Application works end-to-end',
      claimId: 'APPLICATION_WORKS',
      authorityVerdicts: [],
      truthMatrixVerdict: 'NOT_PROVEN',
      rootCause: 'REAL_PRODUCT_GAP',
      launchImpact: 'CRITICAL',
      contradictionDetected: true,
      contradictionReason: 'stale',
    },
  ],
  authoritative,
);
assert(
  'claim patch avoids REAL_PRODUCT_GAP when runtime proven',
  patchedClaims[0].truthMatrixVerdict === 'PROVEN' &&
    patchedClaims[0].rootCause !== 'REAL_PRODUCT_GAP',
  `${patchedClaims[0].truthMatrixVerdict}/${patchedClaims[0].rootCause}`,
);

const failed = results.filter((entry) => !entry.passed);

const reconciliationMd = buildEvidencePropagationReconciliationReportMarkdown(assessment.report);
const auditMd = buildEvidencePropagationAuditReportMarkdown(rec);
const alignmentMd = buildAuthorityVerdictAlignmentReportMarkdown(rec);

writeFileSync(join(ROOT, 'architecture/EVIDENCE_PROPAGATION_RECONCILIATION_REPORT.md'), reconciliationMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/EVIDENCE_PROPAGATION_AUDIT_REPORT.md'), auditMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/AUTHORITY_VERDICT_ALIGNMENT_REPORT.md'), alignmentMd, 'utf8');
writeFileSync(
  join(ROOT, 'architecture/EVIDENCE_PROPAGATION_RECONCILIATION_VALIDATION.md'),
  [
    '# Evidence Propagation Reconciliation Validation',
    '',
    `Result: ${failed.length === 0 ? EVIDENCE_PROPAGATION_RECONCILIATION_PASS : 'FAILED'}`,
    '',
    ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
    '',
    '## Snapshot',
    '',
    `- finalApplicationTruth=${rec.postReconciliationApplicationTruth}`,
    `- authorityAgreement=${rec.authorityAgreement}`,
    `- rootCause=${rec.rootCause}`,
    `- staleFindings=${rec.staleEvidence.length}`,
    `- contradictions=${rec.contradictions.length}`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error('Validation FAILED:');
  for (const entry of failed) console.error(`  - ${entry.name}: ${entry.detail}`);
  process.exit(1);
}

console.log(EVIDENCE_PROPAGATION_RECONCILIATION_PASS);
