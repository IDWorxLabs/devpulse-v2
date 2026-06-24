/**
 * UVL Verification Execution V1 — validation (15/15 verified).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { WORKSPACE_ID_PREFIX } from '../src/real-build-execution-pipeline-v1/real-build-execution-pipeline-bounds.js';
import { runRealBuildExecutionPipelineV11 } from '../src/real-build-execution-pipeline-v1-1/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  buildUvlVerificationExecutionV1ReportMarkdown,
  getLastUvlVerificationExecutionAssessment,
  listUvlVerificationExecutionHistory,
  MAX_UVL_VERIFICATION_EXECUTION_HISTORY,
  MIN_VERIFICATION_COVERAGE_PERCENT,
  MIN_VERIFICATION_CONFIDENCE_SCORE,
  MIN_VERIFIED_CATEGORIES,
  resetUvlVerificationExecutionHistoryForTests,
  runUvlVerificationExecutionV1,
  seedUvlVerificationExecutionHistoryForTests,
  UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR,
  UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
  UVL_VERIFICATION_EXECUTION_V1_REPORT_TITLE,
} from '../src/uvl-verification-execution-v1/index.js';
import { buildUvlVerificationExecutionV1Payload } from '../server/uvl-verification-execution-v1-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, UVL_VERIFICATION_EXECUTION_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, UVL_VERIFICATION_EXECUTION_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 1_200_000;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function countBuiltWorkspaces(): number {
  let count = 0;
  for (const entry of REAL_BUILD_EXECUTION_SUITE) {
    const workspaceId = `${WORKSPACE_ID_PREFIX}-${entry.profile.toLowerCase().replace(/_/g, '-')}`;
    const distIndex = join(ROOT, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId, 'dist', 'index.html');
    if (existsSync(distIndex)) count += 1;
  }
  return count;
}

async function main(): Promise<void> {
  console.log('');
  console.log('UVL Verification Execution V1 — Validation');
  console.log('==========================================');
  console.log('');

  resetUvlVerificationExecutionHistoryForTests();
  checkpoint('start');

  const requiredFiles = [
    'src/uvl-verification-execution-v1/uvl-verification-execution-v1-types.ts',
    'src/uvl-verification-execution-v1/uvl-verification-execution-assessor.ts',
    'src/uvl-verification-execution-v1/uvl-verification-execution-runner.ts',
    'src/uvl-verification-execution-v1/verification-coverage.ts',
    'src/uvl-verification-execution-v1/verification-proof-builder.ts',
    'src/uvl-verification-execution-v1/verification-confidence.ts',
    'src/uvl-verification-execution-v1/failure-intelligence.ts',
    'src/uvl-verification-execution-v1/verification-matrix-builder.ts',
    'server/uvl-verification-execution-v1-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 2_000_000);
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:uvl-verification-execution-v1']), 'script');
  assert('02. server route', serverTs.includes('/api/founder/uvl-verification-execution-v1'), 'route');
  assert('03. UI verification coverage', appJs.includes('Verification Coverage'), 'coverage');
  assert('04. UI verified count', appJs.includes('Verified Count'), 'verified count');
  assert('05. UI failure distribution', appJs.includes('Failure Distribution'), 'failure distribution');

  const builtBefore = countBuiltWorkspaces();
  if (builtBefore < MIN_VERIFIED_CATEGORIES) {
    console.log(`Seeding ${MIN_VERIFIED_CATEGORIES - builtBefore} missing RBEP workspaces via V1.1…`);
    runRealBuildExecutionPipelineV11({ projectRootDir: ROOT });
    checkpoint('RBEP V1.1 seed for verification workspaces');
  }

  assert(
    '06. built workspaces',
    countBuiltWorkspaces() >= MIN_VERIFIED_CATEGORIES,
    `${countBuiltWorkspaces()}/${MIN_VERIFIED_CATEGORIES}`,
  );

  const assessment = await runUvlVerificationExecutionV1({
    projectRootDir: ROOT,
    ensureBuild: false,
  });
  checkpoint('full 15/15 verification run');

  assert(
    '07. categories tested',
    assessment.categoriesTested >= MIN_VERIFIED_CATEGORIES,
    String(assessment.categoriesTested),
  );
  assert(
    '08. verified count',
    assessment.verificationCoverage.verifiedCount >= MIN_VERIFIED_CATEGORIES,
    `${assessment.verificationCoverage.verifiedCount}/${MIN_VERIFIED_CATEGORIES}`,
  );
  assert(
    '09. verification coverage',
    assessment.verificationCoveragePercent >= MIN_VERIFICATION_COVERAGE_PERCENT,
    String(assessment.verificationCoveragePercent),
  );
  assert(
    '10. verification confidence',
    assessment.verificationConfidence.verificationConfidenceScore >= MIN_VERIFICATION_CONFIDENCE_SCORE,
    String(assessment.verificationConfidence.verificationConfidenceScore),
  );
  assert(
    '11. verification proof status',
    assessment.verificationProofStatus === 'PROVEN',
    assessment.verificationProofStatus,
  );
  assert(
    '12. all verified in matrix',
    assessment.verificationMatrix.every((e) => e.verified),
    `${assessment.verificationMatrix.filter((e) => e.verified).length}/${assessment.verificationMatrix.length}`,
  );
  assert(
    '13. failed count zero',
    assessment.verificationCoverage.failedCount === 0,
    String(assessment.verificationCoverage.failedCount),
  );
  assert(
    '14. skipped count zero',
    assessment.verificationCoverage.skippedCount === 0,
    String(assessment.verificationCoverage.skippedCount),
  );

  resetUvlVerificationExecutionHistoryForTests();
  seedUvlVerificationExecutionHistoryForTests(
    assessment,
    MAX_UVL_VERIFICATION_EXECUTION_HISTORY + 2,
  );
  assert(
    '15. history bounded',
    listUvlVerificationExecutionHistory().length <= MAX_UVL_VERIFICATION_EXECUTION_HISTORY,
    String(listUvlVerificationExecutionHistory().length),
  );

  const payload = await buildUvlVerificationExecutionV1Payload({ refresh: false });
  assert(
    '16. operator payload',
    payload.verifiedCount >= MIN_VERIFIED_CATEGORIES,
    String(payload.verifiedCount),
  );

  const reportMarkdown = buildUvlVerificationExecutionV1ReportMarkdown(assessment);
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(
    join(ARTIFACT_DIR, 'verification-coverage.json'),
    `${JSON.stringify(assessment.verificationCoverage, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'verification-proof.json'),
    `${JSON.stringify(assessment.verificationProof, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'verification-confidence.json'),
    `${JSON.stringify(assessment.verificationConfidence, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'failure-distribution.json'),
    `${JSON.stringify(
      {
        entries: assessment.failureDistribution,
        failureIntelligence: assessment.failureIntelligence,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'verification-matrix.json'),
    `${JSON.stringify(assessment.verificationMatrix, null, 2)}\n`,
    'utf8',
  );

  assert('17. report written', existsSync(REPORT_PATH), UVL_VERIFICATION_EXECUTION_V1_REPORT_TITLE);
  assert('18. report pass token', reportMarkdown.includes(UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN), 'token');
  assert(
    '19. assessment cached',
    getLastUvlVerificationExecutionAssessment()?.passToken === UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
    UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN,
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name} — ${r.detail}`);
  }
  console.log('');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  console.log(`Verification Coverage: ${assessment.verificationCoveragePercent}%`);
  console.log(`Verified: ${assessment.verificationCoverage.verifiedCount}/${assessment.categoriesTested}`);
  console.log(`Confidence: ${assessment.verificationConfidence.verificationConfidenceScore}/100`);

  if (failed.length > 0) {
    console.error('\nUVL Verification Execution V1 — FAILED');
    if (assessment.failureIntelligence.length > 0) {
      console.error('Failures:');
      for (const f of assessment.failureIntelligence.slice(0, 5)) {
        console.error(`  ${f.productName}: ${f.rootCause}`);
      }
    }
    process.exit(1);
  }

  console.log(`\n${UVL_VERIFICATION_EXECUTION_V1_PASS_TOKEN}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
