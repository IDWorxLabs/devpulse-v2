/**
 * DevPulse V2 Self Vision Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
  getDevPulseV2BrowserVerificationHarness,
  resetDevPulseV2BrowserVerificationHarnessForTests,
} from '../src/browser-verification/index.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import { resetDevPulseV2CentralBrainAuthorityForTests } from '../src/central-brain/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { resetDevPulseV2EvidenceRegistryAuthorityForTests } from '../src/evidence-registry/index.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  assertBrowserHarnessOwnershipUnchanged,
  assertCentralBrainOwnershipUnchanged,
  assertEvidenceRegistryOwnershipUnchanged,
  assertTimelineLedgerOwnershipUnchanged,
  assertVisibleUiGuardOwnershipUnchanged,
  DevPulseV2SelfVisionAuthority,
  formatSelfVisionReport,
  getBrowserObservationSummary,
  getLastObservationTimelineEventIds,
  getLastPublishedObservationEvidenceId,
  observeHarnessResults,
  observeRegisteredElements,
  observeRequiredElements,
  publishObservationEvidence,
  publishObservationSummary,
  recordObservationEvent,
  recordObservationSession,
  resetDevPulseV2SelfVisionAuthorityForTests,
  SELF_VISION_OWNER_MODULE,
  SELF_VISION_PASS_TOKEN,
  summarizeObservations,
} from '../src/self-vision/index.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/index.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
import { GUARD_OWNER_MODULE } from '../src/visible-ui-guard/types.js';
import {
  resetDevPulseV2VisibleUiGuardAuthorityForTests,
} from '../src/visible-ui-guard/index.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

const SAMPLE_HTML =
  '<div id="shell-root"><div id="expense-panel"><button id="expense-submit" type="button">Submit</button></div></div>';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Self Vision Foundation Validation');
  console.log('=================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 5,
    systems: ['self_vision'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts self_vision packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetDevPulseV2EvidenceRegistryAuthorityForTests();
  resetDevPulseV2CentralBrainAuthorityForTests();
  resetDevPulseV2BrowserVerificationHarnessForTests();
  const guard = resetDevPulseV2VisibleUiGuardAuthorityForTests();
  const selfVision = resetDevPulseV2SelfVisionAuthorityForTests();

  assert(
    '2. Self Vision Authority exists',
    selfVision instanceof DevPulseV2SelfVisionAuthority,
    `ownerModule=${DevPulseV2SelfVisionAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('self_vision');
  assert(
    '3. Ownership registry contains self_vision',
    owner.ownerModule === SELF_VISION_OWNER_MODULE &&
      DevPulseV2SelfVisionAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptySession = selfVision.createObservationSession([]);
  assert(
    '4. Observation session can be created',
    emptySession.sessionId.length > 0 && emptySession.observations.length === 0,
    emptySession.sessionId,
  );

  guard.registerVisibleUiElement({
    elementId: 'ExpensePanel',
    ownerSystemId: 'expense_system',
    ownerModule: 'devpulse_v2_expense_panel',
    type: 'PANEL',
    label: 'Expense Panel',
    mountTarget: '#shell-root',
    expectedSelector: '#expense-panel',
    interactive: true,
    requiredForPhase: true,
  });

  const singleRecord = selfVision.observeElement(
    guard.getVisibleUiElement('ExpensePanel')!,
    SAMPLE_HTML,
  );
  assert(
    '5. Observation record can be created',
    singleRecord.observationId.length > 0 &&
      (singleRecord.status === 'CLICKABLE' || singleRecord.status === 'VISIBLE'),
    `status=${singleRecord.status} selector=${singleRecord.selector}`,
  );

  assert(
    '6. observeElement works',
    singleRecord.elementId === 'ExpensePanel' && singleRecord.selector === '#expense-panel',
    singleRecord.elementId,
  );

  const registeredSession = selfVision.observeRegisteredUi(SAMPLE_HTML);
  assert(
    '7. observeVisibleUi works',
    selfVision.observeVisibleUi().observations.length >= 1,
    `priorSession=${registeredSession.observations.length}`,
  );

  assert(
    '8. observeRegisteredUi works',
    registeredSession.observations.length === 1 &&
      registeredSession.observations[0].status === 'CLICKABLE',
    `count=${registeredSession.observations.length} status=${registeredSession.observations[0]?.status}`,
  );

  const uiBridgeSession = observeRegisteredElements(SAMPLE_HTML);
  const requiredObs = observeRequiredElements(SAMPLE_HTML);
  assert(
    '9. Visible UI Guard bridge works',
    assertVisibleUiGuardOwnershipUnchanged() &&
      uiBridgeSession.observations.length === 1 &&
      requiredObs.length === 1 &&
      getDevPulseV2Owner('visible_ui_clickability_guard').ownerModule === GUARD_OWNER_MODULE,
    `registered=${uiBridgeSession.observations.length} required=${requiredObs.length}`,
  );

  const harness = getDevPulseV2BrowserVerificationHarness();
  await harness.runFoundationVerification('Self Vision observation test');
  const harnessObs = observeHarnessResults();
  const browserSummary = getBrowserObservationSummary();
  assert(
    '10. Browser Harness bridge works',
    assertBrowserHarnessOwnershipUnchanged() &&
      harnessObs.length > 0 &&
      browserSummary.includes('Browser harness observation'),
    `observations=${harnessObs.length}`,
  );

  const timelineEvent = recordObservationEvent(singleRecord);
  const sessionEvent = recordObservationSession(registeredSession);
  const timelineIds = getLastObservationTimelineEventIds();
  assert(
    '11. Timeline bridge works',
    assertTimelineLedgerOwnershipUnchanged() &&
      timelineEvent.eventId.length > 0 &&
      sessionEvent.eventId.length > 0 &&
      timelineIds.observation === timelineEvent.eventId &&
      getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    `event=${timelineEvent.eventId}`,
  );

  const evidence = publishObservationEvidence(singleRecord);
  assert(
    '12. Evidence bridge works',
    assertEvidenceRegistryOwnershipUnchanged() &&
      evidence.evidenceId.length > 0 &&
      evidence.tags.includes('self_vision') &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    evidence.evidenceId,
  );

  const summary = summarizeObservations(registeredSession);
  const published = publishObservationSummary(summary);
  assert(
    '13. Central Brain bridge works',
    assertCentralBrainOwnershipUnchanged() &&
      published.summaryId.length > 0 &&
      selfVision.getLatestObservationSummary()?.summaryId === published.summaryId &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    published.summary,
  );

  assert(
    '14. Observation summary generated',
    summary.observationCount === 1 && summary.clickableCount === 1,
    summary.summary,
  );

  const reportText = formatSelfVisionReport(selfVision.getObservationSessions(), published);
  assert(
    '15. Report generated',
    reportText.includes('Self Vision Observation Report') &&
      reportText.includes(SELF_VISION_OWNER_MODULE) &&
      selfVision.formatReport().includes('Recommendation:'),
    `sessions=${selfVision.getAuthorityState().sessionCount}`,
  );

  assert(
    '16. Observation evidence published',
    getLastPublishedObservationEvidenceId() === evidence.evidenceId,
    evidence.evidenceId,
  );

  assert(
    '17. Observation events recorded',
    timelineIds.session === sessionEvent.eventId,
    sessionEvent.eventId,
  );

  assert(
    '18. No UI mutation performed',
    DevPulseV2SelfVisionAuthority.assertDoesNotModifyUi(),
    'no mutateUi/modifyUi/renderPanel/mountUi',
  );

  assert(
    '19. No clicks performed',
    DevPulseV2SelfVisionAuthority.assertDoesNotPerformClicks(),
    'no click/clickControl/simulateClick',
  );

  assert(
    '20. No execution performed',
    DevPulseV2SelfVisionAuthority.assertDoesNotExecuteActions(),
    'no execute/runAction/performAction',
  );

  assert(
    '21. No code generation performed',
    DevPulseV2SelfVisionAuthority.assertDoesNotGenerateCode(),
    'no generateCode/writeCode',
  );

  assert(
    '22. No answer authority violation',
    DevPulseV2SelfVisionAuthority.assertDoesNotBecomeAnswerAuthority() &&
      DevPulseV2SelfVisionAuthority.assertDoesNotReplaceBrowserHarness() &&
      DevPulseV2SelfVisionAuthority.assertDoesNotReplaceVisibleUiGuard() &&
      assertSingleAnswerAuthorityRegistered() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    SELF_VISION_OWNER_MODULE,
  );

  assert(
    '23. Validation Budget Policy still passes',
    DevPulseV2SelfVisionAuthority.assertValidationBudgetCompatible() &&
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
  assert('24. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(SELF_VISION_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('SELF VISION FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
