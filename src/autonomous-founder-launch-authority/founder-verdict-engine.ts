/**
 * Autonomous Founder Launch Authority V1 — verdict engine.
 */

import {
  AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN,
  FOUNDER_LAUNCH_MIN_SCORE,
} from './autonomous-founder-launch-authority-registry.js';
import type {
  AutonomousFounderLaunchAssessment,
  FounderEvidenceSnapshot,
  FounderLaunchScores,
  FounderLaunchUserPhase,
  FounderLaunchVerdict,
  FounderRemediationPlan,
  FounderReviewerAssessment,
} from './autonomous-founder-launch-authority-types.js';
import { resolveFounderLaunchUserLabel } from './founder-launch-user-surface.js';
import { buildLaunchDecisionExplainability } from './founder-launch-decision-explainability.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hasCriticalLaunchBlockers(evidence: FounderEvidenceSnapshot): boolean {
  if (evidence.featureReality.available && !evidence.featureReality.passed) return true;
  if (evidence.engineeringReality.available && !evidence.engineeringReality.passed) return true;
  if (evidence.verificationHub?.incompleteVerification) return true;
  if (evidence.productArchitecture?.architecturallyIncomplete) return true;
  if (evidence.requirementDiscovery?.poorlyUnderstood) return true;
  if (evidence.missingPrerequisites.length > 0) return true;
  return false;
}

export function buildFounderLaunchScores(reviewers: FounderReviewerAssessment[]): FounderLaunchScores {
  const byRole = (role: FounderReviewerAssessment['role']) =>
    reviewers.find((reviewer) => reviewer.role === role)?.score ?? 0;

  const seniorEngineeringScore = byRole('senior-engineer');
  const qaScore = byRole('qa');
  const uxScore = byRole('ux');
  const productScore = byRole('product');
  const launchScore = byRole('launch');
  const founderScore = byRole('founder');
  const overallFounderScore = clamp(
    seniorEngineeringScore * 0.18 +
      qaScore * 0.2 +
      uxScore * 0.16 +
      productScore * 0.2 +
      launchScore * 0.14 +
      founderScore * 0.12,
  );

  return {
    seniorEngineeringScore,
    qaScore,
    uxScore,
    productScore,
    launchScore,
    founderScore,
    overallFounderScore,
  };
}

function countCriticalEvidenceBlockers(evidence: FounderEvidenceSnapshot): number {
  return [
    evidence.buildReality,
    evidence.blueprintStructure,
    evidence.blueprintVisual,
    evidence.featureReality,
    evidence.universalFeatureContract,
    evidence.engineeringReality,
    evidence.launchReadiness,
  ].reduce((count, source) => count + source.blockers.length, 0);
}

function hasAutofixEligibleIssues(remediationPlan: FounderRemediationPlan | null): boolean {
  return Boolean(remediationPlan && remediationPlan.issues.some((issue) => issue.autofixEligible));
}

