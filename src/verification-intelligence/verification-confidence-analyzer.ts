/**
 * Verification Intelligence — confidence projection analysis.
 */

import type {
  VerificationConfidenceAnalysis,
  VerificationPlanInput,
  VerificationPlanType,
} from './verification-plan-types.js';
import { getVerificationPathEntry } from './verification-path-registry.js';

export function analyzeVerificationConfidence(
  input: VerificationPlanInput,
  planType: VerificationPlanType,
  riskScore: number,
): VerificationConfidenceAnalysis {
  const factors: string[] = [];
  let confidence = input.strategyConfidence;

  confidence = Math.round(confidence * 0.5 + input.trustScore * 0.3);
  factors.push(`Strategy confidence ${input.strategyConfidence} blended with trust ${input.trustScore}`);

  const passRate = input.validationHistoryPassRate ?? 0.8;
  confidence += Math.round((passRate - 0.5) * 15);
  factors.push(`Validation history pass rate ${Math.round(passRate * 100)}%`);

  confidence -= Math.round(riskScore * 0.25);
  factors.push(`Risk score ${riskScore} reduces projection`);

  const target = getVerificationPathEntry(planType)?.targetConfidence ?? 70;
  if (confidence < target) {
    confidence = Math.round((confidence + target) / 2);
    factors.push(`Adjusted toward plan target confidence ${target}`);
  }

  confidence = Math.max(0, Math.min(100, confidence));

  const projection =
    confidence >= target
      ? `Meets ${planType} target confidence (${target})`
      : `Below ${planType} target (${target}) — plan retains required coverage`;

  return { confidence, projection, factors };
}
