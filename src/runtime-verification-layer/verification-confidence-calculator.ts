/**
 * Verification confidence calculator.
 */

import type { VerificationConfidence, VerificationEvidence, VerificationGap } from './runtime-verification-types.js';

export function calculateVerificationConfidence(
  score: number,
  gapCount: number,
  criticalGaps: number,
): VerificationConfidence {
  if (criticalGaps > 2 || score < 40) return 'LOW';
  if (gapCount > 5 || score < 65) return 'MEDIUM';
  if (score >= 65 && criticalGaps === 0) return 'HIGH';
  return 'LOW';
}

export function calculateVerificationScore(
  evidence: VerificationEvidence[],
  gaps: VerificationGap[],
): number {
  const satisfied = evidence.filter((e) => e.satisfied).length;
  const total = evidence.length || 1;
  const evidenceScore = Math.round((satisfied / total) * 70);

  const criticalPenalty = gaps.filter((g) => g.severity === 'CRITICAL').length * 8;
  const highPenalty = gaps.filter((g) => g.severity === 'HIGH').length * 4;
  const mediumPenalty = gaps.filter((g) => g.severity === 'MEDIUM').length * 2;

  const gapPenalty = Math.min(50, criticalPenalty + highPenalty + mediumPenalty);
  return Math.max(0, Math.min(100, evidenceScore + 30 - gapPenalty));
}
