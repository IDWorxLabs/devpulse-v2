/**
 * Phase 25.19 — UI Reviewer Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportForLaunchCouncil } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessUIReviewerAuthority,
  buildUIReviewerAuthorityArtifacts,
  buildUIReviewerReportMarkdown,
  getUIReviewerHistorySize,
  MAX_UI_REVIEWER_HISTORY,
  UI_REVIEWER_AUTHORITY_PASS_TOKEN,
  UI_REVIEWER_REPORT_TITLE,
  resetUIReviewerHistoryForTests,
  validateDiscoverabilityReview,
  validateHierarchyReview,
  validateMissingScreenDetection,
  validateNavigationReview,
  validateUIReviewerAdvisoryOnly,
  validateUIReviewerCategoryCount,
  validateUIReviewerDeterministicScoring,
  validateUIReviewerLaunchBlocking,
  validateUIReviewerReportGeneration,
  validateUIReviewerScoreCalculation,
  validateWorkflowReview,
} from '../src/ui-reviewer-authority/index.js';

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
  'src/ui-reviewer-authority/ui-reviewer-bounds.ts',
  'src/ui-reviewer-authority/ui-reviewer-types.ts',
  'src/ui-reviewer-authority/ui-reviewer-scenarios.ts',
  'src/ui-reviewer-authority/ui-reviewer-authority.ts',
  'src/ui-reviewer-authority/ui-reviewer-report-builder.ts',
  'src/ui-reviewer-authority/ui-reviewer-history.ts',
  'src/ui-reviewer-authority/ui-reviewer-validator.ts',
  'src/ui-reviewer-authority/index.ts',
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

function toForLaunchCouncil(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportForLaunchCouncil {
  const {
    reportMarkdown: _reportMarkdown,
    uiReviewerAuthority: _uiReviewer,
    uiReviewerAuthorityReportMarkdown: _uiReviewerMarkdown,
    clarifyingQuestionIntelligence: _clarifying,
    clarifyingQuestionIntelligenceReportMarkdown: _clarifyingMarkdown,
    launchCouncil: _launchCouncil,
    launchCouncilReport: _launchCouncilReport,
    launchCouncilReportMarkdown: _launchCouncilMarkdown,
    launchCouncilFinalization: _finalization,
    launchCouncilFinalizationReportMarkdown: _finalizationMarkdown,
    launchVerdictGovernance: _governance,
    launchVerdictGovernanceReportMarkdown: _governanceMarkdown,
    ...forLaunchCouncil
  } = report;
  return forLaunchCouncil;
}

function main(): void {
  console.log('');
  console.log('UI Reviewer Authority — Validation (leaf mode)');
  console.log('===========================================');
  console.log('');

  resetUIReviewerHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateUIReviewerCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);

  const authorities = listLaunchCouncilAuthorities();
  assert('02. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '03. ui reviewer registered',
    authorities.some((entry) => entry.authorityId === 'ui-reviewer-authority'),
    'ui-reviewer-authority',
  );
  assert('04. registry count 22', authorities.length === 22, String(authorities.length));

  const v4 = runFounderTestingModeV4();
  const input = toForLaunchCouncil(v4);
  resetUIReviewerHistoryForTests();
  const first = assessUIReviewerAuthority(input);
  resetUIReviewerHistoryForTests();
  const second = assessUIReviewerAuthority(input);

  assert('05. score calculation', validateUIReviewerScoreCalculation(first).passed, String(first.uiReviewScore));
  assert('06. navigation review', validateNavigationReview(first).passed, String(first.navigationScore));
  assert('07. discoverability review', validateDiscoverabilityReview(first).passed, String(first.discoverabilityScore));
  assert('08. hierarchy review', validateHierarchyReview(first).passed, String(first.hierarchyScore));
  assert('09. workflow review', validateWorkflowReview(first).passed, String(first.usabilityScore));
  assert('10. missing screen detection', validateMissingScreenDetection(first).passed, String(first.scenarioResults.length));
  assert('11. launch blocking', validateUIReviewerLaunchBlocking(first).passed, String(first.blocksLaunchReadiness));
  assert(
    '12. deterministic output',
    validateUIReviewerDeterministicScoring(first, second).passed,
    first.cacheKey,
  );
  assert('13. advisory only', validateUIReviewerAdvisoryOnly(first).passed, String(first.advisoryOnly));

  const markdown = buildUIReviewerReportMarkdown(first);
  assert('14. report generation', validateUIReviewerReportGeneration(markdown).passed, UI_REVIEWER_REPORT_TITLE);

  resetUIReviewerHistoryForTests();
  assessUIReviewerAuthority(input);
  assessUIReviewerAuthority(input);
  assert(
    '15. bounded history',
    getUIReviewerHistorySize() <= MAX_UI_REVIEWER_HISTORY,
    String(getUIReviewerHistorySize()),
  );
  assert('16. stable cache key prefix', first.cacheKey.startsWith('ui-reviewer-authority-v1:'), first.cacheKey);

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const councilIntegration = readFileSync(
    join(ROOT, 'src/launch-council/launch-council-founder-integration.ts'),
    'utf8',
  );
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/ui-reviewer-authority/ui-reviewer-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('17. founder test integration', reportBuilder.includes('buildUIReviewerAuthorityArtifacts'), 'report builder');
  assert('18. founder test report section', reportBuilder.includes('## UI Reviewer Authority'), 'markdown section');
  assert('19. launch council mapper', councilIntegration.includes('mapUiReviewerAuthority'), 'council integration');
  assert('20. founder ui panel', appJs.includes('UI Reviewer Authority'), 'app.js');
  assert('21. npm script', Boolean(pkg.scripts?.['validate:ui-reviewer-authority']), 'package script');
  assert('22. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('23. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('24. v4 report includes ui reviewer', Boolean(v4.uiReviewerAuthority), 'assembled report');
  assert(
    '25. consumes upstream authorities',
    first.scenarioResults.length === 6,
    String(first.scenarioResults.length),
  );

  const artifacts = buildUIReviewerAuthorityArtifacts(input);
  assert(
    '26. artifact builder',
    artifacts.uiReviewerAuthority.uiReviewScore === first.uiReviewScore,
    String(artifacts.uiReviewerAuthority.uiReviewScore),
  );

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

  console.log(UI_REVIEWER_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:ui-reviewer-authority');
}

main();
