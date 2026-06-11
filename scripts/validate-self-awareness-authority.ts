/**
 * Phase 25.5 — Self-Awareness Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithTrust } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_SELF_AWARENESS_HISTORY,
  SELF_AWARENESS_AUTHORITY_PASS_TOKEN,
  SELF_AWARENESS_REPORT_TITLE,
  SELF_AWARENESS_SCENARIOS,
  assessSelfAwarenessAuthority,
  buildSelfAwarenessReportMarkdown,
  getSelfAwarenessHistorySize,
  resetSelfAwarenessHistoryForTests,
  validateCriticalAwarenessFailureDetection,
  validateLimitationDetection,
  validateSelfAwarenessDeterministicScoring,
  validateSelfAwarenessLaunchBlocking,
  validateSelfAwarenessRiskCalculation,
  validateSelfAwarenessScenarioCount,
} from '../src/self-awareness-authority/index.js';

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
  'src/self-awareness-authority/self-awareness-bounds.ts',
  'src/self-awareness-authority/self-awareness-types.ts',
  'src/self-awareness-authority/self-awareness-scenarios.ts',
  'src/self-awareness-authority/self-awareness-authority.ts',
  'src/self-awareness-authority/self-awareness-report-builder.ts',
  'src/self-awareness-authority/self-awareness-history.ts',
  'src/self-awareness-authority/self-awareness-validator.ts',
  'src/self-awareness-authority/index.ts',
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

function toWithTrust(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithTrust {
  const {
    reportMarkdown: _reportMarkdown,
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
    ...withTrust
  } = report;
  return withTrust;
}

function main(): void {
  console.log('');
  console.log('Self-Awareness Authority — Validation (leaf mode)');
  console.log('===============================================');
  console.log('');

  resetSelfAwarenessHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const scenarioCount = validateSelfAwarenessScenarioCount();
  assert('01. awareness category evaluation', scenarioCount.passed, scenarioCount.detail);
  assert('02. bounded categories', SELF_AWARENESS_SCENARIOS.length === 6, `count=${SELF_AWARENESS_SCENARIOS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithTrust(v4);
  resetSelfAwarenessHistoryForTests();
  const first = assessSelfAwarenessAuthority(input);
  resetSelfAwarenessHistoryForTests();
  const second = assessSelfAwarenessAuthority(input);

  assert('03. scoring', first.selfAwarenessScore >= 0 && first.selfAwarenessScore <= 100, String(first.selfAwarenessScore));
  const deterministic = validateSelfAwarenessDeterministicScoring(first.scenarioResults, second.scenarioResults);
  assert('04. deterministic scoring', deterministic.passed, deterministic.detail);

  const risk = validateSelfAwarenessRiskCalculation(first, 1);
  assert('05. risk calculation', risk.passed, risk.detail);

  const critical = validateCriticalAwarenessFailureDetection(first);
  assert('06. critical failure detection', critical.passed, critical.detail);
  assert('07. critical failures surfaced', first.criticalAwarenessFailures > 0, String(first.criticalAwarenessFailures));

  const limitations = validateLimitationDetection(first);
  assert('08. limitation detection', limitations.passed, limitations.detail);

  const blockerCount = [
    input.chatIntelligenceReality.blocksLaunchReadiness,
    input.repositoryTypecheckReality.blocksLaunchReadiness,
    input.skepticalFounderSimulator.blocksLaunchReadiness,
    input.promiseFulfillment.blocksLaunchReadiness,
    input.trustAuthority.blocksLaunchReadiness,
  ].filter(Boolean).length;
  assert('09. blocker detection inputs', blockerCount > 0, String(blockerCount));

  const blocking = validateSelfAwarenessLaunchBlocking({
    selfAwarenessScore: first.selfAwarenessScore,
    selfAwarenessRiskScore: first.selfAwarenessRiskScore,
    criticalAwarenessFailures: first.criticalAwarenessFailures,
    blocksLaunchReadiness: first.blocksLaunchReadiness,
  });
  assert('10. launch blocking behavior', blocking.passed, blocking.detail);

  const markdown = buildSelfAwarenessReportMarkdown(first, input.generatedAt);
  assert('11. report generation', markdown.includes(`# ${SELF_AWARENESS_REPORT_TITLE}`), 'title');
  assert(
    '12. report sections',
    markdown.includes('## Self-Awareness Summary') && markdown.includes('## Self-Awareness Verdict'),
    'sections',
  );

  resetSelfAwarenessHistoryForTests();
  assessSelfAwarenessAuthority(input);
  assessSelfAwarenessAuthority(input);
  assert('13. bounded history', getSelfAwarenessHistorySize() <= MAX_SELF_AWARENESS_HISTORY, String(getSelfAwarenessHistorySize()));
  assert('14. stable cache key prefix', first.cacheKey.startsWith('self-awareness-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('15. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '16. self-awareness authority registered',
    authorities.some((entry) => entry.authorityId === 'self-awareness-authority'),
    'self-awareness-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/self-awareness-authority/self-awareness-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('17. founder test integration', reportBuilder.includes('buildSelfAwarenessAuthorityArtifacts'), 'report builder');
  assert('18. founder test report section', reportBuilder.includes('## Self-Awareness Authority'), 'markdown section');
  assert('19. founder ui panel', appJs.includes('Self-Awareness Authority'), 'app.js');
  assert('20. npm script', Boolean(pkg.scripts?.['validate:self-awareness-authority']), 'package script');
  assert('21. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('22. no consciousness claims', !authoritySource.includes('sentience'), 'operational only');
  assert('23. v4 report includes self-awareness', Boolean(v4.selfAwarenessAuthority), 'assembled report');

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

  console.log(SELF_AWARENESS_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:self-awareness-authority');
}

main();
