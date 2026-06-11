/**
 * Phase 25.12 — Competitive Reality Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithCustomerValue } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assessCompetitiveRealityAuthority,
  buildCompetitiveRealityReportMarkdown,
  COMPETITIVE_REALITY_AUTHORITY_PASS_TOKEN,
  COMPETITIVE_REALITY_COMPARISONS,
  COMPETITIVE_REALITY_REPORT_TITLE,
  getCompetitiveRealityHistorySize,
  MAX_COMPETITIVE_HISTORY,
  resetCompetitiveRealityHistoryForTests,
  validateCompetitiveAdvisoryOnly,
  validateCompetitiveCategoryCount,
  validateCompetitiveClassification,
  validateCompetitiveDeterministicScoring,
  validateCompetitiveLaunchBlocking,
  validateCompetitiveRecommendationGeneration,
  validateCompetitiveRiskDetection,
  validateDifferentiationEvaluation,
  validateUniqueAdvantageDetection,
} from '../src/competitive-reality-authority/index.js';
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
  'src/competitive-reality-authority/competitive-reality-bounds.ts',
  'src/competitive-reality-authority/competitive-reality-types.ts',
  'src/competitive-reality-authority/competitive-reality-scenarios.ts',
  'src/competitive-reality-authority/competitive-reality-authority.ts',
  'src/competitive-reality-authority/competitive-reality-report-builder.ts',
  'src/competitive-reality-authority/competitive-reality-history.ts',
  'src/competitive-reality-authority/competitive-reality-validator.ts',
  'src/competitive-reality-authority/index.ts',
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

function toWithCustomerValue(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithCustomerValue {
  const {
    reportMarkdown: _reportMarkdown,
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
    ...withCustomerValue
  } = report;
  return withCustomerValue;
}

function main(): void {
  console.log('');
  console.log('Competitive Reality Authority — Validation (leaf mode)');
  console.log('====================================================');
  console.log('');

  resetCompetitiveRealityHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateCompetitiveCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);
  assert('02. bounded categories', COMPETITIVE_REALITY_COMPARISONS.length === 5, `count=${COMPETITIVE_REALITY_COMPARISONS.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithCustomerValue(v4);
  resetCompetitiveRealityHistoryForTests();
  const first = assessCompetitiveRealityAuthority(input);
  resetCompetitiveRealityHistoryForTests();
  const second = assessCompetitiveRealityAuthority(input);

  assert(
    '03. scoring',
    first.competitiveRealityScore >= 0 &&
      first.competitiveRealityScore <= 100 &&
      first.differentiationScore >= 0 &&
      first.differentiationScore <= 100 &&
      first.competitiveRiskScore >= 0 &&
      first.competitiveRiskScore <= 100,
    `${first.competitiveRealityScore}/${first.differentiationScore}/${first.competitiveRiskScore}`,
  );

  const deterministic = validateCompetitiveDeterministicScoring(first, second);
  assert('04. deterministic output', deterministic.passed, deterministic.detail);

  const differentiation = validateDifferentiationEvaluation(first.findings);
  assert('05. differentiation evaluation', differentiation.passed, differentiation.detail);

  const competitiveRisk = validateCompetitiveRiskDetection(first);
  assert('06. competitive risk detection', competitiveRisk.passed, competitiveRisk.detail);

  const uniqueAdvantages = validateUniqueAdvantageDetection(first);
  assert('07. unique advantage detection', uniqueAdvantages.passed, uniqueAdvantages.detail);
  assert(
    '08. unique advantages surfaced',
    first.uniqueAdvantages.length > 0 || first.uniqueAdvantageCount > 0,
    String(first.uniqueAdvantageCount),
  );

  const classification = validateCompetitiveClassification(first.findings);
  assert('09. scenario classification', classification.passed, classification.detail);

  const blocking = validateCompetitiveLaunchBlocking(first);
  assert('10. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateCompetitiveRecommendationGeneration(first);
  assert('11. recommendation generation', recommendations.passed, recommendations.detail);

  const advisory = validateCompetitiveAdvisoryOnly(first);
  assert('12. advisory-only behavior', advisory.passed, advisory.detail);

  const markdown = buildCompetitiveRealityReportMarkdown(first, input.generatedAt);
  assert('13. report generation', markdown.includes(`# ${COMPETITIVE_REALITY_REPORT_TITLE}`), 'title');
  assert(
    '14. report sections',
    markdown.includes('## Competitive Reality Summary') &&
      markdown.includes('## General AI Comparison') &&
      markdown.includes('## Competitive Reality Verdict'),
    'sections',
  );

  resetCompetitiveRealityHistoryForTests();
  assessCompetitiveRealityAuthority(input);
  assessCompetitiveRealityAuthority(input);
  assert(
    '15. bounded history',
    getCompetitiveRealityHistorySize() <= MAX_COMPETITIVE_HISTORY,
    String(getCompetitiveRealityHistorySize()),
  );
  assert('16. stable cache key prefix', first.cacheKey.startsWith('competitive-reality-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('17. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '18. competitive reality authority registered',
    authorities.some((entry) => entry.authorityId === 'competitive-reality-authority'),
    'competitive-reality-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/competitive-reality-authority/competitive-reality-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('19. founder test integration', reportBuilder.includes('buildCompetitiveRealityAuthorityArtifacts'), 'report builder');
  assert('20. founder test report section', reportBuilder.includes('## Competitive Reality Authority'), 'markdown section');
  assert('21. founder ui panel', appJs.includes('Competitive Reality Authority'), 'app.js');
  assert('22. npm script', Boolean(pkg.scripts?.['validate:competitive-reality-authority']), 'package script');
  assert('23. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('24. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('25. v4 report includes competitive reality', Boolean(v4.competitiveRealityAuthority), 'assembled report');

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

  console.log(COMPETITIVE_REALITY_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:competitive-reality-authority');
}

main();
