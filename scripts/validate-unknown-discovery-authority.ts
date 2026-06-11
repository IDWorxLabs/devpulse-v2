/**
 * Phase 25.9 — Unknown Discovery Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithSelfEvolution } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_UNKNOWN_HISTORY,
  UNKNOWN_DISCOVERY_AUTHORITY_PASS_TOKEN,
  UNKNOWN_DISCOVERY_CATEGORIES,
  UNKNOWN_DISCOVERY_REPORT_TITLE,
  assessUnknownDiscoveryAuthority,
  buildUnknownDiscoveryReportMarkdown,
  getUnknownDiscoveryHistorySize,
  resetUnknownDiscoveryHistoryForTests,
  validateBlindSpotDetection,
  validateContradictionDetection,
  validateCoverageGapDetection,
  validateRecommendedTestGeneration,
  validateUnknownDiscoveryCategoryCount,
  validateUnknownDiscoveryClassification,
  validateUnknownDiscoveryDeterministicScoring,
  validateUnknownDiscoveryLaunchBlocking,
  validateUnknownDiscoveryRecommendationGeneration,
} from '../src/unknown-discovery-authority/index.js';

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
  'src/unknown-discovery-authority/unknown-discovery-bounds.ts',
  'src/unknown-discovery-authority/unknown-discovery-types.ts',
  'src/unknown-discovery-authority/unknown-discovery-scenarios.ts',
  'src/unknown-discovery-authority/unknown-discovery-authority.ts',
  'src/unknown-discovery-authority/unknown-discovery-report-builder.ts',
  'src/unknown-discovery-authority/unknown-discovery-history.ts',
  'src/unknown-discovery-authority/unknown-discovery-validator.ts',
  'src/unknown-discovery-authority/index.ts',
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

function toWithSelfEvolution(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithSelfEvolution {
  const {
    reportMarkdown: _reportMarkdown,
    unknownDiscoveryAuthority: _discovery,
    unknownDiscoveryAuthorityReportMarkdown: _discoveryMarkdown,
    firstTimeUserRealityAuthority: _ftuAuthority,
    firstTimeUserRealityAuthorityReportMarkdown: _ftuAuthorityMarkdown,
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
    ...withSelfEvolution
  } = report;
  return withSelfEvolution;
}

function main(): void {
  console.log('');
  console.log('Unknown Discovery Authority — Validation (leaf mode)');
  console.log('==================================================');
  console.log('');

  resetUnknownDiscoveryHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateUnknownDiscoveryCategoryCount();
  assert('01. discovery category count', categoryCount.passed, categoryCount.detail);
  assert('02. bounded discovery categories', UNKNOWN_DISCOVERY_CATEGORIES.length === 6, `count=${UNKNOWN_DISCOVERY_CATEGORIES.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithSelfEvolution(v4);
  resetUnknownDiscoveryHistoryForTests();
  const first = assessUnknownDiscoveryAuthority(input);
  resetUnknownDiscoveryHistoryForTests();
  const second = assessUnknownDiscoveryAuthority(input);

  assert('03. scoring', first.unknownDiscoveryScore >= 0 && first.unknownDiscoveryScore <= 100, String(first.unknownDiscoveryScore));
  const deterministic = validateUnknownDiscoveryDeterministicScoring(first, second);
  assert('04. deterministic output', deterministic.passed, deterministic.detail);

  const blindSpots = validateBlindSpotDetection(first.findings);
  assert('05. blind spot detection', blindSpots.passed, blindSpots.detail);
  assert('06. findings surfaced', first.findingCount > 0, String(first.findingCount));

  const contradictions = validateContradictionDetection(first.findings);
  assert('07. contradiction detection', contradictions.passed, contradictions.detail);

  const coverage = validateCoverageGapDetection(first.findings);
  assert('08. coverage gap detection', coverage.passed, coverage.detail);

  const classification = validateUnknownDiscoveryClassification(first.findings);
  assert('09. finding classification', classification.passed, classification.detail);

  const recommendedTests = validateRecommendedTestGeneration(first);
  assert('10. recommended test generation', recommendedTests.passed, recommendedTests.detail);

  const blocking = validateUnknownDiscoveryLaunchBlocking(first);
  assert('11. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateUnknownDiscoveryRecommendationGeneration(first);
  assert('12. recommendation generation', recommendations.passed, recommendations.detail);

  assert(
    '13. critical findings surfaced',
    first.criticalFindingCount > 0 || first.highFindingCount > 0,
    `critical=${first.criticalFindingCount}; high=${first.highFindingCount}`,
  );

  const markdown = buildUnknownDiscoveryReportMarkdown(first, input.generatedAt);
  assert('14. report generation', markdown.includes(`# ${UNKNOWN_DISCOVERY_REPORT_TITLE}`), 'title');
  assert(
    '15. report sections',
    markdown.includes('## Unknown Discovery Summary') &&
      markdown.includes('## Recommended New Tests') &&
      markdown.includes('## Unknown Discovery Verdict'),
    'sections',
  );

  resetUnknownDiscoveryHistoryForTests();
  assessUnknownDiscoveryAuthority(input);
  assessUnknownDiscoveryAuthority(input);
  assert('16. bounded history', getUnknownDiscoveryHistorySize() <= MAX_UNKNOWN_HISTORY, String(getUnknownDiscoveryHistorySize()));
  assert('17. stable cache key prefix', first.cacheKey.startsWith('unknown-discovery-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('18. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '19. unknown discovery authority registered',
    authorities.some((entry) => entry.authorityId === 'unknown-discovery-authority'),
    'unknown-discovery-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/unknown-discovery-authority/unknown-discovery-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('20. founder test integration', reportBuilder.includes('buildUnknownDiscoveryAuthorityArtifacts'), 'report builder');
  assert('21. founder test report section', reportBuilder.includes('## Unknown Discovery Authority'), 'markdown section');
  assert('22. founder ui panel', appJs.includes('Unknown Discovery Authority'), 'app.js');
  assert('23. npm script', Boolean(pkg.scripts?.['validate:unknown-discovery-authority']), 'package script');
  assert('24. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('25. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('26. v4 report includes unknown discovery', Boolean(v4.unknownDiscoveryAuthority), 'assembled report');

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

  console.log(UNKNOWN_DISCOVERY_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:unknown-discovery-authority');
}

main();
