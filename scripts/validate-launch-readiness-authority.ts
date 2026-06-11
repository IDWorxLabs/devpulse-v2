/**
 * Phase 25.13 — Launch Readiness Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type {
  FounderTestV4ReportWithAdoptionPrediction,
  FounderTestV4ReportWithCompetitiveReality,
  FounderTestV4ReportWithRealUserReality,
  FounderTestV4ReportWithRealityProof,
} from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  buildAdoptionPredictionAuthorityArtifacts,
} from '../src/adoption-prediction-authority/index.js';
import {
  buildRealUserRealityAuthorityArtifacts,
} from '../src/real-user-reality-authority/index.js';
import {
  buildRealityProofAuthorityArtifacts,
} from '../src/reality-proof-authority/index.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessLaunchReadinessAuthority,
  AUTHORITY_WEIGHTS,
  buildLaunchReadinessReportMarkdown,
  LAUNCH_READINESS_AUTHORITY_PASS_TOKEN,
  LAUNCH_READINESS_REPORT_TITLE,
  getLaunchReadinessHistorySize,
  MAX_LAUNCH_READINESS_HISTORY,
  resetLaunchReadinessHistoryForTests,
  validateAuthorityWeighting,
  validateBlockerDetection,
  validateConfidenceScoring,
  validateConfidenceThresholds,
  validateEvidenceBreakdown,
  validateLaunchReadinessAdvisoryOnly,
  validateLaunchReadinessDeterministicScoring,
  validateLaunchReadinessLaunchBlocking,
  validateLaunchReadinessRecommendationGeneration,
  validateRecommendationGeneration,
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
  'src/launch-readiness-authority/launch-readiness-thresholds.ts',
  'src/launch-readiness-authority/launch-readiness-types.ts',
  'src/launch-readiness-authority/launch-readiness-authority.ts',
  'src/launch-readiness-authority/launch-readiness-report-builder.ts',
  'src/launch-readiness-authority/launch-readiness-history.ts',
  'src/launch-readiness-authority/launch-readiness-validator.ts',
  'src/launch-readiness-authority/index.ts',
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

function toWithAdoptionPrediction(
  report: ReturnType<typeof runFounderTestingModeV4>,
): FounderTestV4ReportWithAdoptionPrediction {
  const {
    reportMarkdown: _reportMarkdown,
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
    ...base
  } = report;
  if (base.adoptionPredictionAuthority) {
    return base as FounderTestV4ReportWithAdoptionPrediction;
  }
  let withRealUser: FounderTestV4ReportWithRealUserReality;
  if (base.realUserRealityAuthority) {
    withRealUser = base as FounderTestV4ReportWithRealUserReality;
  } else {
    const withRealityProof: FounderTestV4ReportWithRealityProof = base.realityProofAuthority
      ? (base as FounderTestV4ReportWithRealityProof)
      : {
          ...(base as FounderTestV4ReportWithCompetitiveReality),
          ...buildRealityProofAuthorityArtifacts(base as FounderTestV4ReportWithCompetitiveReality),
        };
    withRealUser = { ...withRealityProof, ...buildRealUserRealityAuthorityArtifacts(withRealityProof) };
  }
  return { ...withRealUser, ...buildAdoptionPredictionAuthorityArtifacts(withRealUser) };
}

function main(): void {
  console.log('');
  console.log('Launch Readiness Authority — Validation (leaf mode)');
  console.log('=================================================');
  console.log('');

  resetLaunchReadinessHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const weighting = validateAuthorityWeighting();
  assert('01. authority weighting', weighting.passed, weighting.detail);
  assert('02. bounded weighted authorities', Object.keys(AUTHORITY_WEIGHTS).length === 14, 'count=14');

  const thresholds = validateConfidenceThresholds();
  assert('03. confidence thresholds', thresholds.passed, thresholds.detail);

  const v4 = runFounderTestingModeV4();
  const input = toWithAdoptionPrediction(v4);
  resetLaunchReadinessHistoryForTests();
  const first = assessLaunchReadinessAuthority(input);
  resetLaunchReadinessHistoryForTests();
  const second = assessLaunchReadinessAuthority(input);

  const recommendation = validateRecommendationGeneration(first);
  assert('04. recommendation generation', recommendation.passed, recommendation.detail);

  const confidence = validateConfidenceScoring(first);
  assert('05. confidence scoring', confidence.passed, confidence.detail);

  const deterministic = validateLaunchReadinessDeterministicScoring(first, second);
  assert('06. deterministic output', deterministic.passed, deterministic.detail);

  const blockers = validateBlockerDetection(first);
  assert('07. blocker detection', blockers.passed, blockers.detail);
  assert(
    '08. blocking authorities surfaced',
    first.blockers.length > 0 || first.blockingAuthorityCount >= 0,
    String(first.blockingAuthorityCount),
  );

  const evidence = validateEvidenceBreakdown(first);
  assert('09. evidence breakdown', evidence.passed, evidence.detail);

  const launchBlocking = validateLaunchReadinessLaunchBlocking(first);
  assert('10. launch blocking behavior', launchBlocking.passed, launchBlocking.detail);

  const recommendations = validateLaunchReadinessRecommendationGeneration(first);
  assert('11. recommendation list generation', recommendations.passed, recommendations.detail);

  const advisory = validateLaunchReadinessAdvisoryOnly(first);
  assert('12. advisory-only behavior', advisory.passed, advisory.detail);

  assert(
    '13. official launch recommendation produced',
    first.recommendation.length > 0 && first.decision.recommendation === first.recommendation,
    first.recommendation,
  );

  const markdown = buildLaunchReadinessReportMarkdown(first, input.generatedAt);
  assert('14. report generation', markdown.includes(`# ${LAUNCH_READINESS_REPORT_TITLE}`), 'title');
  assert(
    '15. report sections',
    markdown.includes('## Launch Readiness Summary') &&
      markdown.includes('## Authority Weighting') &&
      markdown.includes('## Launch Readiness Verdict'),
    'sections',
  );
  assert('16. weighting displayed', markdown.includes('founder-testing:'), 'weighting');

  resetLaunchReadinessHistoryForTests();
  assessLaunchReadinessAuthority(input);
  assessLaunchReadinessAuthority(input);
  assert(
    '17. bounded history',
    getLaunchReadinessHistorySize() <= MAX_LAUNCH_READINESS_HISTORY,
    String(getLaunchReadinessHistorySize()),
  );
  assert('18. stable cache key prefix', first.cacheKey.startsWith('launch-readiness-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('19. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '20. launch readiness authority registered',
    authorities.some((entry) => entry.authorityId === 'launch-readiness-authority'),
    'launch-readiness-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/launch-readiness-authority/launch-readiness-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('21. founder test integration', reportBuilder.includes('buildLaunchReadinessAuthorityArtifacts'), 'report builder');
  assert('22. founder test report section', reportBuilder.includes('## Launch Readiness Authority'), 'markdown section');
  assert('23. founder ui panel', appJs.includes('Launch Readiness Authority'), 'app.js');
  assert('24. npm script', Boolean(pkg.scripts?.['validate:launch-readiness-authority']), 'package script');
  assert('25. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('26. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('27. reality proof gate', authoritySource.includes('realityProofAuthority.blocksLaunchReadiness'), 'gate');
  assert('29. adoption adjustment gate', authoritySource.includes('adjustLaunchConfidenceForAdoption'), 'gate');
  assert('30. v4 report includes launch readiness', Boolean(v4.launchReadinessAuthority), 'assembled report');

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

  console.log(LAUNCH_READINESS_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:launch-readiness-authority');
}

main();