export function deriveFounderLaunchVerdict(input: {
  evidence: FounderEvidenceSnapshot;
  scores: FounderLaunchScores;
  reviewers: FounderReviewerAssessment[];
  remediationPlan: FounderRemediationPlan | null;
}): FounderLaunchVerdict {
  const { evidence, scores, reviewers, remediationPlan } = input;

  if (hasCriticalLaunchBlockers(evidence)) {
    if (hasAutofixEligibleIssues(remediationPlan)) {
      return 'NEEDS_AUTOFIX';
    }
    return 'NOT_LAUNCH_READY';
  }

  if (!evidence.allPrerequisitesPassed) {
    if (hasAutofixEligibleIssues(remediationPlan)) {
      return 'NEEDS_AUTOFIX';
    }
    if (evidence.missingPrerequisites.length >= 3) {
      return 'NEEDS_HUMAN_REVIEW';
    }
    return 'NOT_LAUNCH_READY';
  }

  const founderReviewer = reviewers.find((reviewer) => reviewer.role === 'founder');
  const founderConfidence = founderReviewer?.founderConfidence ?? scores.founderScore;
  const criticalBlockers = countCriticalEvidenceBlockers(evidence);
  const lowestReviewerScore = Math.min(
    scores.seniorEngineeringScore,
    scores.qaScore,
    scores.uxScore,
    scores.productScore,
    scores.launchScore,
    scores.founderScore,
  );

  if (criticalBlockers > 0) {
    if (hasAutofixEligibleIssues(remediationPlan) && scores.overallFounderScore >= 60) {
      return 'NEEDS_AUTOFIX';
    }
    if (scores.overallFounderScore < 50 || criticalBlockers >= 4) {
      return 'NOT_LAUNCH_READY';
    }
    return 'NEEDS_HUMAN_REVIEW';
  }

  if (scores.overallFounderScore >= 85 && founderConfidence >= 80 && lowestReviewerScore >= 70) {
    if (evidence.productArchitecture?.architecturallyIncomplete) {
      return 'LAUNCH_READY_WITH_WARNINGS';
    }
    return 'LAUNCH_READY';
  }

  if (scores.overallFounderScore >= FOUNDER_LAUNCH_MIN_SCORE && lowestReviewerScore >= 60) {
    return 'LAUNCH_READY_WITH_WARNINGS';
  }

  if (hasAutofixEligibleIssues(remediationPlan) && scores.overallFounderScore >= 55) {
    return 'NEEDS_AUTOFIX';
  }

  if (scores.overallFounderScore >= 45 && lowestReviewerScore >= 40) {
    return 'NEEDS_HUMAN_REVIEW';
  }

  return 'NOT_LAUNCH_READY';
}

export function resolveFounderLaunchUserPhase(verdict: FounderLaunchVerdict): FounderLaunchUserPhase {
  switch (verdict) {
    case 'LAUNCH_READY':
    case 'LAUNCH_READY_WITH_WARNINGS':
      return 'LAUNCH_READY';
    case 'NEEDS_AUTOFIX':
      return 'FIXING_ISSUES';
    case 'NEEDS_HUMAN_REVIEW':
      return 'FINAL_LAUNCH_REVIEW';
    case 'NOT_LAUNCH_READY':
    default:
      return 'LAUNCH_NOT_READY';
  }
}

export function buildAutonomousFounderLaunchAssessment(input: {
  evidence: FounderEvidenceSnapshot;
  reviewers: FounderReviewerAssessment[];
  remediationPlan: FounderRemediationPlan | null;
  contractId?: string | null;
  productName?: string | null;
  reportMarkdown: string;
}): AutonomousFounderLaunchAssessment {
  const scores = buildFounderLaunchScores(input.reviewers);
  const verdict = deriveFounderLaunchVerdict({
    evidence: input.evidence,
    scores,
    reviewers: input.reviewers,
    remediationPlan: input.remediationPlan,
  });
  const userPhase = resolveFounderLaunchUserPhase(verdict);
  const userLabel = resolveFounderLaunchUserLabel(userPhase);
  const passed = verdict === 'LAUNCH_READY' || verdict === 'LAUNCH_READY_WITH_WARNINGS';
  const blocksLaunch = !passed;

  const launchDecisionExplainability = buildLaunchDecisionExplainability({
    verdict,
    evidence: input.evidence,
    assessment: {
      scores,
      reviewers: input.reviewers,
      blocksLaunchReason: blocksLaunch
        ? (input.evidence.missingPrerequisites[0] ??
          input.reviewers.flatMap((reviewer) => reviewer.risks)[0] ??
          `Verdict: ${verdict}`)
        : null,
    },
  });

  return {
    readOnly: true,
    advisoryOnly: true,
    passed,
    verdict,
    passToken: passed
      ? AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS_TOKEN
      : 'AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_FAIL',
    scores,
    reviewers: input.reviewers,
    evidence: input.evidence,
    remediationPlan: verdict === 'NEEDS_AUTOFIX' ? input.remediationPlan : null,
    blocksLaunch,
    blocksLaunchReason: blocksLaunch
      ? (input.evidence.missingPrerequisites[0] ??
        input.reviewers.flatMap((reviewer) => reviewer.risks)[0] ??
        `Verdict: ${verdict}`)
      : null,
    userPhase,
    userLabel,
    contractId: input.contractId ?? null,
    productName: input.productName ?? null,
    generatedAt: new Date().toISOString(),
    reportMarkdown: input.reportMarkdown,
    launchDecisionExplainability,
  };
}
