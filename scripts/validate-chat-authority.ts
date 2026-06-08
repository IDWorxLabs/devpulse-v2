/**
 * DevPulse V2 Chat Authority Foundation — validation scenarios.
 * VALIDATION_MODE: FULL_STACK_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import {
  getDevPulseV2Owner,
  listDevPulseV2Owners,
} from '../src/foundation/ownership-registry.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import { buildAnswer } from '../src/chat/answer-contract.js';
import {
  DevPulseV2ChatAuthority,
  resetDevPulseV2ChatAuthorityForTests,
} from '../src/chat/chat-authority.js';
import {
  assertSingleAnswerAuthorityRegistered,
  formatChatAuthorityReport,
} from '../src/chat/chat-report.js';
import {
  renderAssistantAnswerArea,
  verifyRendererUsesVisibleAnswerTextOnly,
} from '../src/chat/chat-surface.js';
import { generateFoundationResponse } from '../src/chat/minimal-response-engine.js';
import {
  CHAT_OWNER_MODULE,
  CHAT_PASS_TOKEN,
  FOUNDATION_RESPONSE_TEXT,
} from '../src/chat/types.js';
import {
  createDevPulseV2ShellAuthority,
  resetDevPulseV2ShellAuthorityForTests,
} from '../src/shell/shell-authority.js';
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
    const output = execSync(`npm run ${script}`, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    return output.includes(token);
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return ((err.stdout ?? '') + (err.stderr ?? '')).includes(token);
  }
}

async function bootShellAndChat(): Promise<DevPulseV2ChatAuthority> {
  resetDevPulseV2ShellAuthorityForTests();
  const shell = createDevPulseV2ShellAuthority();
  await shell.bootShell();

  const chat = resetDevPulseV2ChatAuthorityForTests();
  await chat.mountIntoShell();
  return chat;
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Chat Authority Foundation Validation');
  console.log('=================================================');
  console.log('');

  // 1. Build gate
  const buildGate = runDevPulseV2BuildGate({
    phase: 1,
    systems: ['chat_authority'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: false,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 1 chat_authority packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary + (buildGate.warningCount ? ` (${buildGate.warningCount} warning(s))` : ''),
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  // 2. Chat Authority exists
  const chat = resetDevPulseV2ChatAuthorityForTests();
  assert(
    '2. Chat Authority exists',
    chat instanceof DevPulseV2ChatAuthority,
    `ownerModule=${DevPulseV2ChatAuthority.ownerModule}`,
  );

  // 3. Ownership registry contains chat_authority
  const chatOwner = getDevPulseV2Owner('chat_authority');
  const registryHasChat = listDevPulseV2Owners().some(
    (o) => o.domain === 'chat_authority' && o.ownerModule === CHAT_OWNER_MODULE,
  );
  assert(
    '3. Ownership registry contains chat_authority',
    chatOwner.ownerModule === CHAT_OWNER_MODULE &&
      DevPulseV2ChatAuthority.assertRegistryOwnership() &&
      registryHasChat,
    `registered=${chatOwner.ownerModule}`,
  );

  // 4. Chat starts IDLE
  assert(
    '4. Chat starts IDLE',
    chat.getState().status === 'IDLE' && chat.getState().messages.length === 0,
    `status=${chat.getState().status}`,
  );

  // Boot shell for remaining scenarios
  const chatReady = await bootShellAndChat();

  // 5. User message can be submitted
  const answer = await chatReady.submitUserMessage('Hello DevPulse');
  assert(
    '5. User message can be submitted',
    chatReady.getState().messages.some((m) => m.role === 'user' && m.text === 'Hello DevPulse'),
    `messages=${chatReady.getState().messages.length}`,
  );

  // 6. Deterministic assistant answer created
  assert(
    '6. Deterministic assistant answer is created',
    answer.status === 'READY' && answer.visibleAnswerText === FOUNDATION_RESPONSE_TEXT,
    `answer="${answer.visibleAnswerText.slice(0, 40)}..."`,
  );

  // 7. Answer object contains visibleAnswerText
  assert(
    '7. Answer object contains visibleAnswerText',
    answer.visibleAnswerText.length > 0 && answer.source === 'CHAT_AUTHORITY',
    `status=${answer.status}`,
  );

  // 8. Empty answer marked EMPTY
  const emptyChat = resetDevPulseV2ChatAuthorityForTests();
  const emptyAnswer = generateFoundationResponse('   ');
  assert(
    '8. Empty answer is marked EMPTY',
    emptyAnswer.status === 'EMPTY' && emptyAnswer.visibleAnswerText === '',
    `status=${emptyAnswer.status}`,
  );

  // 9. Renderer uses visibleAnswerText only
  const decoyAnswer = buildAnswer('Visible text only');
  const decoyWithHidden = Object.assign(decoyAnswer, { hiddenAnswer: 'SECRET HIDDEN PROSE' });
  const rendered = renderAssistantAnswerArea(decoyWithHidden);
  assert(
    '9. Renderer uses visibleAnswerText only',
    rendered.includes('Visible text only') &&
      !rendered.includes('SECRET HIDDEN PROSE') &&
      verifyRendererUsesVisibleAnswerTextOnly(decoyWithHidden, rendered),
    'visible text shown, hidden field excluded',
  );

  // 10. Chat report generated
  const reportText = formatChatAuthorityReport(chatReady);
  assert(
    '10. Chat report generated',
    reportText.includes('Chat Authority Report') &&
      reportText.includes(CHAT_OWNER_MODULE) &&
      reportText.includes('Visible answer present: true'),
    'founder-readable report ok',
  );

  // 11. Task Governor used
  const usage = chatReady.getGovernorUsage();
  assert(
    '11. Task Governor used for chat startup/render work',
    usage.usedTaskGovernor &&
      usage.p0Tasks >= 1 &&
      usage.p1Tasks >= 1 &&
      usage.p3Tasks === 0 &&
      usage.p4Tasks === 0,
    `P0=${usage.p0Tasks} P1=${usage.p1Tasks}`,
  );

  // Mount verification
  const mounted = chatReady.getMountedShellHtml() ?? '';
  assert(
    '11b. Chat mounts into Shell placeholder',
    mounted.includes('data-devpulse-chat-mount') &&
      mounted.includes('data-devpulse-chat') &&
      !mounted.includes('[ Chat Surface Placeholder ]'),
    'chat mounted in shell',
  );

  // 12. Shell Foundation still validates
  assert(
    '12. Shell Foundation still validates',
    runNpmScript('validate:shell', SHELL_PASS_TOKEN),
    'Shell token verified',
  );

  // 13. Task Governor still validates
  assert(
    '13. Task Governor validation still passes',
    runNpmScript('validate:task-governor', TASK_GOVERNOR_PASS_TOKEN),
    'Task Governor token verified',
  );

  // 14. Foundation still passes
  assert(
    '14. Foundation Enforcement Layer still passes',
    runNpmScript('validate:foundation', FOUNDATION_ENFORCEMENT_PASS_TOKEN),
    'Foundation token verified',
  );

  // 15. No duplicate answer authority
  const answerOwners = listDevPulseV2Owners().filter(
    (o) =>
      o.domain === 'chat_authority' ||
      o.domain === 'chat_answer_authority',
  );
  const uniqueModules = new Set(answerOwners.map((o) => o.ownerModule));
  assert(
    '15. No duplicate answer authority is registered',
    assertSingleAnswerAuthorityRegistered() &&
      uniqueModules.size === 1 &&
      uniqueModules.has(CHAT_OWNER_MODULE),
    `owners=${answerOwners.map((o) => o.domain).join(', ')} module=${CHAT_OWNER_MODULE}`,
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
    console.log('=================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(CHAT_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('CHAT AUTHORITY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
