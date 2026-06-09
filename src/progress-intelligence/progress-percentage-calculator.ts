/**
 * Progress percentage calculator — advisory completion estimates.
 */

import type { ProgressConfidence } from './progress-intelligence-types.js';

export function calculatePercentComplete(
  completedCount: number,
  remainingCount: number,
  blockedCount: number,
): { percentComplete: number; confidence: ProgressConfidence } {
  const total = completedCount + remainingCount + blockedCount;
  if (total === 0) {
    return { percentComplete: 0, confidence: 'LOW' };
  }

  const weightedComplete = completedCount;
  const weightedTotal = total;
  const raw = Math.round((weightedComplete / weightedTotal) * 100);
  const percentComplete = Math.min(95, Math.max(5, raw));

  let confidence: ProgressConfidence = 'MEDIUM';
  if (completedCount >= 10 && remainingCount <= 5) confidence = 'HIGH';
  if (completedCount < 3) confidence = 'LOW';

  return { percentComplete, confidence };
}

export function averageCompletion(percents: number[]): number {
  if (percents.length === 0) return 0;
  const sum = percents.reduce((a, b) => a + b, 0);
  return Math.round((sum / percents.length) * 10) / 10;
}
