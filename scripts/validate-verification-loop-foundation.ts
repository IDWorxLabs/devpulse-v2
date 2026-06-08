/**
 * DevPulse V2 Verification Loop Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { buildAnswer } from '../src/chat/answer-contract.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE, FOUNDATION_RESPONSE_TEXT } from '../src/chat/types.js';
import { PROTECTION_OWNER_MODULE } from '../src/answer-authority-protection/types.js';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../src/answer-authority-protection/index.js';
import { resetDevPulseV2AnswerQualityJudgeAuthorityForTests } from '../src/answer-quality-judge/index.js';
import { JUDGE_OWNER_MODULE } from '../src/answer-quality-judge/types.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { resetDevPulseV2EvidenceRegistryAuthorityForTests } from '../src/evidence-registry/index.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { TRUST_OWNER_MODULE } from '../src/trust-engine/types.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';
import {
  assertCentralBrainOwnershipUnchanged,
  assertEvidenceRegistryOwnershipUnchanged,
  assertJudgeOwnershipUnchanged,
  DevPulseV2VerificationLoopAuthority,
  formatVerificationLoopReport,
  LOOP_OWNER_MODULE,
  LOOP_PASS_TOKEN,
  resetDevPulseV2VerificationLoopAuthorityForTests,
  summarizeVerification,
  verifyClaim,
  verifyEvidenceLinks,
  verifySubject,
} from '../src/verification-loop/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function seedEvidence(): { passId: string; warnId: string; failId: string } {
  const registry = resetDevPulseV2EvidenceRegistryAuthorityForTests();
  const pass = registry.addEvidence({
    source: 'FOUNDATION_ENFORCEMENT',
    label: 'Pass evidence',
    summary: 'Supporting PASS evidence',
    status: 'PASS',
    tags: ['verification-test'],
    warnings: [],
    errors: [],
  });
  const warn = registry.addEvidence({
    source: 'TRUST_ENGINE',
    label: 'Warn evidence',
    summary: 'Weak WARN evidence',
    status: 'WARN',
    tags: ['verification-test'],
    warnings: [],
    errors: [],
  });
  const fail = registry.addEvidence({
    source: 'BROWSER_VERIFICATION',
    label: 'Fail evidence',
    summary: 'Contradicting FAIL evidence',
    status: 'FAIL',
    tags: ['verification-test'],
    warnings: [],
    errors: [],
  });
  return { passId: pass.evidenceId, warnId: warn.evidenceId, failId: fail.evidenceId };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Verification Loop Foundation Validation');
  console.log('=====================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['verification_loop'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts verification_loop packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const loop = resetDevPulseV2VerificationLoopAuthorityForTests();
  const evidence = seedEvidence();

  assert(
    '2. Verification Loop Authority exists',
    loop instanceof DevPulseV2VerificationLoopAuthority,
    `ownerModule=${DevPulseV2VerificationLoopAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('verification_loop');
  assert(
    '3. Ownership registry contains verification_loop',
    owner.ownerModule === LOOP_OWNER_MODULE &&
      DevPulseV2VerificationLoopAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = loop.getLoopState();
  assert(
    '4. Verification Loop starts empty',
    emptyState.reviewCount === 0,
    `reviews=${emptyState.reviewCount}`,
  );

  const claim = verifyClaim({
    subject: 'Chat Authority foundation is stable',
    evidenceIds: [evidence.passId],
  });
  assert(
    '5. verifyClaim works',
    claim.verificationId.length > 0 && claim.findings.length > 0,
    claim.verificationId,
  );

  const links = verifyEvidenceLinks([evidence.passId, 'missing-evidence']);
  assert(
    '6. verifyEvidenceLinks works',
    links[0].valid && !links[1].valid,
    `valid=${links[0].valid} missing=${links[1].valid}`,
  );

  const subject = verifySubject('  Foundation claim  ');
  assert(
    '7. verifySubject works',
    subject.valid && subject.subject === 'Foundation claim',
    subject.subject,
  );

  const summary = summarizeVerification(claim);
  assert(
    '8. summarizeVerification works',
    summary.includes('Verification') && summary.includes(claim.verificationId),
    summary.slice(0, 80),
  );

  const verified = loop.verifyAndStoreClaim({
    subject: 'PASS-only claim',
    evidenceIds: [evidence.passId],
  });
  assert(
    '9. VERIFIED status works',
    verified.status === 'VERIFIED' && verified.confidence === 'HIGH',
    verified.status,
  );

  const partial = loop.verifyAndStoreClaim({
    subject: 'WARN evidence claim',
    evidenceIds: [evidence.warnId],
  });
  assert(
    '10. PARTIAL status works',
    partial.status === 'PARTIAL' && partial.confidence === 'MEDIUM',
    partial.status,
  );

  const unverified = loop.verifyAndStoreClaim({
    subject: 'No evidence claim',
    evidenceIds: [],
  });
  assert(
    '11. UNVERIFIED status works',
    unverified.status === 'UNVERIFIED',
    unverified.status,
  );

  const conflict = loop.verifyAndStoreClaim({
    subject: 'Conflicting claim',
    evidenceIds: [evidence.passId, evidence.failId],
  });
  assert(
    '12. CONFLICT status works',
    conflict.status === 'CONFLICT' && conflict.confidence === 'LOW',
    conflict.status,
  );

  const evidenceBridge = loop.verifyEvidenceRecord(evidence.passId);
  assert(
    '13. Evidence bridge works',
    evidenceBridge.valid &&
      loop.getEvidenceVerificationSummary() !== null &&
      assertEvidenceRegistryOwnershipUnchanged(),
    evidenceBridge.summary,
  );

  const judge = resetDevPulseV2AnswerQualityJudgeAuthorityForTests();
  const qualityReview = judge.reviewAndStore(buildAnswer(FOUNDATION_RESPONSE_TEXT));
  const qualityBridge = loop.verifyReviewQualityClaims(qualityReview);
  assert(
    '14. Answer Quality Judge bridge works',
    qualityBridge.reviewId === qualityReview.reviewId &&
      assertJudgeOwnershipUnchanged() &&
      getDevPulseV2Owner('answer_quality_judge').ownerModule === JUDGE_OWNER_MODULE,
    qualityBridge.summary,
  );

  const published = loop.publishVerificationSummary(verified);
  const latest = loop.getLatestVerificationSummary();
  assert(
    '15. Central Brain bridge works',
    published.verificationId === verified.verificationId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const stored = loop.verifyAndStoreClaim({
    subject: 'Stored claim',
    evidenceIds: [evidence.passId],
  });
  const retrieved = loop.getVerification(stored.verificationId);
  assert(
    '16. Verification records stored correctly',
    loop.getLoopState().reviewCount >= 5 &&
      retrieved !== null &&
      retrieved.subject === 'Stored claim',
    `stored=${stored.verificationId}`,
  );

  const reportText = formatVerificationLoopReport(loop.getLoopState(), loop.listVerifications());
  assert(
    '17. Report generated',
    reportText.includes('Verification Loop Report') &&
      loop.formatReport().includes('Recommendation:'),
    `reviews=${loop.getLoopState().reviewCount}`,
  );

  assert(
    '18. Verification Loop does not become answer authority',
    DevPulseV2VerificationLoopAuthority.assertDoesNotBecomeAnswerAuthority() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered(),
    `loop=${LOOP_OWNER_MODULE}`,
  );

  assert(
    '19. Verification Loop does not execute actions',
    DevPulseV2VerificationLoopAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '20. Verification Loop does not generate code',
    DevPulseV2VerificationLoopAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '21. Verification Loop does not replace Trust Engine',
    DevPulseV2VerificationLoopAuthority.assertDoesNotReplaceTrustEngine() &&
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    `trust=${TRUST_OWNER_MODULE}`,
  );

  assert(
    '22. Verification Loop does not replace Browser Verification Harness',
    DevPulseV2VerificationLoopAuthority.assertDoesNotReplaceBrowserHarness() &&
      getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `harness=${HARNESS_OWNER_MODULE}`,
  );

  assert(
    '23. Verification Loop does not replace Answer Quality Judge',
    DevPulseV2VerificationLoopAuthority.assertDoesNotReplaceAnswerQualityJudge() &&
      getDevPulseV2Owner('answer_quality_judge').ownerModule === JUDGE_OWNER_MODULE,
    `judge=${JUDGE_OWNER_MODULE}`,
  );

  assert(
    '24. Answer Authority Protection still passes',
    DevPulseV2VerificationLoopAuthority.assertAnswerAuthorityProtectionCompatible() &&
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE,
    `protection=${PROTECTION_OWNER_MODULE}`,
  );

  assert(
    '25. Validation Budget Policy still passes',
    DevPulseV2VerificationLoopAuthority.assertValidationBudgetCompatible() &&
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
    console.log('=====================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(LOOP_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('VERIFICATION LOOP FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
