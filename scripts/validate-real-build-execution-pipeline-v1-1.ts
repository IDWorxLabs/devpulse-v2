/**
 * Real Build Execution Pipeline V1.1 — validation (full 15/15 proof).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRealBuildExecutionPipelineV11ReportMarkdown,
  EXECUTION_GENERALIZATION_V2_PASS_THRESHOLD,
  MIN_FULL_PROOF_CATEGORIES,
  MIN_PROOF_COVERAGE_PERCENT,
  REAL_BUILD_EXECUTION_V11_ARTIFACT_DIR,
  REAL_BUILD_EXECUTION_V11_REPORT_TITLE,
  REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN,
  resetRealBuildExecutionV11HistoryForTests,
  seedRealBuildExecutionV11HistoryForTests,
  runRealBuildExecutionPipelineV11,
  listRealBuildExecutionV11History,
  MAX_REAL_BUILD_EXECUTION_V11_HISTORY,
} from '../src/real-build-execution-pipeline-v1-1/index.js';
import { buildRealBuildExecutionPipelineV11Payload } from '../server/real-build-execution-pipeline-v11-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, REAL_BUILD_EXECUTION_V11_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, REAL_BUILD_EXECUTION_V11_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 900_000;

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

function main(): void {
  console.log('');
  console.log('Real Build Execution Pipeline V1.1 — Validation');
  console.log('===============================================');
  console.log('');

  resetRealBuildExecutionV11HistoryForTests();
  checkpoint('start');

  const requiredFiles = [
    'src/real-build-execution-pipeline-v1-1/real-build-execution-pipeline-v11-types.ts',
    'src/real-build-execution-pipeline-v1-1/real-build-execution-v11-assessor.ts',
    'src/real-build-execution-pipeline-v1-1/build-proof-builder.ts',
    'src/real-build-execution-pipeline-v1-1/execution-matrix-builder.ts',
    'src/real-build-execution-pipeline-v1-1/failure-intelligence.ts',
    'src/real-build-execution-pipeline-v1-1/proof-coverage.ts',
    'src/real-build-execution-pipeline-v1-1/generalization-score-v2.ts',
    'server/real-build-execution-pipeline-v11-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 1_700_000);
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:real-build-execution-pipeline-v1-1']), 'script');
  assert('02. server route', serverTs.includes('/api/founder/real-build-execution-pipeline-v11'), 'route');
  assert('03. UI proof coverage', appJs.includes('Proof Coverage'), 'Proof Coverage');
  assert('04. UI execution matrix', appJs.includes('Execution Matrix'), 'Execution Matrix');
  assert('05. UI failure intelligence', appJs.includes('Failure Intelligence'), 'Failure Intelligence');

  const assessment = runRealBuildExecutionPipelineV11({ projectRootDir: ROOT });
  checkpoint('full 15/15 pipeline run');

  assert(
    '06. categories tested',
    assessment.categoriesTested >= MIN_FULL_PROOF_CATEGORIES,
    String(assessment.categoriesTested),
  );
  assert(
    '07. full proof count',
    assessment.categoriesWithFullProof >= MIN_FULL_PROOF_CATEGORIES,
    `${assessment.categoriesWithFullProof}/${MIN_FULL_PROOF_CATEGORIES}`,
  );
  assert(
    '08. proof coverage',
    assessment.proofCoveragePercent >= MIN_PROOF_COVERAGE_PERCENT,
    String(assessment.proofCoveragePercent),
  );
  assert(
    '09. generalization score v2',
    assessment.executionGeneralizationScoreV2 >= EXECUTION_GENERALIZATION_V2_PASS_THRESHOLD,
    String(assessment.executionGeneralizationScoreV2),
  );
  assert(
    '10. execution proof status',
    assessment.executionProofStatus === 'PROVEN',
    assessment.executionProofStatus,
  );
  assert(
    '11. build proof records',
    assessment.buildProof.length >= MIN_FULL_PROOF_CATEGORIES,
    String(assessment.buildProof.length),
  );
  assert(
    '12. execution matrix',
    assessment.executionMatrix.every((e) => e.proofComplete),
    `${assessment.executionMatrix.filter((e) => e.proofComplete).length}/${assessment.executionMatrix.length}`,
  );
  assert(
    '13. all built',
    assessment.proofCoverage.builtCount >= MIN_FULL_PROOF_CATEGORIES,
    String(assessment.proofCoverage.builtCount),
  );
  assert(
    '14. all previewed',
    assessment.proofCoverage.previewedCount >= MIN_FULL_PROOF_CATEGORIES,
    String(assessment.proofCoverage.previewedCount),
  );
  assert(
    '15. all afla verdicts',
    assessment.proofCoverage.aflaVerdictCount >= MIN_FULL_PROOF_CATEGORIES,
    String(assessment.proofCoverage.aflaVerdictCount),
  );

  resetRealBuildExecutionV11HistoryForTests();
  seedRealBuildExecutionV11HistoryForTests(
    assessment,
    MAX_REAL_BUILD_EXECUTION_V11_HISTORY + 2,
  );
  assert(
    '16. history bounded',
    listRealBuildExecutionV11History().length <= MAX_REAL_BUILD_EXECUTION_V11_HISTORY,
    String(listRealBuildExecutionV11History().length),
  );

  const payload = buildRealBuildExecutionPipelineV11Payload({ refresh: false });
  assert(
    '17. operator payload',
    payload.proofCoveragePercent >= MIN_PROOF_COVERAGE_PERCENT,
    String(payload.proofCoveragePercent),
  );

  const reportMarkdown = buildRealBuildExecutionPipelineV11ReportMarkdown(assessment);
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(
    join(ARTIFACT_DIR, 'execution-matrix.json'),
    `${JSON.stringify(assessment.executionMatrix, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'build-proof.json'),
    `${JSON.stringify(assessment.buildProof, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'failure-intelligence.json'),
    `${JSON.stringify(
      {
        entries: assessment.failureIntelligence,
        summary: payload.failureIntelligenceSummary,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'generalization-score.json'),
    `${JSON.stringify(
      {
        executionGeneralizationScoreV2: assessment.executionGeneralizationScoreV2,
        executionProofStatus: assessment.executionProofStatus,
        metrics: assessment.metrics,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'proof-coverage.json'),
    `${JSON.stringify(assessment.proofCoverage, null, 2)}\n`,
    'utf8',
  );

  assert('18. report written', existsSync(REPORT_PATH), REAL_BUILD_EXECUTION_V11_REPORT_TITLE);
  assert('19. report pass token', reportMarkdown.includes(REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN), 'token');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name} — ${r.detail}`);
  }
  console.log('');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  console.log(`Proof Coverage: ${assessment.proofCoveragePercent}%`);
  console.log(`Generalization V2: ${assessment.executionGeneralizationScoreV2}/100`);
  console.log(`Full Proof: ${assessment.categoriesWithFullProof}/${assessment.categoriesTested}`);

  if (failed.length > 0) {
    console.error('\nReal Build Execution Pipeline V1.1 — FAILED');
    if (assessment.failureIntelligence.length > 0) {
      console.error('Failures:');
      for (const f of assessment.failureIntelligence.slice(0, 5)) {
        console.error(`  ${f.productName}: ${f.rootCause}`);
      }
    }
    process.exit(1);
  }

  console.log(`\n${REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS_TOKEN}`);
  process.exit(0);
}

main();
