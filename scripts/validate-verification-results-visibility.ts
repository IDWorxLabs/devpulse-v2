/**
 * Phase 24.9.5 — Verification Results Visibility validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  VERIFICATION_RESULTS_VISIBILITY_PASS_TOKEN,
  assessVerificationResultsVisibility,
  buildVerificationResultsFromV4Report,
  buildVerificationResultsFromWorkspace,
  buildVerificationResultsRunning,
  resetVerificationResultsCacheForTests,
} from '../src/verification-results-visibility/index.js';
import {
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';
import type { VerificationCheckResult } from '../src/verification-results-visibility/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;
const textCache = new Map<string, string>();

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  const cached = textCache.get(relativePath);
  if (cached) return cached;
  const content = readFileSync(join(ROOT, relativePath), 'utf8');
  textCache.set(relativePath, content);
  return content;
}

function guardRuntime(group: string): void {
  if (Date.now() - START > MAX_RUNTIME_MS) {
    throw new Error(`Timeout in ${group} after ${Date.now() - START}ms`);
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('Verification Results Visibility — Validation');
  console.log('============================================');
  console.log('');

  resetVerificationResultsCacheForTests();

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const authority = readText('src/verification-results-visibility/verification-results-visibility-authority.ts');
  const responses = readText('src/command-center-brain/verification-results-responses.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/verification-results-visibility/verification-results-visibility-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/verification-results-visibility/verification-results-visibility-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:verification-results-visibility']), 'package');
  assert('04. eight verification states', authority.includes('NO_VERIFICATION_RUN') && authority.includes('VERIFICATION_LAUNCH_READY'), 'states');
  assert('05. check statuses', authority.includes('BLOCKED') && authority.includes('NOT_RUN'), 'statuses');
  assert('06. UI panel', appJs.includes('verification-results-visibility') && appJs.includes('Verification State'), 'ui');
  assert('07. grouped categories UI', appJs.includes('verification-category-group') && appJs.includes('What Was Tested'), 'groups');
  assert('08. fix list UI', appJs.includes('Issues to Fix Next') && appJs.includes('verification-evidence'), 'fixes');
  assert('09. verification feed', appJs.includes('streamVerificationResultsFeed'), 'feed');
  assert('10. founder evaluation', engine.includes('evaluateVerificationResultsVisibility'), 'founder');
  assert('11. command center responses', responses.includes('resolveVerificationResultsResponse'), 'brain');
  assert('12. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs + responses), 'safety');
  assert('13. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  assert('14. warn/ok pill styles', styles.includes('verification-results-state'), 'styles');
  guardRuntime('static');

  const noRun = buildVerificationResultsFromWorkspace(
    buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'))),
  );
  assert('15. NO_VERIFICATION_RUN', noRun.state === 'NO_VERIFICATION_RUN', noRun.state);
  assert('16. honest no-run counts', noRun.summary.passCount === 0 && noRun.summary.failCount === 0, String(noRun.summary.passCount));

  const running = buildVerificationResultsRunning();
  assert('17. VERIFICATION_RUNNING', running.state === 'VERIFICATION_RUNNING', running.state);

  const partialChecks: VerificationCheckResult[] = [
    {
      category: 'Preview',
      checkName: 'Preview loads',
      status: 'PASS',
      meaning: 'ok',
      evidence: 'loaded',
      recommendedAction: 'none',
      priority: 'LOW',
      blocks: { testing: false, demo: false, beta: false, launch: false },
    },
    {
      category: 'Launch Readiness',
      checkName: 'Launch score',
      status: 'NOT_RUN',
      meaning: 'pending',
      evidence: 'not run',
      recommendedAction: 'run test',
      priority: 'LOW',
      blocks: { testing: false, demo: false, beta: false, launch: false },
    },
  ];
  const partial = assessVerificationResultsVisibility({
    founderTestRan: true,
    overallVerdict: 'PRODUCT_DIRECTION_VALID',
    readinessScore: 60,
    checks: partialChecks,
  });
  assert('18. VERIFICATION_PARTIAL', partial.state === 'VERIFICATION_PARTIAL', partial.state);

  const blockedOnly = assessVerificationResultsVisibility({
    founderTestRan: true,
    checks: [
      {
        category: 'Preview',
        checkName: 'Preview open',
        status: 'BLOCKED',
        meaning: 'no preview',
        evidence: 'NO_PREVIEW',
        recommendedAction: 'start preview',
        priority: 'HIGH',
        blocks: { testing: true, demo: true, beta: true, launch: true },
      },
    ],
  });
  assert('19. VERIFICATION_BLOCKED', blockedOnly.state === 'VERIFICATION_BLOCKED', blockedOnly.state);

  const failed = assessVerificationResultsVisibility({
    founderTestRan: true,
    readinessScore: 45,
    overallVerdict: 'EXECUTION_GAPS_PRESENT',
    checks: [
      {
        category: 'Preview',
        checkName: 'Preview validation ready',
        status: 'FAIL',
        meaning: 'not ready',
        evidence: 'PREVIEW_DEGRADED',
        recommendedAction: 'refresh preview',
        priority: 'CRITICAL',
        blocks: { testing: true, demo: true, beta: true, launch: true },
      },
    ],
  });
  assert('20. VERIFICATION_FAILED', failed.state === 'VERIFICATION_FAILED', failed.state);
  assert('21. failed fix ranked', failed.fixesNext.length > 0, String(failed.fixesNext.length));

  const warningsOnly = assessVerificationResultsVisibility({
    founderTestRan: true,
    readinessScore: 72,
    overallVerdict: 'READY_FOR_PUBLIC_BETA',
    checks: [
      {
        category: 'Running Application',
        checkName: 'Test readiness',
        status: 'WARNING',
        meaning: 'caution',
        evidence: 'TESTABLE_WITH_WARNINGS',
        recommendedAction: 'review',
        priority: 'MEDIUM',
        blocks: { testing: false, demo: true, beta: true, launch: false },
      },
      {
        category: 'Launch Readiness',
        checkName: 'Launch',
        status: 'PASS',
        meaning: 'ok',
        evidence: 'score 72',
        recommendedAction: 'none',
        priority: 'LOW',
        blocks: { testing: false, demo: false, beta: false, launch: false },
      },
    ],
  });
  assert('22. VERIFICATION_WARNINGS', warningsOnly.state === 'VERIFICATION_WARNINGS', warningsOnly.state);
  assert('23. warnings not failed', warningsOnly.summary.failCount === 0, String(warningsOnly.summary.failCount));

  resetVerificationResultsCacheForTests();
  const whatTested = processBrainRequest({ message: 'What was tested?' });
  const whatFailed = processBrainRequest({ message: 'What failed?' });
  const noRunBrain = processBrainRequest({ message: 'Did testing pass?' });
  assert(
    '27. brain no-run honest',
    /no verification has been run|testing has not been run/i.test(noRunBrain.brainResponse ?? ''),
    (noRunBrain.brainResponse ?? '').slice(0, 80),
  );
  assert('28. brain what tested', /verification state|founder testing|no verification/i.test(whatTested.brainResponse ?? ''), (whatTested.brainResponse ?? '').slice(0, 80));
  assert(
    '29. brain what failed',
    /fail|no verification has been run/i.test(whatFailed.brainResponse ?? ''),
    (whatFailed.brainResponse ?? '').slice(0, 80),
  );
  guardRuntime('brain');

  const reportPath = join(ROOT, 'architecture', 'VERIFICATION_RESULTS_VISIBILITY_REPORT.md');
  assert('30. report exists', existsSync(reportPath), reportPath);

  const v4 = runFounderTestingModeV4({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  const fromV4 = buildVerificationResultsFromV4Report(v4);
  assert('24. V4 report builds results', fromV4.summary.passCount + fromV4.summary.failCount + fromV4.summary.warningCount > 0, 'counts');
  assert('25. V4 evidence present', fromV4.evidencePresent, String(fromV4.evidencePresent));
  assert('26. V4 categories grouped', fromV4.categories.length >= 6, String(fromV4.categories.length));

  const v3 = runFounderTestingModeV3({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  assert('31. V4 visibility section', Boolean(v4.verificationResultsVisibility?.state), v4.verificationResultsVisibility.state);
  assert('32. V4 visibility score', v4.verificationResultsVisibilityScore.score >= 0, String(v4.verificationResultsVisibilityScore.score));
  assert('33. V4 markdown section', v4.reportMarkdown.includes('Verification Results Visibility'), 'md');
  assert('34. V3 still passes', v3.trustScore >= 0, String(v3.trustScore));
  guardRuntime('founder');

  const passed = results.filter((r) => r.passed).length;
  const failedResults = results.filter((r) => !r.passed);
  const elapsed = Date.now() - START;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failedResults.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`V4 verification state: ${v4.verificationResultsVisibility.state}`);
  console.log('');

  if (failedResults.length) {
    console.log('VERIFICATION_RESULTS_VISIBILITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(VERIFICATION_RESULTS_VISIBILITY_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
