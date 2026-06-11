/**
 * Phase 24.9.6 — Change Intelligence Visibility validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  CHANGE_INTELLIGENCE_VISIBILITY_PASS_TOKEN,
  assessChangeIntelligenceVisibility,
  recordChangeIntelligenceSnapshot,
  resetChangeIntelligenceHistoryForTests,
  type ChangeIntelligenceSnapshot,
} from '../src/change-intelligence-visibility/index.js';
import {
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';
import { resetVerificationResultsCacheForTests } from '../src/verification-results-visibility/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';

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

function snap(overrides: Partial<ChangeIntelligenceSnapshot>): ChangeIntelligenceSnapshot {
  return {
    capturedAt: Date.now(),
    label: 'test',
    previewState: 'NO_PREVIEW',
    runningAppState: 'NO_RUNNING_APP',
    verificationState: 'NO_VERIFICATION_RUN',
    readinessScore: 0,
    passCount: 0,
    failCount: 0,
    blockedCount: 0,
    warningCount: 0,
    betaReady: false,
    launchReady: false,
    projectFactCount: 0,
    projectCount: 0,
    launchReadinessScore: 0,
    topRiskCount: 0,
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Change Intelligence Visibility — Validation');
  console.log('===========================================');
  console.log('');

  resetChangeIntelligenceHistoryForTests();
  resetVerificationResultsCacheForTests();

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const authority = readText('src/change-intelligence-visibility/change-intelligence-visibility-authority.ts');
  const responses = readText('src/command-center-brain/change-intelligence-responses.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/change-intelligence-visibility/change-intelligence-visibility-authority.ts')), 'authority');
  assert('02. history module', existsSync(join(ROOT, 'src/change-intelligence-visibility/change-intelligence-history.ts')), 'history');
  assert('03. package script', Boolean(pkg.scripts?.['validate:change-intelligence-visibility']), 'package');
  assert('04. change categories', authority.includes('Verification Changes') && authority.includes('Risk Changes'), 'categories');
  assert('05. severity + direction', authority.includes('CRITICAL') && authority.includes('IMPROVED'), 'severity');
  assert('06. change intelligence UI', appJs.includes('change-intelligence-visibility') && appJs.includes('Change Intelligence'), 'ui');
  assert('07. recent changes UI', appJs.includes('Recent Changes') && appJs.includes('Regressions'), 'recent');
  assert('08. timeline UI', appJs.includes('change-intelligence-timeline'), 'timeline');
  assert('09. review order UI', appJs.includes('Recommended Review Order'), 'review');
  assert('10. change feed', appJs.includes('streamChangeIntelligenceFeed'), 'feed');
  assert('11. founder evaluation', engine.includes('evaluateChangeIntelligenceVisibility'), 'founder');
  assert('12. command center responses', responses.includes('resolveChangeIntelligenceResponse'), 'brain');
  assert('13. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs + responses), 'safety');
  assert('14. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const insufficient = assessChangeIntelligenceVisibility([snap({ label: 'baseline' })]);
  assert('15. insufficient history honest', !insufficient.hasSufficientHistory, String(insufficient.hasSufficientHistory));
  assert('16. insufficient reason', Boolean(insufficient.insufficientHistoryReason), 'reason');

  recordChangeIntelligenceSnapshot(
    snap({ label: 'baseline', capturedAt: Date.now() - 60_000, readinessScore: 74, previewState: 'PREVIEW_LOADING' }),
  );
  recordChangeIntelligenceSnapshot(
    snap({
      label: 'Founder Test completed',
      readinessScore: 82,
      previewState: 'PREVIEW_INTERACTIVE',
      runningAppState: 'OUTPUT_INTERACTIVE',
      passCount: 8,
      failCount: 1,
      warningCount: 2,
    }),
  );
  const improved = assessChangeIntelligenceVisibility([
    snap({ label: 'baseline', capturedAt: Date.now() - 60_000, readinessScore: 74, previewState: 'PREVIEW_LOADING' }),
    snap({
      label: 'Founder Test completed',
      readinessScore: 82,
      previewState: 'PREVIEW_INTERACTIVE',
      runningAppState: 'OUTPUT_INTERACTIVE',
      passCount: 8,
      failCount: 1,
      warningCount: 2,
    }),
  ]);
  assert('17. improvement detected', improved.improvements.length > 0, String(improved.improvements.length));
  assert('18. score movement explained', Boolean(improved.scoreMovementExplanation), improved.scoreMovementExplanation ?? 'missing');
  assert('19. timeline populated', improved.timeline.length > 0, String(improved.timeline.length));

  const regressed = assessChangeIntelligenceVisibility([
    snap({ label: 'before', readinessScore: 82, launchReady: true, failCount: 0 }),
    snap({ label: 'after', readinessScore: 68, launchReady: false, failCount: 2, warningCount: 4 }),
  ]);
  assert('20. regression detected', regressed.regressions.length > 0, String(regressed.regressions.length));
  assert('21. launch regression explained', Boolean(regressed.readinessMovementExplanation), 'readiness');

  const unchanged = assessChangeIntelligenceVisibility([
    snap({ label: 'a', readinessScore: 70, previewState: 'PREVIEW_VISIBLE' }),
    snap({ label: 'b', readinessScore: 70, previewState: 'PREVIEW_VISIBLE' }),
  ]);
  assert('22. unchanged honest', unchanged.recentChanges.length === 0, String(unchanged.recentChanges.length));

  const snapshot = buildProductWorkspaceSnapshot(Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')));
  assert('23. snapshot changeIntelligence', Boolean(snapshot.changeIntelligence), String(snapshot.changeIntelligence?.historyCount));
  guardRuntime('authority');

  resetChangeIntelligenceHistoryForTests();
  recordChangeIntelligenceSnapshot(snap({ label: 'baseline', readinessScore: 70 }));
  recordChangeIntelligenceSnapshot(snap({ label: 'after', readinessScore: 82, previewState: 'PREVIEW_INTERACTIVE' }));

  const whatChanged = processBrainRequest({ message: 'What changed?' });
  const whatImproved = processBrainRequest({ message: 'What improved?' });
  const insufficientBrain = processBrainRequest({ message: 'Summarize recent changes.' });
  assert('24. brain what changed', /improved|changed|no meaningful|insufficient/i.test(whatChanged.brainResponse ?? ''), (whatChanged.brainResponse ?? '').slice(0, 90));
  assert('25. brain what improved', /improved|no improvements|insufficient/i.test(whatImproved.brainResponse ?? ''), (whatImproved.brainResponse ?? '').slice(0, 90));
  assert('26. brain summarize', /improvement|regression|insufficient|review first/i.test(insufficientBrain.brainResponse ?? ''), (insufficientBrain.brainResponse ?? '').slice(0, 90));
  guardRuntime('brain');

  const reportPath = join(ROOT, 'architecture', 'CHANGE_INTELLIGENCE_VISIBILITY_REPORT.md');
  assert('27. report exists', existsSync(reportPath), reportPath);

  const v4 = runFounderTestingModeV4({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  const v3 = runFounderTestingModeV3({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  assert('28. V4 change intelligence section', Boolean(v4.changeIntelligenceVisibility), String(v4.changeIntelligenceVisibility?.historyCount));
  assert('29. V4 change score', v4.changeIntelligenceVisibilityScore.score >= 0, String(v4.changeIntelligenceVisibilityScore.score));
  assert('30. V4 markdown section', v4.reportMarkdown.includes('Change Intelligence Visibility'), 'md');
  assert('31. V3 still valid', v3.trustScore >= 0, String(v3.trustScore));
  guardRuntime('founder');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const elapsed = Date.now() - START;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log(`Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`V4 change intelligence score: ${v4.changeIntelligenceVisibilityScore.score}`);
  console.log('');

  if (failed.length) {
    console.log('CHANGE_INTELLIGENCE_VISIBILITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(CHANGE_INTELLIGENCE_VISIBILITY_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
