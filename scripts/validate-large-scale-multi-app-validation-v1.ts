/**
 * Large-Scale Multi-App Validation V1 — validation (leaf mode).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetCqiMaturityHistoryForTests } from '../src/clarifying-question-intelligence/index.js';
import { resetUvlMaturityHistoryForTests } from '../src/unified-verification-lab/index.js';
import {
  buildLargeScaleValidationReportMarkdown,
  GENERALIZATION_SCORE_PASS_THRESHOLD,
  LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN,
  LARGE_SCALE_VALIDATION_ARTIFACT_DIR,
  LARGE_SCALE_VALIDATION_REPORT_TITLE,
  LARGE_SCALE_VALIDATION_SUITE,
  MIN_LARGE_SCALE_CATEGORY_COUNT,
  MAX_LARGE_SCALE_VALIDATION_HISTORY,
  resetLargeScaleValidationHistoryForTests,
  runLargeScaleMultiAppValidation,
  listLargeScaleValidationHistory,
} from '../src/large-scale-multi-app-validation-v1/index.js';
import { buildLargeScaleValidationPayload } from '../server/large-scale-validation-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, LARGE_SCALE_VALIDATION_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, LARGE_SCALE_VALIDATION_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 60_000;

const REQUIRED_FILES = [
  'src/large-scale-multi-app-validation-v1/large-scale-multi-app-validation-types.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-multi-app-validation-bounds.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-category-suite-registry.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-failure-classifier.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-validation-metrics.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-cross-app-consistency.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-generalization-score.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-multi-app-validation-assessor.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-validation-report-builder.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-uvl-integration.ts',
  'src/large-scale-multi-app-validation-v1/large-scale-afla-integration.ts',
  'server/large-scale-validation-handler.ts',
] as const;

const REQUIRED_UI_STRINGS = [
  'Large-Scale Validation',
  'Categories Tested',
  'Pass Rate',
  'Failure Distribution',
  'Generalization Score',
  'Category Leaderboard',
  'Weakest Categories',
  '/api/founder/large-scale-validation',
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
  console.log('Large-Scale Multi-App Validation V1 — Validation');
  console.log('================================================');
  console.log('');

  resetLargeScaleValidationHistoryForTests();
  resetCqiMaturityHistoryForTests();
  resetUvlMaturityHistoryForTests();
  checkpoint('start');

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 1_500_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:large-scale-multi-app-validation-v1']), 'script');
  assert('02. operator section', manifest.includes("'Large-Scale Validation'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/large-scale-validation'), 'route');
  assert(
    '04. no separate generalization authority',
    !existsSync(join(ROOT, 'src/generalization-authority')),
    'absent',
  );

  for (const uiString of REQUIRED_UI_STRINGS) {
    assert(`05. UI string ${uiString}`, appJs.includes(uiString), uiString);
  }

  assert(
    '06. suite category count',
    LARGE_SCALE_VALIDATION_SUITE.length >= MIN_LARGE_SCALE_CATEGORY_COUNT,
    String(LARGE_SCALE_VALIDATION_SUITE.length),
  );

  const assessment = runLargeScaleMultiAppValidation();
  checkpoint('full suite run');

  assert('07. categories tested', assessment.categoriesTested >= MIN_LARGE_SCALE_CATEGORY_COUNT, String(assessment.categoriesTested));
  assert('08. pipeline completion', assessment.passRates.generationSuccessRate >= 80, String(assessment.passRates.generationSuccessRate));
  assert(
    '09. generalization score',
    assessment.generalizationScore >= GENERALIZATION_SCORE_PASS_THRESHOLD,
    String(assessment.generalizationScore),
  );
  assert('10. failure distribution', assessment.failureDistribution.length > 0, String(assessment.failureDistribution.length));
  assert('11. category leaderboard', assessment.categoryLeaderboard.length === assessment.categoriesTested, String(assessment.categoryLeaderboard.length));
  assert('12. cross-app consistency', assessment.crossAppConsistency.overallConsistency > 0, String(assessment.crossAppConsistency.overallConsistency));
  assert('13. weakest categories', assessment.weakestCategories.length > 0, String(assessment.weakestCategories.length));

  for (let i = 0; i < MAX_LARGE_SCALE_VALIDATION_HISTORY + 3; i += 1) {
    runLargeScaleMultiAppValidation();
  }
  assert(
    '14. history bounded',
    listLargeScaleValidationHistory().length <= MAX_LARGE_SCALE_VALIDATION_HISTORY,
    String(listLargeScaleValidationHistory().length),
  );

  const payload = buildLargeScaleValidationPayload({ refresh: true });
  assert('15. operator payload', payload.categoriesTested >= MIN_LARGE_SCALE_CATEGORY_COUNT, String(payload.categoriesTested));

  const reportMarkdown = buildLargeScaleValidationReportMarkdown(assessment);
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), JSON.stringify(assessment, null, 2), 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'category-results.json'), JSON.stringify(assessment.categoryResults, null, 2), 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'failure-distribution.json'), JSON.stringify(assessment.failureDistribution, null, 2), 'utf8');
  writeFileSync(join(ARTIFACT_DIR, 'generalization-metrics.json'), JSON.stringify({
    generalizationScore: assessment.generalizationScore,
    passRates: assessment.passRates,
    crossAppConsistency: assessment.crossAppConsistency,
  }, null, 2), 'utf8');

  assert('16. report written', existsSync(REPORT_PATH), LARGE_SCALE_VALIDATION_REPORT_TITLE);
  assert('17. assessment artifact', existsSync(join(ARTIFACT_DIR, 'assessment.json')), 'assessment.json');
  assert('18. report pass token', reportMarkdown.includes(LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN), 'token');

  const failed = results.filter((result) => !result.passed);
  console.log('');
  for (const result of results) {
    const mark = result.passed ? '✓' : '✗';
    console.log(`${mark} ${result.name} — ${result.detail}`);
  }
  console.log('');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  console.log(`Generalization Score: ${assessment.generalizationScore}/100`);
  console.log(`Categories: ${assessment.categoriesTested} tested, ${assessment.categoriesPassed} passed`);
  console.log('');

  if (failed.length > 0) {
    console.error('Large-Scale Multi-App Validation V1 — FAILED');
    process.exit(1);
  }

  console.log(LARGE_SCALE_MULTI_APP_VALIDATION_V1_PASS_TOKEN);
  process.exit(0);
}

main();
