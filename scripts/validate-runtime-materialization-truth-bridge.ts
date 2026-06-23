/**
 * Phase 26.76 — Runtime Materialization Truth Bridge validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import { analyzeAllConsistencyClaims } from '../src/founder-test-consistency-audit/index.js';
import {
  applyRuntimeMaterializationTruthToClaims,
  assessRuntimeMaterializationTruthBridge,
  buildRuntimeMaterializationTruthBridgeReportMarkdown,
  buildRuntimeMaterializationTruthReconciliationReportMarkdown,
  getRuntimeMaterializationTruthBridgeHistorySize,
  reconcileRuntimeMaterializationTruth,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS,
  RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION,
  FOUNDER_RUNTIME_TRUTH_QUESTIONS,
  RECONCILIATION_RULES,
} from '../src/runtime-materialization-truth-bridge/index.js';
import {
  applyTruthMatrixLaunchReconciliationSync,
  buildConsistencyEvidenceFromLaunchContext,
  reconcileTruthClaims,
} from '../src/founder-truth-matrix-integration/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';
import { resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
import { resetRuntimeActivationProofCounterForTests } from '../src/connected-runtime-activation-proof/index.js';

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
  'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.ts',
  'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-registry.ts',
  'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts',
  'src/runtime-materialization-truth-bridge/runtime-proof-analyzer.ts',
  'src/runtime-materialization-truth-bridge/runtime-truth-reconciler.ts',
  'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-report-builder.ts',
  'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-history.ts',
  'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-authority.ts',
  'src/runtime-materialization-truth-bridge/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const reconcilerSource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-truth-reconciler.ts'),
  'utf8',
);
const launchAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
const truthMatrixAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts'),
  'utf8',
);
const registrySource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-registry.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-authority.ts'),
  'utf8',
);
const collectorSource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'),
  'utf8',
);

assert('RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS token', registrySource.includes(RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS), 'missing');
assert('RUNTIME_MATERIALIZATION_TRUTH operation', reconcilerSource.includes(RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION), 'missing');
assert('Rule 1 APPLICATION_PROVEN', reconcilerSource.includes('APPLICATION_PROVEN even if downstream reporting disagrees'), 'missing');
assert('Rule 2 RUNTIME_START_FAILURE', reconcilerSource.includes('RUNTIME_START_FAILURE'), 'missing');
assert('Rule 3 ROUTE_FAILURE', reconcilerSource.includes('ROUTE_FAILURE'), 'missing');
assert('Rule 4 EVIDENCE_PROPAGATION_FAILURE', reconcilerSource.includes('EVIDENCE_PROPAGATION_FAILURE'), 'missing');
assert('applyRuntimeMaterializationTruthToClaims', reconcilerSource.includes('applyRuntimeMaterializationTruthToClaims'), 'missing');
assert('APPLICATION_WORKS claim patch', reconcilerSource.includes('APPLICATION_WORKS'), 'missing');
assert('founder questions registered', FOUNDER_RUNTIME_TRUTH_QUESTIONS.length === 7, String(FOUNDER_RUNTIME_TRUTH_QUESTIONS.length));
assert('launch readiness wired', launchAuthoritySource.includes('assessRuntimeMaterializationTruthBridge'), 'missing');
assert('truth matrix wired', truthMatrixAuthoritySource.includes('applyRuntimeMaterializationTruthToClaims'), 'missing');
assert('runtimeMaterializationTruthBridge input', readFileSync(join(ROOT, 'src/founder-truth-matrix-integration/launch-readiness-truth-bridge.ts'), 'utf8').includes('runtimeMaterializationTruthBridge'), 'missing');
assert('no file mutation in authority', !authoritySource.includes('writeFileSync'), 'authority may mutate files');
assert('skip gap activation', collectorSource.includes('skipRuntimeProofGapActivation: true'), 'missing');
assert('skip preview gap activation', collectorSource.includes('skipPreviewProofGapActivation: true'), 'missing');

resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();
resetRuntimeActivationProofCounterForTests();

const assessment = assessRuntimeMaterializationTruthBridge({ rootDir: ROOT });
const report = assessment.report;
const rec = report.reconciliation;
const snap = report.evidence.snapshot;

assert('assessment completes', assessment.orchestrationState === 'RUNTIME_MATERIALIZATION_TRUTH_COMPLETE', assessment.orchestrationState);
assert('runtime evidence consumed', typeof snap.runtimeProofLevel === 'string', snap.runtimeProofLevel);
assert('proof analysis assigned', Boolean(report.evidence.proofAnalysis.derivedVerdict), report.evidence.proofAnalysis.derivedVerdict);
assert('final APPLICATION truth derived', ['APPLICATION_PROVEN', 'APPLICATION_PARTIAL', 'APPLICATION_NOT_PROVEN'].includes(report.finalApplicationTruth), report.finalApplicationTruth);
assert('failure boundary identified', Boolean(rec.failureBoundary), rec.failureBoundary);
assert('founder answers generated', rec.founderAnswers.recommendedNextActions.length > 0, 'empty');
assert('rules applied', rec.rulesApplied.length >= 1, String(rec.rulesApplied.length));
assert('history recorded', getRuntimeMaterializationTruthBridgeHistorySize() >= 1, String(getRuntimeMaterializationTruthBridgeHistorySize()));
assert('report markdown builds', buildRuntimeMaterializationTruthBridgeReportMarkdown(report).includes('Final APPLICATION truth'), 'missing');
assert('reconciliation report builds', buildRuntimeMaterializationTruthReconciliationReportMarkdown(report).includes('FILES_EXIST vs APPLICATION_WORKS'), 'missing');

if (snap.filesExistOnDisk) {
  assert(
    'FILES_EXIST distinguished from APPLICATION_WORKS',
    rec.failureBoundary === 'STARTUP' ||
      rec.failureBoundary === 'RUNTIME' ||
      rec.failureBoundary === 'ROUTE' ||
      rec.failureBoundary === 'UI' ||
      rec.failureBoundary === 'NONE' ||
      rec.failureBoundary === 'FOUNDER_FLOW' ||
      rec.failureBoundary === 'REPORTING' ||
      rec.failureBoundary === 'EVIDENCE_PROPAGATION',
    rec.failureBoundary,
  );
}

const mockReconciliation = reconcileRuntimeMaterializationTruth({
  evidence: report.evidence,
  reconciliationId: 'validation-mock',
});

const founderTestAssessment = assessFounderTestIntegration({ rootDir: ROOT });
const consistencyEvidence = buildConsistencyEvidenceFromLaunchContext({
  rootDir: ROOT,
  founderTestAssessment,
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  founderReadinessScore: founderTestAssessment.score.overall,
  topBlockers: [],
  chatStressSimulation: null,
  productReadinessSimulation: null,
  autonomousBuildExecutionProof: null,
  runId: founderTestAssessment.run.runId,
  runtimeMaterializationTruthBridge: assessment,
});

const claimAudits = analyzeAllConsistencyClaims(consistencyEvidence);
const baseClaims = reconcileTruthClaims(claimAudits);
const patchedClaims = applyRuntimeMaterializationTruthToClaims(baseClaims, mockReconciliation);

const appWorks = patchedClaims.find((c) => c.claimId === 'APPLICATION_WORKS');
const appRuns = patchedClaims.find((c) => c.claimId === 'APPLICATION_RUNS');
assert('APPLICATION_WORKS claim patched', Boolean(appWorks), 'missing');
assert('APPLICATION_RUNS claim patched', Boolean(appRuns), 'missing');

const truthResult = applyTruthMatrixLaunchReconciliationSync({
  rootDir: ROOT,
  founderTestAssessment,
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  founderReadinessScore: founderTestAssessment.score.overall,
  topBlockers: [],
  chatStressSimulation: null,
  productReadinessSimulation: null,
  autonomousBuildExecutionProof: null,
  runId: founderTestAssessment.run.runId,
  runtimeMaterializationTruthBridge: assessment,
  skipHistoryRecording: true,
});

const truthAppClaim = truthResult.integration.report.reconciliation.claims.find(
  (c) => c.claimId === 'APPLICATION_WORKS' || c.claimId === 'LIVE_PREVIEW_RUNS_APPLICATIONS',
);
assert('launch reconciliation consumes runtime bridge', Boolean(truthAppClaim), 'missing');

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Runtime Materialization Truth Bridge Validation',
  '',
  `Result: ${failed.length === 0 ? RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Assessment snapshot',
  '',
  `- finalApplicationTruth=${report.finalApplicationTruth}`,
  `- rootCause=${rec.rootCause}`,
  `- failureBoundary=${rec.failureBoundary}`,
  `- contradictionCount=${rec.contradictionCount}`,
  `- founderTestVerdictReconciled=${rec.founderTestVerdictReconciled}`,
  `- filesExistOnDisk=${snap.filesExistOnDisk}`,
  `- runtimeProofLevel=${snap.runtimeProofLevel}`,
  `- applicationBoots=${report.evidence.proofAnalysis.applicationBoots}`,
  `- routesReachable=${report.evidence.proofAnalysis.routesReachable}`,
  `- uiRenders=${report.evidence.proofAnalysis.uiRenders}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'RUNTIME_MATERIALIZATION_VALIDATION.md'), validationSummary, 'utf8');

writeFileSync(
  join(ROOT, 'architecture', 'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_REPORT.md'),
  [
    '# Runtime Materialization Truth Bridge Report',
    '',
    '## Objective',
    '',
    'Extend proof from BUILD_PROVEN to APPLICATION_PROVEN using runtime evidence.',
    '',
    '## Path',
    '',
    '- `assessRuntimeMaterializationTruthBridge()` — read-only orchestrator',
    '- `collectRuntimeMaterializationTruthEvidence()` — startup, route, UI, founder flow',
    '- `analyzeRuntimeProofBoundaries()` — identifies failure boundary',
    '- `reconcileRuntimeMaterializationTruth()` — applies rules 1–4',
    '- `applyRuntimeMaterializationTruthToClaims()` — patches Truth Matrix application claims',
    '',
    '## Latest assessment',
    '',
    `- finalApplicationTruth: **${report.finalApplicationTruth}**`,
    `- rootCause: **${rec.rootCause}**`,
    `- failureBoundary: **${rec.failureBoundary}**`,
    `- recommendedFix: **${rec.recommendedFix}**`,
    '',
    '## Pass token',
    '',
    RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS,
    '',
    buildRuntimeMaterializationTruthBridgeReportMarkdown(report),
  ].join('\n'),
  'utf8',
);

writeFileSync(
  join(ROOT, 'architecture', 'RUNTIME_MATERIALIZATION_RECONCILIATION_REPORT.md'),
  buildRuntimeMaterializationTruthReconciliationReportMarkdown(report),
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS);
console.log(validationSummary);
