/**
 * AiDevEngine Operator Feed Detail Upgrade — validation.
 * Proves terminal-style streamed log replaces legacy block cards as primary view.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  enrichOperatorFeedEvents,
  FEED_SECTION_IDLE_COPY,
  FORBIDDEN_VAGUE_FEED_PHRASES,
  PRODUCT_IDENTITY_OPERATOR_FEED,
  processBrainRequest,
} from '../src/command-center-brain/index.js';
import { OPERATOR_FEED_EVENT_SEQUENCE } from '../src/command-center-brain/brain-types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'OPERATOR_FEED_DETAIL_UPGRADE_PASS';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function main(): Promise<void> {
  console.log('');
  console.log('Operator Feed Detail Upgrade — Validation');
  console.log('=========================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const indexHtml = readText('public/founder-reality/index.html');
  const styles = readText('public/founder-reality/styles.css');
  const catalog = readText('src/command-center-brain/operator-feed-detail-catalog.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. detail catalog exists', existsSync(join(ROOT, 'src/command-center-brain/operator-feed-detail-catalog.ts')), 'catalog');
  assert('02. enrich events in brain', catalog.includes('enrichOperatorFeedEvents'), 'enrich');
  assert('03. idle copy exported', Object.keys(FEED_SECTION_IDLE_COPY).length === 5, String(Object.keys(FEED_SECTION_IDLE_COPY).length));
  assert('04. package script', Boolean(pkg.scripts?.['validate:operator-feed-detail-upgrade']), 'package');
  assert('05. no waiting for pipeline', !appJs.includes('Waiting for pipeline'), 'removed vague copy');

  assert('06. operator log buffer', appJs.includes('operatorLogBuffer') && appJs.includes('appendOperatorLogEntry'), 'buffer');
  assert(
    '07. terminal stream lines',
    appJs.includes('operator-stream-line') && styles.includes('.operator-stream-line'),
    'stream line',
  );
  assert(
    '08. stream render function',
    appJs.includes('renderOperatorStreamLog') && appJs.includes('getFilteredOperatorLogEntries'),
    'render',
  );
  assert(
    '09. empty state copy',
    appJs.includes('OPERATOR_LOG_EMPTY_TEXT') &&
      indexHtml.includes('No active run. Execution logs will stream here'),
    'empty',
  );
  assert(
    '10. feed header controls',
    indexHtml.includes('operator-feed-stream-mode') &&
      indexHtml.includes('operator-feed-errors-only-btn') &&
      indexHtml.includes('operator-feed-autoscroll') &&
      appJs.includes('initOperatorFeedControls'),
    'controls',
  );
  assert(
    '11. footer level filters',
    indexHtml.includes('operator-feed-footer') && indexHtml.includes('data-level-filter="ERROR"'),
    'filters',
  );
  assert(
    '12. legacy cards hidden',
    indexHtml.includes('feed-sections-legacy') &&
      styles.includes('.feed-sections-legacy') &&
      !appJs.includes('feed-section-card') &&
      !appJs.includes('feed-action-line'),
    'legacy hidden',
  );
  assert(
    '13. build response trail',
    appJs.includes('appendBuildResponseOperatorLog') &&
      appJs.includes('Build run started') &&
      appJs.includes('Preview URL') &&
      appJs.includes('Profile matched'),
    'build trail',
  );
  assert(
    '14. filter and search state',
    appJs.includes('errorsOnly') &&
      appJs.includes('searchQuery') &&
      appJs.includes('autoScroll') &&
      appJs.includes('copyOperatorLogToClipboard') &&
      appJs.includes('exportOperatorLog'),
    'filters',
  );
  assert(
    '15. chat separate from feed',
    appJs.includes('appendChatMessage(result.brainResponse') &&
      appJs.includes('streamOperatorFeedEvents') &&
      !appJs.includes("appendChatMessage(entry.message"),
    'chat split',
  );
  assert(
    '16. founder test feed stream',
    appJs.includes('founderTestFeedSteps') && appJs.includes('streamFounderTestFeed'),
    'founder feed',
  );
  assert('17. command center request received', appJs.includes('Request received'), 'cc request');
  assert(
    '18. private reasoning guard',
    !appJs.includes('chain-of-thought') && !/inner monologue|hidden reasoning dump/i.test(appJs + catalog),
    'safety',
  );

  for (const phrase of FORBIDDEN_VAGUE_FEED_PHRASES) {
    const inFeedCopy =
      appJs.includes("action: '" + phrase) ||
      appJs.includes('action: "' + phrase) ||
      appJs.includes("detail: '" + phrase) ||
      appJs.includes("textContent = '" + phrase) ||
      appJs.includes('Waiting for pipeline');
    assert(`19.forbidden.${phrase}`, !inFeedCopy, phrase);
  }

  const enriched = enrichOperatorFeedEvents(OPERATOR_FEED_EVENT_SEQUENCE, Date.now());
  assert('20. enriched events have action', enriched.every((e) => Boolean(e.action)), String(enriched.length));
  assert('21. enriched events have detail', enriched.every((e) => Boolean(e.detail)), 'detail');
  assert('22. enriched events have steps', enriched.every((e) => e.stepIndex && e.stepTotal), 'steps');

  const identity = processBrainRequest({ message: 'What is AiDevEngine?' });
  const identityEvents = identity.operatorFeedEvents ?? [];
  assert('23. product identity feed', identityEvents.length === PRODUCT_IDENTITY_OPERATOR_FEED.length, String(identityEvents.length));
  assert(
    '24. identity routing detail',
    identityEvents.some((e) => /product identity|product alignment|intent classified/i.test((e.action ?? '') + (e.detail ?? ''))),
    identityEvents.map((e) => e.action).join(', '),
  );

  const brain = processBrainRequest({ message: 'What should we build next?' });
  const events = brain.operatorFeedEvents ?? [];
  assert('25. brain feed activated', events.length > 0, String(events.length));
  assert(
    '26. no vague-only events',
    events.every((e) => (e.action ?? '').length > 8 && (e.detail ?? '').length > 12),
    events[0]?.action ?? 'none',
  );

  const reportPath = join(ROOT, 'architecture', 'AIDEVENGINE_OPERATOR_FEED_DETAIL_UPGRADE_REPORT.md');
  assert('27. upgrade report exists', existsSync(reportPath), reportPath);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length) {
    console.log('OPERATOR_FEED_DETAIL_UPGRADE_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
