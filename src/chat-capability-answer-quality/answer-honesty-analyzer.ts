/**
 * Phase 26.92 — Answer honesty analyzer (V1).
 */

import { OVERCLAIM_PATTERNS } from './chat-capability-answer-quality-registry.js';

export function analyzeAnswerHonesty(answer: string): {
  score: number;
  violations: string[];
} {
  const violations: string[] = [];
  const lower = answer.toLowerCase();

  for (const pattern of OVERCLAIM_PATTERNS) {
    if (pattern.test(answer)) {
      violations.push(`Overclaim detected: ${pattern.source}`);
    }
  }

  const hasHonestyMarker =
    /\b(honest|limit|cannot|can't|not yet|depends|without evidence|partial|unproven|realistic)\b/i.test(answer);
  const admitsLimits = /\b(limitation|boundary|not proven|requires|clarification|workflow)\b/i.test(answer);

  let score = 80;
  if (hasHonestyMarker) score += 10;
  if (admitsLimits) score += 10;
  score -= violations.length * 25;
  if (!hasHonestyMarker && !admitsLimits) {
    violations.push('Missing honest limits or caveats');
    score -= 15;
  }

  return { score: Math.max(0, Math.min(100, score)), violations };
}
