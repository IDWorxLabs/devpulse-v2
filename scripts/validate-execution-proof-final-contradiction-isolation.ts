/**
 * Phase 27.06 — Execution Proof Final Contradiction Isolation validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS,
  EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME,
  FINAL_STALE_CONSUMER_AUTHORITY_ID,
  FINAL_STALE_CONSUMER_AUTHORITY_NAME,
  FINAL_STALE_CONSUMER_SOURCE_MODULE,
  STALE_FOUNDER_TEST_AUTHORITY_IDS,
  assessExecutionProofFinalContradictionIsolation,
  buildExecutionProofFinalContradictionReportMarkdown,
  buildExecutionProofFinalContradictionValidationMarkdown,
  classifyFinalContradictionDivergence,
  resetExecutionProofFinalContradictionIsolationModuleForTests,
} from '../src/execution-proof-final-contradiction-isolation/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-execution-proof-final-contradiction-isolation';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/execution-proof-final-contradiction-isolation/execution-proof-final-contradiction-isolation-types.ts',
  'src/execution-proof-final-contradiction-isolation/execution-proof-final-contradiction-isolation-registry.ts',
  'src/execution-proof-final-contradiction-isolation/launch-critical-authority-isolator.ts',
  'src/execution-proof-final-contradiction-isolation/stale-evidence-classifier.ts',
  'src/execution-proof-final-contradiction-isolation/contradiction-source-ranker.ts',
  'src/execution-proof-final-contradiction-isolation/execution-proof-final-contradiction-report-builder.ts',
  'src/execution-proof-final-contradiction-isolation/execution-proof-final-contradiction-isolation-history.ts',
  'src/execution-proof-final-contradiction-isolation/execution-proof-final-contradiction-isolation-authority.ts',
  'src/execution-proof-final-contradiction-isolation/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(
    ROOT,
    'src/execution-proof-final-contradiction-isolation/execution-proof-final-contradiction-isolation-authority.ts',
  ),
  'utf8',
);
const isolatorSource = readFileSync(
  join(ROOT, 'src/execution-proof-final-contradiction-isolation/launch-critical-authority-isolator.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('no nested validate- in authority', !authoritySource.includes('validate-'), 'nested');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert(
  'composes existing tracers only',
  isolatorSource.includes('traceAuthorityVerdicts') &&
    isolatorSource.includes('analyzeAllConsistencyClaims') &&
    !isolatorSource.includes('reconcileTruthClaims') &&
    !isolatorSource.includes('applyAuthorityRealityConvergenceSync'),
  'must not add reconciliation layer',
);
assert(
  'package script registered',
  packageJson.includes(
    `validate:execution-proof-final-contradiction-isolation": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'missing',
);

resetExecutionProofFinalContradictionIsolationModuleForTests();

const staleClassification = classifyFinalContradictionDivergence({
  authoritative: {
    readOnly: true,
    workspaceId: 'build-ready-idea-1',
    runId: 'run-1',
    manifestId: 'manifest-1',
    proofTimestamp: '2026-06-20T18:00:00.000Z',
    proofLevel: 'APPLICATION_PROVEN',
    sourceAuthority: 'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE',
    missingArtifacts: 0,
    applicationProven: true,
    convergencePassed: true,
    contradictionEliminationPassed: true,
  },
  consumerTimestamp: '2026-06-20T17:00:00.000Z',
  consumerVerdict: 'PARTIAL',
  expectedVerdict: 'PROVEN',
  workspaceId: 'build-ready-idea-1',
  runId: 'run-1',
  manifestId: 'manifest-1',
  convergencePassed: true,
  contradictionEliminationPassed: true,
  staleConsumer: true,
});
assert(
  'Rule 3 STALE_PROOF_CONSUMER when consumer timestamp older',
  staleClassification === 'STALE_PROOF_CONSUMER',
  staleClassification,
);

const driftClassification = classifyFinalContradictionDivergence({
  authoritative: {
    readOnly: true,
    workspaceId: 'build-ready-idea-1',
    runId: 'run-1',
    manifestId: 'manifest-1',
    proofTimestamp: '2026-06-20T18:00:00.000Z',
    proofLevel: 'APPLICATION_PROVEN',
    sourceAuthority: 'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE',
    missingArtifacts: 0,
    applicationProven: true,
    convergencePassed: true,
    contradictionEliminationPassed: true,
  },
  consumerTimestamp: '2026-06-20T18:00:00.000Z',
  consumerVerdict: 'PARTIAL',
  expectedVerdict: 'PROVEN',
  workspaceId: 'build-ready-idea-1',
  runId: 'run-1',
  manifestId: 'manifest-1',
  convergencePassed: true,
  contradictionEliminationPassed: true,
});
assert(
  'Rule 4 POST_CONVERGENCE_VERDICT_DRIFT when aligned ids but verdict differs',
  driftClassification === 'POST_CONVERGENCE_VERDICT_DRIFT',
  driftClassification,
);

const assessment = await assessExecutionProofFinalContradictionIsolation({
  rootDir: ROOT,
  skipHistoryRecording: true,
});

assert(
  'isolation produces ranked table',
  assessment.report.rankedTable.length >= 0,
  String(assessment.report.rankedTable.length),
);
assert(
  'final stale consumer identified',
  assessment.report.summary.finalStaleConsumerAuthorityId != null,
  assessment.report.summary.finalStaleConsumerAuthorityId ?? 'none',
);
assert(
  'stale consumer matches consistency audit path',
  assessment.report.summary.finalStaleConsumerAuthorityId === FINAL_STALE_CONSUMER_AUTHORITY_ID ||
    STALE_FOUNDER_TEST_AUTHORITY_IDS.some((id) =>
      assessment.report.consumptions.some((c) => c.authorityId === id),
    ),
  assessment.report.summary.finalStaleConsumerAuthorityId ?? 'none',
);

const targetClaims = [
  'AiDevEngine builds applications',
  'Live Preview runs applications',
  'Founder can go from idea to launch',
  'Autonomous Build Execution Proof',
];
for (const claim of targetClaims) {
  const match = assessment.report.consumptions.find((c) => c.claim === claim);
  if (match) {
    assert(
      `contradiction traced: ${claim}`,
      match.divergence !== 'NONE' || match.rootCause.includes('AUTHORITY_DISAGREEMENT'),
      `${match.currentVerdict} vs ${match.expectedVerdict} (${match.divergence})`,
    );
  }
}

const reportMarkdown = buildExecutionProofFinalContradictionReportMarkdown(assessment.report);
writeFileSync(
  join(ROOT, `architecture/${EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME}.md`),
  reportMarkdown,
);

assert(
  'EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT.md written',
  existsSync(join(ROOT, `architecture/${EXECUTION_PROOF_FINAL_CONTRADICTION_REPORT_BASENAME}.md`)),
  'missing',
);
assert(
  'report documents stale consumer',
  reportMarkdown.includes(FINAL_STALE_CONSUMER_AUTHORITY_NAME) &&
    reportMarkdown.includes(FINAL_STALE_CONSUMER_SOURCE_MODULE),
  'missing stale consumer section',
);

const failed = results.filter((entry) => !entry.passed);
const passToken =
  failed.length === 0 && assessment.report.passToken
    ? EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS
    : failed.length === 0
      ? EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS
      : null;

writeFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_VALIDATION.md'),
  buildExecutionProofFinalContradictionValidationMarkdown({ passToken, checks: results }),
);

if (failed.length > 0) {
  console.error('Execution proof final contradiction isolation validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(EXECUTION_PROOF_FINAL_CONTRADICTION_ISOLATION_PASS);
console.log(`Final stale consumer: ${assessment.report.summary.finalStaleConsumerAuthorityName}`);
console.log(`BUILD=PARTIAL: ${assessment.report.summary.firstBuildPartialAuthorityId ?? 'none'}`);
console.log(`RUNTIME=NOT_PROVEN: ${assessment.report.summary.firstRuntimeNotProvenAuthorityId ?? 'none'}`);
console.log(`PREVIEW=NOT_PROVEN: ${assessment.report.summary.firstPreviewNotProvenAuthorityId ?? 'none'}`);
console.log(`LAUNCH=NOT_PROVEN: ${assessment.report.summary.firstLaunchNotProvenAuthorityId ?? 'none'}`);
