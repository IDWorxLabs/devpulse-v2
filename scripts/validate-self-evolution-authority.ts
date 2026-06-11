/**
 * Phase 25.8 — Self-Evolution Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithGapDetection } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_EVOLUTION_HISTORY,
  SELF_EVOLUTION_AUTHORITY_PASS_TOKEN,
  SELF_EVOLUTION_PATTERNS,
  SELF_EVOLUTION_REPORT_TITLE,
  assessSelfEvolutionAuthority,
  buildSelfEvolutionReportMarkdown,
  getSelfEvolutionHistorySize,
  resetSelfEvolutionHistoryForTests,
  validateEvolutionClassification,
  validateMissingCapabilityMapping,
  validateRepeatedFailureDetection,
  validateSelfEvolutionAdvisoryOnly,
  validateSelfEvolutionCategoryCount,
  validateSelfEvolutionDeterministicScoring,
  validateSelfEvolutionLaunchBlocking,
  validateSelfEvolutionRecommendationGeneration,
} from '../src/self-evolution-authority/index.js';

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
  'src/self-evolution-authority/self-evolution-bounds.ts',
  'src/self-evolution-authority/self-evolution-types.ts',
  'src/self-evolution-authority/self-evolution-patterns.ts',
  'src/self-evolution-authority/self-evolution-authority.ts',
  'src/self-evolution-authority/self-evolution-report-builder.ts',
  'src/self-evolution-authority/self-evolution-history.ts',
  'src/self-evolution-authority/self-evolution-validator.ts',
  'src/self-evolution-authority/index.ts',
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

function toWithGapDetection(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithGapDetection {
  const {
    reportMarkdown: _reportMarkdown,
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
    ...withGapDetection
  } = report;
  return withGapDetection;
}

function main(): void {
  console.log('');
  console.log('Self-Evolution Authority — Validation (leaf mode)');
  console.log('==============================================');
  console.log('');

  resetSelfEvolutionHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateSelfEvolutionCategoryCount();
  assert('01. evolution category count', categoryCount.passed, categoryCount.detail);
  assert('02. bounded evolution categories', SELF_EVOLUTION_PATTERNS.length === 8, `count=${SELF_EVOLUTION_PATTERNS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithGapDetection(v4);
  resetSelfEvolutionHistoryForTests();
  const first = assessSelfEvolutionAuthority(input);
  resetSelfEvolutionHistoryForTests();
  const second = assessSelfEvolutionAuthority(input);

  assert('03. scoring', first.selfEvolutionScore >= 0 && first.selfEvolutionScore <= 100, String(first.selfEvolutionScore));
  const deterministic = validateSelfEvolutionDeterministicScoring(first, second);
  assert('04. deterministic scoring', deterministic.passed, deterministic.detail);

  const repeated = validateRepeatedFailureDetection(first.patterns);
  assert('05. repeated failure detection', repeated.passed, repeated.detail);
  assert('06. repeated failures surfaced', first.repeatedFailureCount > 0, String(first.repeatedFailureCount));

  const classification = validateEvolutionClassification(first.patterns);
  assert('07. evolution classification', classification.passed, classification.detail);

  const capability = validateMissingCapabilityMapping(first.patterns);
  assert('08. missing capability mapping', capability.passed, capability.detail);

  const recommendations = validateSelfEvolutionRecommendationGeneration(first);
  assert('09. recommendation generation', recommendations.passed, recommendations.detail);

  const blocking = validateSelfEvolutionLaunchBlocking(first);
  assert('10. launch blocking behavior', blocking.passed, blocking.detail);

  const advisory = validateSelfEvolutionAdvisoryOnly(first);
  assert('11. advisory-only behavior', advisory.passed, advisory.detail);

  assert(
    '12. required evolutions surfaced',
    first.evolutionRequiredCount > 0 || first.blockedEvolutionCount > 0 || first.requiredEvolutions.length > 0,
    `required=${first.evolutionRequiredCount}; blocked=${first.blockedEvolutionCount}`,
  );

  const markdown = buildSelfEvolutionReportMarkdown(first, input.generatedAt);
  assert('13. report generation', markdown.includes(`# ${SELF_EVOLUTION_REPORT_TITLE}`), 'title');
  assert(
    '14. report sections',
    markdown.includes('## Self-Evolution Summary') &&
      markdown.includes('## Repeated Failure Patterns') &&
      markdown.includes('## Self-Evolution Verdict'),
    'sections',
  );

  resetSelfEvolutionHistoryForTests();
  assessSelfEvolutionAuthority(input);
  assessSelfEvolutionAuthority(input);
  assert('15. bounded history', getSelfEvolutionHistorySize() <= MAX_EVOLUTION_HISTORY, String(getSelfEvolutionHistorySize()));
  assert('16. stable cache key prefix', first.cacheKey.startsWith('self-evolution-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('17. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '18. self-evolution authority registered',
    authorities.some((entry) => entry.authorityId === 'self-evolution-authority'),
    'self-evolution-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/self-evolution-authority/self-evolution-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('19. founder test integration', reportBuilder.includes('buildSelfEvolutionAuthorityArtifacts'), 'report builder');
  assert('20. founder test report section', reportBuilder.includes('## Self-Evolution Authority'), 'markdown section');
  assert('21. founder ui panel', appJs.includes('Self-Evolution Authority'), 'app.js');
  assert('22. npm script', Boolean(pkg.scripts?.['validate:self-evolution-authority']), 'package script');
  assert('23. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('24. no automatic fixes', !authoritySource.includes('writeFileSync') && !authoritySource.includes('automatic fix'), 'advisory only');
  assert('25. v4 report includes self evolution', Boolean(v4.selfEvolutionAuthority), 'assembled report');

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

  console.log(SELF_EVOLUTION_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:self-evolution-authority');
}

main();
