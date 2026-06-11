/**
 * AiDevEngine Operator Feed Detail Upgrade — validation.
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
  const styles = readText('public/founder-reality/styles.css');
  const catalog = readText('src/command-center-brain/operator-feed-detail-catalog.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. detail catalog exists', existsSync(join(ROOT, 'src/command-center-brain/operator-feed-detail-catalog.ts')), 'catalog');
  assert('02. enrich events in brain', catalog.includes('enrichOperatorFeedEvents'), 'enrich');
  assert('03. idle copy exported', Object.keys(FEED_SECTION_IDLE_COPY).length === 5, String(Object.keys(FEED_SECTION_IDLE_COPY).length));
  assert('04. package script', Boolean(pkg.scripts?.['validate:operator-feed-detail-upgrade']), 'package');
  assert('05. no waiting for pipeline', !appJs.includes('Waiting for pipeline'), 'removed vague copy');
  assert('06. feed action line UI', appJs.includes('feed-action-line') && styles.includes('feed-action-line'), 'action line');
  assert('07. feed detail line UI', appJs.includes('feed-detail-line'), 'detail line');
  assert('08. feed step line UI', appJs.includes('feed-step-line'), 'step line');
  assert('09. idle feed copy', appJs.includes('Ready to classify your next request'), 'idle');
  assert('10. founder test feed steps', appJs.includes('Starting Founder Testing V4') && appJs.includes('streamFounderTestFeed'), 'founder feed');
  assert('11. command center request received', appJs.includes('Request received'), 'cc request');
  assert(
    '12. private reasoning guard',
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
    assert(`13.forbidden.${phrase}`, !inFeedCopy, phrase);
  }

  const enriched = enrichOperatorFeedEvents(OPERATOR_FEED_EVENT_SEQUENCE, Date.now());
  assert('14. enriched events have action', enriched.every((e) => Boolean(e.action)), String(enriched.length));
  assert('15. enriched events have detail', enriched.every((e) => Boolean(e.detail)), 'detail');
  assert('16. enriched events have steps', enriched.every((e) => e.stepIndex && e.stepTotal), 'steps');

  const identity = processBrainRequest({ message: 'What is AiDevEngine?' });
  const identityEvents = identity.operatorFeedEvents ?? [];
  assert('17. product identity feed', identityEvents.length === PRODUCT_IDENTITY_OPERATOR_FEED.length, String(identityEvents.length));
  assert(
    '18. identity routing detail',
    identityEvents.some((e) => /product identity|product alignment|intent classified/i.test((e.action ?? '') + (e.detail ?? ''))),
    identityEvents.map((e) => e.action).join(', '),
  );

  const brain = processBrainRequest({ message: 'What should we build next?' });
  const events = brain.operatorFeedEvents ?? [];
  assert('19. brain feed activated', events.length > 0, String(events.length));
  assert(
    '20. no vague-only events',
    events.every((e) => (e.action ?? '').length > 8 && (e.detail ?? '').length > 12),
    events[0]?.action ?? 'none',
  );

  const reportPath = join(ROOT, 'architecture', 'AIDEVENGINE_OPERATOR_FEED_DETAIL_UPGRADE_REPORT.md');
  assert('21. upgrade report exists', existsSync(reportPath), reportPath);

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
