/**
 * Phase 25.17 — Launch Council Finalization validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithLaunchCouncil } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  assessLaunchCouncilFinalization,
  buildLaunchCouncilFinalizationArtifacts,
  buildLaunchCouncilFinalizationReportMarkdown,
  getLaunchCouncilFinalizationHistorySize,
  LAUNCH_COUNCIL_FINALIZATION_PASS_TOKEN,
  LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE,
  MAX_FINALIZATION_HISTORY,
  resetLaunchCouncilFinalizationHistoryForTests,
  validateAgreementAnalysis,
  validateAuthorityAggregation,
  validateAuthorityClassification,
  validateContradictionDetection,
  validateCouncilConfidenceRange,
  validateCouncilPositionDerivation,
  validateCouncilScoreRange,
  validateFinalizationAdvisoryOnly,
  validateFinalizationDeterministicScoring,
  validateFinalizationReportGeneration,
  validateLaunchGateBlockingRule,
} from '../src/launch-council-finalization/index.js';

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
  'src/launch-council-finalization/launch-council-finalization-bounds.ts',
  'src/launch-council-finalization/launch-council-finalization-types.ts',
  'src/launch-council-finalization/launch-council-finalization-authority.ts',
  'src/launch-council-finalization/launch-council-finalization-report-builder.ts',
  'src/launch-council-finalization/launch-council-finalization-history.ts',
  'src/launch-council-finalization/launch-council-finalization-validator.ts',
  'src/launch-council-finalization/index.ts',
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

function toWithLaunchCouncil(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithLaunchCouncil {
  const {
    reportMarkdown: _reportMarkdown,
    launchCouncilFinalization: _finalization,
    launchCouncilFinalizationReportMarkdown: _finalizationMarkdown,
    launchVerdictGovernance: _governance,
    launchVerdictGovernanceReportMarkdown: _governanceMarkdown,
    adaptiveAutofixIntelligence: _adaptive,
    adaptiveAutofixIntelligenceReportMarkdown: _adaptiveMarkdown,
    clarifyingQuestionIntelligence: _clarifying,
    clarifyingQuestionIntelligenceReportMarkdown: _clarifyingMarkdown,
    ...withLaunchCouncil
  } = report;
  return withLaunchCouncil as FounderTestV4ReportWithLaunchCouncil;
}

function main(): void {
  console.log('');
  console.log('Launch Council Finalization — Validation (leaf mode)');
  console.log('=================================================');
  console.log('');

  resetLaunchCouncilFinalizationHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const classification = validateAuthorityClassification();
  assert('01. authority classification', classification.passed, classification.detail);

  const authorities = listLaunchCouncilAuthorities();
  assert('02. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '03. finalization authority registered',
    authorities.some((entry) => entry.authorityId === 'launch-council-finalization'),
    'launch-council-finalization',
  );
  assert('04. registry count 23', authorities.length === 23, String(authorities.length));

  const v4 = runFounderTestingModeV4();
  const input = toWithLaunchCouncil(v4);
  resetLaunchCouncilFinalizationHistoryForTests();
  const first = assessLaunchCouncilFinalization(input);
  resetLaunchCouncilFinalizationHistoryForTests();
  const second = assessLaunchCouncilFinalization(input);

  assert('05. council score range', validateCouncilScoreRange(first).passed, String(first.councilScore));
  assert(
    '06. council confidence range',
    validateCouncilConfidenceRange(first).passed,
    String(first.councilConfidence),
  );
  assert('07. agreement analysis', validateAgreementAnalysis(first).passed, String(first.agreementScore));
  assert('08. authority aggregation', validateAuthorityAggregation(first).passed, String(first.authorityCount));
  assert('09. contradiction detection', validateContradictionDetection(first).passed, String(first.contradictionCount));
  assert('10. council position derivation', validateCouncilPositionDerivation(first).passed, first.councilPosition);
  assert('11. launch gate blocking rule', validateLaunchGateBlockingRule(first).passed, first.councilPosition);
  assert(
    '12. deterministic output',
    validateFinalizationDeterministicScoring(first, second).passed,
    first.cacheKey,
  );
  assert('13. advisory only', validateFinalizationAdvisoryOnly(first).passed, String(first.advisoryOnly));

  const markdown = buildLaunchCouncilFinalizationReportMarkdown(first, input);
  assert('14. report generation', validateFinalizationReportGeneration(markdown).passed, LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE);

  resetLaunchCouncilFinalizationHistoryForTests();
  assessLaunchCouncilFinalization(input);
  assessLaunchCouncilFinalization(input);
  assert(
    '15. bounded history',
    getLaunchCouncilFinalizationHistorySize() <= MAX_FINALIZATION_HISTORY,
    String(getLaunchCouncilFinalizationHistorySize()),
  );
  assert('16. stable cache key prefix', first.cacheKey.startsWith('launch-council-finalization-v1:'), first.cacheKey);

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(
    join(ROOT, 'src/launch-council-finalization/launch-council-finalization-authority.ts'),
    'utf8',
  );
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert(
    '17. founder test integration',
    reportBuilder.includes('buildLaunchCouncilFinalizationArtifacts'),
    'report builder',
  );
  assert('18. founder test report section', reportBuilder.includes('## Launch Council Finalization'), 'markdown section');
  assert('19. founder ui panel', appJs.includes('Launch Council Finalization'), 'app.js');
  assert('20. npm script', Boolean(pkg.scripts?.['validate:launch-council-finalization']), 'package script');
  assert('21. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('22. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('23. v4 report includes finalization', Boolean(v4.launchCouncilFinalization), 'assembled report');
  assert(
    '24. consumes council outputs',
    first.authorityCount === input.launchCouncil.authorityResults.length,
    String(first.authorityCount),
  );
  assert(
    '25. launch blockers cannot yield READY',
    first.launchBlockers.length === 0 || first.councilPosition !== 'READY',
    first.councilPosition,
  );

  const artifacts = buildLaunchCouncilFinalizationArtifacts(input);
  assert(
    '26. artifact builder',
    artifacts.launchCouncilFinalization.councilPosition === first.councilPosition,
    artifacts.launchCouncilFinalization.councilPosition,
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

  console.log(LAUNCH_COUNCIL_FINALIZATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:launch-council-finalization');
}

main();
