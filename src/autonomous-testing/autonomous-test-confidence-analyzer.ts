/**
 * Autonomous Testing — confidence analysis.
 */

import type { AutonomousTestCategory, AutonomousTestDepth, AutonomousTestPlanInput } from './autonomous-testing-types.js';
import { getAutonomousTestDepthEntry } from './autonomous-test-registry.js';

export function analyzeAutonomousTestConfidence(
  input: AutonomousTestPlanInput,
  depth: AutonomousTestDepth,
  categories: AutonomousTestCategory[],
  riskScore: number,
): number {
  let confidence = input.verificationConfidence ?? 60;
  confidence = Math.round(confidence * 0.4 + input.trustScore * 0.35);

  const depthEntry = getAutonomousTestDepthEntry(depth);
  const categoryBonus = Math.min(15, categories.length * 2);
  confidence += categoryBonus;

  confidence -= Math.round(riskScore * 0.2);

  const minConfidence = depthEntry?.minimumConfidence ?? 65;
  if (confidence < minConfidence) {
    confidence = Math.round((confidence + minConfidence) / 2);
  }

  return Math.max(0, Math.min(100, confidence));
}
