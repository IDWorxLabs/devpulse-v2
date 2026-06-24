/**
 * AFLA Trust Calibration V1 — verdict consistency testing.
 */

import { buildFounderRemediationPlan } from '../autonomous-founder-launch-authority/founder-remediation-plan.js';
import { collectFounderLaunchEvidence } from '../autonomous-founder-launch-authority/founder-evidence-collector.js';
import { runFounderReviewerPanel } from '../autonomous-founder-launch-authority/founder-reviewer-engine.js';
import { buildAutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/founder-verdict-engine.js';
import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import {
  VERDICT_STABILITY_MAX_VARIANCE,
  VERDICT_STABILITY_RUN_COUNT,
} from './afla-trust-calibration-bounds.js';
import type { VerdictStabilityReport } from './afla-trust-calibration-types.js';

function variance(values: readonly number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squared = values.map((v) => (v - mean) ** 2);
  return Math.round(Math.sqrt(squared.reduce((sum, v) => sum + v, 0) / values.length));
}

export function buildFounderLaunchAssessmentFromPrompt(input: {
  productPrompt: string;
  profile?: string;
  productName?: string;
}): AutonomousFounderLaunchAssessment {
  const evidence = collectFounderLaunchEvidence({
    productPrompt: input.productPrompt,
    profile: input.profile,
    synthesizeLaunchReadiness: true,
  });
  const reviewers = runFounderReviewerPanel(evidence);
  const remediationPlan = buildFounderRemediationPlan({
    evidence,
    reviewers,
    maxRetries: 2,
    retryAttempt: 0,
  });
  return buildAutonomousFounderLaunchAssessment({
    evidence,
    reviewers,
    remediationPlan,
    productName: input.productName,
    reportMarkdown: '',
  });
}

export function runVerdictStabilityTest(input: {
  productPrompt: string;
  profile?: string;
  productName?: string;
  runCount?: number;
}): VerdictStabilityReport {
  const runCount = input.runCount ?? VERDICT_STABILITY_RUN_COUNT;
  const evidence = collectFounderLaunchEvidence({
    productPrompt: input.productPrompt,
    profile: input.profile,
    synthesizeLaunchReadiness: true,
  });
  const reviewers = runFounderReviewerPanel(evidence);
  const remediationPlan = buildFounderRemediationPlan({
    evidence,
    reviewers,
    maxRetries: 2,
    retryAttempt: 0,
  });

  const verdicts: AutonomousFounderLaunchAssessment['verdict'][] = [];
  const scores: number[] = [];
  const founderConfidences: number[] = [];

  for (let i = 0; i < runCount; i += 1) {
    const assessment = buildAutonomousFounderLaunchAssessment({
      evidence,
      reviewers,
      remediationPlan,
      productName: input.productName,
      reportMarkdown: '',
    });
    verdicts.push(assessment.verdict);
    scores.push(assessment.scores.overallFounderScore);
    const founderReviewer = assessment.reviewers.find((r) => r.role === 'founder');
    founderConfidences.push(founderReviewer?.founderConfidence ?? assessment.scores.founderScore);
  }

  const scoreVariance = variance(scores);
  const confidenceVariance = variance(founderConfidences);
  const verdictStable = verdicts.every((v) => v === verdicts[0]);
  const scoreStable = scoreVariance <= VERDICT_STABILITY_MAX_VARIANCE;
  const confidenceStable = confidenceVariance <= VERDICT_STABILITY_MAX_VARIANCE;

  const stabilityFlags: string[] = [];
  if (!verdictStable) stabilityFlags.push('Verdict instability across repeated runs');
  if (!scoreStable) stabilityFlags.push(`Score variance ${scoreVariance} exceeds ±${VERDICT_STABILITY_MAX_VARIANCE}`);
  if (!confidenceStable) {
    stabilityFlags.push(`Confidence variance ${confidenceVariance} exceeds ±${VERDICT_STABILITY_MAX_VARIANCE}`);
  }

  return {
    readOnly: true,
    runCount,
    verdicts,
    scores,
    founderConfidences,
    verdictStable,
    scoreVariance,
    confidenceVariance,
    scoreStable,
    confidenceStable,
    stabilityFlags,
  };
}
