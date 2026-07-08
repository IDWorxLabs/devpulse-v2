/**
 * Simplified Builder UI V1 — validation suite.
 *
 * Confirms AiDevEngine V4 opens directly into a simplified prompt -> build -> preview
 * experience, that the previous complex Command Center is no longer the default route
 * (but remains reachable as an Advanced surface), that Advanced/Diagnostics is hidden
 * by default, and that no core engine folders were deleted while simplifying the UI.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { exitValidator, startValidatorHttpServer } from '../src/windows-validator-clean-exit-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const SIMPLIFIED_BUILDER_UI_V1_PASS_TOKEN = 'SIMPLIFIED_BUILDER_UI_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

/** Representative sample of core engineering systems that must survive UI simplification. */
const CORE_ENGINE_FOLDERS = [
  'src/one-prompt-live-preview',
  'src/chat-to-build-execution-bridge-v1',
  'src/autonomous-engineering-executive',
  'src/autonomous-engineering-loop',
  'src/autonomous-software-engineering-engine',
  'src/code-generation-engine',
  'src/code-generation-planner',
  'src/live-preview-gate',
  'src/live-preview-runtime',
  'src/project-registry-v1',
  'src/project-session-continuity-v1',
  'src/execution-trace',
  'src/execution-runtime',
  'src/recovery-planner',
  'src/recovery-strategy-engine',
  'src/verification-registry',
  'src/verification-orchestrator',
  'src/build-intent-routing',
  'src/universal-prompt-to-app-materialization',
  'src/world2-execution-engine',
  'src/trust-engine',
  'src/founder-action-center',
  'src/project-vault',
];

