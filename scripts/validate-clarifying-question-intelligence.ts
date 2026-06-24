/**
 * Phase 25.20 — Clarifying Question Intelligence validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithUiReviewer } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessClarifyingQuestionIntelligence,
  buildClarifyingQuestionIntelligenceArtifacts,
  buildClarifyingQuestionReportMarkdown,
  CLARIFYING_QUESTION_INTELLIGENCE_PASS_TOKEN,
  CLARIFYING_QUESTION_REPORT_TITLE,
  getClarifyingQuestionHistorySize,
  MAX_CLARIFYING_HISTORY,
  resetClarifyingQuestionHistoryForTests,
  validateCategoryDetection,
  validateClarifyingAdvisoryOnly,
  validateClarifyingDeterministicScoring,
  validateClarifyingReportGeneration,
  validateCompletenessScoring,
  validateCriticalBlocksClarification,
  validateCriticalRequirementDetection,
  validateMissingRequirementDetection,
  validatePriorityClassification,
  validateQuestionGeneration,
  validateRequirementCategoryCount,
} from '../src/clarifying-question-intelligence/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 300_000;

const REQUIRED_FILES = [
  'src/clarifying-question-intelligence/clarifying-question-bounds.ts',
  'src/clarifying-question-intelligence/clarifying-question-types.ts',
  'src/clarifying-question-intelligence/clarifying-question-categories.ts',
  'src/clarifying-question-intelligence/clarifying-question-authority.ts',
  'src/clarifying-question-intelligence/clarifying-question-history.ts',
  'src/clarifying-question-intelligence/clarifying-question-report-builder.ts',
  'src/clarifying-question-intelligence/clarifying-question-validator.ts',
  'src/clarifying-question-intelligence/index.ts',
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

function toWithUiReviewer(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithUiReviewer {
  const {
    reportMarkdown: _reportMarkdown,
    clarifyingQuestionIntelligence: _clarifying,
    clarifyingQuestionIntelligenceReportMarkdown: _clarifyingMarkdown,
    launchCouncil: _launchCouncil,
    launchCouncilReport: _launchCouncilReport,
    launchCouncilReportMarkdown: _launchCouncilMarkdown,
    launchCouncilFinalization: _finalization,
    launchCouncilFinalizationReportMarkdown: _finalizationMarkdown,
    launchVerdictGovernance: _governance,
    launchVerdictGovernanceReportMarkdown: _governanceMarkdown,
    ...withUiReviewer
  } = report;
  return withUiReviewer;
}

function main(): void {
  console.log('');
  console.log('Clarifying Question Intelligence — Validation (leaf mode)');
  console.log('=======================================================');
  console.log('');

  resetClarifyingQuestionHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const categoryCount = validateRequirementCategoryCount();
  assert('01. category count', categoryCount.passed, categoryCount.detail);

  const authorities = listLaunchCouncilAuthorities();
  assert('02. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '03. clarifying question registered',
    authorities.some((entry) => entry.authorityId === 'clarifying-question-intelligence'),
    'clarifying-question-intelligence',
  );
  assert('04. registry count 28', authorities.length === 28, String(authorities.length));

  const v4 = runFounderTestingModeV4();
  const input = toWithUiReviewer(v4);
  resetClarifyingQuestionHistoryForTests();
  const first = assessClarifyingQuestionIntelligence(input);
  resetClarifyingQuestionHistoryForTests();
  const second = assessClarifyingQuestionIntelligence(input);

  assert('05. category detection', validateCategoryDetection(first).passed, validateCategoryDetection(first).detail);
  assert(
    '06. missing requirement detection',
    validateMissingRequirementDetection(first).passed,
    String(first.missingRequirementCount),
  );
  assert(
    '07. critical requirement detection',
    validateCriticalRequirementDetection(first).passed,
    String(first.criticalMissingRequirementCount),
  );
  assert('08. question generation', validateQuestionGeneration(first).passed, String(first.recommendedQuestions.length));
  assert(
    '09. priority classification',
    validatePriorityClassification(first).passed,
    validatePriorityClassification(first).detail,
  );
  assert('10. completeness scoring', validateCompletenessScoring(first).passed, validateCompletenessScoring(first).detail);
  assert(
    '11. critical blocks clarification',
    validateCriticalBlocksClarification(first).passed,
    String(first.clarificationRequired),
  );
  assert(
    '12. deterministic output',
    validateClarifyingDeterministicScoring(first, second).passed,
    first.cacheKey,
  );
  assert('13. advisory only', validateClarifyingAdvisoryOnly(first).passed, String(first.advisoryOnly));

  const markdown = buildClarifyingQuestionReportMarkdown(first);
  assert(
    '14. report generation',
    validateClarifyingReportGeneration(markdown).passed,
    CLARIFYING_QUESTION_REPORT_TITLE,
  );

  resetClarifyingQuestionHistoryForTests();
  assessClarifyingQuestionIntelligence(input);
  assessClarifyingQuestionIntelligence(input);
  assert(
    '15. bounded history',
    getClarifyingQuestionHistorySize() <= MAX_CLARIFYING_HISTORY,
    String(getClarifyingQuestionHistorySize()),
  );
  assert(
    '16. stable cache key prefix',
    first.cacheKey.startsWith('clarifying-question-intelligence-v1:'),
    first.cacheKey,
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const v5ReportBuilder = readFileSync(
    join(ROOT, 'src/founder-testing-mode/founder-testing-v5-report-builder.ts'),
    'utf8',
  );
  const councilIntegration = readFileSync(
    join(ROOT, 'src/launch-council/launch-council-founder-integration.ts'),
    'utf8',
  );
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(
    join(ROOT, 'src/clarifying-question-intelligence/clarifying-question-authority.ts'),
    'utf8',
  );
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert(
    '17. founder test integration',
    reportBuilder.includes('buildClarifyingQuestionIntelligenceArtifacts'),
    'report builder',
  );
  assert(
    '18. founder test report section',
    reportBuilder.includes('## Clarifying Question Intelligence'),
    'markdown section',
  );
  assert(
    '19. launch council mapper',
    councilIntegration.includes('mapClarifyingQuestionIntelligence'),
    'council integration',
  );
  assert('20. founder ui panel', appJs.includes('Clarifying Question Intelligence'), 'app.js');
  assert(
    '21. npm script',
    Boolean(pkg.scripts?.['validate:clarifying-question-intelligence']),
    'package script',
  );
  assert('22. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('23. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('24. v4 report includes clarifying question', Boolean(v4.clarifyingQuestionIntelligence), 'assembled report');
  assert(
    '25. v5 report section',
    v5ReportBuilder.includes('## Clarifying Question Intelligence'),
    'v5 markdown section',
  );
  assert(
    '26. assumptions prevented bounded',
    first.assumptionsPrevented.length <= 16 && first.assumptionsPrevented.length > 0,
    String(first.assumptionsPrevented.length),
  );

  const artifacts = buildClarifyingQuestionIntelligenceArtifacts(input);
  assert(
    '27. artifact builder',
    artifacts.clarifyingQuestionIntelligence.requirementCompletenessScore === first.requirementCompletenessScore,
    String(artifacts.clarifyingQuestionIntelligence.requirementCompletenessScore),
  );
  assert(
    '28. council consumes clarifying evidence',
    v4.launchCouncil.authorityResults.some(
      (result) => result.authorityId === 'clarifying-question-intelligence',
    ),
    'launch council authority result',
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

  console.log(CLARIFYING_QUESTION_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:clarifying-question-intelligence');
}

main();
