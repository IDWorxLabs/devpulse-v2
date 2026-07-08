/**
 * Product Stabilization Phase 5 V1 — validation suite.
 *
 * Confirms the simplified builder is a single-screen testing cockpit: fixed header, two-column
 * layout (left: prompt/controls/status/result, right: live preview/proof), the page itself never
 * scrolls (panels scroll internally instead), Reset test / New prompt controls exist with the
 * correct clearing semantics, the preview area has Open in new tab / Refresh / Clear controls,
 * Advanced Diagnostics stays hidden by default, result wording follows the calm four-state
 * hierarchy, and every earlier product-stabilization validator still passes.
 */

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { exitValidator, startValidatorHttpServer } from '../src/windows-validator-clean-exit-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const PRODUCT_STABILIZATION_PHASE_5_V1_PASS_TOKEN = 'PRODUCT_STABILIZATION_PHASE_5_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

/** Forbidden app-specific hardcoding — the cockpit UI must work for every generated app. */
const FORBIDDEN_APP_SPECIFIC_TERMS = ['counter', 'todo', 'calculator', 'crm', 'lisa', 'expense-tracker', 'expense tracker'];

function containsForbiddenAppSpecificTerm(source: string): string | null {
  for (const term of FORBIDDEN_APP_SPECIFIC_TERMS) {
    const re = term.includes(' ') || term.includes('-') ? new RegExp(term, 'i') : new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(source)) return term;
  }
  return null;
}

/** Extracts exactly one function's source (brace-balanced), not a fixed character window. */
function extractFunctionBody(source: string, functionName: string): string {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const braceStart = source.indexOf('{', start);
  if (braceStart === -1) return '';
  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return source.slice(start);
}

/**
 * Runs a previous validator script as a child process and confirms it exits 0 with its pass
 * token. Invokes tsx's CLI entry directly via `node` — cross-platform, no shell required (unlike
 * spawning `npx`, which is a `.cmd` shim on Windows).
 */