async function main(): Promise<void> {
  console.log('');
  console.log('Simplified Builder UI V1 — Validation');
  console.log('======================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:simplified-builder-ui-v1']),
    'validate:simplified-builder-ui-v1',
  );

  // --- Static files -------------------------------------------------------

  const indexPath = join(ROOT, 'public/founder-reality/index.html');
  const commandCenterPath = join(ROOT, 'public/founder-reality/command-center.html');
  const builderHomeJsPath = join(ROOT, 'public/founder-reality/builder-home.js');
  const builderHomeCssPath = join(ROOT, 'public/founder-reality/builder-home.css');

  assert('02. simplified index.html exists', existsSync(indexPath), indexPath);
  assert('03. advanced command-center.html preserved', existsSync(commandCenterPath), commandCenterPath);
  assert('04. builder-home.js exists', existsSync(builderHomeJsPath), builderHomeJsPath);
  assert('05. builder-home.css exists', existsSync(builderHomeCssPath), builderHomeCssPath);

  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const commandCenterHtml = existsSync(commandCenterPath) ? readFileSync(commandCenterPath, 'utf8') : '';
  const builderHomeJs = existsSync(builderHomeJsPath) ? readFileSync(builderHomeJsPath, 'utf8') : '';

  assert(
    '06. default route is BuilderHome, not the old Command Center',
    indexHtml.includes('data-component="BuilderHome"') && !indexHtml.includes('data-view="command-center"'),
    'index.html must render BuilderHome shell',
  );
  assert(
    '07. confusing legacy nav items are not in the default experience',
    !/Action Center|Product Coherence|Project Memory|Founder Review|Project Insights/.test(indexHtml),
    'legacy nav labels absent from index.html',
  );
  assert(
    '08. old Command Center UI still exists and is reachable (not deleted)',
    commandCenterHtml.includes('id="chat-surface"') && commandCenterHtml.includes('nav-item'),
    'command-center.html retains full legacy shell',
  );

  // --- Required regions -----------------------------------------------------

  assert('09. prompt textarea exists', indexHtml.includes('id="builder-prompt-input"'), 'PromptBuilderPanel textarea');
  assert('10. build button exists', indexHtml.includes('id="builder-build-btn"'), 'Build button');
  assert(
    '11. live preview region exists',
    indexHtml.includes('id="builder-preview-panel"') && indexHtml.includes('id="builder-preview-frame"'),
    'LivePreviewPanel',
  );
  assert(
    '12. progress/evidence region exists',
    indexHtml.includes('id="builder-progress-panel"') && indexHtml.includes('id="builder-worklog"'),
    'BuildProgressPanel work log',
  );
  assert(
    '13. failure region exists',
    indexHtml.includes('id="builder-result-panel"') && indexHtml.includes('id="builder-result-headline"'),
    'BuildFailurePanel',
  );
  assert(
    '14. retry / repair flow exists',
    builderHomeJs.includes('Retry build') && builderHomeJs.includes('describeRepairAttempts'),
    'Retry + repair evidence',
  );

  // --- Advanced diagnostics hidden by default --------------------------------

  const diagnosticsMarkupMatch = indexHtml.match(
    /<aside\s+class="builder-diagnostics-drawer[^>]*id="builder-diagnostics-drawer"[\s\S]*?>/,
  );
  const diagnosticsTagOpen = diagnosticsMarkupMatch ? diagnosticsMarkupMatch[0] : '';
  assert(
    '15. diagnostics drawer present',
    indexHtml.includes('data-component="DiagnosticsDrawer"'),
    'DiagnosticsDrawer element',
  );
  assert(
    '16. diagnostics drawer hidden by default in markup',
    /class="[^"]*\bhidden\b[^"]*"/.test(diagnosticsTagOpen) &&
      diagnosticsTagOpen.includes('hidden') &&
      diagnosticsTagOpen.includes('aria-hidden="true"'),
    diagnosticsTagOpen || 'diagnostics drawer tag not found',
  );
  assert(
    '17. advanced surfaces reachable but not dominant',
    indexHtml.includes('Advanced / Diagnostics') && indexHtml.includes('href="/command-center"'),
    'Advanced entry points present',
  );

  // --- Real pipeline wiring (not fake progress) -------------------------------

  assert(
    '18. builder-home.js calls the real build API',
    builderHomeJs.includes("'/api/build/from-prompt'") || builderHomeJs.includes('/api/build/from-prompt'),
    'POST /api/build/from-prompt',
  );
  assert(
    '19. work log built from real engine output',
    builderHomeJs.includes('executionTraceEvents') && builderHomeJs.includes('progressItems'),
    'real stages, not fabricated',
  );
  assert(
    '20. no hardcoded fake progress simulation',
    !/setTimeout\s*\(\s*function[^)]*\)\s*,\s*\d+\s*\)[\s\S]{0,80}(complete|ready|progress)/i.test(builderHomeJs),
    'no setTimeout-driven fake progress',
  );

  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  assert(
    '21. server still routes /api/build/from-prompt to the real handler',
    serverTs.includes("'/api/build/from-prompt'") && serverTs.includes('handleBuildFromPromptRequest'),
    'real build pipeline route intact',
  );
  assert(
    '22. server maps /command-center to the advanced shell',
    serverTs.includes("'/command-center'"),
    'advanced route mapping',
  );

  // --- Core engine systems preserved ------------------------------------------

  for (const folder of CORE_ENGINE_FOLDERS) {
    assert(`23. core folder preserved — ${folder}`, existsSync(join(ROOT, folder)), folder);
  }

  // --- Live server check: default route + advanced route ----------------------

  let closeServer: (() => Promise<void>) | null = null;
  try {
    const started = await startValidatorHttpServer(() => createFounderRealityServer());
    closeServer = started.close;
    const baseUrl = started.baseUrl;

    const rootRes = await fetch(`${baseUrl}/`);
    const rootHtml = await rootRes.text();
    assert('24. GET / returns HTTP 200', rootRes.status === 200, String(rootRes.status));
    assert(
      '25. GET / serves the simplified builder, not the legacy Command Center',
      rootHtml.includes('id="builder-prompt-input"') && !rootHtml.includes('id="chat-surface"'),
      'default route content',
    );

    const advancedRes = await fetch(`${baseUrl}/command-center`);
    const advancedHtml = await advancedRes.text();
    assert('26. GET /command-center returns HTTP 200', advancedRes.status === 200, String(advancedRes.status));
    assert(
      '27. GET /command-center serves the full legacy shell',
      advancedHtml.includes('id="chat-surface"'),
      'advanced route content',
    );

    const cssRes = await fetch(`${baseUrl}/builder-home.css`);
    assert('28. builder-home.css served', cssRes.status === 200, String(cssRes.status));
    const jsRes = await fetch(`${baseUrl}/builder-home.js`);
    assert('29. builder-home.js served', jsRes.status === 200, String(jsRes.status));
  } catch (err) {
    assert('24-29. live server checks', false, err instanceof Error ? err.message : String(err));
  } finally {
    if (closeServer) {
      await closeServer();
    }
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
    console.log(SIMPLIFIED_BUILDER_UI_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
