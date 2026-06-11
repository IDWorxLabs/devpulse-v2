/**
 * Phase 25.2 — Skeptical Founder Simulator validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportCore } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_SKEPTICAL_HISTORY,
  SKEPTICAL_FOUNDER_REPORT_TITLE,
  SKEPTICAL_FOUNDER_SCENARIOS,
  SKEPTICAL_FOUNDER_SIMULATOR_PASS_TOKEN,
  assessSkepticalFounderSimulator,
  buildSkepticalFounderReportMarkdown,
  getSkepticalFounderHistorySize,
  resetSkepticalFounderHistoryForTests,
  validateSkepticalDeterministicScoring,
  validateSkepticalLaunchBlocking,
  validateSkepticalScenarioCount,
} from '../src/skeptical-founder-simulator/index.js';

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
  'src/skeptical-founder-simulator/skeptical-founder-bounds.ts',
  'src/skeptical-founder-simulator/skeptical-founder-types.ts',
  'src/skeptical-founder-simulator/skeptical-founder-scenarios.ts',
  'src/skeptical-founder-simulator/skeptical-founder-authority.ts',
  'src/skeptical-founder-simulator/skeptical-founder-report-builder.ts',
  'src/skeptical-founder-simulator/skeptical-founder-history.ts',
  'src/skeptical-founder-simulator/skeptical-founder-validator.ts',
  'src/skeptical-founder-simulator/index.ts',
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

function toReportCore(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportCore {
  const {
    reportMarkdown: _reportMarkdown,
    skepticalFounderSimulator: _skeptical,
    skepticalFounderReportMarkdown: _skepticalMarkdown,
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
    ...core
  } = report;
  return core;
}

function main(): void {
  console.log('');
  console.log('Skeptical Founder Simulator — Validation (leaf mode)');
  console.log('==================================================');
  console.log('');

  resetSkepticalFounderHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const scenarioCount = validateSkepticalScenarioCount();
  assert('01. scenario generation', scenarioCount.passed, scenarioCount.detail);
  assert('02. bounded scenarios', SKEPTICAL_FOUNDER_SCENARIOS.length === 6, `count=${SKEPTICAL_FOUNDER_SCENARIOS.length}`);

  const v4 = runFounderTestingModeV4();
  const core = toReportCore(v4);
  resetSkepticalFounderHistoryForTests();
  const first = assessSkepticalFounderSimulator(core);
  resetSkepticalFounderHistoryForTests();
  const second = assessSkepticalFounderSimulator(core);
  const deterministic = validateSkepticalDeterministicScoring(first.scenarioResults, second.scenarioResults);
  assert('03. score calculation', first.skepticalFounderScore >= 0 && first.skepticalFounderScore <= 100, String(first.skepticalFounderScore));
  assert('04. deterministic scoring', deterministic.passed, deterministic.detail);
  assert('05. launch risk calculation', first.launchRiskScore >= 0 && first.launchRiskScore <= 100, String(first.launchRiskScore));
  assert('06. objection generation', first.objectionCount > 0 && first.objections.length > 0, String(first.objectionCount));

  const blocking = validateSkepticalLaunchBlocking({
    skepticalFounderScore: first.skepticalFounderScore,
    launchRiskScore: first.launchRiskScore,
    criticalTrustObjection: first.criticalTrustObjection,
    blocksLaunchReadiness: first.blocksLaunchReadiness,
  });
  assert('07. launch blocking behavior', blocking.passed, blocking.detail);

  const markdown = buildSkepticalFounderReportMarkdown(first, core.generatedAt);
  assert('08. report generation', markdown.includes(`# ${SKEPTICAL_FOUNDER_REPORT_TITLE}`), 'markdown title');
  assert('09. report sections', markdown.includes('## Skeptical Founder Summary') && markdown.includes('## Skeptical Founder Verdict'), 'sections');

  resetSkepticalFounderHistoryForTests();
  assessSkepticalFounderSimulator(core);
  assessSkepticalFounderSimulator(core);
  assert('10. bounded history', getSkepticalFounderHistorySize() <= MAX_SKEPTICAL_HISTORY, String(getSkepticalFounderHistorySize()));
  assert('11. stable cache key prefix', first.cacheKey.startsWith('skeptical-founder-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('12. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '13. skeptical authority registered',
    authorities.some((entry) => entry.authorityId === 'skeptical-founder-simulator'),
    'skeptical-founder-simulator',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/skeptical-founder-simulator/skeptical-founder-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('14. founder test integration', reportBuilder.includes('buildSkepticalFounderSimulatorArtifacts'), 'report builder');
  assert('15. founder test report section', reportBuilder.includes('## Skeptical Founder Simulator'), 'markdown section');
  assert('16. founder ui panel', appJs.includes('Skeptical Founder Simulator'), 'app.js');
  assert('17. npm script', Boolean(pkg.scripts?.['validate:skeptical-founder-simulator']), 'package script');
  assert('18. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('19. no external ai', !authoritySource.includes('fetch(') && !authoritySource.includes('openai'), 'deterministic');
  assert('20. v4 report includes skeptical', Boolean(v4.skepticalFounderSimulator), 'assembled report');

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

  console.log(SKEPTICAL_FOUNDER_SIMULATOR_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:skeptical-founder-simulator');
}

main();
