/**
 * Founder Review Operator Dashboard V1 — validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDER_LAUNCH_SUITE_APPS } from '../src/autonomous-founder-launch-authority/autonomous-founder-launch-authority-registry.js';
import {
  buildFounderReviewPayload,
  FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS_TOKEN,
  MAX_FOUNDER_REVIEW_HISTORY,
  resetFounderReviewHistoryForTests,
} from '../src/founder-review-operator-dashboard/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 15_000;

const STATIC_SCAN_FILES = [
  'server/founder-review-handler.ts',
  'server/founder-reality-server.ts',
  'src/founder-review-operator-dashboard/index.ts',
  'public/founder-reality/app.js',
  'public/founder-reality/index.html',
  'public/founder-reality/styles.css',
  'server/command-center-shell-manifest.ts',
  'package.json',
] as const;

const REQUIRED_UI_STRINGS = [
  'Founder Review',
  'Launch Readiness',
  'Evidence Chain',
  'Reviewer Panel',
  'Launch Readiness Breakdown',
  'Launch Blockers',
  'AutoFix',
  'Founder Verdict',
  'Historical Launch Reviews',
  'Senior Engineer Review',
  'Copy Founder Review Report',
  'founder-review-dashboard',
  '/api/founder/founder-review',
];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readBoundedText(relativePath: string, maxBytes = 700_000): string {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function validatePayloadShape(profile: string, productName: string): void {
  resetFounderReviewHistoryForTests();
  const payload = buildFounderReviewPayload(ROOT, profile);
  assert(`${profile}: payload profile`, payload.profile === profile, payload.profile);
  assert(`${profile}: product name`, payload.productName === productName, payload.productName);
  assert(`${profile}: evidence chain count`, payload.evidenceChain.length === 7, String(payload.evidenceChain.length));
  assert(`${profile}: read only`, payload.readOnly === true && payload.informationalOnly === true, 'readOnly');
  assert(`${profile}: score breakdown`, payload.scoreBreakdown.overall >= 0 && payload.scoreBreakdown.overall <= 100, String(payload.scoreBreakdown.overall));
  assert(`${profile}: founder verdict card`, Boolean(payload.founderVerdict.reasoningSummary), 'reasoning');
  assert(`${profile}: copy report`, payload.copyReportText.includes('Founder Review Operator Dashboard'), 'copy');
  assert(`${profile}: blockers panel`, Array.isArray(payload.blockers.criticalBlockers), 'blockers');
  assert(`${profile}: autofix panel`, typeof payload.autoFix.autofixActive === 'boolean', 'autofix');
  assert(`${profile}: history bounded`, payload.history.length <= MAX_FOUNDER_REVIEW_HISTORY, String(payload.history.length));

  const cachedPath = join(ROOT, '.autonomous-founder-launch-authority', `${profile}-assessment.json`);
  if (existsSync(cachedPath)) {
    assert(`${profile}: cached assessment drives reviewers`, payload.reviewerPanel.length === 6, String(payload.reviewerPanel.length));
    assert(`${profile}: cached assessment available`, payload.assessmentAvailable === true, 'available');
  }
}

function main(): void {
  console.log('');
  console.log('Founder Review Operator Dashboard V1 — Validation (leaf mode)');
  console.log('=============================================================');
  console.log('');

  checkpoint('start');

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const handler = fileTexts.get('server/founder-review-handler.ts') ?? '';
  const server = fileTexts.get('server/founder-reality-server.ts') ?? '';
  const appJs = fileTexts.get('public/founder-reality/app.js') ?? '';
  const html = fileTexts.get('public/founder-reality/index.html') ?? '';
  const styles = fileTexts.get('public/founder-reality/styles.css') ?? '';
  const manifest = fileTexts.get('server/command-center-shell-manifest.ts') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. dashboard module', existsSync(join(ROOT, 'src/founder-review-operator-dashboard/index.ts')), 'module');
  assert('02. handler module', existsSync(join(ROOT, 'server/founder-review-handler.ts')), 'handler');
  assert('03. package script', Boolean(pkg.scripts?.['validate:founder-review-operator-dashboard-v1']), 'package');
  assert('04. api route registered', server.includes('/api/founder/founder-review'), 'route');
  assert('05. operator feed section', manifest.includes("'Founder Review'"), 'feed section');
  assert('06. product nav item', manifest.includes("'Founder Review'"), 'nav');
  assert('07. center view shell', html.includes('view-founder-review') && html.includes('founder-review-surface'), 'view');
  assert('08. sidebar nav item', html.includes('data-view="founder-review"'), 'sidebar');

  for (const text of REQUIRED_UI_STRINGS) {
    assert(`09. ui string: ${text}`, appJs.includes(text) || html.includes(text), text);
  }

  assert('10. responsive styles', styles.includes('@media (max-width: 900px)') && styles.includes('.founder-review-reviewer-grid'), 'responsive');
  assert('11. no brain in handler', !handler.includes('/api/brain/respond') && !handler.includes('assessFounderSensemaking'), 'brain');
  assert('12. no validator execution in handler', !handler.includes('execSync') && !handler.includes("npm run validate"), 'validators');
  assert('13. no launch decision logic added', !handler.includes('deriveFounderLaunchVerdict') && !handler.includes('runAutonomousFounderLaunchAuthority'), 'decisions');
  assert('14. uses read-only payload builder', handler.includes('buildFounderReviewPayload'), 'builder');
  assert('15. profile query support', server.includes('searchParams.get(\'profile\')'), 'profile');

  checkpoint('static checks complete');

  for (const app of FOUNDER_LAUNCH_SUITE_APPS) {
    validatePayloadShape(app.profile, app.productName);
    checkpoint(`payload ${app.profile}`);
  }

  const taskTrackerPayload = buildFounderReviewPayload(ROOT, 'TASK_TRACKER_WEB_V1');
  assert('multi-app: task tracker payload', taskTrackerPayload.profile === 'TASK_TRACKER_WEB_V1', taskTrackerPayload.profile);

  const elapsed = Date.now() - START;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_REQUIRES_FIXES');
  process.exit(1);
}
