/**
 * AFLA Trust Calibration V1 — assessment orchestrator.
 */

import { resolveTrustCalibrationSuiteApp } from './afla-trust-calibration-suite-registry.js';
import type { AssessAflaTrustCalibrationInput, AflaTrustCalibrationAssessment } from './afla-trust-calibration-types.js';
import { analyzeConfidenceCalibration } from './afla-trust-confidence-calibration.js';
import { recordAflaTrustCalibrationAssessment } from './afla-trust-calibration-history.js';
import { detectFalseNegatives, countFalseNegatives } from './afla-trust-false-negative-detector.js';
import { detectFalsePositives, countFalsePositives } from './afla-trust-false-positive-detector.js';
import { analyzeReviewerAlignment } from './afla-trust-reviewer-alignment.js';
import { computeAflaTrustScore } from './afla-trust-score.js';
import { computeLargeScaleTrustAdjustment } from '../large-scale-multi-app-validation-v1/large-scale-afla-integration.js';
import { computeProductArchitectureAflaPenalty } from '../product-architect-intelligence-v1/product-architect-afla-integration.js';
import {
  buildFounderLaunchAssessmentFromPrompt,
  runVerdictStabilityTest,
} from './afla-trust-verdict-stability.js';

export function assessAflaTrustCalibration(
  input: AssessAflaTrustCalibrationInput = {},
): AflaTrustCalibrationAssessment {
  const suiteApp = resolveTrustCalibrationSuiteApp(input.profile);
  const productPrompt = input.productPrompt ?? suiteApp.prompt;

  const assessment =
    input.assessment ??
    buildFounderLaunchAssessmentFromPrompt({
      productPrompt,
      profile: suiteApp.profile,
      productName: suiteApp.productName,
    });

  const verdictStability = runVerdictStabilityTest({
    productPrompt,
    profile: suiteApp.profile,
    productName: suiteApp.productName,
  });

  const falsePositives = detectFalsePositives(assessment);
  const falseNegatives = detectFalseNegatives(assessment);
  const confidenceCalibration = analyzeConfidenceCalibration(assessment);
  const reviewerAlignment = analyzeReviewerAlignment(assessment);

  const aflaTrustScore = Math.max(
    0,
    computeAflaTrustScore({
      verdictStability,
      falsePositiveCount: falsePositives.length,
      falseNegativeCount: falseNegatives.length,
      confidenceCalibration,
      reviewerAlignment,
    }) -
      computeLargeScaleTrustAdjustment().penalty -
      computeProductArchitectureAflaPenalty().penalty,
  );

  const result: AflaTrustCalibrationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Autonomous Founder Launch Authority',
    profile: suiteApp.profile,
    productName: suiteApp.productName,
    productPrompt,
    aflaTrustScore,
    falsePositiveCount: falsePositives.length,
    falseNegativeCount: falseNegatives.length,
    falsePositives,
    falseNegatives,
    verdictStability,
    confidenceCalibration,
    reviewerAlignment,
    launchDecisionExplainability: assessment.launchDecisionExplainability,
    assessment,
    generatedAt: new Date().toISOString(),
  };

  recordAflaTrustCalibrationAssessment(result);
  return result;
}

export function getAflaTrustScore(input?: AssessAflaTrustCalibrationInput): number {
  return assessAflaTrustCalibration(input).aflaTrustScore;
}
