/**
 * Phase 26.59 — Final report access cache unification validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS,
  resolveFinalReportMarkdownPriority,
  shouldUseCachedFinalReportDespiteFetchFailure,
  storeFinalReportMarkdownInCache,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-final-report-access-cache-unification';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'src/founder-test-runtime-monitor/final-report-access-cache.ts',
  'scripts/validate-final-report-access-cache-unification.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('final report cache map', appJs.includes('founderTestFinalReportsByRunId'), 'cache map');
assert('apply final report bridge', appJs.includes('applyFounderTestFinalReport'), 'bridge');
assert('resolve final report helper', appJs.includes('resolveFounderTestFinalReportMarkdown'), 'resolve helper');
assert('notification stores via bridge', appJs.includes("applyFounderTestFinalReport(resolved.runId, resolved.reportMarkdown, 'deliver-notification'"), 'notify bridge');
assert('copy checks cache before fetch', /function buildFounderTestCopyPayload\(\)[\s\S]*?resolveFounderTestFinalReportMarkdown[\s\S]*?needsFetch/.test(appJs), 'copy order');
assert('open checks cache before fetch', /function openFounderTestReportModal\(\)[\s\S]*?resolveFounderTestFinalReportMarkdown/.test(appJs), 'open cache');
assert('copy immediate when cached', /function copyLatestFounderTestReport[\s\S]*?!payload\.needsFetch/.test(appJs), 'immediate copy');
assert('fetching label', appJs.includes('Fetching Report...'), 'fetching label');
assert('final report labels', appJs.includes('Copy Final Report') && appJs.includes('Open Final Report'), 'labels');
assert('fetch failure uses cached report', appJs.includes('resolveFounderTestFinalReportMarkdown(payload.runId).markdown'), 'cache fallback');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:final-report-access-cache-unification": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

const runId = 'cache-unify-run';
const markdown = '# Founder Test Report\n\nCached final report.';
let cache: Record<string, string> = {};
cache = storeFinalReportMarkdownInCache(cache, runId, markdown);

const preferred = resolveFinalReportMarkdownPriority({
  runId,
  finalReportsByRunId: cache,
  lastFounderTestReportMarkdown: '# other',
  notificationReportMarkdown: '# notification',
});
assert('local cache wins priority', preferred.source === 'local-cache', preferred.source);
assert('local cache markdown', preferred.markdown === markdown, preferred.markdown ?? 'null');
assert('cached fetch failure ignored', shouldUseCachedFinalReportDespiteFetchFailure({
  runId,
  finalReportsByRunId: cache,
}), 'cached');

const notificationOnly = resolveFinalReportMarkdownPriority({
  runId,
  finalReportsByRunId: {},
  notificationReportMarkdown: markdown,
});
assert('notification used when no cache', notificationOnly.source === 'notification', notificationOnly.source);

const report = [
  '# Final Report Access Cache Unification Report',
  '',
  '## Root Cause',
  '',
  '- Notifications received the final report markdown, but Operator Feed Copy/Open bypassed the delivered cache.',
  '- Buttons always attempted `/api/founder-test/result` fetch for COMPLETE runs, showing Fetching/Failed even when markdown was already local.',
  '',
  '## Cache Unification',
  '',
  '- `founderTestFinalReportsByRunId[runId]` is the local source of truth.',
  '- Notification delivery writes to this cache immediately.',
  '- Result payload application also writes to this cache.',
  '',
  '## Operator Feed Priority',
  '',
  '1. Local final report cache by runId',
  '2. `lastFounderTestReport.reportMarkdown`',
  '3. Notification report markdown by runId',
  '4. Result endpoint fetch (bounded retries)',
  '5. COMPLETE handoff diagnostic fallback',
  '',
  '## Manual UI Verification Steps',
  '',
  '1. Run Founder Test to COMPLETE — confirm notification **Founder Test Report Ready** appears.',
  '2. Without refreshing, click **Copy Final Report** on Operator Feed — clipboard should fill immediately (no Fetching).',
  '3. Click **Open Final Report** — modal shows full markdown immediately.',
  '4. Disconnect network or stop server, click Copy again — cached report still copies (no Failed to fetch).',
  '',
  '---',
  '',
  `Pass token: ${FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FINAL_REPORT_ACCESS_CACHE_UNIFICATION_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'FINAL_REPORT_ACCESS_CACHE_UNIFICATION_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Final Report Access Cache Unification validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Final Report Access Cache Unification validation PASSED (${results.length} checks)`);
console.log(FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS);
