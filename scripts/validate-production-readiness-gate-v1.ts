/**
 * Production Readiness Gate V1 — validation (15/15 production readiness proof).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { WORKSPACE_ID_PREFIX } from '../src/real-build-execution-pipeline-v1/real-build-execution-pipeline-bounds.js';
import { runRealBuildExecutionPipelineV11 } from '../src/real-build-execution-pipeline-v1-1/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  buildProductionReadinessGateV1ReportMarkdown,
  getLastProductionReadinessGateAssessment,
  listProductionReadinessGateHistory,
  MAX_PRODUCTION_READINESS_GATE_HISTORY,
  MIN_PRODUCTION_READINESS_SCORE,
  MIN_PRODUCTION_READY_CATEGORIES,
  PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR,
  PRODUCTION_READINESS_GATE_V1_PASS_TOKEN,
  PRODUCTION_READINESS_GATE_V1_REPORT_TITLE,
  resetProductionReadinessGateHistoryForTests,
  runProductionReadinessGateV1,
  seedProductionReadinessGateHistoryForTests,
} from '../src/production-readiness-gate-v1/index.js';
import { buildProductionReadinessPayload } from '../server/production-readiness-gate-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, PRODUCTION_READINESS_GATE_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 1_200_000;

const REGRESSION_SCRIPTS = [
  'validate:capability-audit-v3-1',
  'validate:validation-runtime-governance-v1',
  'validate:uvl-verification-execution-v1',
  'validate:real-build-execution-pipeline-v1-1',
  'validate:product-architect-intelligence-v1',
  'validate:afla-trust-calibration-v1',
  'validate:autonomous-founder-launch-authority-v1',
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
  console.log('Production Readiness Gate V1 — Validation');
  console.log('=========================================');
  console.log('');

  resetProductionReadinessGateHistoryForTests();
  checkpoint('start');

  const requiredFiles = [
    'src/production-readiness-gate-v1/production-readiness-gate-v1-types.ts',
    'src/production-readiness-gate-v1/production-readiness-gate-assessor.ts',
    'src/production-readiness-gate-v1/production-readiness-gate-runner.ts',
    'src/production-readiness-gate-v1/production-domain-assessor.ts',
    'src/production-readiness-gate-v1/production-risk-engine.ts',
    'src/production-readiness-gate-v1/production-readiness-evidence-loader.ts',
    'server/production-readiness-gate-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 2_500_000);
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:production-readiness-gate-v1']), 'script');
  assert('02. server route', serverTs.includes('/api/founder/production-readiness-gate-v1'), 'route');
  assert('03. UI overall score', appJs.includes('Overall Score'), 'overall score');
  assert('04. UI domain scores', appJs.includes('Domain Scores'), 'domain scores');
  assert('05. UI production risks', appJs.includes('Production Risks'), 'production risks');
  assert('06. UI readiness verdict', appJs.includes('Readiness Verdict'), 'readiness verdict');
  assert('07. UI hardening recommendations', appJs.includes('Hardening Recommendations'), 'hardening');

  for (const script of REGRESSION_SCRIPTS) {
    assert(`08. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const builtBefore = countBuiltWorkspaces();
  if (builtBefore < MIN_PRODUCTION_READY_CATEGORIES) {
    console.log(`Seeding ${MIN_PRODUCTION_READY_CATEGORIES - builtBefore} missing RBEP workspaces via V1.1…`);
    runRealBuildExecutionPipelineV11({ projectRootDir: ROOT });
    checkpoint('RBEP V1.1 seed for production readiness workspaces');
  }

  assert(
    '09. built workspaces',
    countBuiltWorkspaces() >= MIN_PRODUCTION_READY_CATEGORIES,
    `${countBuiltWorkspaces()}/${MIN_PRODUCTION_READY_CATEGORIES}`,
  );

  const assessment = runProductionReadinessGateV1({ projectRootDir: ROOT });
  checkpoint('full 15/15 production readiness run');

  assert(
    '10. categories evaluated',
    assessment.categoriesEvaluated >= MIN_PRODUCTION_READY_CATEGORIES,
    `${assessment.categoriesEvaluated}/${MIN_PRODUCTION_READY_CATEGORIES}`,
  );

  assert(
    '11. production readiness score >= 80',
    assessment.productionReadinessScore >= MIN_PRODUCTION_READINESS_SCORE,
    String(assessment.productionReadinessScore),
  );

  assert(
    '12. production proof status',
    assessment.productionProofStatus === 'PROVEN',
    assessment.productionProofStatus,
  );

  assert(
    '13. production readiness verdict',
    assessment.productionReadinessVerdict === 'PRODUCTION_READY' ||
      assessment.productionReadinessVerdict === 'PRODUCTION_READY_WITH_WARNINGS',
    assessment.productionReadinessVerdict,
  );

  assert(
    '14. risks classified',
    assessment.riskAnalysis.length >= MIN_PRODUCTION_READY_CATEGORIES,
    String(assessment.riskAnalysis.length),
  );

  assert(
    '15. hardening recommendations',
    assessment.hardeningRecommendations.length >= 1,
    String(assessment.hardeningRecommendations.length),
  );

  assert(
    '16. domain scores present',
    assessment.domainScores.domains.length >= 9,
    String(assessment.domainScores.domains.length),
  );

  seedProductionReadinessGateHistoryForTests(assessment);
  const history = listProductionReadinessGateHistory();
  assert(
    '17. history bounded',
    history.length <= MAX_PRODUCTION_READINESS_GATE_HISTORY,
    String(history.length),
  );

  const payload = buildProductionReadinessPayload({ refresh: false, projectRootDir: ROOT });
  assert(
    '18. payload smoke test',
    payload.overallScore === getLastProductionReadinessGateAssessment()?.productionReadinessScore,
    String(payload.overallScore),
  );

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(ARTIFACT_DIR, 'risk-analysis.json'),
    `${JSON.stringify(assessment.riskAnalysis, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'domain-scores.json'),
    `${JSON.stringify(assessment.domainScores, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'production-matrix.json'),
    `${JSON.stringify(assessment.productionMatrix, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'hardening-recommendations.json'),
    `${JSON.stringify(assessment.hardeningRecommendations, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(REPORT_PATH, buildProductionReadinessGateV1ReportMarkdown(assessment), 'utf8');

  assert('19. artifacts written', existsSync(join(ARTIFACT_DIR, 'assessment.json')), ARTIFACT_DIR);
  assert('20. report written', existsSync(REPORT_PATH), PRODUCTION_READINESS_GATE_V1_REPORT_TITLE);

  const failed = results.filter((r) => !r.passed);
  console.log('\n--- Production Readiness Gate V1 Validation ---');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }

  console.log('\n--- Summary ---');
  console.log(`Production Readiness Score: ${assessment.productionReadinessScore}/100`);
  console.log(`Verdict: ${assessment.productionReadinessVerdict}`);
  console.log(`Categories Production Ready: ${assessment.categoriesProductionReady}/${assessment.categoriesEvaluated}`);
  console.log(`Risks: ${assessment.riskAnalysis.length}`);
  console.log(`Report: ${PRODUCTION_READINESS_GATE_V1_REPORT_TITLE}`);

  if (failed.length === 0) {
    console.log(`\n${PRODUCTION_READINESS_GATE_V1_PASS_TOKEN}`);
    process.exit(0);
  }

  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
