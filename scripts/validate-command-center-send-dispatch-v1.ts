/**
 * Command Center Send Dispatch V1 — validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMAND_CENTER_SEND_DISPATCH_V1_PASS,
  COMMAND_CENTER_SEND_DIAGNOSTIC_TOKENS,
  evaluateSubmitPrecheck,
  isLikelyBuildPromptMessage,
} from '../src/command-center-send-dispatch-v1/index.js';
import { evaluateSessionRepair } from '../src/command-center-chat-response-execution-repair-v1/index.js';
import { finishValidator } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CALCULATOR_PROMPT = 'build a calculator app';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Send Dispatch V1 — Validation');
  console.log('==============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const dispatchJs = readFileSync(
    join(ROOT, 'public/founder-reality/command-center-send-dispatch.js'),
    'utf8',
  );
  const repairJs = readFileSync(
    join(ROOT, 'public/founder-reality/command-center-chat-response-execution-repair.js'),
    'utf8',
  );
  const indexHtml = readFileSync(join(ROOT, 'public/founder-reality/index.html'), 'utf8');

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:command-center-send-dispatch']),
    'package.json',
  );
  assert(
    '02. send dispatch module exists',
    existsSync(join(ROOT, 'src/command-center-send-dispatch-v1/index.ts')),
    'module',
  );
  assert(
    '03. browser dispatch client exists',
    existsSync(join(ROOT, 'public/founder-reality/command-center-send-dispatch.js')),
    'client',
  );
  assert('04. script tag in index.html', indexHtml.includes('command-center-send-dispatch.js'), 'index.html');

  assert('05. submitCommandCenterMessage in app.js', appJs.includes('function submitCommandCenterMessage'), 'app.js');
  assert(
    '06. form submit calls submitCommandCenterMessage',
    appJs.includes("submitCommandCenterMessage('submit')"),
    'form handler',
  );
  assert(
    '07. Enter key calls submitCommandCenterMessage',
    appJs.includes("submitCommandCenterMessage('enter')"),
    'enter handler',
  );
  assert(
    '08. Send click logs COMMAND_CENTER_SEND_CLICKED',
    appJs.includes('COMMAND_CENTER_SEND_CLICKED') && dispatchJs.includes('COMMAND_CENTER_SEND_CLICKED'),
    'diagnostics',
  );

  for (const token of COMMAND_CENTER_SEND_DIAGNOSTIC_TOKENS) {
    assert(
      `09. diagnostic token ${token}`,
      appJs.includes(token) || dispatchJs.includes(token),
      token,
    );
  }

  assert('10. syncCommandCenterSendButtonState exists', appJs.includes('function syncCommandCenterSendButtonState'), 'app.js');
  assert(
    '11. send not disabled by localRuntimeHealthy',
    !appJs.includes('sendBtn.disabled = !localRuntimeHealthy') &&
      !appJs.includes('sendBtn.disabled = !reconciliation.localRuntimeHealthy'),
    'runtime must not hard-disable Send',
  );
  assert(
    '12. calculator prompt detected as build',
    isLikelyBuildPromptMessage(CALCULATOR_PROMPT) === true,
    CALCULATOR_PROMPT,
  );

  const precheck = evaluateSubmitPrecheck({
    message: CALCULATOR_PROMPT,
    hasChatInput: true,
    sendButtonHardDisabled: false,
  });
  assert('13. submit precheck allows calculator send', precheck.allowed === true, JSON.stringify(precheck));

  const buildNoProject = evaluateSessionRepair({
    activeProjectId: null,
    activeSessionId: null,
    hydrationState: 'empty',
    hasSessionContinuityApi: true,
    isLikelyBuildPrompt: true,
  });
  assert(
    '14. build without active project not blocked',
    buildNoProject.canContinue === true && buildNoProject.needsRepair === false,
    JSON.stringify(buildNoProject),
  );

  const buildHydrating = evaluateSessionRepair({
    activeProjectId: null,
    activeSessionId: null,
    hydrationState: 'loading',
    hasSessionContinuityApi: true,
    isLikelyBuildPrompt: true,
  });
  assert(
    '15. build during hydration not blocked',
    buildHydrating.canContinue === true && buildHydrating.needsRepair === false,
    JSON.stringify(buildHydrating),
  );

  const chatHydrating = evaluateSessionRepair({
    activeProjectId: 'proj-1',
    activeSessionId: null,
    hydrationState: 'loading',
    hasSessionContinuityApi: true,
    isLikelyBuildPrompt: false,
  });
  assert(
    '16. non-build hydration still blocks session repair',
    chatHydrating.canContinue === false && chatHydrating.needsRepair === true,
    JSON.stringify(chatHydrating),
  );

  assert(
    '17. execution trace on submit',
    appJs.includes('appendOperatorLogFromEvent') &&
      appJs.includes("'Command Center Submit'") &&
      appJs.includes('submitCommandCenterMessage'),
    'operator feed',
  );
  assert(
    '18. brain POST diagnostic in fetch path',
    appJs.includes('COMMAND_CENTER_BRAIN_POST_SENT') && appJs.includes('COMMAND_CENTER_BRAIN_RESPONSE_RECEIVED'),
    'fetch diagnostics',
  );
  assert(
    '19. repair client build session bypass',
    repairJs.includes('isLikelyBuildPrompt') && repairJs.includes('Build prompt without active project'),
    'repair.js',
  );
  assert(
    '20. askBrain passes isLikelyBuildPrompt to session repair',
    appJs.includes('isLikelyBuildPrompt: options.isLikelyBuildPrompt'),
    'askBrain wiring',
  );

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }

  const failed = results.filter((check) => !check.passed);
  console.log('');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  console.log('');

  if (failed.length === 0) {
    console.log(COMMAND_CENTER_SEND_DISPATCH_V1_PASS);
    await finishValidator(0);
  } else {
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
