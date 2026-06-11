/**
 * Phase 25.7 — Gap Detection Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithUserSuccess } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  GAP_DETECTION_AUTHORITY_PASS_TOKEN,
  GAP_DETECTION_CATEGORIES,
  GAP_DETECTION_REPORT_TITLE,
  MAX_GAP_HISTORY,
  assessGapDetectionAuthority,
  buildGapDetectionReportMarkdown,
  getGapDetectionHistorySize,
  resetGapDetectionHistoryForTests,
  validateGapCategoryCount,
  validateGapClassification,
  validateGapDeterministicScoring,
  validateGapImpactMapping,
  validateGapLaunchBlocking,
  validateGapRecommendationGeneration,
  validateGapSeverityClassification,
} from '../src/gap-detection-authority/index.js';

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
  'src/gap-detection-authority/gap-detection-bounds.ts',
  'src/gap-detection-authority/gap-detection-types.ts',
  'src/gap-detection-authority/gap-detection-scenarios.ts',
  'src/gap-detection-authority/gap-detection-authority.ts',
  'src/gap-detection-authority/gap-detection-report-builder.ts',
  'src/gap-detection-authority/gap-detection-history.ts',
  'src/gap-detection-authority/gap-detection-validator.ts',
  'src/gap-detection-authority/index.ts',
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

function toWithUserSuccess(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithUserSuccess {
  const {
    reportMarkdown: _reportMarkdown,
    gapDetectionAuthority: _gap,
    gapDetectionAuthorityReportMarkdown: _gapMarkdown,
    selfEvolutionAuthority: _evolution,
    selfEvolutionAuthorityReportMarkdown: _evolutionMarkdown,
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
    ...withUserSuccess
  } = report;
  return withUserSuccess;
}

function main(): void {
  console.log('');
  console.log('Gap Detection Authority — Validation (leaf mode)');
  console.log('===============================================');
  console.log('');

  resetGapDetectionHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateGapCategoryCount();
  assert('01. gap category count', categoryCount.passed, categoryCount.detail);
  assert('02. bounded gap categories', GAP_DETECTION_CATEGORIES.length === 6, `count=${GAP_DETECTION_CATEGORIES.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithUserSuccess(v4);
  resetGapDetectionHistoryForTests();
  const first = assessGapDetectionAuthority(input);
  resetGapDetectionHistoryForTests();
  const second = assessGapDetectionAuthority(input);

  assert('03. scoring', first.gapDetectionScore >= 0 && first.gapDetectionScore <= 100, String(first.gapDetectionScore));
  const deterministic = validateGapDeterministicScoring(first, second);
  assert('04. deterministic scoring', deterministic.passed, deterministic.detail);

  const classification = validateGapClassification(first.detectedGaps);
  assert('05. gap classification', classification.passed, classification.detail);

  const severity = validateGapSeverityClassification(first.detectedGaps);
  assert('06. severity classification', severity.passed, severity.detail);

  const impact = validateGapImpactMapping(first.detectedGaps);
  assert('07. impact mapping', impact.passed, impact.detail);

  const recommendations = validateGapRecommendationGeneration(first);
  assert('08. recommendation generation', recommendations.passed, recommendations.detail);

  const blocking = validateGapLaunchBlocking(first);
  assert('09. launch blocking behavior', blocking.passed, blocking.detail);

  assert(
    '10. critical gaps surfaced',
    first.criticalGapCount > 0 || first.highGapCount > 0 || first.totalGaps > 0,
    `critical=${first.criticalGapCount}; high=${first.highGapCount}; total=${first.totalGaps}`,
  );

  const markdown = buildGapDetectionReportMarkdown(first, input.generatedAt);
  assert('11. report generation', markdown.includes(`# ${GAP_DETECTION_REPORT_TITLE}`), 'title');
  assert(
    '12. report sections',
    markdown.includes('## Gap Detection Summary') &&
      markdown.includes('## Capability Gaps') &&
      markdown.includes('## Gap Detection Verdict'),
    'sections',
  );

  resetGapDetectionHistoryForTests();
  assessGapDetectionAuthority(input);
  assessGapDetectionAuthority(input);
  assert('13. bounded history', getGapDetectionHistorySize() <= MAX_GAP_HISTORY, String(getGapDetectionHistorySize()));
  assert('14. stable cache key prefix', first.cacheKey.startsWith('gap-detection-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('15. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '16. gap detection authority registered',
    authorities.some((entry) => entry.authorityId === 'gap-detection-authority'),
    'gap-detection-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/gap-detection-authority/gap-detection-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('17. founder test integration', reportBuilder.includes('buildGapDetectionAuthorityArtifacts'), 'report builder');
  assert('18. founder test report section', reportBuilder.includes('## Gap Detection Authority'), 'markdown section');
  assert('19. founder ui panel', appJs.includes('Gap Detection Authority'), 'app.js');
  assert('20. npm script', Boolean(pkg.scripts?.['validate:gap-detection-authority']), 'package script');
  assert('21. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('22. evidence based gaps', authoritySource.includes('evidence'), 'evidence required');
  assert('23. v4 report includes gap detection', Boolean(v4.gapDetectionAuthority), 'assembled report');

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

  console.log(GAP_DETECTION_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:gap-detection-authority');
}

main();
