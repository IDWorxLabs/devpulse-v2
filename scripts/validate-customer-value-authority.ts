/**
 * Phase 25.11 — Customer Value Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithFirstTimeUser } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assessCustomerValueAuthority,
  buildCustomerValueReportMarkdown,
  CUSTOMER_VALUE_AUTHORITY_PASS_TOKEN,
  CUSTOMER_VALUE_REPORT_TITLE,
  CUSTOMER_VALUE_SCENARIOS,
  getCustomerValueHistorySize,
  MAX_CUSTOMER_VALUE_HISTORY,
  resetCustomerValueHistoryForTests,
  validateCriticalValueFailureDetection,
  validateCustomerValueAdvisoryOnly,
  validateCustomerValueCategoryCount,
  validateCustomerValueDeterministicScoring,
  validateCustomerValueEvaluation,
  validateCustomerValueLaunchBlocking,
  validateCustomerValueRecommendationGeneration,
  validateCustomerValueScenarioClassification,
  validateRetentionScoring,
  validateValueRiskDetection,
} from '../src/customer-value-authority/index.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 60_000;

const REQUIRED_FILES = [
  'src/customer-value-authority/customer-value-bounds.ts',
  'src/customer-value-authority/customer-value-types.ts',
  'src/customer-value-authority/customer-value-scenarios.ts',
  'src/customer-value-authority/customer-value-authority.ts',
  'src/customer-value-authority/customer-value-report-builder.ts',
  'src/customer-value-authority/customer-value-history.ts',
  'src/customer-value-authority/customer-value-validator.ts',
  'src/customer-value-authority/index.ts',
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

function toWithFirstTimeUser(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithFirstTimeUser {
  const {
    reportMarkdown: _reportMarkdown,
    customerValueAuthority: _value,
    customerValueAuthorityReportMarkdown: _valueMarkdown,
    competitiveRealityAuthority: _competitive,
    competitiveRealityAuthorityReportMarkdown: _competitiveMarkdown,
    realityProofAuthority: _proof,
    realityProofAuthorityReportMarkdown: _proofMarkdown,
    realUserRealityAuthority: _realUser,
    realUserRealityAuthorityReportMarkdown: _realUserMarkdown,
    adoptionPredictionAuthority: _adoption,
    adoptionPredictionAuthorityReportMarkdown: _adoptionMarkdown,
    launchReadinessAuthority: _launchReadiness,
    launchReadinessAuthorityReportMarkdown: _launchReadinessMarkdown,
    launchCouncil: _launchCouncil,
    launchCouncilReport: _launchCouncilReport,
    launchCouncilReportMarkdown: _launchCouncilMarkdown,
    launchCouncilFinalization: _finalization,
    launchCouncilFinalizationReportMarkdown: _finalizationMarkdown,
    launchVerdictGovernance: _governance,
    launchVerdictGovernanceReportMarkdown: _governanceMarkdown,
    uiReviewerAuthority: _uiReviewer,
    uiReviewerAuthorityReportMarkdown: _uiReviewerMarkdown,
    clarifyingQuestionIntelligence: _clarifying,
    clarifyingQuestionIntelligenceReportMarkdown: _clarifyingMarkdown,
    ...withFirstTimeUser
  } = report;
  return withFirstTimeUser;
}

function main(): void {
  console.log('');
  console.log('Customer Value Authority — Validation (leaf mode)');
  console.log('===============================================');
  console.log('');

  resetCustomerValueHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateCustomerValueCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);
  assert('02. bounded categories', CUSTOMER_VALUE_SCENARIOS.length === 6, `count=${CUSTOMER_VALUE_SCENARIOS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithFirstTimeUser(v4);
  resetCustomerValueHistoryForTests();
  const first = assessCustomerValueAuthority(input);
  resetCustomerValueHistoryForTests();
  const second = assessCustomerValueAuthority(input);

  assert('03. scoring', first.customerValueScore >= 0 && first.customerValueScore <= 100, String(first.customerValueScore));
  const deterministic = validateCustomerValueDeterministicScoring(first, second);
  assert('04. deterministic output', deterministic.passed, deterministic.detail);

  const evaluation = validateCustomerValueEvaluation(first.scenarioResults);
  assert('05. value evaluation', evaluation.passed, evaluation.detail);

  const retention = validateRetentionScoring(first);
  assert('06. retention scoring', retention.passed, retention.detail);

  const valueRisk = validateValueRiskDetection(first);
  assert('07. value risk detection', valueRisk.passed, valueRisk.detail);
  assert('08. value risks surfaced', first.valueRisks.length > 0, String(first.valueRisks.length));

  const critical = validateCriticalValueFailureDetection(first);
  assert('09. critical failure detection', critical.passed, critical.detail);

  const classification = validateCustomerValueScenarioClassification(first.scenarioResults);
  assert('10. scenario classification', classification.passed, classification.detail);

  const blocking = validateCustomerValueLaunchBlocking(first);
  assert('11. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateCustomerValueRecommendationGeneration(first);
  assert('12. recommendation generation', recommendations.passed, recommendations.detail);

  const advisory = validateCustomerValueAdvisoryOnly(first);
  assert('13. advisory-only behavior', advisory.passed, advisory.detail);

  assert(
    '14. value signals surfaced',
    first.valueSignals.length > 0 || first.customerValueScore > 0,
    `signals=${first.valueSignals.length}`,
  );

  const markdown = buildCustomerValueReportMarkdown(first, input.generatedAt);
  assert('15. report generation', markdown.includes(`# ${CUSTOMER_VALUE_REPORT_TITLE}`), 'title');
  assert(
    '16. report sections',
    markdown.includes('## Customer Value Summary') &&
      markdown.includes('## Repeat Usage Value') &&
      markdown.includes('## Customer Value Verdict'),
    'sections',
  );

  resetCustomerValueHistoryForTests();
  assessCustomerValueAuthority(input);
  assessCustomerValueAuthority(input);
  assert('17. bounded history', getCustomerValueHistorySize() <= MAX_CUSTOMER_VALUE_HISTORY, String(getCustomerValueHistorySize()));
  assert('18. stable cache key prefix', first.cacheKey.startsWith('customer-value-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('19. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '20. customer value authority registered',
    authorities.some((entry) => entry.authorityId === 'customer-value-authority'),
    'customer-value-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/customer-value-authority/customer-value-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('21. founder test integration', reportBuilder.includes('buildCustomerValueAuthorityArtifacts'), 'report builder');
  assert('22. founder test report section', reportBuilder.includes('## Customer Value Authority'), 'markdown section');
  assert('23. founder ui panel', appJs.includes('Customer Value Authority'), 'app.js');
  assert('24. npm script', Boolean(pkg.scripts?.['validate:customer-value-authority']), 'package script');
  assert('25. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('26. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('27. v4 report includes customer value', Boolean(v4.customerValueAuthority), 'assembled report');

  checkpoint('complete');

  const failed = results.filter((item) => !item.passed);
  console.log(`Scenarios: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`  ✗ ${item.name}: ${item.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(CUSTOMER_VALUE_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:customer-value-authority');
}

main();
