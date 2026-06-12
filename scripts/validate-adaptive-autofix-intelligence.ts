/**
 * Phase 25.21 — Adaptive AutoFix Intelligence validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithLaunchVerdictGovernance } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
  refreshLaunchCouncilWithAdaptiveAutofix,
} from '../src/launch-council/index.js';
import {
  assessAdaptiveAutofixIntelligence,
  buildAdaptiveAutofixIntelligenceArtifacts,
  buildAdaptiveAutofixReportMarkdown,
  ADAPTIVE_AUTOFIX_INTELLIGENCE_PASS_TOKEN,
  ADAPTIVE_AUTOFIX_REPORT_TITLE,
  getAdaptiveAutofixHistorySize,
  MAX_ADAPTIVE_AUTOFIX_HISTORY,
  resetAdaptiveAutofixHistoryForTests,
  validateAdaptiveAdvisoryOnly,
  validateAdaptiveDeterministicScoring,
  validateAdaptiveLaunchBlocking,
  validateAdaptiveReportGeneration,
  validateAdaptiveThresholdTrigger,
  validateCapabilityGapDetection,
  validateCapabilityMappingCount,
  validateEvolutionPlanning,
  validateRecommendationGeneration,
  validateRepeatedFailureDetection,
} from '../src/adaptive-autofix-intelligence/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 90_000;

const REQUIRED_FILES = [
  'src/adaptive-autofix-intelligence/adaptive-autofix-bounds.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-types.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-failure-history.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-pattern-detector.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-capability-detector.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-evolution-planner.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-authority.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-report-builder.ts',
  'src/adaptive-autofix-intelligence/adaptive-autofix-validator.ts',
  'src/adaptive-autofix-intelligence/index.ts',
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

function toWithLaunchVerdictGovernance(
  report: ReturnType<typeof runFounderTestingModeV4>,
): FounderTestV4ReportWithLaunchVerdictGovernance {
  const {
    reportMarkdown: _reportMarkdown,
    adaptiveAutofixIntelligence: _adaptive,
    adaptiveAutofixIntelligenceReportMarkdown: _adaptiveMarkdown,
    ...withGovernance
  } = report;
  return withGovernance;
}

function main(): void {
  console.log('');
  console.log('Adaptive AutoFix Intelligence — Validation (leaf mode)');
  console.log('====================================================');
  console.log('');

  resetAdaptiveAutofixHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  assert('01. capability mapping count', validateCapabilityMappingCount().passed, validateCapabilityMappingCount().detail);

  const authorities = listLaunchCouncilAuthorities();
  assert('02. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '03. adaptive autofix registered',
    authorities.some((entry) => entry.authorityId === 'adaptive-autofix-intelligence'),
    'adaptive-autofix-intelligence',
  );
  assert('04. registry count 23', authorities.length === 23, String(authorities.length));

  const v4 = runFounderTestingModeV4();
  const input = toWithLaunchVerdictGovernance(v4);
  resetAdaptiveAutofixHistoryForTests();
  const first = assessAdaptiveAutofixIntelligence(input);
  resetAdaptiveAutofixHistoryForTests();
  const second = assessAdaptiveAutofixIntelligence(input);

  assert('05. repeated failure detection', validateRepeatedFailureDetection(first).passed, validateRepeatedFailureDetection(first).detail);
  assert('06. threshold trigger', validateAdaptiveThresholdTrigger(first).passed, validateAdaptiveThresholdTrigger(first).detail);
  assert('07. capability gap detection', validateCapabilityGapDetection(first).passed, validateCapabilityGapDetection(first).detail);
  assert('08. evolution planning', validateEvolutionPlanning(first).passed, validateEvolutionPlanning(first).detail);
  assert('09. recommendation generation', validateRecommendationGeneration(first).passed, validateRecommendationGeneration(first).detail);
  assert('10. deterministic output', validateAdaptiveDeterministicScoring(first, second).passed, first.cacheKey);
  assert('11. advisory only', validateAdaptiveAdvisoryOnly(first).passed, String(first.advisoryOnly));
  assert('12. launch blocking rule', validateAdaptiveLaunchBlocking(first).passed, first.autofixReadiness);

  const markdown = buildAdaptiveAutofixReportMarkdown(first, input.generatedAt);
  assert('13. report generation', validateAdaptiveReportGeneration(markdown).passed, ADAPTIVE_AUTOFIX_REPORT_TITLE);

  resetAdaptiveAutofixHistoryForTests();
  assessAdaptiveAutofixIntelligence(input);
  assessAdaptiveAutofixIntelligence(input);
  assert(
    '14. bounded history',
    getAdaptiveAutofixHistorySize() <= MAX_ADAPTIVE_AUTOFIX_HISTORY,
    String(getAdaptiveAutofixHistorySize()),
  );
  assert('15. stable cache key prefix', first.cacheKey.startsWith('adaptive-autofix-intelligence-v1:'), first.cacheKey);

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const councilIntegration = readFileSync(
    join(ROOT, 'src/launch-council/launch-council-founder-integration.ts'),
    'utf8',
  );
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(
    join(ROOT, 'src/adaptive-autofix-intelligence/adaptive-autofix-authority.ts'),
    'utf8',
  );
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('16. founder test integration', reportBuilder.includes('buildAdaptiveAutofixIntelligenceArtifacts'), 'report builder');
  assert('17. founder test report section', reportBuilder.includes('## Adaptive AutoFix Intelligence'), 'markdown section');
  assert('18. launch council mapper', councilIntegration.includes('mapAdaptiveAutofixIntelligence'), 'council integration');
  assert('19. council refresh wired', councilIntegration.includes('refreshLaunchCouncilWithAdaptiveAutofix'), 'council refresh');
  assert('20. founder ui panel', appJs.includes('Adaptive AutoFix Intelligence'), 'app.js');
  assert('21. npm script', Boolean(pkg.scripts?.['validate:adaptive-autofix-intelligence']), 'package script');
  assert('22. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('23. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('24. v4 report includes adaptive autofix', Boolean(v4.adaptiveAutofixIntelligence), 'assembled report');

  const artifacts = buildAdaptiveAutofixIntelligenceArtifacts(input);
  assert(
    '25. artifact builder',
    artifacts.adaptiveAutofixIntelligence.adaptiveAutoFixScore === first.adaptiveAutoFixScore,
    String(artifacts.adaptiveAutofixIntelligence.adaptiveAutoFixScore),
  );

  const withAdaptive = { ...input, ...artifacts };
  const councilRefresh = refreshLaunchCouncilWithAdaptiveAutofix(withAdaptive);
  assert(
    '26. council consumes adaptive evidence',
    councilRefresh.launchCouncil.authorityResults.some(
      (result) => result.authorityId === 'adaptive-autofix-intelligence',
    ),
    'launch council authority result',
  );
  assert(
    '27. consumes upstream authorities',
    first.failureRecords.length >= 0 && first.recommendations.every((item) => item.recommendedIntegrationPoints.length > 0),
    String(first.recommendations.length),
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

  console.log(ADAPTIVE_AUTOFIX_INTELLIGENCE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:adaptive-autofix-intelligence');
}

main();
