/**
 * Large-Scale Pipeline Integration V1 — validation (evidence aggregation, no FULL reruns).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildLargeScalePipelineIntegrationV1ReportMarkdown,
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_ARTIFACT_DIR,
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN,
  LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT_TITLE,
  MIN_BROAD_CATEGORY_COUNT,
  MIN_PIPELINE_SCORE,
  MIN_RBEP_BUILD_SUCCESS_RATE,
  runLargeScalePipelineIntegrationV1,
} from '../src/large-scale-pipeline-integration-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, LARGE_SCALE_PIPELINE_INTEGRATION_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:large-scale-multi-app-validation-v1',
  'validate:capability-audit-v3-1',
  'validate:real-build-execution-pipeline-v1-1',
  'validate:uvl-verification-execution-v1',
  'validate:production-readiness-gate-v1',
  'validate:general-purpose-code-generation-v1',
  'validate:cloud-execution-path-v1',
  'validate:validation-runtime-governance-v1',
] as const;

const REQUIRED_EVIDENCE_ARTIFACTS = [
  '.real-build-execution-pipeline-v1-1/build-proof.json',
  '.real-build-execution-pipeline-v1-1/generalization-score.json',
  '.uvl-verification-execution-v1/verification-coverage.json',
  '.large-scale-multi-app-validation/assessment.json',
] as const;

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
  console.log('Large-Scale Pipeline Integration V1 — Validation');
  console.log('================================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/large-scale-pipeline-integration-v1/pipeline-evidence-loader.ts',
    'src/large-scale-pipeline-integration-v1/pipeline-category-mapping.ts',
    'src/large-scale-pipeline-integration-v1/pipeline-metrics.ts',
    'src/large-scale-pipeline-integration-v1/pipeline-score.ts',
    'src/large-scale-pipeline-integration-v1/pipeline-integration-assessor.ts',
    'src/large-scale-pipeline-integration-v1/index.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 2_600_000);
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:large-scale-pipeline-integration-v1']), 'script');
  assert('02. server route unchanged', serverTs.includes('/api/founder/large-scale-validation'), 'route');
  assert('03. UI pipeline score', appJs.includes('Large-Scale Pipeline Score'), 'pipeline score');
  assert('04. UI build-proven', appJs.includes('Build-Proven Categories'), 'build-proven');
  assert('05. UI remaining gaps', appJs.includes('Remaining Gaps'), 'remaining gaps');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`06. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  for (const artifact of REQUIRED_EVIDENCE_ARTIFACTS) {
    assert(`07. evidence artifact: ${artifact}`, existsSync(join(ROOT, artifact)), artifact);
  }

  checkpoint('evidence prerequisites');

  const assessment = runLargeScalePipelineIntegrationV1({ projectRootDir: ROOT });
  checkpoint('pipeline integration assessment');

  assert(
    '08. broad categories >= 50',
    assessment.metrics.broadCategoriesTested >= MIN_BROAD_CATEGORY_COUNT,
    String(assessment.metrics.broadCategoriesTested),
  );

  assert(
    '09. authoritative build success rate >= 100%',
    assessment.metrics.buildSuccessRate >= MIN_RBEP_BUILD_SUCCESS_RATE,
    String(assessment.metrics.buildSuccessRate),
  );

  assert(
    '10. build success rate not 0%',
    assessment.metrics.buildSuccessRate > 0,
    String(assessment.metrics.buildSuccessRate),
  );

  assert(
    '11. verification success rate >= 100%',
    assessment.metrics.verificationSuccessRate >= 100,
    String(assessment.metrics.verificationSuccessRate),
  );

  assert(
    '12. production readiness rate >= 100%',
    assessment.metrics.productionReadinessRate >= 100,
    String(assessment.metrics.productionReadinessRate),
  );

  assert(
    '13. legacy harness build rate contrast documented',
    assessment.metrics.legacyLargeScaleBuildSuccessRate < assessment.metrics.buildSuccessRate,
    `legacy=${assessment.metrics.legacyLargeScaleBuildSuccessRate} authoritative=${assessment.metrics.buildSuccessRate}`,
  );

  assert(
    '14. build-proven categories >= 15',
    assessment.metrics.buildProvenCategories >= 15,
    String(assessment.metrics.buildProvenCategories),
  );

  assert(
    '15. verification-proven categories >= 15',
    assessment.metrics.verificationProvenCategories >= 15,
    String(assessment.metrics.verificationProvenCategories),
  );

  assert(
    '16. category mapping populated',
    assessment.categoryMapping.length >= MIN_BROAD_CATEGORY_COUNT,
    String(assessment.categoryMapping.length),
  );

  assert(
    '17. pipeline score >= threshold',
    assessment.pipelineScore.score >= MIN_PIPELINE_SCORE,
    String(assessment.pipelineScore.score),
  );

  assert(
    '18. audit impact integration complete',
    assessment.auditImpact.integrationComplete,
    assessment.auditImpact.auditShouldReport.slice(0, 80),
  );

  assert(
    '19. highest gap resolved',
    assessment.auditImpact.highestGapResolved,
    'large-scale pipeline integration',
  );

  assert(
    '20. evidence sources loaded',
    assessment.evidenceSources.filter((s) => s.evidenceAvailable).length >= 4,
    String(assessment.evidenceSources.filter((s) => s.evidenceAvailable).length),
  );

  assert(
    '21. pass token',
    assessment.passToken === LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN,
    assessment.passToken,
  );

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(
    join(ARTIFACT_DIR, 'pipeline-metrics.json'),
    `${JSON.stringify(assessment.metrics, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'category-mapping.json'),
    `${JSON.stringify(assessment.categoryMapping, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'evidence-sources.json'),
    `${JSON.stringify(assessment.evidenceSources, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'gap-classification.json'),
    `${JSON.stringify(assessment.gapClassification, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'pipeline-score.json'),
    `${JSON.stringify(assessment.pipelineScore, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'audit-impact.json'),
    `${JSON.stringify(assessment.auditImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'assessment.json'),
    `${JSON.stringify(assessment, null, 2)}\n`,
    'utf8',
  );

  const reportMarkdown = buildLargeScalePipelineIntegrationV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');
  writeFileSync(
    join(ROOT, 'LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT.md'),
    reportMarkdown,
    'utf8',
  );

  checkpoint('artifacts written');

  assert('22. pipeline-metrics.json', existsSync(join(ARTIFACT_DIR, 'pipeline-metrics.json')), 'written');
  assert('23. report written', existsSync(REPORT_PATH), LARGE_SCALE_PIPELINE_INTEGRATION_V1_REPORT_TITLE);

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Large-Scale Pipeline Integration V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS_TOKEN);
  console.log(`Pipeline score: ${assessment.pipelineScore.score}/100`);
  console.log(
    `Build: ${assessment.metrics.buildSuccessRate}% | Verification: ${assessment.metrics.verificationSuccessRate}% | Broad: ${assessment.metrics.broadCategoriesTested}`,
  );
}

main();
