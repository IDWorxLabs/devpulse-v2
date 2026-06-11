/**
 * Phase 25.10 — First-Time User Reality Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithUnknownDiscovery } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assessFirstTimeUserRealityAuthority,
  buildFirstTimeUserRealityReportMarkdown,
  FIRST_TIME_USER_REALITY_AUTHORITY_PASS_TOKEN,
  FIRST_TIME_USER_REALITY_REPORT_TITLE,
  FIRST_TIME_USER_REALITY_SCENARIOS,
  getFirstTimeUserRealityHistorySize,
  MAX_FIRST_TIME_USER_HISTORY,
  resetFirstTimeUserRealityHistoryForTests,
  validateConfusionDetection,
  validateFirstTimeUserAdvisoryOnly,
  validateFirstTimeUserCategoryCount,
  validateFirstTimeUserDeterministicScoring,
  validateFirstTimeUserLaunchBlocking,
  validateFirstTimeUserRecommendationGeneration,
  validateFirstTimeUserScenarioClassification,
  validateOnboardingEvaluation,
  validateWorkflowEvaluation,
} from '../src/first-time-user-reality-authority/index.js';
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
  'src/first-time-user-reality-authority/first-time-user-reality-bounds.ts',
  'src/first-time-user-reality-authority/first-time-user-reality-types.ts',
  'src/first-time-user-reality-authority/first-time-user-reality-scenarios.ts',
  'src/first-time-user-reality-authority/first-time-user-reality-authority.ts',
  'src/first-time-user-reality-authority/first-time-user-reality-report-builder.ts',
  'src/first-time-user-reality-authority/first-time-user-reality-history.ts',
  'src/first-time-user-reality-authority/first-time-user-reality-validator.ts',
  'src/first-time-user-reality-authority/index.ts',
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

function toWithUnknownDiscovery(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithUnknownDiscovery {
  const {
    reportMarkdown: _reportMarkdown,
    firstTimeUserRealityAuthority: _ftuAuthority,
    firstTimeUserRealityAuthorityReportMarkdown: _ftuAuthorityMarkdown,
    customerValueAuthority: _value,
    customerValueAuthorityReportMarkdown: _valueMarkdown,
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
    ...withUnknownDiscovery
  } = report;
  return withUnknownDiscovery;
}

function main(): void {
  console.log('');
  console.log('First-Time User Reality Authority — Validation (leaf mode)');
  console.log('=========================================================');
  console.log('');

  resetFirstTimeUserRealityHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateFirstTimeUserCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);
  assert('02. bounded categories', FIRST_TIME_USER_REALITY_SCENARIOS.length === 6, `count=${FIRST_TIME_USER_REALITY_SCENARIOS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithUnknownDiscovery(v4);
  resetFirstTimeUserRealityHistoryForTests();
  const first = assessFirstTimeUserRealityAuthority(input);
  resetFirstTimeUserRealityHistoryForTests();
  const second = assessFirstTimeUserRealityAuthority(input);

  assert('03. scoring', first.firstTimeUserScore >= 0 && first.firstTimeUserScore <= 100, String(first.firstTimeUserScore));
  assert('04. confusion score', first.confusionScore >= 0 && first.confusionScore <= 100, String(first.confusionScore));
  const deterministic = validateFirstTimeUserDeterministicScoring(first, second);
  assert('05. deterministic output', deterministic.passed, deterministic.detail);

  const confusion = validateConfusionDetection(first.scenarioResults);
  assert('06. confusion detection', confusion.passed, confusion.detail);
  assert('07. confusion points surfaced', first.confusionPoints.length > 0, String(first.confusionPoints.length));

  const onboarding = validateOnboardingEvaluation(first.scenarioResults);
  assert('08. onboarding evaluation', onboarding.passed, onboarding.detail);

  const workflow = validateWorkflowEvaluation(first.scenarioResults);
  assert('09. workflow evaluation', workflow.passed, workflow.detail);

  const classification = validateFirstTimeUserScenarioClassification(first.scenarioResults);
  assert('10. scenario classification', classification.passed, classification.detail);

  const blocking = validateFirstTimeUserLaunchBlocking(first);
  assert('11. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateFirstTimeUserRecommendationGeneration(first);
  assert('12. recommendation generation', recommendations.passed, recommendations.detail);

  const advisory = validateFirstTimeUserAdvisoryOnly(first);
  assert('13. advisory-only behavior', advisory.passed, advisory.detail);

  assert(
    '14. blockers surfaced',
    first.blockerCount > 0 || first.criticalConfusionCount > 0,
    `blockers=${first.blockerCount}; critical=${first.criticalConfusionCount}`,
  );

  const markdown = buildFirstTimeUserRealityReportMarkdown(first, input.generatedAt);
  assert('15. report generation', markdown.includes(`# ${FIRST_TIME_USER_REALITY_REPORT_TITLE}`), 'title');
  assert(
    '16. report sections',
    markdown.includes('## First-Time User Summary') &&
      markdown.includes('## Workflow Understanding') &&
      markdown.includes('## First-Time User Verdict'),
    'sections',
  );

  resetFirstTimeUserRealityHistoryForTests();
  assessFirstTimeUserRealityAuthority(input);
  assessFirstTimeUserRealityAuthority(input);
  assert('17. bounded history', getFirstTimeUserRealityHistorySize() <= MAX_FIRST_TIME_USER_HISTORY, String(getFirstTimeUserRealityHistorySize()));
  assert('18. stable cache key prefix', first.cacheKey.startsWith('first-time-user-reality-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('19. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '20. first-time user authority registered',
    authorities.some((entry) => entry.authorityId === 'first-time-user-reality-authority'),
    'first-time-user-reality-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/first-time-user-reality-authority/first-time-user-reality-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('21. founder test integration', reportBuilder.includes('buildFirstTimeUserRealityAuthorityArtifacts'), 'report builder');
  assert('22. founder test report section', reportBuilder.includes('## First-Time User Reality Authority'), 'markdown section');
  assert('23. founder ui panel', appJs.includes('First-Time User Reality Authority'), 'app.js');
  assert('24. npm script', Boolean(pkg.scripts?.['validate:first-time-user-reality-authority']), 'package script');
  assert('25. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('26. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('27. v4 report includes first-time user authority', Boolean(v4.firstTimeUserRealityAuthority), 'assembled report');

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

  console.log(FIRST_TIME_USER_REALITY_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:first-time-user-reality-authority');
}

main();
