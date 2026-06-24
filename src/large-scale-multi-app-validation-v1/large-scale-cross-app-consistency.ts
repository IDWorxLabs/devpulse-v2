/**
 * Large-Scale Multi-App Validation V1 — cross-app consistency measurement.
 */

import type { LargeScaleCategoryResult } from './large-scale-multi-app-validation-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function variance(values: readonly number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length,
  );
}

export function measureCrossAppConsistency(
  results: readonly LargeScaleCategoryResult[],
): {
  navigationConsistency: number;
  blueprintConsistency: number;
  verificationConsistency: number;
  launchDecisionConsistency: number;
  overallConsistency: number;
} {
  if (results.length === 0) {
    return {
      navigationConsistency: 0,
      blueprintConsistency: 0,
      verificationConsistency: 0,
      launchDecisionConsistency: 0,
      overallConsistency: 0,
    };
  }

  const verificationScores = results.map((r) => r.metrics.verificationConfidence);
  const blueprintScores = results.map((r) => (r.metrics.blueprintSuccess ? 100 : r.metrics.verificationCoverage));
  const aflaScores = results.map((r) => r.metrics.aflaOverallScore);
  const reqScores = results.map((r) => r.metrics.requirementConfidence);

  const consistencyFromVariance = (scores: readonly number[]): number =>
    clamp(100 - variance(scores) * 2);

  const navigationConsistency = consistencyFromVariance(reqScores);
  const blueprintConsistency = consistencyFromVariance(blueprintScores);
  const verificationConsistency = consistencyFromVariance(verificationScores);
  const launchDecisionConsistency = consistencyFromVariance(aflaScores);

  const verdicts = new Set(results.map((r) => r.aflaVerdict));
  const verdictPenalty = verdicts.size <= 2 ? 10 : verdicts.size <= 4 ? 5 : 0;

  const overallConsistency = clamp(
    (navigationConsistency + blueprintConsistency + verificationConsistency + launchDecisionConsistency) / 4 +
      verdictPenalty,
  );

  return {
    navigationConsistency,
    blueprintConsistency,
    verificationConsistency,
    launchDecisionConsistency,
    overallConsistency,
  };
}
