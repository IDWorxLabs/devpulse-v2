/**
 * DevPulse V2 Reality Replay Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
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
  assertSelfVisionOwnershipUnchanged,
  assertTimelineLedgerOwnershipUnchanged,
  DevPulseV2RealityReplayAuthority,
  formatRealityReplayReport,
  getBrowserReplaySummary,
  getEvidenceReplaySummary,
  getObservationReplaySummary,
  getTimelineReplaySummary,
  publishReplaySummary,
  reconstructEvidenceHistory,
  reconstructTimelineEvents,
  replayBrowserVerificationHistory,
  replayObservationSessions,
  resetDevPulseV2RealityReplayAuthorityForTests,
  REPLAY_OWNER_MODULE,
  REPLAY_PASS_TOKEN,
  summarizeReplay,
} from '../src/reality-replay/index.js';
import {
  resetDevPulseV2SelfVisionAuthorityForTests,
  SELF_VISION_OWNER_MODULE,
} from '../src/self-vision/index.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/index.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
import {
  resetDevPulseV2VerificationLoopAuthorityForTests,
} from '../src/verification-loop/index.js';
import { LOOP_OWNER_MODULE } from '../src/verification-loop/types.js';
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

async function seedHistoricalData(): Promise<void> {
  const ledger = resetDevPulseV2TimelineLedgerAuthorityForTests();
  ledger.addEvent({
    source: 'BROWSER_VERIFICATION',
    category: 'VERIFICATION',
    title: 'Seed timeline event for replay',
    summary: 'Historical event for Reality Replay validation',
    relatedEvidenceIds: [],
    status: 'INFO',
    warnings: [],
    errors: [],
  });

  const evidence = resetDevPulseV2EvidenceRegistryAuthorityForTests();
  evidence.addEvidence({
    source: 'BROWSER_VERIFICATION',
    label: 'Seed evidence for replay',
    summary: 'Historical evidence record',
    status: 'PASS',
    relatedSystemId: 'reality_replay',
    tags: ['replay', 'seed'],
    warnings: [],
    errors: [],
  });

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

  const harness = resetDevPulseV2BrowserVerificationHarnessForTests();
  await harness.runFoundationVerification('Reality Replay validation test');

  resetDevPulseV2VerificationLoopAuthorityForTests().verifyAndStoreClaim({
    subject: 'Replay validation claim',
    evidenceIds: [],
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Reality Replay Foundation Validation');
  console.log('==================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 5,
    systems: ['reality_replay'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts reality_replay packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2CentralBrainAuthorityForTests();
  await seedHistoricalData();
  const replay = resetDevPulseV2RealityReplayAuthorityForTests();

  assert(
    '2. Reality Replay Authority exists',
    replay instanceof DevPulseV2RealityReplayAuthority,
    `ownerModule=${DevPulseV2RealityReplayAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('reality_replay');
  assert(
    '3. Ownership registry contains reality_replay',
    owner.ownerModule === REPLAY_OWNER_MODULE &&
      DevPulseV2RealityReplayAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const manualSession = replay.createReplaySession([]);
  assert(
    '4. Replay session can be created',
    manualSession.replaySessionId.length > 0,
    manualSession.replaySessionId,
  );

  const manualEvent = replay.createReplayEvent({
    timestamp: Date.now(),
    sourceSystemId: 'reality_replay',
    eventType: 'MANUAL',
    description: 'Test replay event',
    evidenceIds: [],
    warnings: [],
    errors: [],
  });
  assert(
    '5. Replay event can be created',
    manualEvent.replayEventId.length > 0 && manualEvent.eventType === 'MANUAL',
    manualEvent.replayEventId,
  );

  const fullReplay = replay.reconstructTimeline();
  assert(
    '6. reconstructTimeline works',
    fullReplay.events.length > 0 && fullReplay.events[0].timestamp <= fullReplay.events[fullReplay.events.length - 1].timestamp,
    `events=${fullReplay.events.length} status=${fullReplay.status}`,
  );

  const observationReplay = replay.replayObservationHistory();
  assert(
    '7. replayObservationHistory works',
    observationReplay.events.length >= 1 &&
      observationReplay.events.some((e) => e.sourceSystemId === 'self_vision'),
    `events=${observationReplay.events.length}`,
  );

  const evidenceReplay = replay.replayEvidenceHistory();
  assert(
    '8. replayEvidenceHistory works',
    evidenceReplay.events.length >= 1 &&
      evidenceReplay.events.some((e) => e.sourceSystemId === 'evidence_registry'),
    `events=${evidenceReplay.events.length}`,
  );

  const browserReplay = replay.replayBrowserHistory();
  assert(
    '9. replayBrowserHistory works',
    browserReplay.events.length >= 1 &&
      browserReplay.events.some((e) => e.sourceSystemId === 'browser_verification_harness'),
    `events=${browserReplay.events.length}`,
  );

  const validationReplay = replay.replayValidationHistory();
  assert(
    '10. replayValidationHistory works',
    validationReplay.events.length >= 1 &&
      validationReplay.events.some((e) => e.sourceSystemId === 'verification_loop'),
    `events=${validationReplay.events.length}`,
  );

  const summary = summarizeReplay(fullReplay);
  assert(
    '11. summarizeReplay works',
    summary.summaryId.length > 0 && summary.eventCount === fullReplay.events.length,
    summary.summary,
  );

  assert(
    '12. Self Vision bridge works',
    assertSelfVisionOwnershipUnchanged() &&
      replayObservationSessions().events.length >= 1 &&
      getObservationReplaySummary().includes('Observation replay') &&
      getDevPulseV2Owner('self_vision').ownerModule === SELF_VISION_OWNER_MODULE,
    getObservationReplaySummary(),
  );

  assert(
    '13. Timeline bridge works',
    assertTimelineLedgerOwnershipUnchanged() &&
      reconstructTimelineEvents().length >= 1 &&
      getTimelineReplaySummary().includes('Timeline replay') &&
      getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    getTimelineReplaySummary(),
  );

  assert(
    '14. Evidence bridge works',
    assertEvidenceRegistryOwnershipUnchanged() &&
      reconstructEvidenceHistory().length >= 1 &&
      getEvidenceReplaySummary().includes('Evidence replay') &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    getEvidenceReplaySummary(),
  );

  assert(
    '15. Browser bridge works',
    assertBrowserHarnessOwnershipUnchanged() &&
      replayBrowserVerificationHistory().events.length >= 1 &&
      getBrowserReplaySummary().includes('Browser replay') &&
      getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    getBrowserReplaySummary(),
  );

  const published = publishReplaySummary(summary);
  assert(
    '16. Central Brain bridge works',
    assertCentralBrainOwnershipUnchanged() &&
      published.summaryId === summary.summaryId &&
      replay.getLatestReplaySummary()?.summaryId === published.summaryId &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    published.summary,
  );

  const reportText = formatRealityReplayReport(replay.getReplaySessions(), published);
  assert(
    '17. Replay report generated',
    reportText.includes('Reality Replay Report') &&
      reportText.includes(REPLAY_OWNER_MODULE) &&
      replay.formatReport().includes('Recommendation:'),
    `sessions=${replay.getAuthorityState().sessionCount}`,
  );

  assert(
    '18. Replay summary generated',
    replay.getLatestReplaySummary() !== null && published.eventCount > 0,
    published.summary,
  );

  assert(
    '19. Observation history reconstructed',
    observationReplay.events.some((e) => e.eventType === 'OBSERVATION'),
    `count=${observationReplay.events.length}`,
  );

  assert(
    '20. Evidence history reconstructed',
    evidenceReplay.events.some((e) => e.eventType === 'EVIDENCE'),
    `count=${evidenceReplay.events.length}`,
  );

  assert(
    '21. Browser history reconstructed',
    browserReplay.events.some((e) => e.eventType === 'BROWSER_CHECK'),
    `count=${browserReplay.events.length}`,
  );

  assert(
    '22. No execution performed',
    DevPulseV2RealityReplayAuthority.assertDoesNotExecuteActions(),
    'no execute/runAction',
  );

  assert(
    '23. No repairs performed',
    DevPulseV2RealityReplayAuthority.assertDoesNotPerformRepairs(),
    'no repair/fix/remediate',
  );

  assert(
    '24. No root cause analysis performed',
    DevPulseV2RealityReplayAuthority.assertDoesNotPerformRootCauseAnalysis(),
    'no rootCause/diagnose/analyzeCause',
  );

  assert(
    '25. No prediction performed',
    DevPulseV2RealityReplayAuthority.assertDoesNotPerformPrediction(),
    'no predict/forecast/predictFailure',
  );

  assert(
    '26. No answer authority violation',
    DevPulseV2RealityReplayAuthority.assertDoesNotBecomeAnswerAuthority() &&
      DevPulseV2RealityReplayAuthority.assertDoesNotReplaceTimelineLedger() &&
      DevPulseV2RealityReplayAuthority.assertDoesNotReplaceSelfVision() &&
      assertSingleAnswerAuthorityRegistered() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      getDevPulseV2Owner('verification_loop').ownerModule === LOOP_OWNER_MODULE,
    REPLAY_OWNER_MODULE,
  );

  assert(
    '27. Validation Budget Policy still passes',
    DevPulseV2RealityReplayAuthority.assertValidationBudgetCompatible() &&
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
  assert('28. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(REPLAY_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('REALITY REPLAY FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
