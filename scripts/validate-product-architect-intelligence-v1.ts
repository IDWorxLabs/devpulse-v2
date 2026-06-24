/**
 * Product Architect Intelligence V1 — validation (leaf mode).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessProductArchitecture,
  buildLargeScaleProductArchitectureSummary,
  buildProductArchitectIntelligenceReportMarkdown,
  buildUvlProductArchitectureSummary,
  computeProductArchitectureAflaPenalty,
  detectMissingScreens,
  getLastProductArchitectureAssessment,
  listProductArchitectIntelligenceHistory,
  MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY,
  MIN_PRODUCT_ARCHITECT_SUITE_APPS,
  PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS,
  PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS_TOKEN,
  resetProductArchitectIntelligenceHistoryForTests,
} from '../src/product-architect-intelligence-v1/index.js';
import { getProductArchitectIntelligenceConsolidationOwnership } from '../src/product-architect-intelligence-v1/index.js';
import { buildProductArchitectIntelligencePayload } from '../server/product-architect-intelligence-handler.js';
import { buildVerificationHubPayload } from '../server/verification-hub-handler.js';
import { getDevPulseV2ProductArchitectAuthority } from '../src/product-architect/product-architect-authority.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, '.product-architect-intelligence-v1');
const START = Date.now();
const MAX_RUNTIME_MS = 45_000;

const REQUIRED_FILES = [
  'src/product-architect-intelligence-v1/product-architect-intelligence-bounds.ts',
  'src/product-architect-intelligence-v1/product-architect-intelligence-types.ts',
  'src/product-architect-intelligence-v1/product-pattern-registry.ts',
  'src/product-architect-intelligence-v1/product-missing-screen-detector.ts',
  'src/product-architect-intelligence-v1/product-workflow-completeness.ts',
  'src/product-architect-intelligence-v1/product-user-journey-analyzer.ts',
  'src/product-architect-intelligence-v1/product-gap-report-builder.ts',
  'src/product-architect-intelligence-v1/product-readiness-score.ts',
  'src/product-architect-intelligence-v1/product-architect-cqi-integration.ts',
  'src/product-architect-intelligence-v1/product-architect-uvl-integration.ts',
  'src/product-architect-intelligence-v1/product-architect-afla-integration.ts',
  'src/product-architect-intelligence-v1/product-architect-large-scale-integration.ts',
  'src/product-architect-intelligence-v1/product-architect-intelligence-history.ts',
  'src/product-architect-intelligence-v1/product-architecture-assessor.ts',
  'src/product-architect-intelligence-v1/product-architect-intelligence-report-builder.ts',
  'src/product-architect-intelligence-v1/product-architect-intelligence-suite-registry.ts',
  'server/product-architect-intelligence-handler.ts',
] as const;

const REQUIRED_UI_STRINGS = [
  'Product Architect Review',
  'Product Readiness Score',
  'Architecture Score',
  'Workflow Score',
  'User Journey Score',
  'Critical Product Gaps',
  'Missing Screens',
  'Missing Workflows',
  'Recommendations',
  '/api/founder/product-architect-intelligence',
  'product-architect-profile-select',
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
  console.log('Product Architect Intelligence V1 — Validation');
  console.log('===============================================');
  console.log('');

  resetProductArchitectIntelligenceHistoryForTests();
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

  const ownership = getProductArchitectIntelligenceConsolidationOwnership();
  assert('01. PAI canonical owner', ownership.status === 'CANONICAL', ownership.capability);
  assert('02. package script', Boolean(pkg.scripts?.['validate:product-architect-intelligence-v1']), 'script');
  assert('03. operator section', manifest.includes("'Product Architect Review'"), 'manifest');
  assert('04. server route', serverTs.includes('/api/founder/product-architect-intelligence'), 'route');
  assert(
    '05. foundation architect preserved',
    getDevPulseV2ProductArchitectAuthority().constructor.name === 'DevPulseV2ProductArchitectAuthority',
    'foundation',
  );

  for (const uiString of REQUIRED_UI_STRINGS) {
    assert(`06. UI string ${uiString}`, appJs.includes(uiString), uiString);
  }

  assert(
    '07. suite app count',
    PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS.length >= MIN_PRODUCT_ARCHITECT_SUITE_APPS,
    String(PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS.length),
  );

  const crmMissing = detectMissingScreens({
    evidenceText: 'Build a CRM to manage customers with create, edit, delete, and search customer records.',
    domain: 'CRM',
  });
  assert(
    '08. CRM missing Pipeline',
    crmMissing.some((item) => item.screen === 'Pipeline' && item.flag === 'Critical Product Gap'),
    crmMissing.map((item) => item.screen).join(', '),
  );
  assert(
    '09. CRM missing Reports',
    crmMissing.some((item) => item.screen === 'Reports' && item.flag === 'Critical Product Gap'),
    crmMissing.map((item) => item.screen).join(', '),
  );

  const marketplaceMissing = detectMissingScreens({
    evidenceText: 'Build a marketplace for buyers and sellers with listings, search, and transactions.',
    domain: 'MARKETPLACE',
  });
  assert(
    '10. Marketplace missing Checkout',
    marketplaceMissing.some((item) => item.screen === 'Checkout' && item.flag === 'Launch Risk'),
    marketplaceMissing.map((item) => item.screen).join(', '),
  );
  assert(
    '11. Marketplace missing Orders',
    marketplaceMissing.some((item) => item.screen === 'Orders' && item.flag === 'Launch Risk'),
    marketplaceMissing.map((item) => item.screen).join(', '),
  );

  for (const suiteApp of PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS) {
    resetProductArchitectIntelligenceHistoryForTests();
    const assessment = assessProductArchitecture({
      profile: suiteApp.profile,
      productPrompt: suiteApp.prompt,
      productName: suiteApp.productName,
    });

    assert(`${suiteApp.profile}: profile`, assessment.profile === suiteApp.profile, assessment.profile);
    assert(
      `${suiteApp.profile}: scores bounded`,
      assessment.scores.productReadinessScore >= 0 &&
        assessment.scores.productReadinessScore <= 100 &&
        assessment.scores.architectureScore >= 0 &&
        assessment.scores.workflowCompletenessScore <= 100,
      String(assessment.scores.productReadinessScore),
    );
    assert(
      `${suiteApp.profile}: gap report`,
      assessment.gapReport.gaps.length > 0,
      String(assessment.gapReport.gaps.length),
    );
    assert(
      `${suiteApp.profile}: cqi context`,
      Boolean(assessment.cqiContext?.rootCause),
      assessment.cqiContext?.rootCause ?? 'missing',
    );
    checkpoint(`suite ${suiteApp.profile}`);
  }

  resetProductArchitectIntelligenceHistoryForTests();
  for (let i = 0; i < MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY + 5; i += 1) {
    assessProductArchitecture({ profile: 'CRM_WEB_V1' });
  }
  assert(
    '12. history bounded',
    listProductArchitectIntelligenceHistory().length <= MAX_PRODUCT_ARCHITECT_INTELLIGENCE_HISTORY,
    String(listProductArchitectIntelligenceHistory().length),
  );

  const payload = buildProductArchitectIntelligencePayload({ profile: 'CRM_WEB_V1' });
  assert('13. payload read only', payload.readOnly === true, 'readOnly');
  assert('14. payload recommendations', payload.recommendations.length > 0, String(payload.recommendations.length));

  const uvlSummary = buildUvlProductArchitectureSummary(getLastProductArchitectureAssessment());
  assert('15. UVL summary coverage', uvlSummary.productArchitectureCoverage >= 0, String(uvlSummary.productArchitectureCoverage));

  const verificationHub = buildVerificationHubPayload({ profile: 'CRM_WEB_V1' });
  assert(
    '16. verification hub product architecture',
    verificationHub.productArchitectureCoverage.productReadinessScore >= 0,
    String(verificationHub.productArchitectureCoverage.productReadinessScore),
  );

  const aflaPenalty = computeProductArchitectureAflaPenalty(getLastProductArchitectureAssessment());
  assert('17. AFLA penalty bounded', aflaPenalty.penalty >= 0 && aflaPenalty.penalty <= 20, String(aflaPenalty.penalty));

  const largeScaleSummary = buildLargeScaleProductArchitectureSummary();
  assert(
    '18. large-scale summary',
    largeScaleSummary.categoriesAssessed >= MIN_PRODUCT_ARCHITECT_SUITE_APPS,
    String(largeScaleSummary.categoriesAssessed),
  );

  const last = getLastProductArchitectureAssessment();
  if (last) {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    writeFileSync(join(ARTIFACT_DIR, 'assessment.json'), JSON.stringify(last, null, 2), 'utf8');
    writeFileSync(
      join(ARTIFACT_DIR, 'gap-report.json'),
      JSON.stringify(last.gapReport, null, 2),
      'utf8',
    );
    writeFileSync(
      join(ARTIFACT_DIR, 'workflow-analysis.json'),
      JSON.stringify(last.workflowAnalysis, null, 2),
      'utf8',
    );
    writeFileSync(
      join(ARTIFACT_DIR, 'journey-analysis.json'),
      JSON.stringify(last.journeyAnalysis, null, 2),
      'utf8',
    );
    writeFileSync(
      join(ROOT, 'PRODUCT_ARCHITECT_INTELLIGENCE_REPORT.md'),
      buildProductArchitectIntelligenceReportMarkdown(last),
      'utf8',
    );
    assert('19. assessment artifact', existsSync(join(ARTIFACT_DIR, 'assessment.json')), 'written');
    assert(
      '20. report artifact',
      existsSync(join(ROOT, 'PRODUCT_ARCHITECT_INTELLIGENCE_REPORT.md')),
      'written',
    );
  }

  const failed = results.filter((result) => !result.passed);
  console.log('');
  for (const result of results) {
    const mark = result.passed ? '✓' : '✗';
    console.log(`${mark} ${result.name} — ${result.detail}`);
  }
  console.log('');
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  console.log('');

  if (failed.length > 0) {
    console.error('Product Architect Intelligence V1 — FAILED');
    process.exit(1);
  }

  console.log(PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS_TOKEN);
  process.exit(0);
}

main();
