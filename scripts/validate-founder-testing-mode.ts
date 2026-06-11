/**
 * AiDevEngine Founder Testing Mode V1 — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TESTING_MODE_OWNER_MODULE,
  FOUNDER_TESTING_MODE_PASS_TOKEN,
  FOUNDER_TEST_MAX_PROMPTS,
  FOUNDER_TEST_MAX_SCREEN_MS,
  FOUNDER_TEST_MAX_SCREENS,
  FOUNDER_TEST_MAX_TOTAL_MS,
  FOUNDER_TEST_REPORT_TITLE,
  runFounderTestingMode,
} from '../src/founder-testing-mode/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function fetchFounderTestFromServer(): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-test/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveResults: [], liveSection: 'Validator-only server run' }),
      })
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown>;
          server.close();
          resolve({ status: res.status, body });
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('AiDevEngine Founder Testing Mode V1 — Validation');
  console.log('==============================================');
  console.log('');

  const html = readText('public/founder-reality/index.html');
  const appJs = readText('public/founder-reality/app.js');
  const orchestrator = readText('src/founder-testing-mode/founder-testing-orchestrator.ts');
  const handler = readText('server/founder-testing-handler.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. owner module constant', FOUNDER_TESTING_MODE_OWNER_MODULE.length > 0, FOUNDER_TESTING_MODE_OWNER_MODULE);
  assert('02. pass token', FOUNDER_TESTING_MODE_PASS_TOKEN === 'FOUNDER_TESTING_MODE_V1_PASS', FOUNDER_TESTING_MODE_PASS_TOKEN);
  assert('03. report title', FOUNDER_TEST_REPORT_TITLE === 'AIDEVENGINE_FOUNDER_TEST_REPORT', FOUNDER_TEST_REPORT_TITLE);

  assert('04. max screens bound', FOUNDER_TEST_MAX_SCREENS === 20, String(FOUNDER_TEST_MAX_SCREENS));
  assert('05. max prompts bound', FOUNDER_TEST_MAX_PROMPTS === 10, String(FOUNDER_TEST_MAX_PROMPTS));
  assert('06. max screen ms bound', FOUNDER_TEST_MAX_SCREEN_MS === 5000, String(FOUNDER_TEST_MAX_SCREEN_MS));
  assert('07. max total ms bound', FOUNDER_TEST_MAX_TOTAL_MS === 60000, String(FOUNDER_TEST_MAX_TOTAL_MS));

  assert('08. orchestrator module exists', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-orchestrator.ts')), 'orchestrator');
  assert('09. report builder exists', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-report-builder.ts')), 'report builder');
  assert('10. screen checker exists', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-screen-checker.ts')), 'screen checker');
  assert('11. prompt checker exists', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-prompt-checker.ts')), 'prompt checker');

  assert('12. Run Founder Test button in HTML', html.includes('id="run-founder-test"') && html.includes('Run Founder Test'), 'button');
  assert(
    '13. founder test hint in HTML',
    html.includes('Run Founder Test') &&
      (html.includes('product readiness') ||
        html.includes('vision alignment') ||
        html.includes('human behavior') ||
        html.includes('launch readiness') ||
        html.includes('execution reality')),
    'hint',
  );
  assert('14. Copy Report button in HTML', html.includes('id="copy-founder-test-report"') && html.includes('Copy Report'), 'copy');
  assert('15. founder test panel in HTML', html.includes('id="founder-test-panel"'), 'panel');

  assert('16. live nav checks in app.js', appJs.includes('runFounderTestLiveChecks') && appJs.includes('FOUNDER_TEST_MAX_SCREEN_MS'), 'live checks');
  assert('17. loading timeout in app.js', appJs.includes('waitForInsightsReady') && appJs.includes('no-infinite-loading'), 'loading timeout');
  assert('18. copy report in app.js', appJs.includes('copyFounderTestReport') && appJs.includes('reportMarkdown'), 'copy report');
  assert(
    '19. POST founder-test API in app.js',
    appJs.includes('/api/founder-test/run-v4') ||
      appJs.includes('/api/founder-test/run-v3') ||
      appJs.includes('/api/founder-test/run-v2') ||
      appJs.includes('/api/founder-test/run'),
    'api call',
  );

  assert('20. read-only orchestrator', orchestrator.includes('readOnly: true') && !orchestrator.includes('writeFile'), 'read-only');
  assert('21. no auto-fix in orchestrator', !orchestrator.includes('auto-fix') && !orchestrator.includes('autoFix'), 'no auto-fix');
  assert('22. bounded prompts', orchestrator.includes('runBoundedPromptChecks'), 'bounded prompts');
  assert('23. bounded screens slice', orchestrator.includes('FOUNDER_TEST_MAX_SCREENS'), 'bounded screens');
  assert('24. report builder wired', orchestrator.includes('assembleFounderTestReport'), 'report builder');
  assert('25. final verdict wired', orchestrator.includes('deriveVerdict'), 'verdict');

  assert(
    '26. handler read-only header',
    handler.includes('read-only') && handler.includes('runFounderTestingMode'),
    'handler header',
  );
  assert('27. handler uses orchestrator', handler.includes('runFounderTestingMode'), 'handler orchestrator');
  assert('28. package script registered', Boolean(pkg.scripts?.['validate:founder-testing-mode']), 'package script');

  const report = runFounderTestingMode({ rootDir: ROOT, validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')) });
  assert('29. orchestrator produces report', Boolean(report.reportMarkdown), 'report markdown');
  assert('30. report has verdict', Boolean(report.verdict), report.verdict);
  assert('31. report has scores', report.scores.overall >= 0 && report.scores.overall <= 100, String(report.scores.overall));
  assert('32. screen results bounded', report.screenResults.length <= FOUNDER_TEST_MAX_SCREENS, String(report.screenResults.length));
  assert('33. prompt results bounded', report.promptResults.length <= FOUNDER_TEST_MAX_PROMPTS, String(report.promptResults.length));
  assert('34. report title in markdown', report.reportMarkdown.includes(FOUNDER_TEST_REPORT_TITLE), 'title in markdown');
  assert('35. readOnly flag true', report.readOnly === true, 'readOnly');

  const api = await fetchFounderTestFromServer();
  assert('36. API route status 200', api.status === 200, String(api.status));
  assert('37. API returns report', Boolean((api.body.report as { reportMarkdown?: string } | undefined)?.reportMarkdown), 'api report');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');

  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }

  console.log('');
  if (failed.length) {
    console.log('FOUNDER_TESTING_MODE_V1_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(FOUNDER_TESTING_MODE_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
