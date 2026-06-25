/**
 * Operator Feed stream redesign — validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'OPERATOR_FEED_STREAM_REDESIGN_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function main(): Promise<void> {
  console.log('');
  console.log('Operator Feed Stream Redesign — Validation');
  console.log('========================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const styles = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script', Boolean(pkg.scripts?.['validate:operator-feed-stream-redesign']), 'script');
  assert('02. operator log buffer', appJs.includes('operatorLogBuffer'), 'buffer');
  assert('03. stream renderer', appJs.includes('renderOperatorStreamLog'), 'renderer');
  assert('04. terminal stream container', html.includes('feed-stream-terminal'), 'terminal');
  assert('05. legacy cards hidden', html.includes('feed-sections-legacy') && html.includes('hidden'), 'legacy hidden');
  assert('06. empty state copy', html.includes('No active run. Execution logs will stream here'), 'empty');
  assert('07. live stream control', html.includes('operator-feed-stream-mode'), 'live stream');
  assert('08. errors only control', html.includes('operator-feed-errors-only-btn'), 'errors only');
  assert('09. search control', html.includes('operator-feed-search'), 'search');
  assert('10. auto-scroll control', html.includes('operator-feed-autoscroll'), 'autoscroll');
  assert('11. clear control', html.includes('operator-feed-clear-btn'), 'clear');
  assert('12. copy export controls', appJs.includes('copyOperatorLogToClipboard') && appJs.includes('exportOperatorLog'), 'copy/export');
  assert('13. footer level filters', html.includes('operator-feed-footer') && html.includes('data-level-filter'), 'filters');
  assert('14. timestamped stream lines', appJs.includes('formatOperatorLogTimestamp') && appJs.includes('operator-log-ts'), 'timestamp');
  assert(
    '15. level stage message',
    appJs.includes('operator-log-level') && appJs.includes('operator-log-stage') && appJs.includes('operator-log-message'),
    'fields',
  );
  assert('16. build trail helper', appJs.includes('appendBuildResponseOperatorLog'), 'build trail');
  assert('17. brain respond wiring', appJs.includes('streamOperatorFeedEvents') && appJs.includes('responseForTrail'), 'brain wiring');
  assert('18. cards not primary view', appJs.includes('feed-sections-legacy') || appJs.includes("container.setAttribute('hidden'"), 'cards disabled');
  assert('19. chat separate from feed', appJs.includes('appendChatMessage') && appJs.includes('appendOperatorLogFromEvent'), 'separation');
  assert('20. session history preserved', appJs.includes('Session history preserved'), 'history');
  assert('21. terminal css', styles.includes('.feed-stream-terminal') && styles.includes('.operator-stream-line'), 'css');
  assert('22. init controls', appJs.includes('initOperatorFeedControls()'), 'init');
  assert('23. reasoning indent', appJs.includes('operator-stream-indent') || appJs.includes('indent: true'), 'indent');
  assert('24. errors only filter logic', appJs.includes('operatorFeedUi.errorsOnly'), 'errors filter');
  assert('25. search filter logic', appJs.includes('operatorFeedUi.searchQuery'), 'search filter');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Operator Feed Stream Redesign — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
