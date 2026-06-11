/**
 * Phase 25.16 — Adoption Prediction Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithRealUserReality } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assessAdoptionPredictionAuthority,
  buildAdoptionPredictionReportMarkdown,
  getAdoptionPredictionHistorySize,
  MAX_ADOPTION_HISTORY,
  ADOPTION_PREDICTION_AUTHORITY_PASS_TOKEN,
  ADOPTION_PREDICTION_REPORT_TITLE,
  resetAdoptionPredictionHistoryForTests,
  validateAbandonmentPrediction,
  validateAdoptionAdvisoryOnly,
  validateAdoptionCategoryCount,
  validateAdoptionDeterministicScoring,
  validateAdoptionLaunchBlocking,
  validateAdoptionRecommendationGeneration,
  validateEvidenceConfidenceCalculation,
  validateLowConfidenceNotPresentedAsFact,
  validateRecommendationPrediction,
  validateRetentionPrediction,
} from '../src/adoption-prediction-authority/index.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessLaunchReadinessAuthority,
  resetLaunchReadinessHistoryForTests,
} from '../src/launch-readiness-authority/index.js';

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
  'src/adoption-prediction-authority/adoption-prediction-bounds.ts',
  'src/adoption-prediction-authority/adoption-prediction-types.ts',
  'src/adoption-prediction-authority/adoption-prediction-scenarios.ts',
  'src/adoption-prediction-authority/adoption-prediction-authority.ts',
  'src/adoption-prediction-authority/adoption-prediction-report-builder.ts',
  'src/adoption-prediction-authority/adoption-prediction-history.ts',
  'src/adoption-prediction-authority/adoption-prediction-validator.ts',
  'src/adoption-prediction-authority/index.ts',
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

function toWithRealUserReality(
  report: ReturnType<typeof runFounderTestingModeV4>,
): FounderTestV4ReportWithRealUserReality {
  const {
    reportMarkdown: _reportMarkdown,
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
    ...withRealUserReality
  } = report;
  return withRealUserReality;
}

function main(): void {
  console.log('');
  console.log('Adoption Prediction Authority — Validation (leaf mode)');
  console.log('===================================================');
  console.log('');

  resetAdoptionPredictionHistoryForTests();
  resetLaunchReadinessHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateAdoptionCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);

  const v4 = runFounderTestingModeV4();
  const input = toWithRealUserReality(v4);
  resetAdoptionPredictionHistoryForTests();
  const first = assessAdoptionPredictionAuthority(input);
  resetAdoptionPredictionHistoryForTests();
  const second = assessAdoptionPredictionAuthority(input);

  assert(
    '02. scoring',
    first.adoptionPredictionScore >= 0 &&
      first.adoptionPredictionScore <= 100 &&
      first.growthPotentialScore >= 0,
    String(first.adoptionPredictionScore),
  );

  const deterministic = validateAdoptionDeterministicScoring(first, second);
  assert('03. deterministic output', deterministic.passed, deterministic.detail);

  const retention = validateRetentionPrediction(first);
  assert('04. retention prediction', retention.passed, retention.detail);

  const recommendation = validateRecommendationPrediction(first);
  assert('05. recommendation prediction', recommendation.passed, recommendation.detail);

  const abandonment = validateAbandonmentPrediction(first);
  assert('06. abandonment prediction', abandonment.passed, abandonment.detail);

  const confidence = validateEvidenceConfidenceCalculation(first);
  assert('07. evidence confidence calculation', confidence.passed, confidence.detail);

  const lowConfidence = validateLowConfidenceNotPresentedAsFact(first);
  assert('08. low confidence not presented as fact', lowConfidence.passed, lowConfidence.detail);

  const blocking = validateAdoptionLaunchBlocking(first);
  assert('09. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateAdoptionRecommendationGeneration(first);
  assert('10. recommendation generation', recommendations.passed, recommendations.detail);

  const advisory = validateAdoptionAdvisoryOnly(first);
  assert('11. advisory-only behavior', advisory.passed, advisory.detail);

  const markdown = buildAdoptionPredictionReportMarkdown(first, input.generatedAt);
  assert('12. report generation', markdown.includes(`# ${ADOPTION_PREDICTION_REPORT_TITLE}`), 'title');
  assert(
    '13. report sections',
    markdown.includes('## Adoption Prediction Summary') &&
      markdown.includes('## Abandonment Risk') &&
      markdown.includes('## Adoption Prediction Verdict'),
    'sections',
  );

  resetAdoptionPredictionHistoryForTests();
  assessAdoptionPredictionAuthority(input);
  assessAdoptionPredictionAuthority(input);
  assert(
    '14. bounded history',
    getAdoptionPredictionHistorySize() <= MAX_ADOPTION_HISTORY,
    String(getAdoptionPredictionHistorySize()),
  );
  assert('15. stable cache key prefix', first.cacheKey.startsWith('adoption-prediction-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('16. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '17. adoption prediction authority registered',
    authorities.some((entry) => entry.authorityId === 'adoption-prediction-authority'),
    'adoption-prediction-authority',
  );

  const withAdoption = {
    ...input,
    adoptionPredictionAuthority: first,
    adoptionPredictionAuthorityReportMarkdown: markdown,
  };
  resetLaunchReadinessHistoryForTests();
  const launchReadiness = assessLaunchReadinessAuthority(withAdoption);
  assert(
    '18. launch readiness integration',
    launchReadiness.launchConfidenceScore <= 100,
    String(launchReadiness.launchConfidenceScore),
  );

  const launchReadinessSource = readFileSync(
    join(ROOT, 'src/launch-readiness-authority/launch-readiness-authority.ts'),
    'utf8',
  );
  assert(
    '19. launch readiness adoption adjustment',
    launchReadinessSource.includes('adjustLaunchConfidenceForAdoption'),
    'adjustment',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/adoption-prediction-authority/adoption-prediction-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('20. founder test integration', reportBuilder.includes('buildAdoptionPredictionAuthorityArtifacts'), 'report builder');
  assert('21. founder test report section', reportBuilder.includes('## Adoption Prediction Authority'), 'markdown section');
  assert('22. founder ui panel', appJs.includes('Adoption Prediction Authority'), 'app.js');
  assert('23. npm script', Boolean(pkg.scripts?.['validate:adoption-prediction-authority']), 'package script');
  assert('24. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('25. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('26. v4 report includes adoption prediction', Boolean(v4.adoptionPredictionAuthority), 'assembled report');

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

  console.log(ADOPTION_PREDICTION_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:adoption-prediction-authority');
}

main();
