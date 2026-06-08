/**
 * DevPulse V2 Visible UI Clickability Guard — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { SHELL_OWNER_MODULE } from '../src/shell/types.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';
import {
  assertBrowserHarnessOwnershipUnchanged,
  DevPulseV2VisibleUiGuardAuthority,
  formatVisibleUiGuardReport,
  GUARD_OWNER_MODULE,
  GUARD_PASS_TOKEN,
  resetDevPulseV2VisibleUiGuardAuthorityForTests,
  validatePromptHasVisibleUiRequirements,
} from '../src/visible-ui-guard/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function validElementInput(overrides: Partial<Parameters<DevPulseV2VisibleUiGuardAuthority['registerVisibleUiElement']>[0]> = {}) {
  return {
    elementId: 'ui-chat-panel',
    ownerSystemId: 'chat_authority',
    ownerModule: CHAT_OWNER_MODULE,
    type: 'PANEL' as const,
    label: 'Chat Panel',
    mountTarget: '#shell-root',
    expectedSelector: '#chat-panel',
    interactive: false,
    requiredForPhase: false,
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Visible UI Clickability Guard Validation');
  console.log('========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['visible_ui_clickability_guard'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts visible_ui_clickability_guard packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const guard = resetDevPulseV2VisibleUiGuardAuthorityForTests();

  assert(
    '2. Visible UI Guard Authority exists',
    guard instanceof DevPulseV2VisibleUiGuardAuthority,
    `ownerModule=${DevPulseV2VisibleUiGuardAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('visible_ui_clickability_guard');
  assert(
    '3. Ownership registry contains visible_ui_clickability_guard',
    owner.ownerModule === GUARD_OWNER_MODULE &&
      DevPulseV2VisibleUiGuardAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Registry starts empty',
    guard.getVisibleUiRegistryState().elementCount === 0,
    `count=${guard.getVisibleUiRegistryState().elementCount}`,
  );

  const registered = guard.registerVisibleUiElement(validElementInput());
  assert(
    '5. registerVisibleUiElement works',
    registered.errors.length === 0 && guard.getVisibleUiRegistryState().elementCount === 1,
    registered.elementId,
  );

  assert(
    '6. getVisibleUiElement works',
    guard.getVisibleUiElement('ui-chat-panel')?.label === 'Chat Panel',
    guard.getVisibleUiElement('ui-chat-panel')?.label ?? 'missing',
  );

  assert(
    '7. listVisibleUiElements works',
    guard.listVisibleUiElements().length === 1,
    `count=${guard.listVisibleUiElements().length}`,
  );

  guard.registerVisibleUiElement(
    validElementInput({ elementId: 'ui-chat-submit', type: 'BUTTON', interactive: true, expectedSelector: '#chat-submit' }),
  );
  assert(
    '8. listVisibleUiElementsByOwner works',
    guard.listVisibleUiElementsByOwner('chat_authority').length === 2,
    `owner-count=${guard.listVisibleUiElementsByOwner('chat_authority').length}`,
  );

  const snapshot = guard.createVisibleUiSnapshot();
  assert(
    '9. createVisibleUiSnapshot works',
    snapshot.elementCount === 2 && snapshot.snapshotId.length > 0,
    snapshot.snapshotId,
  );

  const duplicate = guard.registerVisibleUiElement(validElementInput({ elementId: 'ui-chat-panel' }));
  assert(
    '10. Duplicate elementId fails',
    duplicate.errors.some((e) => e.includes('Duplicate elementId')),
    duplicate.errors.join('; '),
  );

  const noOwner = guard.registerVisibleUiElement(validElementInput({ elementId: 'ui-no-owner', ownerSystemId: '' }));
  assert(
    '11. Missing ownerSystemId fails',
    noOwner.errors.some((e) => e.includes('ownerSystemId')),
    noOwner.errors.join('; '),
  );

  const noMount = guard.registerVisibleUiElement(validElementInput({ elementId: 'ui-no-mount', mountTarget: '' }));
  assert(
    '12. Missing mountTarget fails',
    noMount.errors.some((e) => e.includes('mountTarget')),
    noMount.errors.join('; '),
  );

  const noSelector = guard.registerVisibleUiElement(
    validElementInput({ elementId: 'ui-no-selector', expectedSelector: '' }),
  );
  assert(
    '13. Missing expectedSelector fails',
    noSelector.errors.some((e) => e.includes('expectedSelector')),
    noSelector.errors.join('; '),
  );

  const panelHtml = '<div id="shell-root"><section id="chat-panel">Chat</section></div>';
  const panelRecord = guard.getVisibleUiElement('ui-chat-panel')!;
  const panelCheck = guard.checkElement(panelRecord, panelHtml);
  assert(
    '14. Non-interactive visible element passes visibility check',
    panelCheck.visible && panelCheck.status === 'PASS' && !panelRecord.interactive,
    panelCheck.status,
  );

  const buttonHtml =
    '<div id="shell-root"><button id="chat-submit" type="button">Send</button></div>';
  const buttonRecord = guard.getVisibleUiElement('ui-chat-submit')!;
  const buttonCheck = guard.checkElement(buttonRecord, buttonHtml);
  assert(
    '15. Interactive visible/clickable element passes',
    buttonCheck.visible && buttonCheck.clickable && buttonCheck.status === 'PASS',
    buttonCheck.status,
  );

  const notClickableHtml = '<div id="shell-root"><div id="chat-submit">Send</div></div>';
  const notClickableCheck = guard.checkElement(buttonRecord, notClickableHtml);
  assert(
    '16. Interactive visible-but-not-clickable element fails',
    notClickableCheck.visible && !notClickableCheck.clickable && notClickableCheck.status === 'FAIL',
    notClickableCheck.status,
  );

  const required = guard.registerVisibleUiElement(
    validElementInput({
      elementId: 'ui-required-panel',
      expectedSelector: '#required-panel',
      requiredForPhase: true,
    }),
  );
  const requiredCheck = guard.checkElement(required, '<div id="shell-root"></div>');
  assert(
    '17. Required phase missing element fails',
    requiredCheck.status === 'FAIL' && requiredCheck.errors.some((e) => e.includes('Required phase')),
    requiredCheck.status,
  );

  const visibilityChecks = guard.buildUiVisibilityChecks();
  const clickabilityChecks = guard.buildUiClickabilityChecks();
  assert(
    '18. Browser harness bridge returns registered checks',
    visibilityChecks.length >= 2 &&
      clickabilityChecks.length >= 1 &&
      assertBrowserHarnessOwnershipUnchanged() &&
      getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `visibility=${visibilityChecks.length} clickability=${clickabilityChecks.length}`,
  );

  const riskyPrompt = validatePromptHasVisibleUiRequirements(
    'Build a new settings panel with approval button and preview card.',
  );
  assert(
    '19. Future prompt policy detects panel/button/control prompts missing UI guard requirements',
    riskyPrompt.uiSurfaceDetected && !riskyPrompt.valid && riskyPrompt.missingRequirements.length > 0,
    riskyPrompt.missingRequirements.join(', '),
  );

  const safePrompt = validatePromptHasVisibleUiRequirements(`
    Build a settings panel with visible UI registration.
    owner system id: settings_panel
    mount target: #shell-root
    expected selector: #settings-panel
    browser visibility check required
    clickability check for approval button
    report entry in guard report
  `);
  assert(
    '20. Future prompt policy accepts prompt with registration + visibility + clickability requirements',
    safePrompt.valid && safePrompt.uiSurfaceDetected,
    `missing=${safePrompt.missingRequirements.length}`,
  );

  guard.runChecks(buttonHtml);
  const reportText = formatVisibleUiGuardReport(
    guard.getVisibleUiRegistryState(),
    guard.listVisibleUiElements(),
    guard.getLastCheckResults(),
  );
  assert(
    '21. Report generated',
    reportText.includes('Visible UI Registration & Clickability Guard Report') &&
      guard.formatReport().includes('Recommendation:'),
    `elements=${guard.getVisibleUiRegistryState().elementCount}`,
  );

  assert(
    '22. Guard does not replace Browser Verification Harness',
    DevPulseV2VisibleUiGuardAuthority.assertDoesNotReplaceBrowserHarness() &&
      DevPulseV2VisibleUiGuardAuthority.assertDoesNotReplaceShell() &&
      getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `harness=${HARNESS_OWNER_MODULE} shell=${SHELL_OWNER_MODULE}`,
  );

  assert(
    '23. Guard does not become answer authority',
    DevPulseV2VisibleUiGuardAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    GUARD_OWNER_MODULE,
  );

  assert(
    '24. Guard does not create UI panels now',
    DevPulseV2VisibleUiGuardAuthority.assertDoesNotCreateUiPanels(),
    'no panel creation methods',
  );

  assert(
    '25. Validation Budget Policy still passes',
    DevPulseV2VisibleUiGuardAuthority.assertValidationBudgetCompatible() &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `policy=${POLICY_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('26. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log('');
    console.log(GUARD_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('VISIBLE UI CLICKABILITY GUARD VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
