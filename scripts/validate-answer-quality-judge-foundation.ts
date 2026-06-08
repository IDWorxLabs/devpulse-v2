/**
 * DevPulse V2 Answer Quality Judge Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { buildAnswer } from '../src/chat/answer-contract.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE, FOUNDATION_RESPONSE_TEXT } from '../src/chat/types.js';
import { PROTECTION_OWNER_MODULE } from '../src/answer-authority-protection/types.js';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../src/answer-authority-protection/index.js';
import {
  assertCentralBrainOwnershipUnchanged,
  calculateQualityScore,
  DevPulseV2AnswerQualityJudgeAuthority,
  formatAnswerQualityReport,
  generateQualityChecks,
  JUDGE_OWNER_MODULE,
  JUDGE_PASS_TOKEN,
  resetDevPulseV2AnswerQualityJudgeAuthorityForTests,
  reviewAnswer,
  summarizeReview,
} from '../src/answer-quality-judge/index.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Answer Quality Judge Foundation Validation');
  console.log('=========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['answer_quality_judge'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts answer_quality_judge packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const judge = resetDevPulseV2AnswerQualityJudgeAuthorityForTests();

  assert(
    '2. Answer Quality Judge Authority exists',
    judge instanceof DevPulseV2AnswerQualityJudgeAuthority,
    `ownerModule=${DevPulseV2AnswerQualityJudgeAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('answer_quality_judge');
  assert(
    '3. Ownership registry contains answer_quality_judge',
    owner.ownerModule === JUDGE_OWNER_MODULE &&
      DevPulseV2AnswerQualityJudgeAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = judge.getJudgeState();
  assert(
    '4. Judge starts empty',
    emptyState.reviewCount === 0,
    `reviews=${emptyState.reviewCount}`,
  );

  const validAnswer = buildAnswer(FOUNDATION_RESPONSE_TEXT);
  const reviewed = reviewAnswer(validAnswer);
  assert(
    '5. reviewAnswer works',
    reviewed.reviewId.length > 0 && reviewed.checks.length >= 7,
    `checks=${reviewed.checks.length}`,
  );

  const score = calculateQualityScore(reviewed);
  assert(
    '6. calculateQualityScore works',
    score >= 0 && score <= 100 && reviewed.qualityScore === score,
    `score=${score}`,
  );

  const checks = generateQualityChecks(validAnswer);
  assert(
    '7. generateQualityChecks works',
    checks.length >= 7 && checks.some((c) => c.name === 'Answer exists'),
    `checks=${checks.length}`,
  );

  const summary = summarizeReview(reviewed);
  assert(
    '8. summarizeReview works',
    summary.includes('Review') && summary.includes(reviewed.reviewId),
    summary.slice(0, 80),
  );

  const emptyAnswer = buildAnswer('');
  const emptyReview = judge.reviewAndStore(emptyAnswer);
  assert(
    '9. Empty answer review works',
    emptyReview.overallStatus === 'FAIL' &&
      emptyReview.checks.some((c) => c.name === 'Answer is not empty' && c.status === 'FAIL'),
    emptyReview.overallStatus,
  );

  const validReview = judge.reviewAndStore(validAnswer);
  assert(
    '10. Valid answer review works',
    validReview.overallStatus === 'PASS' && validReview.qualityScore >= 80,
    `status=${validReview.overallStatus} score=${validReview.qualityScore}`,
  );

  const compliance = judge.reviewAuthorityCompliance();
  assert(
    '11. Authority compliance review works',
    compliance.compliant && compliance.violationCount === 0,
    compliance.summary,
  );

  const published = judge.publishReviewSummary(validReview);
  const latest = judge.getLatestReviewSummary();
  assert(
    '12. Central Brain bridge works',
    published.reviewId === validReview.reviewId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const stored = judge.reviewAndStore(validAnswer);
  const retrieved = judge.getReview(stored.reviewId);
  assert(
    '13. Review records stored correctly',
    judge.getJudgeState().reviewCount >= 3 &&
      retrieved !== null &&
      retrieved.answerId === validAnswer.answerId,
    `stored=${stored.reviewId}`,
  );

  const reportText = formatAnswerQualityReport(judge.getJudgeState(), judge.listReviews());
  assert(
    '14. Report generated',
    reportText.includes('Answer Quality Judge Report') &&
      judge.formatReport().includes('Recommendation:'),
    `reviews=${judge.getJudgeState().reviewCount}`,
  );

  assert(
    '15. Judge does not become answer authority',
    DevPulseV2AnswerQualityJudgeAuthority.assertDoesNotBecomeAnswerAuthority() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered(),
    `judge=${JUDGE_OWNER_MODULE}`,
  );

  const answerBefore = { ...validAnswer, visibleAnswerText: validAnswer.visibleAnswerText };
  judge.reviewAndStore(validAnswer);
  assert(
    '16. Judge does not modify answers',
    DevPulseV2AnswerQualityJudgeAuthority.assertDoesNotModifyAnswers() &&
      validAnswer.visibleAnswerText === answerBefore.visibleAnswerText &&
      validAnswer.answerId === answerBefore.answerId,
    validAnswer.visibleAnswerText.slice(0, 40),
  );

  assert(
    '17. Judge does not rewrite answers',
    DevPulseV2AnswerQualityJudgeAuthority.assertDoesNotRewriteAnswers(),
    'no rewrite methods',
  );

  assert(
    '18. Judge does not execute actions',
    DevPulseV2AnswerQualityJudgeAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '19. Answer Authority Protection still passes',
    DevPulseV2AnswerQualityJudgeAuthority.assertAnswerAuthorityProtectionCompatible() &&
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE,
    `protection=${PROTECTION_OWNER_MODULE}`,
  );

  assert(
    '20. Validation Budget Policy still passes',
    DevPulseV2AnswerQualityJudgeAuthority.assertValidationBudgetCompatible() &&
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
  assert('21. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(JUDGE_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('ANSWER QUALITY JUDGE FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
