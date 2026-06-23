/**
 * Phase 26.71 — Launch verdict reconciler (V1).
 * Applies truth matrix override rules before launch verdict emission.
 */

import type {
  FounderTestLaunchBlocker,
  LaunchReadinessVerdict,
} from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type {
  CategorizedLaunchBlockers,
  ReconciledTruthClaim,
} from './founder-truth-matrix-integration-types.js';

export interface LaunchVerdictReconciliationResult {
  readOnly: true;
  postReconciliationVerdict: LaunchReadinessVerdict;
  overrideApplied: boolean;
  overrideReason: string | null;
  categorizedBlockers: CategorizedLaunchBlockers;
  trustScoreBlocked: boolean;
  productLaunchBlocked: boolean;
}

const SCORING_AUTHORITY_HINTS = [
  'Chat Intelligence',
  'Chat Stress',
  'chat-intelligence',
  'scoring',
  'score 0',
  '0/100',
] as const;

function isScoringRelatedBlocker(blocker: FounderTestLaunchBlocker): boolean {
  const haystack = `${blocker.sourceAuthority} ${blocker.explanation}`.toLowerCase();
  return SCORING_AUTHORITY_HINTS.some((hint) => haystack.includes(hint.toLowerCase()));
}

function claimBlocker(
  claim: ReconciledTruthClaim,
  category: 'product' | 'testing' | 'authority',
): FounderTestLaunchBlocker {
  const severity =
    claim.launchImpact === 'CRITICAL'
      ? 'CRITICAL'
      : claim.launchImpact === 'HIGH'
        ? 'HIGH'
        : claim.launchImpact === 'MEDIUM'
          ? 'MEDIUM'
          : 'LOW';

  const categoryLabel =
    category === 'product'
      ? 'REAL_PRODUCT_GAP'
      : category === 'testing'
        ? claim.rootCause === 'SCORING_DEFECT'
          ? 'TESTING_SYSTEM_DEFECT'
          : 'EVIDENCE_PROPAGATION_FAILURE'
        : 'AUTHORITY_DISAGREEMENT';

  return {
    readOnly: true,
    sourceAuthority: `Founder Truth Matrix (${categoryLabel})`,
    severity,
    explanation:
      `${claim.claim}: truth=${claim.truthMatrixVerdict}, rootCause=${claim.rootCause}. ` +
      (claim.contradictionReason || 'Reconciled by FOUNDER_TRUTH_MATRIX_RECONCILIATION.'),
    recommendedAction:
      category === 'testing'
        ? 'Fix testing-system scoring or evidence propagation — does not block product launch readiness.'
        : category === 'authority'
          ? `Use TRUTH_MATRIX_VERDICT (${claim.truthMatrixVerdict}) instead of conflicting authority output.`
          : 'Address real product gap before launch.',
  };
}

function downgradeBlockedVerdict(verdict: LaunchReadinessVerdict): LaunchReadinessVerdict {
  if (verdict === 'BLOCKED' || verdict === 'NOT_LAUNCH_READY') {
    return 'LAUNCH_READY_WITH_WARNINGS';
  }
  return verdict;
}

function upgradeToBlocked(verdict: LaunchReadinessVerdict): LaunchReadinessVerdict {
  if (verdict === 'LAUNCH_READY' || verdict === 'LAUNCH_READY_WITH_WARNINGS') {
    return 'NOT_LAUNCH_READY';
  }
  return verdict;
}

