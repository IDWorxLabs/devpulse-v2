/**
 * Phase 25.6 — User Success Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithSelfAwareness } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_USER_SUCCESS_HISTORY,
  USER_SUCCESS_AUTHORITY_PASS_TOKEN,
  USER_SUCCESS_REPORT_TITLE,
  USER_SUCCESS_SCENARIOS,
  assessUserSuccessAuthority,
  buildUserSuccessReportMarkdown,
  getUserSuccessHistorySize,
  resetUserSuccessHistoryForTests,
  validateCriticalSuccessFailureDetection,
  validateOutcomeAchievementScoring,
  validateUserBlockerDetection,
  validateUserSuccessDeterministicScoring,
  validateUserSuccessLaunchBlocking,
  validateUserSuccessScenarioCount,
} from '../src/user-success-authority/index.js';

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
  'src/user-success-authority/user-success-bounds.ts',
  'src/user-success-authority/user-success-types.ts',
  'src/user-success-authority/user-success-scenarios.ts',
  'src/user-success-authority/user-success-authority.ts',
  'src/user-success-authority/user-success-report-builder.ts',
  'src/user-success-authority/user-success-history.ts',
  'src/user-success-authority/user-success-validator.ts',
  'src/user-success-authority/index.ts',
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

function toWithSelfAwareness(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithSelfAwareness {
  const {
    reportMarkdown: _reportMarkdown,
    userSuccessAuthority: _success,
    userSuccessAuthorityReportMarkdown: _successMarkdown,
    gapDetectionAuthority: _gap,
    gapDetectionAuthorityReportMarkdown: _gapMarkdown,
    selfEvolutionAuthority: _evolution,
    selfEvolutionAuthorityReportMarkdown: _evolutionMarkdown,
    unknownDiscoveryAuthority: _discovery,
    unknownDiscoveryAuthorityReportMarkdown: _discoveryMarkdown,
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
    ...withSelfAwareness
  } = report;
  return withSelfAwareness;
}

function main(): void {
  console.log('');
  console.log('User Success Authority — Validation (leaf mode)');
  console.log('==============================================');
  console.log('');

  resetUserSuccessHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const scenarioCount = validateUserSuccessScenarioCount();
  assert('01. goal evaluation', scenarioCount.passed, scenarioCount.detail);
  assert('02. bounded goal categories', USER_SUCCESS_SCENARIOS.length === 6, `count=${USER_SUCCESS_SCENARIOS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithSelfAwareness(v4);
  resetUserSuccessHistoryForTests();
  const first = assessUserSuccessAuthority(input);
  resetUserSuccessHistoryForTests();
  const second = assessUserSuccessAuthority(input);

  assert('03. scoring', first.userSuccessScore >= 0 && first.userSuccessScore <= 100, String(first.userSuccessScore));
  const deterministic = validateUserSuccessDeterministicScoring(first.scenarioResults, second.scenarioResults);
  assert('04. deterministic scoring', deterministic.passed, deterministic.detail);

  const outcome = validateOutcomeAchievementScoring(first);
  assert('05. outcome achievement scoring', outcome.passed, outcome.detail);

  const critical = validateCriticalSuccessFailureDetection(first);
  assert('06. critical failure detection', critical.passed, critical.detail);
  assert('07. critical failures surfaced', first.criticalSuccessFailures > 0, String(first.criticalSuccessFailures));

  const blockers = validateUserBlockerDetection(first);
  assert('08. blocker detection', blockers.passed, blockers.detail);

  const blocking = validateUserSuccessLaunchBlocking({
    userSuccessScore: first.userSuccessScore,
    outcomeAchievementScore: first.outcomeAchievementScore,
    criticalSuccessFailures: first.criticalSuccessFailures,
    blocksLaunchReadiness: first.blocksLaunchReadiness,
  });
  assert('09. launch blocking behavior', blocking.passed, blocking.detail);

  const markdown = buildUserSuccessReportMarkdown(first, input.generatedAt);
  assert('10. report generation', markdown.includes(`# ${USER_SUCCESS_REPORT_TITLE}`), 'title');
  assert(
    '11. report sections',
    markdown.includes('## User Success Summary') && markdown.includes('## User Success Verdict'),
    'sections',
  );

  resetUserSuccessHistoryForTests();
  assessUserSuccessAuthority(input);
  assessUserSuccessAuthority(input);
  assert('12. bounded history', getUserSuccessHistorySize() <= MAX_USER_SUCCESS_HISTORY, String(getUserSuccessHistorySize()));
  assert('13. stable cache key prefix', first.cacheKey.startsWith('user-success-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('14. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '15. user success authority registered',
    authorities.some((entry) => entry.authorityId === 'user-success-authority'),
    'user-success-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/user-success-authority/user-success-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('16. founder test integration', reportBuilder.includes('buildUserSuccessAuthorityArtifacts'), 'report builder');
  assert('17. founder test report section', reportBuilder.includes('## User Success Authority'), 'markdown section');
  assert('18. founder ui panel', appJs.includes('User Success Authority'), 'app.js');
  assert('19. npm script', Boolean(pkg.scripts?.['validate:user-success-authority']), 'package script');
  assert('20. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('21. outcome focused', authoritySource.includes('valueDelivered'), 'outcome not feature-only');
  assert('22. v4 report includes user success', Boolean(v4.userSuccessAuthority), 'assembled report');

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

  console.log(USER_SUCCESS_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:user-success-authority');
}

main();
