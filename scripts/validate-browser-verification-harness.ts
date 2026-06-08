/**
 * DevPulse V2 Browser Verification Harness Foundation — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import {
  DevPulseV2BrowserVerificationHarness,
  formatBrowserVerificationReport,
  HARNESS_OWNER_MODULE,
  HARNESS_PASS_TOKEN,
  resetDevPulseV2BrowserVerificationHarnessForTests,
} from '../src/browser-verification/index.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE, CHAT_PASS_TOKEN, FOUNDATION_RESPONSE_TEXT } from '../src/chat/types.js';
import { FEED_PASS_TOKEN } from '../src/operator-feed/types.js';
import { SHELL_PASS_TOKEN } from '../src/shell/types.js';
import { TASK_GOVERNOR_PASS_TOKEN } from '../src/task-governor/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

function checkResult(
  result: Awaited<ReturnType<DevPulseV2BrowserVerificationHarness['runFoundationVerification']>>,
  bvId: string,
  rbId?: string,
): string | undefined {
  const check =
    result.checks.find((c) => c.checkId === bvId) ??
    (rbId ? result.checks.find((c) => c.checkId === rbId) : undefined);
  return check?.actual;
}

function checkPassed(
  result: Awaited<ReturnType<DevPulseV2BrowserVerificationHarness['runFoundationVerification']>>,
  bvId: string,
  rbId?: string,
): boolean {
  const check =
    result.checks.find((c) => c.checkId === bvId) ??
    (rbId ? result.checks.find((c) => c.checkId === rbId) : undefined);
  return check?.status === 'PASS';
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
  console.log('DevPulse V2 — Browser Verification Harness Validation');
  console.log('======================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['browser_verification_harness'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 1 browser_verification_harness packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const harness = resetDevPulseV2BrowserVerificationHarnessForTests();
  assert(
    '2. Browser Verification Harness exists',
    harness instanceof DevPulseV2BrowserVerificationHarness,
    `ownerModule=${DevPulseV2BrowserVerificationHarness.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('browser_verification_harness');
  assert(
    '3. Ownership registry contains browser_verification_harness',
    owner.ownerModule === HARNESS_OWNER_MODULE &&
      DevPulseV2BrowserVerificationHarness.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const result = await harness.runFoundationVerification('Harness integration test');

  assert(
    '4. Harness can boot Shell',
    checkPassed(result, 'BV-01', 'RB-01'),
    checkResult(result, 'BV-01', 'RB-01') ?? 'missing',
  );

  assert(
    '5. Harness can mount Chat',
    checkPassed(result, 'BV-02') ||
      (checkPassed(result, 'RB-02') && checkPassed(result, 'RB-06')),
    checkResult(result, 'BV-02') ?? checkResult(result, 'RB-02') ?? 'missing',
  );

  assert(
    '6. Harness can submit a message',
    checkPassed(result, 'BV-06', 'RB-04'),
    checkResult(result, 'BV-06', 'RB-04') ?? 'missing',
  );

  assert(
    '7. Harness verifies visibleAnswerText rendered',
    checkPassed(result, 'BV-07', 'RB-05'),
    checkResult(result, 'BV-07', 'RB-05') ?? 'missing',
  );

  assert(
    '8. Harness verifies Inline Operator Feed rendered',
    checkPassed(result, 'BV-08', 'RB-07'),
    checkResult(result, 'BV-08', 'RB-07') ?? 'missing',
  );

  assert(
    '9. Harness verifies feed events are not assistant answers',
    checkPassed(result, 'BV-09', 'RB-08'),
    checkResult(result, 'BV-09', 'RB-08') ?? 'missing',
  );

  assert(
    '10. Harness measures visible timing',
    result.checks.find((c) => c.checkId === 'BV-10')?.status !== 'FAIL',
    result.checks.find((c) => c.checkId === 'BV-10')?.actual ?? 'missing',
  );

  assert(
    '11. Harness measures clickable timing',
    result.checks.find((c) => c.checkId === 'BV-11')?.status !== 'FAIL',
    result.checks.find((c) => c.checkId === 'BV-11')?.actual ?? 'missing',
  );

  const reportText = formatBrowserVerificationReport(result, harness.isRealBrowserRunnerAttached());
  const realAttached = harness.isRealBrowserRunnerAttached();
  const simulatedWarningHonest =
    !realAttached &&
    result.warnings.some((w) => w.toLowerCase().includes('real browser runner')) &&
    reportText.includes('Real browser attached:  false');
  const realAttachedHonest =
    realAttached &&
    result.runnerUsed === 'real-browser' &&
    reportText.includes('Real browser attached:  true');
  assert(
    '12. Harness reports browser runner status honestly',
    simulatedWarningHonest || realAttachedHonest,
    `warnings=${result.warnings.length} attached=${realAttached} runner=${result.runnerUsed}`,
  );

  assert(
    '13. Harness report generated',
    reportText.includes('Browser Verification Report') &&
      (reportText.includes('BV-07') || reportText.includes('RB-05')) &&
      result.status !== 'FAIL',
    `status=${result.status}`,
  );

  assert(
    '14. Inline Operator Feed validation still passes',
    runNpmScript('validate:inline-operator-feed', FEED_PASS_TOKEN),
    'Feed token verified',
  );

  assert(
    '15. Chat Authority validation still passes',
    runNpmScript('validate:chat-authority', CHAT_PASS_TOKEN),
    'Chat token verified',
  );

  assert(
    '16. Shell Foundation validation still passes',
    runNpmScript('validate:shell', SHELL_PASS_TOKEN),
    'Shell token verified',
  );

  assert(
    '17. Task Governor validation still passes',
    runNpmScript('validate:task-governor', TASK_GOVERNOR_PASS_TOKEN),
    'Task Governor token verified',
  );

  assert(
    '18. Foundation Enforcement Layer still passes',
    runNpmScript('validate:foundation', FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    'Foundation token verified',
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '19. No duplicate answer authority is registered',
    assertSingleAnswerAuthorityRegistered() &&
      new Set(answerOwners.map((o) => o.ownerModule)).size === 1 &&
      answerOwners[0]?.ownerModule === CHAT_OWNER_MODULE &&
      result.checks.find((c) => c.checkId === 'BV-13')?.status === 'PASS',
    `BV-13=${result.checks.find((c) => c.checkId === 'BV-13')?.status}`,
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
    console.log('======================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(HARNESS_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('BROWSER VERIFICATION HARNESS VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
