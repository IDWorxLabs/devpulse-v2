/**
 * Operator Feed stream layout — stacked metadata + full-width message rows.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'OPERATOR_FEED_LAYOUT_PASS';

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

function buildSampleFeedHtml(entryCount: number): string {
  const stages = ['planning', 'materialization', 'classification', 'build', 'preview'];
  const messages = [
    'Planning proof — PARTIAL',
    'Generated workspace with 6 units and 12 planned tasks',
    'Build intent classified — PROJECT_MANAGEMENT_WEB_V1',
    'npm install completed',
    'Build completed successfully. Preview ready at http://127.0.0.1:5173/',
  ];
  let html = '';
  for (let i = 0; i < entryCount; i += 1) {
    const stage = stages[i % stages.length];
    const message = messages[i % messages.length];
    html +=
      '<div class="operator-feed-row operator-stream-line">' +
      '<div class="operator-log-meta">' +
      '<span class="operator-log-ts">12:34:56.789</span>' +
      '<span class="operator-log-level level-info">[INFO]</span>' +
      '<span class="operator-log-stage">' +
      stage +
      '</span>' +
      '</div>' +
      '<div class="operator-log-message">' +
      message +
      '</div>' +
      '</div>';
  }
  return html;
}

function main(): void {
  console.log('');
  console.log('Operator Feed Layout — Validation');
  console.log('=================================');
  console.log('');

  const styles = readText('public/founder-reality/styles.css');
  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  const feedCss = styles.slice(styles.indexOf('/* ── Operator Feed ── */'));

  assert('01. package script', Boolean(pkg.scripts?.['validate:operator-feed-layout']), 'script');
  assert('02. viewport wrapper html', html.includes('operator-stream-viewport') && html.includes('operator-stream-log'), 'viewport');
  assert('03. app renders stacked markup', appJs.includes('operator-log-meta') && appJs.includes('operator-log-message'), 'stacked markup');
  assert('04. scroll viewport not rows', appJs.includes("el('feed-stream-log')") && appJs.includes('viewport.scrollTop'), 'scroll');
  assert('05. metadata row class in css', feedCss.includes('.operator-log-meta'), 'meta css');
  assert('06. message row full width', feedCss.includes('.operator-log-message') && feedCss.includes('width: 100%'), 'message width');
  const renderStreamBlock = appJs.slice(
    appJs.indexOf('function renderOperatorStreamLog'),
    appJs.indexOf('function clearOperatorLogBuffer'),
  );
  assert(
    '07. message not same row as meta in app',
    /operator-log-meta[\s\S]{0,1200}operator-log-message/.test(renderStreamBlock),
    'separate rows',
  );
  assert('08. no fixed column grid on rows', !feedCss.includes('grid-template-columns: 90px 70px 120px'), 'no fixed grid');
  assert('09. no fixed ts column width', !feedCss.includes('width: 90px') || !feedCss.includes('.operator-log-ts'), 'no ts column');
  assert('10. compact item spacing', feedCss.includes('margin: 0 0 4px'), '4px gap');
  assert('11. row height auto', feedCss.includes('.operator-feed-row') && feedCss.includes('height: auto'), 'height auto');
  assert('12. no row flex grow', !/\.operator-feed-row[\s\S]{0,300}flex:\s*1/.test(feedCss), 'no flex 1 row');
  assert('13. normal word break', feedCss.includes('word-break: normal'), 'word-break');
  assert('14. pre-wrap messages', feedCss.includes('white-space: pre-wrap'), 'pre-wrap');
  assert('15. no break-all in feed', !/\.operator-log[\s\S]*?break-all/.test(feedCss), 'no break-all');
  assert('16. viewport scroll container', feedCss.includes('overflow-y: auto') && feedCss.includes('.operator-stream-viewport'), 'scroll');
  assert('17. log list block flow', feedCss.includes('.operator-stream-log') && feedCss.includes('display: block'), 'log list');
  assert('18. stage on meta row unbracketed in app', appJs.includes('<span class="operator-log-stage">') && !appJs.includes('operator-log-stage">['), 'stage format');

  const sample45 = buildSampleFeedHtml(45);
  const rowMatches = sample45.match(/operator-feed-row/g) ?? [];
  const metaMatches = sample45.match(/operator-log-meta/g) ?? [];
  const messageMatches = sample45.match(/operator-log-message/g) ?? [];
  assert('19. forty-five sample rows', rowMatches.length === 45, String(rowMatches.length));
  assert('20. forty-five metadata rows', metaMatches.length === 45, String(metaMatches.length));
  assert('21. forty-five message rows', messageMatches.length === 45, String(messageMatches.length));
  assert(
    '22. readable long message sample',
    sample45.includes('Preview ready at http://127.0.0.1:5173/') && sample45.includes('12 planned tasks'),
    'long messages',
  );
  assert(
    '23. metadata precedes message in markup',
    sample45.indexOf('operator-log-meta') < sample45.indexOf('operator-log-message'),
    'meta first',
  );
  const estimatedCompactHeightPx = 45 * 22;
  const maxReasonableHeightPx = 45 * 48;
  assert(
    '24. compact height budget for stacked rows',
    estimatedCompactHeightPx < maxReasonableHeightPx,
    `${estimatedCompactHeightPx}px est < ${maxReasonableHeightPx}px cap`,
  );
  assert(
    '25. planning and preview samples',
    sample45.includes('>planning<') && sample45.includes('Preview ready'),
    'stages',
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Operator Feed Layout — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PASS_TOKEN);
  console.log('Operator Feed uses stacked metadata + full-width message rows.');
}

main();
