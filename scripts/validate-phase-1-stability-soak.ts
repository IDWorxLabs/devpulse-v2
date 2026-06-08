/**
 * DevPulse V2 Phase 1 Stability Soak Foundation — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import { HARNESS_PASS_TOKEN } from '../src/browser-verification/types.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE, CHAT_PASS_TOKEN } from '../src/chat/types.js';
import { FEED_PASS_TOKEN } from '../src/operator-feed/types.js';
import { SHELL_PASS_TOKEN } from '../src/shell/types.js';
import {
  DEFAULT_SOAK_CYCLE_COUNT,
  DevPulseV2Phase1StabilitySoakAuthority,
  PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED,
  resetDevPulseV2Phase1StabilitySoakAuthorityForTests,
  SOAK_OWNER_MODULE,
  SOAK_PASS_TOKEN,
} from '../src/stability-soak/index.js';
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
  console.log('DevPulse V2 — Phase 1 Stability Soak Validation');
  console.log('================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['phase_1_stability_soak'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 1 stability soak packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const soak = resetDevPulseV2Phase1StabilitySoakAuthorityForTests();
  assert(
    '2. Stability Soak Authority exists',
    soak instanceof DevPulseV2Phase1StabilitySoakAuthority,
    `ownerModule=${DevPulseV2Phase1StabilitySoakAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('phase_1_stability_soak');
  assert(
    '3. Ownership registry contains phase_1_stability_soak',
    owner.ownerModule === SOAK_OWNER_MODULE &&
      DevPulseV2Phase1StabilitySoakAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const state = await soak.runSoak(DEFAULT_SOAK_CYCLE_COUNT);

  assert(
    '4. Soak runner performs 3 cycles',
    state.runCount === DEFAULT_SOAK_CYCLE_COUNT && state.cycles.length === 3,
    `runCount=${state.runCount}`,
  );

  assert(
    '5. Each cycle runs Browser Verification Harness',
    state.cycles.every((c) => c.browserHarnessStatus !== undefined),
    state.cycles.map((c) => `c${c.cycleIndex}:${c.browserHarnessStatus}`).join(', '),
  );

  assert(
    '6. Each cycle checks Shell',
    state.cycles.every((c) => c.shellOk),
    state.cycles.map((c) => `c${c.cycleIndex}:shell=${c.shellOk}`).join(', '),
  );

  assert(
    '7. Each cycle checks Chat Authority',
    state.cycles.every((c) => c.chatAuthorityOk),
    state.cycles.map((c) => `c${c.cycleIndex}:chat=${c.chatAuthorityOk}`).join(', '),
  );

  assert(
    '8. Each cycle checks Inline Operator Feed',
    state.cycles.every((c) => c.inlineOperatorFeedOk),
    state.cycles.map((c) => `c${c.cycleIndex}:feed=${c.inlineOperatorFeedOk}`).join(', '),
  );

  assert(
    '9. Warnings are preserved honestly',
    state.warnings.length > 0 &&
      (state.cycles.some((c) => c.warnings.length > 0) ||
        state.realBrowserRunnerAttached ||
        state.warnings.some((w) => w.includes(String(PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED)))),
    `warnings=${state.warnings.length} attached=${state.realBrowserRunnerAttached}`,
  );

  const simulatedBrowserWarningHonest =
    !state.realBrowserRunnerAttached &&
    state.warnings.some((w) => w.toLowerCase().includes('real browser runner'));
  const realBrowserAttachedHonest = state.realBrowserRunnerAttached;
  assert(
    '10. Browser runner status is not hidden',
    simulatedBrowserWarningHonest || realBrowserAttachedHonest,
    `attached=${state.realBrowserRunnerAttached}`,
  );

  assert(
    '11. No fake 30-day claim is made',
    state.elapsedDaysClaimed === 0 &&
      state.warnings.some((w) => w.includes(String(PHASE_1_SOAK_CALENDAR_DAYS_REQUIRED))) &&
      !state.warnings.some((w) => /30 days complete|soak complete/i.test(w)),
    `elapsedDays=${state.elapsedDaysClaimed}`,
  );

  const phase2ReadinessHonest =
    state.failCount > 0
      ? state.phase2Readiness === 'NOT_READY'
      : state.realBrowserRunnerAttached
        ? state.phase2Readiness === 'FOUNDATION_READY'
        : state.phase2Readiness === 'REAL_BROWSER_REQUIRED';
  assert(
    '12. Phase 2 readiness is honest (not falsely complete)',
    phase2ReadinessHonest && state.failCount === 0,
    `phase2Readiness=${state.phase2Readiness} attached=${state.realBrowserRunnerAttached}`,
  );

  const reportText = soak.formatReport();
  assert(
    '13. Soak report generated',
    reportText.includes('Phase 1 Stability Soak Report') &&
      reportText.includes('Phase 2 readiness') &&
      reportText.includes('Calendar days claimed:  0'),
    `status=${state.status}`,
  );

  assert(
    '14. Browser Harness validation still passes',
    runNpmScript('validate:browser-harness', HARNESS_PASS_TOKEN),
    'browser-harness ok',
  );

  assert(
    '15. Inline Operator Feed validation still passes',
    runNpmScript('validate:inline-operator-feed', FEED_PASS_TOKEN),
    'feed ok',
  );

  assert(
    '16. Chat Authority validation still passes',
    runNpmScript('validate:chat-authority', CHAT_PASS_TOKEN),
    'chat ok',
  );

  assert(
    '17. Shell validation still passes',
    runNpmScript('validate:shell', SHELL_PASS_TOKEN),
    'shell ok',
  );

  assert(
    '18. Task Governor validation still passes',
    runNpmScript('validate:task-governor', TASK_GOVERNOR_PASS_TOKEN),
    'governor ok',
  );

  assert(
    '19. Foundation validation still passes',
    runNpmScript('validate:foundation', FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    'foundation ok',
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '20. No duplicate answer authority exists',
    assertSingleAnswerAuthorityRegistered() &&
      new Set(answerOwners.map((o) => o.ownerModule)).size === 1 &&
      answerOwners[0]?.ownerModule === CHAT_OWNER_MODULE,
    `owner=${CHAT_OWNER_MODULE}`,
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
    console.log('================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(SOAK_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('PHASE 1 STABILITY SOAK VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
