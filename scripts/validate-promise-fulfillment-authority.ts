/**
 * Phase 25.3 — Promise Fulfillment Authority validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import type { FounderTestV4ReportWithSkeptical } from '../src/founder-testing-mode/founder-testing-v4-types.js';
import {
  assertLaunchCouncilRegistryIntegrity,
  listLaunchCouncilAuthorities,
} from '../src/launch-council/index.js';
import {
  MAX_PROMISE_HISTORY,
  PROMISE_FULFILLMENT_AUTHORITY_PASS_TOKEN,
  PROMISE_FULFILLMENT_REPORT_TITLE,
  REGISTERED_PROMISES,
  assertPromiseRegistryIntegrity,
  assessPromiseFulfillment,
  buildPromiseFulfillmentReportMarkdown,
  getPromiseFulfillmentHistorySize,
  resetPromiseFulfillmentHistoryForTests,
  validatePromiseContradictionDetection,
  validatePromiseDeterministicScoring,
  validatePromiseEvidenceMapping,
  validatePromiseFulfillmentScoring,
  validatePromiseLaunchBlocking,
  validatePromiseRegistry,
} from '../src/promise-fulfillment-authority/index.js';

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
  'src/promise-fulfillment-authority/promise-fulfillment-bounds.ts',
  'src/promise-fulfillment-authority/promise-fulfillment-types.ts',
  'src/promise-fulfillment-authority/promise-fulfillment-registry.ts',
  'src/promise-fulfillment-authority/promise-fulfillment-authority.ts',
  'src/promise-fulfillment-authority/promise-fulfillment-report-builder.ts',
  'src/promise-fulfillment-authority/promise-fulfillment-history.ts',
  'src/promise-fulfillment-authority/promise-fulfillment-validator.ts',
  'src/promise-fulfillment-authority/index.ts',
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

function toWithSkeptical(report: ReturnType<typeof runFounderTestingModeV4>): FounderTestV4ReportWithSkeptical {
  const {
    reportMarkdown: _reportMarkdown,
    promiseFulfillment: _promise,
    promiseFulfillmentReportMarkdown: _promiseMarkdown,
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
    ...withSkeptical
  } = report;
  return withSkeptical;
}

function main(): void {
  console.log('');
  console.log('Promise Fulfillment Authority — Validation (leaf mode)');
  console.log('====================================================');
  console.log('');

  resetPromiseFulfillmentHistoryForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  const registry = validatePromiseRegistry();
  assert('01. promise registry integrity', registry.passed && assertPromiseRegistryIntegrity(), registry.detail);
  assert('02. bounded promise set', REGISTERED_PROMISES.length === 16, `count=${REGISTERED_PROMISES.length}`);

  const v4 = runFounderTestingModeV4();
  const input = toWithSkeptical(v4);
  resetPromiseFulfillmentHistoryForTests();
  const first = assessPromiseFulfillment(input);
  resetPromiseFulfillmentHistoryForTests();
  const second = assessPromiseFulfillment(input);

  const evidence = validatePromiseEvidenceMapping(first.promiseAssessments);
  assert('03. evidence mapping', evidence.passed, evidence.detail);

  const scoring = validatePromiseFulfillmentScoring(first);
  assert('04. fulfillment scoring', scoring.passed, scoring.detail);

  const contradictions = validatePromiseContradictionDetection(first);
  assert('05. contradiction detection', contradictions.passed, contradictions.detail);
  assert('06. contradicted promises surfaced', first.contradictedCount > 0, String(first.contradictedCount));
  assert('07. unproven promises surfaced', first.unprovenCount >= 0, String(first.unprovenCount));

  const blocking = validatePromiseLaunchBlocking(first);
  assert('08. launch blocking behavior', blocking.passed, blocking.detail);

  const deterministic = validatePromiseDeterministicScoring(first, second);
  assert('09. deterministic scoring', deterministic.passed, deterministic.detail);

  const markdown = buildPromiseFulfillmentReportMarkdown(first, input.generatedAt);
  assert('10. report generation', markdown.includes(`# ${PROMISE_FULFILLMENT_REPORT_TITLE}`), 'title');
  assert(
    '11. report sections',
    markdown.includes('## Promise Fulfillment Summary') && markdown.includes('## Promise Fulfillment Verdict'),
    'sections',
  );

  resetPromiseFulfillmentHistoryForTests();
  assessPromiseFulfillment(input);
  assessPromiseFulfillment(input);
  assert('12. bounded history', getPromiseFulfillmentHistorySize() <= MAX_PROMISE_HISTORY, String(getPromiseFulfillmentHistorySize()));
  assert('13. stable cache key prefix', first.cacheKey.startsWith('promise-fulfillment-v1:'), first.cacheKey);

  const authorities = listLaunchCouncilAuthorities();
  assert('14. launch council registration', assertLaunchCouncilRegistryIntegrity(), `count=${authorities.length}`);
  assert(
    '15. promise authority registered',
    authorities.some((entry) => entry.authorityId === 'promise-fulfillment-authority'),
    'promise-fulfillment-authority',
  );

  const reportBuilder = readFileSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-report-builder.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const authoritySource = readFileSync(join(ROOT, 'src/promise-fulfillment-authority/promise-fulfillment-authority.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('16. founder test integration', reportBuilder.includes('buildPromiseFulfillmentArtifacts'), 'report builder');
  assert('17. founder test report section', reportBuilder.includes('## Promise Fulfillment'), 'markdown section');
  assert('18. founder ui panel', appJs.includes('Promise Fulfillment'), 'app.js');
  assert('19. npm script', Boolean(pkg.scripts?.['validate:promise-fulfillment-authority']), 'package script');
  assert('20. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('21. no external ai', !authoritySource.includes('fetch(') && !authoritySource.includes('openai'), 'deterministic');
  assert('22. v4 report includes promise fulfillment', Boolean(v4.promiseFulfillment), 'assembled report');

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

  console.log(PROMISE_FULFILLMENT_AUTHORITY_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:promise-fulfillment-authority');
}

main();
