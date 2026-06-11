/**
 * Phase 25.15 — Real User Reality Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithAdoptionPrediction, FounderTestV4ReportWithRealityProof } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  buildAdoptionPredictionAuthorityArtifacts,
} from '../src/adoption-prediction-authority/index.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessLaunchReadinessAuthority,
  resetLaunchReadinessHistoryForTests,
} from '../src/launch-readiness-authority/index.js';
import {
  assessRealUserRealityAuthority,
  buildRealUserRealityReportMarkdown,
  getRealUserRealityHistorySize,
  MAX_REAL_USER_HISTORY,
  REAL_USER_REALITY_AUTHORITY_PASS_TOKEN,
  REAL_USER_REALITY_REPORT_TITLE,
  resetRealUserRealityHistoryForTests,
  validateConfusionScoring,
  validateEvidenceClassification,
  validateFounderEvidenceSeparation,
  validateNoRealUserDetection,
  validateRealUserAdvisoryOnly,
  validateRealUserCategoryCount,
  validateRealUserDeterministicScoring,
  validateRealUserLaunchBlocking,
  validateRealUserRecommendationGeneration,
  validateRetentionScoring,
} from '../src/real-user-reality-authority/index.js';

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
  'src/real-user-reality-authority/real-user-reality-bounds.ts',
  'src/real-user-reality-authority/real-user-reality-types.ts',
  'src/real-user-reality-authority/real-user-reality-scenarios.ts',
  'src/real-user-reality-authority/real-user-reality-authority.ts',
  'src/real-user-reality-authority/real-user-reality-report-builder.ts',
  'src/real-user-reality-authority/real-user-reality-history.ts',
  'src/real-user-reality-authority/real-user-reality-validator.ts',
  'src/real-user-reality-authority/index.ts',
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

function toWithRealityProof(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithRealityProof {
  const {
    reportMarkdown: _reportMarkdown,
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
    ...withRealityProof
  } = report;
  return withRealityProof;
}

function main(): void {
  console.log('');
  console.log('Real User Reality Authority — Validation (leaf mode)');
  console.log('=================================================');
  console.log('');

  resetRealUserRealityHistoryForTests();
  resetLaunchReadinessHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateRealUserCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);

  const v4 = runFounderTestingModeV4();
  const input = toWithRealityProof(v4);
  resetRealUserRealityHistoryForTests();
  const first = assessRealUserRealityAuthority(input);
  resetRealUserRealityHistoryForTests();
  const second = assessRealUserRealityAuthority(input);

  assert(
    '02. scoring',
    first.realUserRealityScore >= 0 &&
      first.realUserRealityScore <= 100 &&
      first.userEvidenceScore >= 0 &&
      first.userSuccessScore >= 0,
    String(first.realUserRealityScore),
  );

  const deterministic = validateRealUserDeterministicScoring(first, second);
  assert('03. deterministic output', deterministic.passed, deterministic.detail);

  const classification = validateEvidenceClassification(first);
  assert('04. evidence classification', classification.passed, classification.detail);

  const noRealUser = validateNoRealUserDetection(first);
  assert('05. no-real-user detection', noRealUser.passed, noRealUser.detail);
  assert('06. NO_REAL_USER_EVIDENCE surfaced', first.noRealUserEvidence, String(first.realUserEvidenceCount));

  const separation = validateFounderEvidenceSeparation(first);
  assert('07. founder evidence separation', separation.passed, separation.detail);
  assert('08. founder evidence present', first.founderOnlyEvidenceCount > 0, String(first.founderOnlyEvidenceCount));

  const retention = validateRetentionScoring(first);
  assert('09. retention scoring', retention.passed, retention.detail);

  const confusion = validateConfusionScoring(first);
  assert('10. confusion scoring', confusion.passed, confusion.detail);

  const blocking = validateRealUserLaunchBlocking(first);
  assert('11. launch blocking behavior', blocking.passed, blocking.detail);

  const recommendations = validateRealUserRecommendationGeneration(first);
  assert('12. recommendation generation', recommendations.passed, recommendations.detail);

  const advisory = validateRealUserAdvisoryOnly(first);
  assert('13. advisory-only behavior', advisory.passed, advisory.detail);

  const markdown = buildRealUserRealityReportMarkdown(first, input.generatedAt);
  assert('14. report generation', markdown.includes(`# ${REAL_USER_REALITY_REPORT_TITLE}`), 'title');
  assert(
    '15. report sections',
    markdown.includes('## Real User Reality Summary') &&
      markdown.includes('## Missing User Evidence') &&
      markdown.includes('## Real User Reality Verdict'),
    'sections',
  );

  resetRealUserRealityHistoryForTests();
  assessRealUserRealityAuthority(input);
  assessRealUserRealityAuthority(input);
  assert(
    '16. bounded history',
    getRealUserRealityHistorySize() <= MAX_REAL_USER_HISTORY,
    String(getRealUserRealityHistorySize()),
  );
  assert('17. stable cache key prefix', first.cacheKey.startsWith('real-user-reality-authority-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('18. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '19. real user reality authority registered',
    authorities.some((entry) => entry.authorityId === 'real-user-reality-authority'),
    'real-user-reality-authority',
  );

  const withRealUser = { ...input, realUserRealityAuthority: first, realUserRealityAuthorityReportMarkdown: markdown };
  const withAdoption: FounderTestV4ReportWithAdoptionPrediction = {
    ...withRealUser,
    ...buildAdoptionPredictionAuthorityArtifacts(withRealUser),
  };
  resetLaunchReadinessHistoryForTests();
  const launchReadiness = assessLaunchReadinessAuthority(withAdoption);
  assert(
    '20. launch readiness integration',
    launchReadiness.recommendation !== 'READY_FOR_PUBLIC_LAUNCH' || first.realUserEvidenceCount > 0,
    `${launchReadiness.recommendation}; realUsers=${first.realUserEvidenceCount}`,
  );
  assert(
    '21. public launch capped without real users',
    first.noRealUserEvidence
      ? launchReadiness.recommendation !== 'READY_FOR_PUBLIC_LAUNCH' &&
          launchReadiness.recommendation !== 'READY_FOR_PUBLIC_BETA'
      : true,
    launchReadiness.recommendation,
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const launchReadinessSource = readFileSync(join(ROOT, 'src/launch-readiness-authority/launch-readiness-authority.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/real-user-reality-authority/real-user-reality-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('22. founder test integration', reportBuilder.includes('buildRealUserRealityAuthorityArtifacts'), 'report builder');
  assert('23. founder test report section', reportBuilder.includes('## Real User Reality Authority'), 'markdown section');
  assert('24. founder ui panel', appJs.includes('Real User Reality Authority'), 'app.js');
  assert(
    '25. launch readiness real user gate',
    launchReadinessSource.includes('realUserRealityAuthority.realUserEvidenceCount'),
    'gate',
  );
  assert('26. npm script', Boolean(pkg.scripts?.['validate:real-user-reality-authority']), 'package script');
  assert('27. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('28. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('29. v4 report includes real user reality', Boolean(v4.realUserRealityAuthority), 'assembled report');

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

  console.log(REAL_USER_REALITY_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:real-user-reality-authority');
}

main();
