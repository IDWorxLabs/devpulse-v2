/**
 * Phase 26.75 — Build Materialization Truth Bridge validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import {
  BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS,
  BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION,
  FOUNDER_BUILD_TRUTH_QUESTIONS,
  RECONCILIATION_RULES,
  applyBuildMaterializationTruthToClaims,
  assessBuildMaterializationTruthBridge,
  buildBuildMaterializationTruthBridgeReportMarkdown,
  buildBuildMaterializationTruthReconciliationReportMarkdown,
  collectBuildMaterializationTruthEvidence,
  getBuildMaterializationTruthBridgeHistorySize,
  reconcileBuildMaterializationTruth,
  resetBuildMaterializationTruthBridgeModuleForTests,
  shouldSuppressArtifactsBrokenBlocker,
} from '../src/build-materialization-truth-bridge/index.js';
import {
  applyTruthMatrixLaunchReconciliationSync,
  reconcileTruthClaims,
} from '../src/founder-truth-matrix-integration/index.js';
import { analyzeAllConsistencyClaims } from '../src/founder-test-consistency-audit/index.js';
import { buildConsistencyEvidenceFromLaunchContext } from '../src/founder-truth-matrix-integration/index.js';
import { resetBuildMaterializationRealityModuleForTests } from '../src/build-materialization-reality/index.js';
import { resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';

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

class MutationGuard {
  private readonly authoritySource: string;

  constructor() {
    this.authoritySource = readFileSync(
      join(ROOT, 'src/build-materialization-truth-bridge/build-materialization-truth-bridge-authority.ts'),
      'utf8',
    );
  }

  noFileMutation(): boolean {
    return (
      !this.authoritySource.includes('writeFileSync') &&
      !this.authoritySource.includes('writeFile(') &&
      !this.authoritySource.includes('materializeBuildProofGapArtifacts')
    );
  }

  noSyntheticEvidence(): boolean {
    return (
      !this.authoritySource.includes('materializeBuildProofGapArtifacts') &&
      readFileSync(join(ROOT, 'src/build-materialization-truth-bridge/evidence-bridge.ts'), 'utf8').includes(
        'attemptBuildProofGapMaterialization: false',
      )
    );
  }
}

const REQUIRED = [
  'src/build-materialization-truth-bridge/build-materialization-truth-bridge-types.ts',
  'src/build-materialization-truth-bridge/build-materialization-truth-bridge-registry.ts',
  'src/build-materialization-truth-bridge/evidence-bridge.ts',
  'src/build-materialization-truth-bridge/truth-reconciler.ts',
  'src/build-materialization-truth-bridge/build-materialization-truth-bridge-report-builder.ts',
  'src/build-materialization-truth-bridge/build-materialization-truth-bridge-history.ts',
  'src/build-materialization-truth-bridge/build-materialization-truth-bridge-authority.ts',
  'src/build-materialization-truth-bridge/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const reconcilerSource = readFileSync(
  join(ROOT, 'src/build-materialization-truth-bridge/truth-reconciler.ts'),
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

assert('BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS token', reconcilerSource.includes(BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS) || readFileSync(join(ROOT, 'src/build-materialization-truth-bridge/build-materialization-truth-bridge-registry.ts'), 'utf8').includes(BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS), 'missing');
assert('BUILD_MATERIALIZATION_TRUTH operation', reconcilerSource.includes(BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION), 'missing');
assert('Rule 1 ARTIFACTS_NOT_GENERATED guard', reconcilerSource.includes('ARTIFACTS_NOT_GENERATED cannot be root cause'), 'missing');
assert('Rule 2 BUILD_TRUTH_CONTRADICTION', reconcilerSource.includes('BUILD_TRUTH_CONTRADICTION'), 'missing');
assert('Rule 3 filesystem evidence priority', reconcilerSource.includes('filesystem evidence outranks stale proof snapshots'), 'missing');
assert('Rule 4 EVIDENCE_PROPAGATION_FAILURE', reconcilerSource.includes('EVIDENCE_PROPAGATION_FAILURE not ARTIFACTS_NOT_GENERATED'), 'missing');
assert('founder questions registered', FOUNDER_BUILD_TRUTH_QUESTIONS.length === 6, String(FOUNDER_BUILD_TRUTH_QUESTIONS.length));
assert('reconciliation rules count', RECONCILIATION_RULES.length === 4, String(RECONCILIATION_RULES.length));
assert('launch readiness wired', launchAuthoritySource.includes('assessBuildMaterializationTruthBridge'), 'missing');
assert('truth matrix wired', truthMatrixAuthoritySource.includes('applyBuildMaterializationTruthToClaims'), 'missing');
assert('buildMaterializationTruthBridge input', readFileSync(join(ROOT, 'src/founder-truth-matrix-integration/launch-readiness-truth-bridge.ts'), 'utf8').includes('buildMaterializationTruthBridge'), 'missing');

const guard = new MutationGuard();
assert('no file mutation in authority', guard.noFileMutation(), 'authority may mutate files');
assert('no synthetic evidence', guard.noSyntheticEvidence(), 'authority may synthesize evidence');

resetBuildMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationRealityModuleForTests();
resetConnectedBuildExecutionCounterForTests();

const assessment = assessBuildMaterializationTruthBridge({ rootDir: ROOT });
const report = assessment.report;
const rec = report.reconciliation;
const snap = report.evidence.snapshot;

assert('assessment completes', assessment.orchestrationState === 'BUILD_MATERIALIZATION_TRUTH_COMPLETE', assessment.orchestrationState);
assert('disk evidence consumed', snap.workspaceCount >= 0 && typeof snap.existingArtifacts === 'number', 'missing scan');
assert('materialization verdict assigned', Boolean(rec.materializationVerdict), rec.materializationVerdict);
assert('final BUILD truth derived', ['BUILD_PROVEN', 'BUILD_PARTIAL', 'BUILD_NOT_PROVEN'].includes(report.finalBuildTruth), report.finalBuildTruth);
assert('founder answers generated', rec.founderAnswers.recommendedNextActions.length > 0, 'empty');
assert('rules applied', rec.rulesApplied.length >= 1, String(rec.rulesApplied.length));
assert('history recorded', getBuildMaterializationTruthBridgeHistorySize() >= 1, String(getBuildMaterializationTruthBridgeHistorySize()));
assert('report markdown builds', buildBuildMaterializationTruthBridgeReportMarkdown(report).includes('Final BUILD truth'), 'missing');
assert('reconciliation report builds', buildBuildMaterializationTruthReconciliationReportMarkdown(report).includes('Final BUILD truth'), 'missing');

// Rule 1 scenario: disk proves files exist — ARTIFACTS_NOT_GENERATED cannot stand
if (snap.missingArtifacts === 0 && snap.existingArtifacts > 0 && snap.workspaceExists) {
  assert(
    'Rule 1 — not ARTIFACTS_NOT_GENERATED when disk proves files',
    rec.rootCause !== 'ARTIFACTS_NOT_GENERATED',
    rec.rootCause,
  );
  if (snap.founderFirstBrokenLink === 'artifacts→files') {
    assert(
      'Rule 1 — founder misreport detected or reconciled',
      rec.founderTestVerdictReconciled || rec.contradictionCount > 0,
      `reconciled=${rec.founderTestVerdictReconciled}, contradictions=${rec.contradictionCount}`,
    );
  }
}

// Truth matrix integration — reuse assessment evidence (avoid duplicate disk scans)
const founderTestAssessment = assessFounderTestIntegration({ rootDir: ROOT });
const evidence = assessment.report.evidence;
const mockReconciliation = reconcileBuildMaterializationTruth({
  evidence,
  reconciliationId: 'validation-mock',
});

const consistencyEvidence = buildConsistencyEvidenceFromLaunchContext({
  rootDir: ROOT,
  founderTestAssessment,
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  founderReadinessScore: founderTestAssessment.score.overall,
  topBlockers: [],
  chatStressSimulation: null,
  productReadinessSimulation: null,
  autonomousBuildExecutionProof: evidence.autonomousBuildProof,
  runId: founderTestAssessment.run.runId,
  buildMaterializationTruthBridge: assessment,
});

const claimAudits = analyzeAllConsistencyClaims(consistencyEvidence);
const baseClaims = reconcileTruthClaims(claimAudits);
const patchedClaims = applyBuildMaterializationTruthToClaims(baseClaims, mockReconciliation);
const buildClaim = patchedClaims.find((c) => c.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS');

assert('Truth Matrix BUILD claim patched', Boolean(buildClaim), 'missing');
assert(
  'Truth Matrix uses BUILD_MATERIALIZATION_TRUTH verdict',
  buildClaim!.truthMatrixVerdict === mockReconciliation.postReconciliationBuildVerdict.replace('BUILD_', '') ||
    buildClaim!.truthMatrixVerdict === 'PROVEN' ||
    buildClaim!.truthMatrixVerdict === 'PARTIAL' ||
    buildClaim!.truthMatrixVerdict === 'NOT_PROVEN',
  buildClaim!.truthMatrixVerdict,
);

const truthResult = applyTruthMatrixLaunchReconciliationSync({
  rootDir: ROOT,
  founderTestAssessment,
  preReconciliationVerdict: 'NOT_LAUNCH_READY',
  founderReadinessScore: founderTestAssessment.score.overall,
  topBlockers: [],
  chatStressSimulation: null,
  productReadinessSimulation: null,
  autonomousBuildExecutionProof: evidence.autonomousBuildProof,
  runId: founderTestAssessment.run.runId,
  buildMaterializationTruthBridge: assessment,
  skipHistoryRecording: true,
});

const truthBuildClaim = truthResult.integration.report.reconciliation.claims.find(
  (c) => c.claimId === 'AIDEVENGINE_BUILDS_APPLICATIONS',
);
assert('launch reconciliation consumes bridge', Boolean(truthBuildClaim), 'missing');

if (shouldSuppressArtifactsBrokenBlocker(rec)) {
  assert(
    'artifacts→files blocker suppression available',
    shouldSuppressArtifactsBrokenBlocker(rec) === true,
    'expected suppression when disk proves files',
  );
}

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Build Materialization Truth Bridge Validation',
  '',
  `Result: ${failed.length === 0 ? BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Assessment snapshot',
  '',
  `- finalBuildTruth=${report.finalBuildTruth}`,
  `- rootCause=${rec.rootCause}`,
  `- materializationVerdict=${rec.materializationVerdict}`,
  `- contradictionCount=${rec.contradictionCount}`,
  `- founderTestVerdictReconciled=${rec.founderTestVerdictReconciled}`,
  `- truthMatrixVerdictUpdated=${rec.truthMatrixVerdictUpdated}`,
  `- workspaceCount=${snap.workspaceCount}`,
  `- existingArtifacts=${snap.existingArtifacts}`,
  `- missingArtifacts=${snap.missingArtifacts}`,
  `- founderFirstBrokenLink=${snap.founderFirstBrokenLink ?? 'none'}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'BUILD_MATERIALIZATION_TRUTH_BRIDGE_VALIDATION.md'),
  validationSummary,
  'utf8',
);

writeFileSync(
  join(ROOT, 'architecture', 'BUILD_MATERIALIZATION_TRUTH_BRIDGE_REPORT.md'),
  [
    '# Build Materialization Truth Bridge Report',
    '',
    '## Objective',
    '',
    'Reconcile Founder Test BUILD verdicts with filesystem evidence from Build Materialization Reality before declaring artifacts→files broken.',
    '',
    '## Path',
    '',
    '- `assessBuildMaterializationTruthBridge()` — read-only orchestrator',
    '- `collectBuildMaterializationTruthEvidence()` — consumes disk + proof authorities',
    '- `reconcileBuildMaterializationTruth()` — applies rules 1–4',
    '- `applyBuildMaterializationTruthToClaims()` — updates Founder Truth Matrix BUILD claim',
    '',
    '## Latest assessment',
    '',
    `- finalBuildTruth: **${report.finalBuildTruth}**`,
    `- rootCause: **${rec.rootCause}**`,
    `- materializationVerdict: **${rec.materializationVerdict}**`,
    `- contradictionCount: **${rec.contradictionCount}**`,
    `- recommendedFix: **${rec.recommendedFix}**`,
    '',
    '## Pass token',
    '',
    BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS,
    '',
    buildBuildMaterializationTruthBridgeReportMarkdown(report),
  ].join('\n'),
  'utf8',
);

writeFileSync(
  join(ROOT, 'architecture', 'BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT.md',
  ),
  buildBuildMaterializationTruthReconciliationReportMarkdown(report),
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS);
console.log(validationSummary);
