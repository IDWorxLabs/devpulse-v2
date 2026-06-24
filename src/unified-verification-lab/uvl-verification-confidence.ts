/**
 * UVL Maturity V1 — verification confidence score from evidence sources.
 */

import { getLastBlueprintVisualAssessment } from '../universal-app-blueprint-visual/index.js';
import { getLastFeatureRealityAssessment } from '../feature-reality-validation/index.js';
import { getLastEngineeringRealityAssessment } from '../engineering-reality-authority/index.js';
import {
  assessCqiMaturity,
  getLastCqiMaturityAssessment,
} from '../clarifying-question-intelligence/index.js';
import { getLastAutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import type { VerificationCoverageRow } from './uvl-maturity-types.js';
import { computeOverallCoveragePercent } from './uvl-verification-coverage-assessor.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeVerificationConfidenceScore(input: {
  productPrompt: string;
  categoryCoverage: readonly VerificationCoverageRow[];
}): number {
  const visual = getLastBlueprintVisualAssessment();
  const feature = getLastFeatureRealityAssessment();
  const engineering = getLastEngineeringRealityAssessment();
  const cqi = getLastCqiMaturityAssessment() ?? assessCqiMaturity({ userPrompt: input.productPrompt });
  const afla = getLastAutonomousFounderLaunchAssessment();

  const evidenceScores: Array<{ score: number; weight: number }> = [];

  if (visual) {
    evidenceScores.push({ score: visual.scores.overallBlueprintScore, weight: 0.2 });
  }
  if (feature) {
    evidenceScores.push({ score: feature.scores.overallFeatureScore, weight: 0.25 });
  }
  if (engineering) {
    evidenceScores.push({ score: engineering.scores.overallEngineeringScore, weight: 0.25 });
  }
  if (cqi) {
    evidenceScores.push({ score: cqi.requirementConfidenceScore, weight: 0.15 });
  }
  if (afla) {
    evidenceScores.push({ score: afla.scores.overallFounderScore, weight: 0.15 });
  }

  let evidenceConfidence = 0;
  if (evidenceScores.length > 0) {
    const totalWeight = evidenceScores.reduce((sum, entry) => sum + entry.weight, 0);
    const weighted = evidenceScores.reduce((sum, entry) => sum + entry.score * entry.weight, 0);
    evidenceConfidence = totalWeight > 0 ? weighted / totalWeight : 0;
  }

  const coverageBlend = computeOverallCoveragePercent(input.categoryCoverage);
  const blended =
    evidenceScores.length > 0
      ? evidenceConfidence * 0.65 + coverageBlend * 0.35
      : coverageBlend;

  return clamp(blended);
}

export function computeVerificationConfidencePenalty(confidenceScore: number): number {
  if (confidenceScore >= 75) return 0;
  return clamp((75 - confidenceScore) * 0.6);
}
