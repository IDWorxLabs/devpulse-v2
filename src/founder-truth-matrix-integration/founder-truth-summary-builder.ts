/**
 * Phase 26.71 — Founder truth summary builder (V1).
 */

import type { ConsistencyClaimAudit } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import { FOUNDER_TRUTH_QUESTIONS } from './founder-truth-matrix-integration-registry.js';
import type {
  FounderTruthMatrixReconciliation,
  FounderTruthQuestionAnswer,
  FounderTruthSummary,
  ReconciledTruthClaim,
} from './founder-truth-matrix-integration-types.js';
import type { LaunchVerdictReconciliationResult } from './launch-verdict-reconciler.js';

function buildQuestionAnswer(
  question: string,
  claim: ReconciledTruthClaim | undefined,
): FounderTruthQuestionAnswer {
  if (!claim) {
    return {
      readOnly: true,
      question,
      answer: 'UNKNOWN',
      answerToken: 'TRUTH_MATRIX_FINAL_ANSWER',
      reason: 'No reconciled claim available for this founder question.',
      rootCause: 'UNKNOWN',
      launchImpact: 'NONE',
    };
  }

  let reason = `TRUTH_MATRIX_FINAL_ANSWER: ${claim.truthMatrixVerdict} (rootCause=${claim.rootCause}, launchImpact=${claim.launchImpact}).`;
  if (claim.contradictionDetected) {
    reason += ` Contradiction reconciled: ${claim.contradictionReason}`;
  }

  return {
    readOnly: true,
    question,
    answer: claim.truthMatrixVerdict,
    answerToken: 'TRUTH_MATRIX_FINAL_ANSWER',
    reason,
    rootCause: claim.rootCause,
    launchImpact: claim.launchImpact,
  };
}

function deriveLaunchBlockedByProduct(
  reconciliation: FounderTruthMatrixReconciliation,
  launchResult: LaunchVerdictReconciliationResult,
): boolean {
  return reconciliation.productLaunchBlocked || launchResult.productLaunchBlocked;
}

function deriveLaunchBlockedByTesting(
  reconciliation: FounderTruthMatrixReconciliation,
  launchResult: LaunchVerdictReconciliationResult,
): boolean {
  return (
    reconciliation.testingSystemDefectCount > 0 &&
    !launchResult.productLaunchBlocked &&
    launchResult.postReconciliationVerdict !== 'NOT_LAUNCH_READY' &&
    launchResult.postReconciliationVerdict !== 'BLOCKED'
  );
}

export function buildFounderTruthSummary(
  reconciledClaims: ReconciledTruthClaim[],
  reconciliation: FounderTruthMatrixReconciliation,
  launchResult: LaunchVerdictReconciliationResult,
  claimAudits: ConsistencyClaimAudit[],
): FounderTruthSummary {
  const claimById = new Map(reconciledClaims.map((c) => [c.claimId, c]));

  const whatIsActuallyTrue = reconciledClaims
    .filter((c) => c.truthMatrixVerdict === 'PROVEN' || c.truthMatrixVerdict === 'PARTIAL')
    .map((c) => `${c.claim}: ${c.truthMatrixVerdict} (${c.rootCause})`);

  const whatIsActuallyBroken = reconciledClaims
    .filter((c) => c.truthMatrixVerdict === 'NOT_PROVEN')
    .map((c) => `${c.claim}: NOT_PROVEN (${c.rootCause})`);

  const productGaps = reconciledClaims
    .filter((c) => c.rootCause === 'REAL_PRODUCT_GAP')
    .map((c) => `${c.claim} — ${c.contradictionReason || c.rootCause}`);

  const testingSystemGaps = reconciledClaims
    .filter((c) => c.rootCause === 'SCORING_DEFECT' || c.rootCause === 'EVIDENCE_PROPAGATION_FAILURE')
    .map((c) =>
      c.rootCause === 'SCORING_DEFECT'
        ? `TESTING_SYSTEM_DEFECT — ${c.claim}: ${c.contradictionReason || 'scoring defect'}`
        : `EVIDENCE_PROPAGATION_FAILURE — ${c.claim}`,
    );

  const authorityDisagreements = reconciledClaims
    .filter((c) => c.rootCause === 'AUTHORITY_DISAGREEMENT')
    .map(
      (c) =>
        `${c.claim}: TRUTH_MATRIX_VERDICT=${c.truthMatrixVerdict} — ${c.contradictionReason || 'authorities disagreed'}`,
    );

  const launchBlockingProductGaps = launchResult.categorizedBlockers.launchBlockersProduct.map(
    (b) => b.explanation,
  );

  const nonBlockingTestingDefects = launchResult.categorizedBlockers.launchBlockersTesting.map(
    (b) => b.explanation,
  );

  const founderQuestions = FOUNDER_TRUTH_QUESTIONS.map(({ question, claimId }) =>
    buildQuestionAnswer(question, claimById.get(claimId)),
  );

  // Enrich launch-blocked questions from reconciliation state
  const productBlocked = deriveLaunchBlockedByProduct(reconciliation, launchResult);
  const testingBlocked = deriveLaunchBlockedByTesting(reconciliation, launchResult);

  const productLaunchQuestion = founderQuestions.find((q) =>
    q.question.includes('blocked by the product'),
  );
  if (productLaunchQuestion) {
    productLaunchQuestion.answer = productBlocked ? 'NOT_PROVEN' : 'PROVEN';
    productLaunchQuestion.reason = productBlocked
      ? `TRUTH_MATRIX_FINAL_ANSWER: Launch blocked by REAL_PRODUCT_GAP (${launchBlockingProductGaps.length} product gap blocker(s)).`
      : 'TRUTH_MATRIX_FINAL_ANSWER: No reconciled REAL_PRODUCT_GAP blocks launch readiness.';
  }

  const testingLaunchQuestion = founderQuestions.find((q) =>
    q.question.includes('testing infrastructure'),
  );
  if (testingLaunchQuestion) {
    testingLaunchQuestion.answer = testingBlocked ? 'PARTIAL' : 'PROVEN';
    testingLaunchQuestion.reason = testingBlocked
      ? `TRUTH_MATRIX_FINAL_ANSWER: Testing infrastructure defects present (${nonBlockingTestingDefects.length}) but do not block product launch.`
      : 'TRUTH_MATRIX_FINAL_ANSWER: No non-blocking testing infrastructure defect dominates launch verdict.';
  }

  if (whatIsActuallyTrue.length === 0) {
    whatIsActuallyTrue.push(
      claimAudits.some((a) => a.finalTruth === 'PROVEN')
        ? 'Partial truth available — see per-claim reconciled verdicts.'
        : 'No audited claims reach PROVEN reconciled truth right now.',
    );
  }

  return {
    readOnly: true,
    sectionId: 'FOUNDER_TRUTH_SUMMARY',
    whatIsActuallyTrue,
    whatIsActuallyBroken,
    productGaps,
    testingSystemGaps,
    authorityDisagreements,
    launchBlockingProductGaps,
    nonBlockingTestingDefects,
    launchBlockedByProduct: productBlocked,
    launchBlockedByTestingInfrastructure: testingBlocked,
    founderQuestions,
  };
}
