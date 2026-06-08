/**
 * DevPulse V2 Real Browser Runner Attachment — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import {
  createRealBrowserRunnerAdapter,
  DevPulseV2BrowserVerificationHarness,
  formatBrowserVerificationReport,
  getRealBrowserRunnerStatus,
  HARNESS_PASS_TOKEN,
  REAL_BROWSER_OWNER_MODULE,
  REAL_BROWSER_PASS_TOKEN,
  resetDevPulseV2BrowserVerificationHarnessForTests,
  resetRealBrowserRunnerAdapterForTests,
} from '../src/browser-verification/index.js';
import { CHAT_PASS_TOKEN } from '../src/chat/types.js';
import { FEED_PASS_TOKEN } from '../src/operator-feed/types.js';
import { SOAK_PASS_TOKEN } from '../src/stability-soak/types.js';
import { SHELL_PASS_TOKEN } from '../src/shell/types.js';
import { TASK_GOVERNOR_PASS_TOKEN } from '../src/task-governor/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function runNpmScript(script: string, token: string): boolean {
  try {
    const output = execSync(`npm run ${script}`, { cwd: process.cwd(), encoding: 'utf8' });
    return output.includes(token);
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return ((err.stdout ?? '') + (err.stderr ?? '')).includes(token);
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Real Browser Runner Attachment Validation');
  console.log('========================================================');
  console.log('');

  resetRealBrowserRunnerAdapterForTests();

  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['real_browser_runner_attachment'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts real_browser_runner_attachment packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const adapter = await createRealBrowserRunnerAdapter();
  const runnerStatus = getRealBrowserRunnerStatus();

  assert(
    '2. Real browser runner adapter exists',
    adapter !== null &&
      (runnerStatus === 'ATTACHED' ||
        runnerStatus === 'PACKAGE_REQUIRED' ||
        runnerStatus === 'FAILED'),
    `status=${runnerStatus}`,
  );

  const owner = getDevPulseV2Owner('real_browser_runner_attachment');
  assert(
    '3. Ownership registry contains real_browser_runner_attachment',
    owner.ownerModule === REAL_BROWSER_OWNER_MODULE,
    `registered=${owner.ownerModule}`,
  );

  resetDevPulseV2BrowserVerificationHarnessForTests();
  const harness = resetDevPulseV2BrowserVerificationHarnessForTests();
  const result = await harness.runFoundationVerification('Real browser attachment test');
  const reportText = formatBrowserVerificationReport(result, harness.isRealBrowserRunnerAttached());

  assert(
    '4. Harness reports which runner was used',
    (result.runnerUsed === 'real-browser' || result.runnerUsed === 'simulated-html') &&
      reportText.includes(`Runner used:            ${result.runnerUsed}`),
    `runner=${result.runnerUsed}`,
  );

  const modeA =
    runnerStatus === 'ATTACHED' &&
    harness.isRealBrowserRunnerAttached() &&
    result.runnerUsed === 'real-browser' &&
    result.checks.some((c) => c.checkId.startsWith('RB-')) &&
    result.checks.filter((c) => c.checkId.startsWith('RB-')).every((c) => c.status !== 'FAIL') &&
    result.status !== 'FAIL';

  const modeB =
    runnerStatus !== 'ATTACHED' &&
    !harness.isRealBrowserRunnerAttached() &&
    result.runnerUsed === 'simulated-html' &&
    (result.warnings.some((w) => w.includes('REAL_BROWSER_PACKAGE_REQUIRED')) ||
      result.warnings.some((w) => w.toLowerCase().includes('real browser runner'))) &&
    result.status !== 'FAIL';

  assert(
    '5. Honest Mode A (real attached) or Mode B (package/fallback)',
    modeA || modeB,
    modeA
      ? 'Mode A: real browser attached and RB checks pass'
      : modeB
        ? `Mode B: status=${runnerStatus} fallback active`
        : `status=${runnerStatus} runner=${result.runnerUsed}`,
  );

  assert(
    '6. Real browser check targets covered when attached',
    modeB ||
      (result.checks.some((c) => c.checkId === 'RB-01') &&
        result.checks.some((c) => c.checkId === 'RB-05') &&
        result.checks.some((c) => c.checkId === 'RB-07') &&
        result.checks.some((c) => c.checkId === 'RB-09')),
    `rbChecks=${result.checks.filter((c) => c.checkId.startsWith('RB-')).length}`,
  );

  assert(
    '7. Simulated fallback still passes foundation checks when not attached',
    modeA ||
      (result.checks.some((c) => c.checkId === 'BV-01') &&
        result.checks.find((c) => c.checkId === 'BV-07')?.status === 'PASS'),
    `status=${result.status}`,
  );

  assert(
    '8. Harness ownership unchanged (no second harness)',
    DevPulseV2BrowserVerificationHarness.assertRegistryOwnership(),
    `owner=${DevPulseV2BrowserVerificationHarness.ownerModule}`,
  );

  assert(
    '9. Phase 1 soak validation still passes',
    runNpmScript('validate:phase-1-soak', SOAK_PASS_TOKEN),
    'soak ok',
  );

  assert(
    '10. Browser Harness validation still passes',
    runNpmScript('validate:browser-harness', HARNESS_PASS_TOKEN),
    'browser-harness ok',
  );

  assert(
    '11. Inline Operator Feed validation still passes',
    runNpmScript('validate:inline-operator-feed', FEED_PASS_TOKEN),
    'feed ok',
  );

  assert(
    '12. Chat Authority validation still passes',
    runNpmScript('validate:chat-authority', CHAT_PASS_TOKEN),
    'chat ok',
  );

  assert(
    '13. Shell validation still passes',
    runNpmScript('validate:shell', SHELL_PASS_TOKEN),
    'shell ok',
  );

  assert(
    '14. Task Governor validation still passes',
    runNpmScript('validate:task-governor', TASK_GOVERNOR_PASS_TOKEN),
    'governor ok',
  );

  assert(
    '15. Foundation validation still passes',
    runNpmScript('validate:foundation', FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    'foundation ok',
  );

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log(`Mode: ${modeA ? 'A (real browser attached)' : 'B (package/fallback honest)'}`);
    console.log('');
    console.log(REAL_BROWSER_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('REAL BROWSER RUNNER ATTACHMENT VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