export function reconcileLaunchVerdictWithTruthMatrix(input: {
  preReconciliationVerdict: LaunchReadinessVerdict;
  topBlockers: FounderTestLaunchBlocker[];
  reconciledClaims: ReconciledTruthClaim[];
}): LaunchVerdictReconciliationResult {
  let postVerdict = input.preReconciliationVerdict;
  let overrideApplied = false;
  let overrideReason: string | null = null;

  const launchBlockersProduct: FounderTestLaunchBlocker[] = [];
  const launchBlockersTesting: FounderTestLaunchBlocker[] = [];
  const launchBlockersAuthorityDisagreement: FounderTestLaunchBlocker[] = [];

  const realProductGapClaims = input.reconciledClaims.filter(
    (c) => c.rootCause === 'REAL_PRODUCT_GAP' && c.truthMatrixVerdict === 'NOT_PROVEN',
  );
  const scoringDefectClaims = input.reconciledClaims.filter((c) => c.rootCause === 'SCORING_DEFECT');
  const propagationClaims = input.reconciledClaims.filter(
    (c) => c.rootCause === 'EVIDENCE_PROPAGATION_FAILURE',
  );
  const authorityDisagreementClaims = input.reconciledClaims.filter(
    (c) => c.rootCause === 'AUTHORITY_DISAGREEMENT',
  );

  for (const claim of realProductGapClaims) {
    launchBlockersProduct.push(claimBlocker(claim, 'product'));
  }
  for (const claim of scoringDefectClaims) {
    launchBlockersTesting.push(claimBlocker(claim, 'testing'));
  }
  for (const claim of propagationClaims) {
    launchBlockersTesting.push(claimBlocker(claim, 'testing'));
  }
  for (const claim of authorityDisagreementClaims) {
    launchBlockersAuthorityDisagreement.push(claimBlocker(claim, 'authority'));
  }

  for (const blocker of input.topBlockers) {
    if (isScoringRelatedBlocker(blocker)) {
      launchBlockersTesting.push(blocker);
    } else if (
      realProductGapClaims.some((c) =>
        blocker.explanation.toLowerCase().includes(c.claim.toLowerCase().slice(0, 12)),
      )
    ) {
      launchBlockersProduct.push(blocker);
    } else {
      launchBlockersProduct.push(blocker);
    }
  }

  const productLaunchBlocked = realProductGapClaims.length > 0;
  const trustScoreBlocked = propagationClaims.length > 0;

  // Rule 4 — REAL_PRODUCT_GAP blocks launch readiness
  if (productLaunchBlocked) {
    const previous = postVerdict;
    postVerdict = upgradeToBlocked(postVerdict);
    if (postVerdict !== previous) {
      overrideApplied = true;
      overrideReason = 'REAL_PRODUCT_GAP — launch blocked by reconciled product gap evidence.';
    }
  }

  // Rule 1 — SCORING_DEFECT does not block launch; record TESTING_SYSTEM_DEFECT
  if (scoringDefectClaims.length > 0 && !productLaunchBlocked) {
    const scoringOnlyBlock =
      (postVerdict === 'NOT_LAUNCH_READY' || postVerdict === 'BLOCKED') &&
      input.topBlockers.every((b) => isScoringRelatedBlocker(b) || launchBlockersTesting.includes(b));

    if (scoringOnlyBlock || scoringDefectClaims.some((c) => c.contradictionDetected)) {
      const previous = postVerdict;
      postVerdict = downgradeBlockedVerdict(postVerdict);
      if (postVerdict !== previous) {
        overrideApplied = true;
        overrideReason =
          'SCORING_DEFECT — TESTING_SYSTEM_DEFECT recorded separately; launch readiness not blocked by testing infrastructure defect.';
      }
    }
  }

  // Rule 3 — EVIDENCE_PROPAGATION_FAILURE blocks trust score, not product readiness
  if (trustScoreBlocked && !productLaunchBlocked) {
    const propagationOnlyBlock =
      postVerdict === 'NOT_LAUNCH_READY' &&
      input.topBlockers.length > 0 &&
      input.topBlockers.every(
        (b) =>
          isScoringRelatedBlocker(b) ||
          propagationClaims.some((c) => b.explanation.includes(c.claim.slice(0, 10))),
      );

    if (propagationOnlyBlock) {
      const previous = postVerdict;
      postVerdict = downgradeBlockedVerdict(postVerdict);
      if (postVerdict !== previous) {
        overrideApplied = true;
        overrideReason =
          'EVIDENCE_PROPAGATION_FAILURE — trust score blocked; product launch readiness not blocked by propagation failure alone.';
      }
    }
  }

  // Rule 2 — AUTHORITY_DISAGREEMENT uses TRUTH_MATRIX_VERDICT instead of auto-block
  if (authorityDisagreementClaims.length > 0 && !productLaunchBlocked) {
    const allDisagreementsReconciled = authorityDisagreementClaims.every(
      (c) => c.truthMatrixVerdict === 'PROVEN' || c.truthMatrixVerdict === 'PARTIAL',
    );
    if (
      allDisagreementsReconciled &&
      (postVerdict === 'NOT_LAUNCH_READY' || postVerdict === 'BLOCKED')
    ) {
      const previous = postVerdict;
      postVerdict = downgradeBlockedVerdict(postVerdict);
      if (postVerdict !== previous) {
        overrideApplied = true;
        overrideReason =
          'AUTHORITY_DISAGREEMENT — using TRUTH_MATRIX_VERDICT instead of conflicting authority auto-block.';
      }
    }
  }

  return {
    readOnly: true,
    postReconciliationVerdict: postVerdict,
    overrideApplied,
    overrideReason,
    categorizedBlockers: {
      readOnly: true,
      launchBlockersProduct,
      launchBlockersTesting,
      launchBlockersAuthorityDisagreement,
    },
    trustScoreBlocked,
    productLaunchBlocked,
  };
}
