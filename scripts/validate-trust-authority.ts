/**
 * Phase 25.4 — Trust Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithPromise } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_TRUST_HISTORY,
  TRUST_AUTHORITY_PASS_TOKEN,
  TRUST_AUTHORITY_REPORT_TITLE,
  TRUST_SCENARIOS,
  assessTrustAuthority,
  buildTrustAuthorityReportMarkdown,
  getTrustAuthorityHistorySize,
  resetTrustAuthorityHistoryForTests,
  validateCriticalTrustFailureDetection,
  validateTrustDeterministicScoring,
  validateTrustLaunchBlocking,
  validateTrustRiskCalculation,
  validateTrustScenarioCount,
} from '../src/trust-authority/index.js';

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
  'src/trust-authority/trust-authority-bounds.ts',
  'src/trust-authority/trust-authority-types.ts',
  'src/trust-authority/trust-scenarios.ts',
  'src/trust-authority/trust-authority.ts',
  'src/trust-authority/trust-report-builder.ts',
  'src/trust-authority/trust-history.ts',
  'src/trust-authority/trust-validator.ts',
  'src/trust-authority/index.ts',
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

function toWithPromise(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithPromise {
  const {
    reportMarkdown: _reportMarkdown,
    trustAuthority: _trust,
    trustAuthorityReportMarkdown: _trustMarkdown,
    selfAwarenessAuthority: _awareness,
    selfAwarenessAuthorityReportMarkdown: _awarenessMarkdown,
    userSuccessAuthority: _success,
    userSuccessAuthorityReportMarkdown: _successMarkdown,
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
    ...withPromise
  } = report;
  return withPromise;
}

function main(): void {
  console.log('');
  console.log('Trust Authority — Validation (leaf mode)');
  console.log('========================================');
  console.log('');

  resetTrustAuthorityHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const scenarioCount = validateTrustScenarioCount();
  assert('01. category evaluation', scenarioCount.passed, scenarioCount.detail);
  assert('02. bounded scenarios', TRUST_SCENARIOS.length === 5, `count=${TRUST_SCENARIOS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithPromise(v4);
  resetTrustAuthorityHistoryForTests();
  const first = assessTrustAuthority(input);
  resetTrustAuthorityHistoryForTests();
  const second = assessTrustAuthority(input);

  assert('03. trust scoring', first.trustScore >= 0 && first.trustScore <= 100, String(first.trustScore));
  const deterministic = validateTrustDeterministicScoring(first.scenarioResults, second.scenarioResults);
  assert('04. deterministic scoring', deterministic.passed, deterministic.detail);

  const risk = validateTrustRiskCalculation(first, 1);
  assert('05. trust risk calculation', risk.passed, risk.detail);

  const critical = validateCriticalTrustFailureDetection(first);
  assert('06. critical failure detection', critical.passed, critical.detail);
  assert('07. critical failures surfaced', first.criticalTrustFailures > 0, String(first.criticalTrustFailures));
  assert('08. trust risks surfaced', first.trustRisks.length > 0, String(first.trustRisks.length));

  const blocking = validateTrustLaunchBlocking({
    trustScore: first.trustScore,
    trustRiskScore: first.trustRiskScore,
    criticalTrustFailures: first.criticalTrustFailures,
    blocksLaunchReadiness: first.blocksLaunchReadiness,
  });
  assert('09. launch blocking behavior', blocking.passed, blocking.detail);

  const markdown = buildTrustAuthorityReportMarkdown(first, input.generatedAt);
  assert('10. report generation', markdown.includes(`# ${TRUST_AUTHORITY_REPORT_TITLE}`), 'title');
  assert(
    '11. report sections',
    markdown.includes('## Trust Summary') && markdown.includes('## Trust Verdict'),
    'sections',
  );

  resetTrustAuthorityHistoryForTests();
  assessTrustAuthority(input);
  assessTrustAuthority(input);
  assert('12. bounded history', getTrustAuthorityHistorySize() <= MAX_TRUST_HISTORY, String(getTrustAuthorityHistorySize()));
  assert('13. stable cache key prefix', first.cacheKey.startsWith('trust-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('14. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '15. trust authority registered',
    authorities.some((entry) => entry.authorityId === 'trust-authority'),
    'trust-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/trust-authority/trust-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('16. founder test integration', reportBuilder.includes('buildTrustAuthorityArtifacts'), 'report builder');
  assert('17. founder test report section', reportBuilder.includes('## Trust Authority'), 'markdown section');
  assert('18. founder ui panel', appJs.includes('Trust Authority'), 'app.js');
  assert('19. npm script', Boolean(pkg.scripts?.['validate:trust-authority']), 'package script');
  assert('20. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('21. no external ai', !authoritySource.includes('fetch(') && !authoritySource.includes('openai'), 'deterministic');
  assert('22. v4 report includes trust authority', Boolean(v4.trustAuthority), 'assembled report');

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

  console.log(TRUST_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:trust-authority');
}

main();
