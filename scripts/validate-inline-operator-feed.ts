/**
 * DevPulse V2 Inline Operator Feed Foundation — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import {
  assertSingleOwner,
  getDevPulseV2Owner,
  listDevPulseV2Owners,
} from '../src/foundation/ownership-registry.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import {
  createDevPulseV2ShellAuthority,
  resetDevPulseV2ShellAuthorityForTests,
} from '../src/shell/shell-authority.js';
import { SHELL_PASS_TOKEN } from '../src/shell/types.js';
import {
  createDevPulseV2ChatAuthority,
  resetDevPulseV2ChatAuthorityForTests,
} from '../src/chat/chat-authority.js';
import { CHAT_OWNER_MODULE, CHAT_PASS_TOKEN, FOUNDATION_RESPONSE_TEXT } from '../src/chat/types.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import {
  DevPulseV2InlineOperatorFeedAuthority,
  createTurnIdFromMessage,
  feedDidNotModifyAnswer,
  feedEventsAreNotAssistantAnswers,
  formatInlineOperatorFeedReport,
  FOUNDATION_FEED_STAGES,
  getDevPulseV2InlineOperatorFeedAuthority,
  getInlineFeedSurfaceSnapshot,
  resetDevPulseV2InlineOperatorFeedAuthorityForTests,
} from '../src/operator-feed/index.js';
import { FEED_OWNER_MODULE, FEED_PASS_TOKEN } from '../src/operator-feed/types.js';
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

async function bootStack() {
  resetDevPulseV2ShellAuthorityForTests();
  const shell = createDevPulseV2ShellAuthority();
  await shell.bootShell();

  resetDevPulseV2InlineOperatorFeedAuthorityForTests();
  const chat = resetDevPulseV2ChatAuthorityForTests();
  await chat.mountIntoShell();
  return chat;
}

function isOrderedByCreatedAt(events: { createdAt: number }[]): boolean {
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].createdAt < events[i - 1].createdAt) return false;
  }
  return true;
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Inline Operator Feed Foundation Validation');
  console.log('=======================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['inline_operator_feed'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: false,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 1 inline_operator_feed packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary + (buildGate.warningCount ? ` (${buildGate.warningCount} warning(s))` : ''),
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const feed = resetDevPulseV2InlineOperatorFeedAuthorityForTests();
  assert(
    '2. Inline Operator Feed Authority exists',
    feed instanceof DevPulseV2InlineOperatorFeedAuthority,
    `ownerModule=${DevPulseV2InlineOperatorFeedAuthority.ownerModule}`,
  );

  const feedOwner = getDevPulseV2Owner('inline_operator_feed');
  assert(
    '3. Ownership registry contains inline_operator_feed',
    feedOwner.ownerModule === FEED_OWNER_MODULE &&
      DevPulseV2InlineOperatorFeedAuthority.assertRegistryOwnership(),
    `registered=${feedOwner.ownerModule}`,
  );

  assert(
    '4. Feed starts IDLE',
    feed.getState().status === 'IDLE' && feed.getState().events.length === 0,
    `status=${feed.getState().status}`,
  );

  const chat = await bootStack();
  const answer = await chat.submitUserMessage('Show progress please');
  const feedAuthority = getDevPulseV2InlineOperatorFeedAuthority();
  const events = chat.getActiveTurnFeedEvents();

  assert(
    '5. User chat turn creates feed events',
    events.length === 5,
    `events=${events.length}`,
  );

  const stages = events.map((e) => e.stage);
  const expectedStages = FOUNDATION_FEED_STAGES.map((s) => s.stage);
  assert(
    '6. Required five foundation stages are emitted',
    stages.join(',') === expectedStages.join(','),
    `stages=${stages.join(' → ')}`,
  );

  assert(
    '7. Feed events contain visibleText',
    events.every((e) => e.visibleText.trim().length > 0),
    'all events have visibleText',
  );

  assert(
    '8. Feed events are ordered',
    isOrderedByCreatedAt(events),
    `createdAt sequence ok`,
  );

  const userMsg = chat.getState().messages.find((m) => m.role === 'user');
  const expectedTurnId = userMsg ? createTurnIdFromMessage(userMsg.messageId) : '';
  assert(
    '9. Feed events attach to chat turn id',
    events.every((e) => e.turnId === expectedTurnId),
    `turnId=${expectedTurnId}`,
  );

  assert(
    '10. Feed does not modify visibleAnswerText',
    feedDidNotModifyAnswer(
      { ...answer, visibleAnswerText: answer.visibleAnswerText },
      answer,
    ) && answer.visibleAnswerText === FOUNDATION_RESPONSE_TEXT,
    `answer="${answer.visibleAnswerText.slice(0, 30)}..."`,
  );

  const assistantCount = chat.getState().messages.filter((m) => m.role === 'assistant').length;
  assert(
    '11. Feed does not create assistant answers',
    assistantCount === 1 &&
      feedEventsAreNotAssistantAnswers(events, answer) &&
      !events.some((e) => e.visibleText === FOUNDATION_RESPONSE_TEXT),
    `assistant messages=${assistantCount}`,
  );

  const surfaceHtml = chat.getChatSurfaceHtml() ?? '';
  const feedSnapshot = getInlineFeedSurfaceSnapshot(events);
  assert(
    '12. Feed surface renders events inline',
    surfaceHtml.includes('data-devpulse-inline-feed') &&
      feedSnapshot.hasInlineMount &&
      feedSnapshot.eventCount === 5,
    `inline mount=${feedSnapshot.hasInlineMount}`,
  );

  const feedUsage = feedAuthority.getGovernorUsage();
  assert(
    '13. Task Governor used for feed work',
    feedUsage.usedTaskGovernor &&
      feedUsage.p1Tasks >= 5 &&
      feedUsage.p3Tasks === 0 &&
      feedUsage.p4Tasks === 0,
    `P1=${feedUsage.p1Tasks}`,
  );

  assert(
    '14. Chat Authority validation still passes',
    runNpmScript('validate:chat-authority', CHAT_PASS_TOKEN),
    'Chat token verified',
  );

  assert(
    '15. Shell Foundation validation still passes',
    runNpmScript('validate:shell', SHELL_PASS_TOKEN),
    'Shell token verified',
  );

  assert(
    '16. Task Governor validation still passes',
    runNpmScript('validate:task-governor', TASK_GOVERNOR_PASS_TOKEN),
    'Task Governor token verified',
  );

  assert(
    '17. Foundation Enforcement Layer still passes',
    runNpmScript('validate:foundation', FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    'Foundation token verified',
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  const uniqueAnswerModules = new Set(answerOwners.map((o) => o.ownerModule));
  assert(
    '18. No duplicate answer authority is registered',
    assertSingleAnswerAuthorityRegistered() &&
      uniqueAnswerModules.size === 1 &&
      uniqueAnswerModules.has(CHAT_OWNER_MODULE) &&
      assertSingleOwner('inline_operator_feed').ok &&
      getDevPulseV2Owner('inline_operator_feed').ownerModule === FEED_OWNER_MODULE,
    `answer owner=${CHAT_OWNER_MODULE}, feed owner=${FEED_OWNER_MODULE}`,
  );

  assert(
    '18b. Feed report generated',
    formatInlineOperatorFeedReport(feedAuthority, chat.isFeedAttached()).includes(
      'Inline Operator Feed Report',
    ),
    'founder report ok',
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
    console.log('=======================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(FEED_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('INLINE OPERATOR FEED VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
