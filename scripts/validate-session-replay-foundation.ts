/**
 * DevPulse V2 Session Replay Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/index.js';
import { AIDEV_OWNER_MODULE } from '../src/aidev-engine/types.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import {
  createDevPulseV2ChatAuthority,
  resetDevPulseV2ChatAuthorityForTests,
} from '../src/chat/chat-authority.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { resetDevPulseV2BrowserVerificationHarnessForTests } from '../src/browser-verification/index.js';
import { resetDevPulseV2CentralBrainAuthorityForTests } from '../src/central-brain/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { resetDevPulseV2EvidenceRegistryAuthorityForTests } from '../src/evidence-registry/index.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  PLANNING_STACK_VALIDATION_REQUEST,
  resetDevPulseV2PlanningStackValidationAuthorityForTests,
} from '../src/planning-stack-validation/index.js';
import { resetDevPulseV2RealityReplayAuthorityForTests } from '../src/reality-replay/index.js';
import { REPLAY_OWNER_MODULE } from '../src/reality-replay/types.js';
import {
  assertAiDevOwnershipUnchanged,
  assertCentralBrainOwnershipUnchanged,
  assertEvidenceRegistryOwnershipUnchanged,
  assertRealityReplayOwnershipUnchanged,
  assertSelfVisionOwnershipUnchanged,
  assertTimelineLedgerOwnershipUnchanged,
  DevPulseV2SessionReplayAuthority,
  formatSessionReplayReport,
  getAiDevSessionSummary,
  getEvidenceSessionSummary,
  getObservationSessionSummary,
  getReplaySessionSummary,
  getTimelineSessionSummary,
  publishSessionReplaySummary,
  reconstructAiDevRequests,
  reconstructEvidenceSessions,
  reconstructObservationSessions,
  reconstructReplaySessions,
  reconstructTimelineSessions,
  resetDevPulseV2SessionReplayAuthorityForTests,
  SESSION_REPLAY_OWNER_MODULE,
  SESSION_REPLAY_PASS_TOKEN,
  summarizeSessionReplay,
} from '../src/session-replay/index.js';
import {
  resetDevPulseV2SelfVisionAuthorityForTests,
  SELF_VISION_OWNER_MODULE,
} from '../src/self-vision/index.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/index.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
import { resetDevPulseV2VisibleUiGuardAuthorityForTests } from '../src/visible-ui-guard/index.js';
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

async function seedSessionHistory(): Promise<void> {
  const startedAt = Date.now();

  resetDevPulseV2TimelineLedgerAuthorityForTests().addEvent({
    source: 'CHAT',
    category: 'USER',
    title: 'User session seed event',
    summary: 'Timeline event for session replay validation',
    relatedEvidenceIds: [],
    relatedRecordId: 'user-session-seed',
    status: 'INFO',
    warnings: [],
    errors: [],
  });

  resetDevPulseV2EvidenceRegistryAuthorityForTests().addEvidence({
    source: 'BROWSER_VERIFICATION',
    label: 'Session replay seed evidence',
    summary: 'Evidence for session reconstruction',
    status: 'PASS',
    relatedSystemId: 'session_replay',
    relatedRecordId: 'session-seed',
    tags: ['session_replay', 'seed'],
    warnings: [],
    errors: [],
  });

  resetDevPulseV2AiDevEngineAuthorityForTests().intakeBuildRequest('Build session replay validation app');

  resetDevPulseV2PlanningStackValidationAuthorityForTests().runValidation(PLANNING_STACK_VALIDATION_REQUEST);

  resetDevPulseV2VisibleUiGuardAuthorityForTests().registerVisibleUiElement({
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
  resetDevPulseV2SelfVisionAuthorityForTests().observeRegisteredUi(SAMPLE_HTML);

  const chat = createDevPulseV2ChatAuthority(startedAt);
  await chat.submitUserMessage('Session replay validation message');

  resetDevPulseV2BrowserVerificationHarnessForTests();
  resetDevPulseV2RealityReplayAuthorityForTests().reconstructTimeline();
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Session Replay Foundation Validation');
  console.log('==================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 5,
    systems: ['session_replay'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts session_replay packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2CentralBrainAuthorityForTests();
  resetDevPulseV2ChatAuthorityForTests(Date.now());
  await seedSessionHistory();
  const sessionReplay = resetDevPulseV2SessionReplayAuthorityForTests();

  assert(
    '2. Session Replay Authority exists',
    sessionReplay instanceof DevPulseV2SessionReplayAuthority,
    `ownerModule=${DevPulseV2SessionReplayAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('session_replay');
  assert(
    '3. Ownership registry contains session_replay',
    owner.ownerModule === SESSION_REPLAY_OWNER_MODULE &&
      DevPulseV2SessionReplayAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const manualRecord = sessionReplay.createSessionReplayRecord([], 'manual-session');
  assert(
    '4. Session replay record can be created',
    manualRecord.sessionReplayId.length > 0,
    manualRecord.sessionReplayId,
  );

  const manualEvent = sessionReplay.createSessionReplayEvent({
    timestamp: Date.now(),
    sourceSystemId: 'session_replay',
    eventType: 'MANUAL',
    description: 'Test session replay event',
    evidenceIds: [],
    warnings: [],
    errors: [],
  });
  assert(
    '5. Session replay event can be created',
    manualEvent.replayEventId.length > 0,
    manualEvent.replayEventId,
  );

  const completeSession = sessionReplay.reconstructSession();
  assert(
    '6. reconstructSession works',
    completeSession.events.length > 0 && completeSession.sessionId === 'complete-session',
    `events=${completeSession.events.length} status=${completeSession.status}`,
  );

  const userSession = sessionReplay.reconstructUserSession();
  assert(
    '7. reconstructUserSession works',
    userSession.events.some((e) => e.eventType === 'USER_MESSAGE' || e.eventType === 'ASSISTANT_MESSAGE'),
    `events=${userSession.events.length}`,
  );

  const aidevSession = sessionReplay.reconstructAiDevSession();
  assert(
    '8. reconstructAiDevSession works',
    aidevSession.events.some((e) => e.sourceSystemId === 'aidev_engine'),
    `events=${aidevSession.events.length}`,
  );

  const planningSession = sessionReplay.reconstructPlanningSession();
  assert(
    '9. reconstructPlanningSession works',
    planningSession.events.some((e) => e.eventType === 'PLANNING_VALIDATION'),
    `events=${planningSession.events.length}`,
  );

  const observationSession = sessionReplay.reconstructObservationSession();
  assert(
    '10. reconstructObservationSession works',
    observationSession.events.some((e) => e.sourceSystemId === 'self_vision'),
    `events=${observationSession.events.length}`,
  );

  const summary = summarizeSessionReplay(sessionReplay.getSessionReplayRecords());
  assert(
    '11. summarizeSessionReplay works',
    summary.sessionCount > 0 && summary.eventCount > 0,
    `sessions=${summary.sessionCount} events=${summary.eventCount}`,
  );

  assert(
    '12. Reality Replay bridge works',
    assertRealityReplayOwnershipUnchanged() &&
      reconstructReplaySessions().length >= 1 &&
      getReplaySessionSummary().includes('Reality Replay sessions') &&
      getDevPulseV2Owner('reality_replay').ownerModule === REPLAY_OWNER_MODULE,
    getReplaySessionSummary(),
  );

  assert(
    '13. AiDev bridge works',
    assertAiDevOwnershipUnchanged() &&
      reconstructAiDevRequests().length >= 1 &&
      getAiDevSessionSummary().includes('AiDev sessions') &&
      getDevPulseV2Owner('aidev_engine').ownerModule === AIDEV_OWNER_MODULE,
    getAiDevSessionSummary(),
  );

  assert(
    '14. Timeline bridge works',
    assertTimelineLedgerOwnershipUnchanged() &&
      reconstructTimelineSessions().length >= 1 &&
      getTimelineSessionSummary().includes('Timeline sessions') &&
      getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    getTimelineSessionSummary(),
  );

  assert(
    '15. Evidence bridge works',
    assertEvidenceRegistryOwnershipUnchanged() &&
      reconstructEvidenceSessions().length >= 1 &&
      getEvidenceSessionSummary().includes('Evidence sessions') &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    getEvidenceSessionSummary(),
  );

  assert(
    '16. Self Vision bridge works',
    assertSelfVisionOwnershipUnchanged() &&
      reconstructObservationSessions().length >= 1 &&
      getObservationSessionSummary().includes('Observation sessions') &&
      getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE,
    getObservationSessionSummary(),
  );

  const published = publishSessionReplaySummary(summary);
  assert(
    '17. Central Brain bridge works',
    assertCentralBrainOwnershipUnchanged() &&
      sessionReplay.getLatestSessionReplaySummary()?.sessionCount === published.sessionCount &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    `sessions=${published.sessionCount}`,
  );

  const reportText = formatSessionReplayReport(sessionReplay.getSessionReplayRecords(), published);
  assert(
    '18. Session replay report generated',
    reportText.includes('Session Replay Report') &&
      reportText.includes(SESSION_REPLAY_OWNER_MODULE) &&
      sessionReplay.formatReport().includes('Recommendation:'),
    `records=${sessionReplay.getAuthorityState().recordCount}`,
  );

  assert(
    '19. User session reconstructed',
    userSession.events.length >= 2,
    userSession.sessionId,
  );

  assert(
    '20. AiDev request session reconstructed',
    reconstructAiDevRequests()[0]?.events.some((e) => e.eventType === 'AIDEV_REQUEST'),
    aidevSession.sessionId,
  );

  assert(
    '21. Planning session reconstructed',
    planningSession.events.some((e) => e.eventType === 'PLANNING_HANDOFF'),
    `handoffs=${planningSession.events.filter((e) => e.eventType === 'PLANNING_HANDOFF').length}`,
  );

  assert(
    '22. Observation session reconstructed',
    observationSession.events.some((e) => e.eventType === 'OBSERVATION'),
    observationSession.sessionId,
  );

  assert(
    '23. No execution performed',
    DevPulseV2SessionReplayAuthority.assertDoesNotExecuteActions(),
    'no execute/runAction',
  );

  assert(
    '24. No repairs performed',
    DevPulseV2SessionReplayAuthority.assertDoesNotPerformRepairs(),
    'no repair/fix/remediate',
  );

  assert(
    '25. No root cause analysis performed',
    DevPulseV2SessionReplayAuthority.assertDoesNotPerformRootCauseAnalysis(),
    'no rootCause/diagnose/analyzeCause',
  );

  assert(
    '26. No prediction performed',
    DevPulseV2SessionReplayAuthority.assertDoesNotPerformPrediction(),
    'no predict/forecast/predictFailure',
  );

  assert(
    '27. No answer authority violation',
    DevPulseV2SessionReplayAuthority.assertDoesNotBecomeAnswerAuthority() &&
      DevPulseV2SessionReplayAuthority.assertDoesNotReplaceRealityReplay() &&
      DevPulseV2SessionReplayAuthority.assertDoesNotReplaceTimelineLedger() &&
      DevPulseV2SessionReplayAuthority.assertDoesNotReplaceSelfVision() &&
      assertSingleAnswerAuthorityRegistered() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    SESSION_REPLAY_OWNER_MODULE,
  );

  assert(
    '28. Validation Budget Policy still passes',
    DevPulseV2SessionReplayAuthority.assertValidationBudgetCompatible() &&
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
  assert('29. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(SESSION_REPLAY_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('SESSION REPLAY FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