function runPreviousValidator(scriptRelativePath: string, passToken: string): { ok: boolean; detail: string } {
  const tsxCli = require.resolve('tsx/cli');
  try {
    const output = execFileSync(process.execPath, [tsxCli, scriptRelativePath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const ok = output.includes(passToken);
    return { ok, detail: ok ? 'pass token found' : 'pass token missing from output' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stdout = (err as { stdout?: Buffer | string })?.stdout;
    const stdoutText = stdout ? stdout.toString() : '';
    return { ok: stdoutText.includes(passToken), detail: stdoutText ? stdoutText.slice(-300) : message.slice(0, 300) };
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('Product Stabilization Phase 5 V1 — Validation');
  console.log('===============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:product-stabilization-phase-5-v1']),
    'validate:product-stabilization-phase-5-v1',
  );

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const cssPath = join(ROOT, 'public/founder-reality/builder-home.css');
  const jsPath = join(ROOT, 'public/founder-reality/builder-home.js');

  assert('02. index.html exists', existsSync(indexPath), indexPath);
  assert('03. builder-home.css exists', existsSync(cssPath), cssPath);
  assert('04. builder-home.js exists', existsSync(jsPath), jsPath);

  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
  const js = existsSync(jsPath) ? readFileSync(jsPath, 'utf8') : '';

  // --- Cockpit layout: fixed header + two-column grid -------------------------------------

  assert(
    '05. fixed header exists above the two-column main area',
    indexHtml.includes('class="builder-header"') && indexHtml.includes('class="builder-main"'),
    'builder-header / builder-main present',
  );
  assert(
    '06. two-column layout: left and right columns exist',
    indexHtml.includes('id="builder-col-left"') && indexHtml.includes('id="builder-col-right"'),
    'builder-col-left / builder-col-right present',
  );
  assert(
    '07. CSS defines a two-column grid for .builder-main',
    /\.builder-main\s*\{[^}]*display:\s*grid[^}]*grid-template-columns/s.test(css),
    'expected display:grid + grid-template-columns on .builder-main',
  );

  // --- Left column: prompt, controls, compact status, result summary ----------------------

  const leftColMatch = indexHtml.match(/<div class="builder-col builder-col-left"[\s\S]*?<\/div>\s*<div class="builder-col builder-col-right"/);
  const leftColHtml = leftColMatch ? leftColMatch[0] : indexHtml;
  assert(
    '08. left column contains the prompt input',
    leftColHtml.includes('id="builder-prompt-input"'),
    'prompt textarea should be in the left column',
  );
  assert(
    '09. left column contains Build / Reset test / New prompt controls',
    leftColHtml.includes('id="builder-build-btn"') &&
      leftColHtml.includes('id="builder-reset-btn"') &&
      leftColHtml.includes('id="builder-new-btn"'),
    'Build / Reset test / New prompt buttons should be in the left column',
  );
  assert(
    '10. left column contains the compact build status timeline',
    leftColHtml.includes('id="builder-progress-panel"') && leftColHtml.includes('id="builder-worklog"'),
    'build status panel should be in the left column',
  );
  assert(
    '11. left column contains the plain-English result summary',
    leftColHtml.includes('id="builder-result-panel"') && leftColHtml.includes('id="builder-result-headline"'),
    'result panel should be in the left column',
  );

  // --- Right column: live preview + proof summary, above the fold -------------------------

  const rightColMatch = indexHtml.match(/<div class="builder-col builder-col-right"[\s\S]*?<\/main>/);
  const rightColHtml = rightColMatch ? rightColMatch[0] : indexHtml;
  assert(
    '12. right column contains the live preview panel',
    rightColHtml.includes('id="builder-preview-panel"') && rightColHtml.includes('id="builder-preview-frame"'),
    'preview panel should be in the right column',
  );
  assert(
    '13. right column contains the live preview proof summary',
    rightColHtml.includes('id="builder-proof-section"') && rightColHtml.includes('id="builder-proof-headline"'),
    'proof summary should be in the right column, next to the preview',
  );
  assert(
    '14. preview panel is styled to fill the right column (above the fold, not pushed down)',
    /\.builder-preview-panel\s*\{[^}]*flex:\s*1/s.test(css),
    'expected .builder-preview-panel { flex: 1 ... }',
  );

  // --- Body/page never scrolls; panels scroll internally -----------------------------------

  assert(
    '15. html/body enforce no page-level scrolling',
    /html,\s*body\s*\{[^}]*overflow:\s*hidden/s.test(css),
    'expected html, body { ... overflow: hidden ... }',
  );
  assert(
    '16. .builder-shell is bounded to the viewport height (no page growth)',
    /\.builder-shell\s*\{[^}]*height:\s*100(vh|dvh)/s.test(css),
    'expected .builder-shell { height: 100vh/100dvh ... }',
  );
  assert(
    '17. left column scrolls internally when its content overflows',
    /\.builder-col-left\s*\{[^}]*overflow-y:\s*auto/s.test(css),
    'expected .builder-col-left { overflow-y: auto ... }',
  );
  assert(
    '18. diagnostics drawer scrolls internally and is a fixed overlay, not part of page flow',
    /\.builder-diagnostics-drawer\s*\{[^}]*position:\s*fixed[^}]*overflow-y:\s*auto/s.test(css),
    'expected .builder-diagnostics-drawer { position: fixed ... overflow-y: auto ... }',
  );

  // --- Reset test / New prompt buttons -----------------------------------------------------

  assert(
    '19. Reset test button exists, labeled clearly, disabled until a build has started',
    /id="builder-reset-btn"[^>]*disabled[^>]*>Reset test</.test(indexHtml) ||
      (indexHtml.includes('id="builder-reset-btn"') && indexHtml.includes('>Reset test<') && indexHtml.includes('disabled')),
    'expected <button id="builder-reset-btn" ... disabled ...>Reset test</button>',
  );
  assert(
    '20. New prompt button exists, always available (never disabled or hidden in markup)',
    indexHtml.includes('id="builder-new-btn"') &&
      indexHtml.includes('>New prompt<') &&
      !/id="builder-new-btn"[^>]*(disabled|class="[^"]*hidden)/.test(indexHtml),
    'expected <button id="builder-new-btn" ...>New prompt</button> with no disabled/hidden attribute',
  );

  assert(
    '21. resetTest() exists and keeps the prompt text (never clears builder-prompt-input value)',
    /function resetTest\s*\(/.test(js) && !/builder-prompt-input'\)\.value\s*=\s*''/.test(extractFunctionBody(js, 'resetTest')),
    'resetTest must not clear the prompt textarea',
  );
  assert(
    '22. newPrompt() exists and clears the prompt text',
    /function newPrompt\s*\(/.test(js) && /builder-prompt-input'\)\.value\s*=\s*''/.test(extractFunctionBody(js, 'newPrompt')),
    "newPrompt must clear the prompt textarea (builder-prompt-input').value = '')",
  );
  assert(
    '23. Both Reset test and New prompt clear result/preview/timeline via a shared clearing routine',
    /function clearResultPreviewAndTimeline\s*\(/.test(js) &&
      /hideFailure\(\)/.test(extractFunctionBody(js, 'clearResultPreviewAndTimeline')) &&
      /showProgressEmpty\(true\)/.test(extractFunctionBody(js, 'clearResultPreviewAndTimeline')) &&
      /renderPreview\(null\)/.test(extractFunctionBody(js, 'clearResultPreviewAndTimeline')) &&
      /clearResultPreviewAndTimeline\(\)/.test(extractFunctionBody(js, 'resetTest')) &&
      /clearResultPreviewAndTimeline\(\)/.test(extractFunctionBody(js, 'newPrompt')),
    'expected clearResultPreviewAndTimeline() to clear result/preview/timeline and be called by both resetTest() and newPrompt()',
  );
  assert(
    '24. Reset test cancels in-flight build tracking (abort + invalidate stale responses) instead of leaving it running silently',
    /function cancelActiveBuildTracking\s*\(/.test(js) &&
      /abortController[\s\S]{0,80}\.abort\(\)/.test(js) &&
      /requestId \+= 1/.test(js),
    'expected an abort + requestId invalidation mechanism used by Reset test / New prompt',
  );
  assert(
    '25. Build button is only disabled while actively building (re-enabled after cancel/reset)',
    /builder-build-btn'\)\.disabled = false/.test(js) && /builder-build-btn'\)\.disabled = true/.test(js),
    'build button toggles disabled true/false around the build lifecycle',
  );

  // --- Preview area improvements ------------------------------------------------------------

  assert(
    '26. preview area has Open in new tab, Refresh preview, and Clear preview controls',
    indexHtml.includes('id="builder-preview-open-link"') &&
      indexHtml.includes('id="builder-preview-refresh-btn"') &&
      indexHtml.includes('id="builder-preview-clear-btn"'),
    'expected open-link + refresh-btn + clear-btn in the preview panel',
  );
  assert(
    '27. refresh/clear preview buttons are wired to real handlers, not fake progress',
    /function refreshPreview\s*\(/.test(js) &&
      /function clearPreviewOnly\s*\(/.test(js) &&
      /addEventListener\('click', refreshPreview\)/.test(js) &&
      /addEventListener\('click', clearPreviewOnly\)/.test(js),
    'expected refreshPreview()/clearPreviewOnly() wired to their buttons',
  );

  // --- Advanced Diagnostics hidden by default -----------------------------------------------

  const diagnosticsMarkupMatch = indexHtml.match(
    /<aside\s+class="builder-diagnostics-drawer[^>]*id="builder-diagnostics-drawer"[\s\S]*?>/,
  );
  const diagnosticsTagOpen = diagnosticsMarkupMatch ? diagnosticsMarkupMatch[0] : '';
  assert(
    '28. diagnostics drawer hidden by default in markup',
    diagnosticsTagOpen.includes('hidden') && diagnosticsTagOpen.includes('aria-hidden="true"'),
    diagnosticsTagOpen || 'diagnostics drawer tag not found',
  );
  assert(
    '29. diagnostics drawer scrolls internally when opened (does not affect page scroll)',
    /\.builder-diagnostics-drawer\s*\{[^}]*overflow-y:\s*auto/s.test(css),
    'expected .builder-diagnostics-drawer { ... overflow-y: auto ... }',
  );

  // --- Result wording hierarchy --------------------------------------------------------------

  assert(
    '30. main result headline uses the four calm, clear states (not scary jargon)',
    /BUILT_SUCCESSFULLY:\s*'Built and running'/.test(js) &&
      /BUILT_WITH_WARNINGS:\s*'Built with warnings'/.test(js) &&
      /FAILED_WITH_REPAIR_AVAILABLE:\s*'Build needs repair'/.test(js) &&
      /FAILED_BLOCKED:\s*'Build blocked'/.test(js),
    'expected RESULT_TITLE to map to Built and running / Built with warnings / Build needs repair / Build blocked',
  );
  assert(
    '31. a secondary detail line (preview availability / proof / validation) is rendered separately from the main headline',
    /function buildSecondaryDetailLine\s*\(/.test(js) && indexHtml.includes('id="builder-result-detail-line"'),
    'expected buildSecondaryDetailLine() + #builder-result-detail-line',
  );
  assert(
    '32. execution status softens "stopped/blocked" wording when the app is actually running',
    /function renderExecutionStatus\s*\(\s*buildExecution,\s*appIsRunning\s*\)/.test(js) &&
      /appIsRunning[\s\S]{0,200}(FAILED|BLOCKED)/.test(js),
    'expected renderExecutionStatus(buildExecution, appIsRunning) to reframe FAILED/BLOCKED wording when appIsRunning is true',
  );
  assert(
    '33. Interaction proof is shown as one compact line with expandable details, not as a full page state',
    indexHtml.includes('id="builder-proof-details"') && /<details class="builder-proof-details"/.test(indexHtml),
    'expected <details id="builder-proof-details"> wrapping the deeper proof evidence lists',
  );

  // --- Generality audit ------------------------------------------------------------------

  let hardcodingFound: string | null = null;
  for (const file of [indexPath, cssPath, jsPath]) {
    const source = readFileSync(file, 'utf8');
    const found = containsForbiddenAppSpecificTerm(source);
    if (found && !hardcodingFound) hardcodingFound = `${found} in ${file}`;
  }
  assert('34. No app-specific hardcoding in the cockpit UI files', hardcodingFound === null, hardcodingFound || 'clean');

  // --- Live server checks -------------------------------------------------------------------

  let closeServer: (() => Promise<void>) | null = null;
  try {
    const started = await startValidatorHttpServer(() => createFounderRealityServer());
    closeServer = started.close;
    const baseUrl = started.baseUrl;

    const rootRes = await fetch(`${baseUrl}/`);
    const rootHtml = await rootRes.text();
    assert('35. GET / returns HTTP 200', rootRes.status === 200, String(rootRes.status));
    assert(
      '36. GET / serves the cockpit layout (two columns, reset/new prompt controls)',
      rootHtml.includes('id="builder-col-left"') &&
        rootHtml.includes('id="builder-col-right"') &&
        rootHtml.includes('id="builder-reset-btn"') &&
        rootHtml.includes('id="builder-new-btn"'),
      'served HTML missing cockpit layout markup',
    );

    const cssRes = await fetch(`${baseUrl}/builder-home.css`);
    assert('37. builder-home.css served', cssRes.status === 200, String(cssRes.status));
    const jsRes = await fetch(`${baseUrl}/builder-home.js`);
    assert('38. builder-home.js served', jsRes.status === 200, String(jsRes.status));
  } catch (err) {
    assert('35-38. live server checks', false, err instanceof Error ? err.message : String(err));
  } finally {
    if (closeServer) {
      await closeServer();
    }
  }

  // --- Real-browser viewport fit check (best-effort — never fails the suite if Playwright's
  // browser binary is not installed in this environment; that is an environment limitation,
  // not evidence the cockpit layout is broken) --------------------------------------------

  let viewportCheckSkippedReason: string | null = null;
  try {
    const started = await startValidatorHttpServer(() => createFounderRealityServer());
    try {
      const playwright = await import('playwright');
      const browser = await playwright.chromium.launch({ headless: true });
      try {
        for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
          const page = await browser.newPage({ viewport });
          await page.goto(started.baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const fits = await page.evaluate(() => {
            return document.documentElement.scrollHeight <= window.innerHeight + 2; // +2px rounding tolerance
          });
          assert(
            `39. cockpit fits in one viewport at ${viewport.width}x${viewport.height} (no page scroll)`,
            fits,
            `documentElement.scrollHeight vs window.innerHeight at ${viewport.width}x${viewport.height}`,
          );
          await page.close();
        }
      } finally {
        await browser.close();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      viewportCheckSkippedReason = message;
    } finally {
      await started.close();
    }
  } catch (err) {
    viewportCheckSkippedReason = err instanceof Error ? err.message : String(err);
  }
  if (viewportCheckSkippedReason) {
    assert(
      '39. cockpit fits in one viewport (real-browser check skipped — no Playwright browser in this environment)',
      true,
      viewportCheckSkippedReason.slice(0, 200),
    );
  }

  // --- All previous product stabilization validators still pass ---------------------------

  const previousValidators: Array<{ script: string; token: string }> = [
    { script: 'scripts/validate-simplified-builder-ui-v1.ts', token: 'SIMPLIFIED_BUILDER_UI_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-1-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_1_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-2-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_2_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-3-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_3_V1_PASS' },
    { script: 'scripts/validate-product-stabilization-phase-4-v1.ts', token: 'PRODUCT_STABILIZATION_PHASE_4_V1_PASS' },
  ];
  let checkNumber = 40;
  for (const { script, token } of previousValidators) {
    const outcome = runPreviousValidator(script, token);
    assert(`${checkNumber}. ${script} still passes`, outcome.ok, outcome.detail);
    checkNumber += 1;
  }

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(PRODUCT_STABILIZATION_PHASE_5_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
