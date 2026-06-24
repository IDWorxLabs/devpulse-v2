/**
 * Real Build Execution Pipeline V1 — validation (leaf mode).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRealBuildExecutionPipelineReportMarkdown,
  EXECUTION_GENERALIZATION_PASS_THRESHOLD,
  MIN_BUILD_SUCCESS_RATE,
  MIN_GENERATION_SUCCESS_RATE,
  MIN_PREVIEW_SUCCESS_RATE,
  MIN_REAL_BUILD_SUITE_COUNT,
  REAL_BUILD_EXECUTION_ARTIFACT_DIR,
  REAL_BUILD_EXECUTION_PIPELINE_REPORT_TITLE,
  REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN,
  REAL_BUILD_EXECUTION_SUITE,
  resetRealBuildExecutionHistoryForTests,
  runRealBuildExecutionPipeline,
  listRealBuildExecutionHistory,
  MAX_REAL_BUILD_EXECUTION_HISTORY,
} from '../src/real-build-execution-pipeline-v1/index.js';
import { buildRealBuildExecutionPipelinePayload } from '../server/real-build-execution-pipeline-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, REAL_BUILD_EXECUTION_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, REAL_BUILD_EXECUTION_PIPELINE_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 240_000;

const REQUIRED_FILES = [
  'src/real-build-execution-pipeline-v1/real-build-execution-pipeline-types.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-pipeline-bounds.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-runner.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-metrics.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-failure-classifier.ts',
  'src/real-build-execution-pipeline-v1/real-build-generalization-score.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-assessor.ts',
  'src/real-build-execution-pipeline-v1/real-build-afla-integration.ts',
  'src/real-build-execution-pipeline-v1/real-build-uvl-integration.ts',
  'src/real-build-execution-pipeline-v1/real-build-pai-integration.ts',
  'src/real-build-execution-pipeline-v1/real-build-execution-report-builder.ts',
  'server/real-build-execution-pipeline-handler.ts',
] as const;

const REQUIRED_UI_STRINGS = [
  'Execution Pipeline',
  'Build Success Rate',
  'Preview Success Rate',
  'Verification Success Rate',
  'Execution Proof Status',
  'Failure Distribution',
  'Recent Execution Runs',
  '/api/founder/real-build-execution-pipeline',
];

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
  console.log('Real Build Execution Pipeline V1 — Validation');
  console.log('=============================================');
  console.log('');

  resetRealBuildExecutionHistoryForTests();
  checkpoint('start');

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 1_600_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:real-build-execution-pipeline-v1']), 'script');
  assert('02. operator section', manifest.includes("'Execution Pipeline'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/real-build-execution-pipeline'), 'route');

  for (const uiString of REQUIRED_UI_STRINGS) {
    assert(`04. UI string ${uiString}`, appJs.includes(uiString), uiString);
  }

  assert(
    '05. suite category count',
    REAL_BUILD_EXECUTION_SUITE.length >= MIN_REAL_BUILD_SUITE_COUNT,
    String(REAL_BUILD_EXECUTION_SUITE.length),
  );

  const assessment = runRealBuildExecutionPipeline({ leafMode: true, projectRootDir: ROOT });
  checkpoint('leaf pipeline run');

  assert(
    '06. categories tested',
    assessment.categoriesTested >= MIN_REAL_BUILD_SUITE_COUNT,
    String(assessment.categoriesTested),
  );
  assert(
    '07. generation success rate',
    assessment.metrics.generationSuccessRate >= MIN_GENERATION_SUCCESS_RATE,
    String(assessment.metrics.generationSuccessRate),
  );
  assert(
    '08. build success rate',
    assessment.metrics.buildSuccessRate >= MIN_BUILD_SUCCESS_RATE,
    String(assessment.metrics.buildSuccessRate),
  );
  assert(
    '09. preview success rate',
    assessment.metrics.previewSuccessRate >= MIN_PREVIEW_SUCCESS_RATE,
    String(assessment.metrics.previewSuccessRate),
  );
  assert(
    '10. execution generalization score',
    assessment.executionGeneralizationScore >= EXECUTION_GENERALIZATION_PASS_THRESHOLD,
    String(assessment.executionGeneralizationScore),
  );
  assert(
    '11. failure distribution',
    assessment.failureDistribution.length > 0,
    String(assessment.failureDistribution.length),
  );
  assert(
    '12. execution proof status',
    assessment.executionProofStatus !== 'NOT_PROVEN',
    assessment.executionProofStatus,
  );
  assert(
    '13. recent builds',
    assessment.recentBuilds.length > 0,
    String(assessment.recentBuilds.length),
  );

  const proofCompleteCount = assessment.categoryResults.filter(
    (r) => r.executionProof.proofComplete,
  ).length;
  assert('14. build execution proof', proofCompleteCount >= 1, String(proofCompleteCount));

  resetRealBuildExecutionHistoryForTests();
  for (let i = 0; i < MAX_REAL_BUILD_EXECUTION_HISTORY + 3; i += 1) {
    runRealBuildExecutionPipeline({
      profiles: ['CRM_WEB_V1'],
      skipNpmBuild: true,
      projectRootDir: ROOT,
    });
  }
  runRealBuildExecutionPipeline({ leafMode: true, projectRootDir: ROOT });
  assert(
    '15. history bounded',
    listRealBuildExecutionHistory().length <= MAX_REAL_BUILD_EXECUTION_HISTORY,
    String(listRealBuildExecutionHistory().length),
  );

  const payload = buildRealBuildExecutionPipelinePayload({ refresh: false });
  assert('16. operator payload', (payload.assessment?.categoriesTested ?? 0) >= MIN_REAL_BUILD_SUITE_COUNT, String(payload.assessment?.categoriesTested));

  const reportMarkdown = buildRealBuildExecutionPipelineReportMarkdown(assessment);
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(
    join(ARTIFACT_DIR, 'execution-metrics.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, metrics: assessment.metrics }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'failure-distribution.json'),
    `${JSON.stringify(assessment.failureDistribution, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'build-proof.json'),
    `${JSON.stringify(
      assessment.categoryResults.map((r) => ({
        profile: r.profile,
        productName: r.productName,
        proofComplete: r.executionProof.proofComplete,
        executionProof: r.executionProof,
      })),
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'generalization-score.json'),
    `${JSON.stringify(
      {
        executionGeneralizationScore: assessment.executionGeneralizationScore,
        executionProofStatus: assessment.executionProofStatus,
        categoriesTested: assessment.categoriesTested,
        categoriesPassed: assessment.categoriesPassed,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  assert('17. report written', existsSync(REPORT_PATH), REAL_BUILD_EXECUTION_PIPELINE_REPORT_TITLE);
  assert('18. execution-metrics artifact', existsSync(join(ARTIFACT_DIR, 'execution-metrics.json')), 'execution-metrics.json');
  assert('19. report pass token', reportMarkdown.includes(REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN), 'token');

  const failed = results.filter((result) => !result.passed);
  console.log('');
  for (const result of results) {
    console.log(`${result.passed ? '✓' : '✗'} ${result.name} — ${result.detail}`);
  }
  console.log('');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  console.log(`Execution Generalization Score: ${assessment.executionGeneralizationScore}/100`);
  console.log(`Generation: ${assessment.metrics.generationSuccessRate}% · Build: ${assessment.metrics.buildSuccessRate}% · Preview: ${assessment.metrics.previewSuccessRate}%`);
  console.log('');

  if (failed.length > 0) {
    console.error('Real Build Execution Pipeline V1 — FAILED');
    process.exit(1);
  }

  console.log(REAL_BUILD_EXECUTION_PIPELINE_V1_PASS_TOKEN);
  process.exit(0);
}

main();
