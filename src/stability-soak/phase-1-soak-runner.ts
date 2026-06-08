/**
 * Single Phase 1 soak cycle — uses existing stack modules directly.
 */

import { runDevPulseV2BuildGate } from '../foundation/build-gate.js';
import { runDevPulseV2ConstitutionalValidation } from '../foundation/constitutional-validator.js';
import {
  createDevPulseV2ChatAuthority,
  resetDevPulseV2ChatAuthorityForTests,
} from '../chat/chat-authority.js';
import { FOUNDATION_RESPONSE_TEXT } from '../chat/types.js';
import {
  createDevPulseV2BrowserVerificationHarness,
  resetDevPulseV2BrowserVerificationHarnessForTests,
} from '../browser-verification/browser-verification-harness.js';
import { FOUNDATION_FEED_STAGES } from '../operator-feed/types.js';
import {
  createDevPulseV2ShellAuthority,
  resetDevPulseV2ShellAuthorityForTests,
} from '../shell/shell-authority.js';
import {
  createTaskId,
  getDevPulseV2TaskGovernor,
  resetDevPulseV2TaskGovernorForTests,
} from '../task-governor/task-governor.js';
import type { SoakCycleResult } from './types.js';

export async function runPhase1SoakCycle(cycleIndex: number): Promise<SoakCycleResult> {
  const startedAt = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['shell', 'chat_authority', 'inline_operator_feed'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });
  const constitutional = runDevPulseV2ConstitutionalValidation({
    phase: 1,
    answerAuthorities: ['devpulse_v2_chat_authority'],
  });
  const foundationEnforcementOk = buildGate.buildAllowed && constitutional.passed;
  if (!foundationEnforcementOk) {
    errors.push('Foundation enforcement check failed');
  }

  resetDevPulseV2TaskGovernorForTests();
  const governor = getDevPulseV2TaskGovernor();
  const order: string[] = [];
  governor.enqueueTask({
    id: createTaskId('p3'),
    label: 'p3',
    priority: 'P3_HEAVY_BACKGROUND',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      order.push('p3');
    },
  });
  governor.enqueueTask({
    id: createTaskId('p0'),
    label: 'p0',
    priority: 'P0_VISIBLE_USER_PATH',
    estimatedCostMs: 1,
    createdAt: Date.now(),
    run: () => {
      order.push('p0');
    },
  });
  await governor.runUntilBudgetExhausted(50);
  const taskGovernorOk = order[0] === 'p0';
  if (!taskGovernorOk) errors.push('Task Governor priority ordering failed');

  resetDevPulseV2ShellAuthorityForTests(startedAt);
  const shell = createDevPulseV2ShellAuthority(startedAt);
  await shell.bootShell();
  const shellState = shell.getState();
  const shellOk =
    shellState.status === 'READY' ||
    shellState.status === 'CLICKABLE' ||
    shellState.status === 'VISIBLE';
  if (!shellOk) errors.push(`Shell boot status: ${shellState.status}`);

  resetDevPulseV2ChatAuthorityForTests(startedAt);
  const chat = createDevPulseV2ChatAuthority(startedAt);
  await chat.mountIntoShell();
  const answer = await chat.submitUserMessage(`Soak cycle ${cycleIndex} message`);
  const chatAuthorityOk =
    answer.status === 'READY' &&
    answer.visibleAnswerText === FOUNDATION_RESPONSE_TEXT &&
    chat.getState().messages.filter((m) => m.role === 'assistant').length === 1;
  if (!chatAuthorityOk) errors.push('Chat Authority submit/answer failed');

  const feedEvents = chat.getActiveTurnFeedEvents();
  const inlineOperatorFeedOk =
    feedEvents.length === FOUNDATION_FEED_STAGES.length &&
    feedEvents.every((e) => e.visibleText.trim().length > 0);
  if (!inlineOperatorFeedOk) {
    errors.push(`Inline Operator Feed expected ${FOUNDATION_FEED_STAGES.length} events`);
  }

  resetDevPulseV2BrowserVerificationHarnessForTests();
  const harness = createDevPulseV2BrowserVerificationHarness();
  const browserResult = await harness.runFoundationVerification(
    `Browser soak cycle ${cycleIndex}`,
  );
  const browserHarnessStatus: SoakCycleResult['browserHarnessStatus'] =
    browserResult.status === 'PASS' ||
    browserResult.status === 'WARN' ||
    browserResult.status === 'FAIL'
      ? browserResult.status
      : 'WARN';
  if (browserHarnessStatus === 'FAIL') {
    errors.push('Browser Verification Harness failed');
  }
  if (!harness.isRealBrowserRunnerAttached()) {
    warnings.push('Real browser runner not yet attached — simulated HTML verification only.');
  }
  warnings.push(...browserResult.warnings);

  let outcome: SoakCycleResult['outcome'] = 'PASS';
  if (errors.length > 0) outcome = 'FAIL';
  else if (warnings.length > 0 || browserHarnessStatus === 'WARN') outcome = 'WARN';

  return {
    cycleIndex,
    startedAt,
    completedAt: Date.now(),
    outcome,
    foundationEnforcementOk,
    taskGovernorOk,
    shellOk,
    chatAuthorityOk,
    inlineOperatorFeedOk,
    browserHarnessStatus,
    warnings: [...new Set(warnings)],
    errors,
  };
}
