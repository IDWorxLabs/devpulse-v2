/**
 * Interaction result recorder — aggregates outcomes without verdicts.
 */

import type { ExecutedInteraction, InteractionResult } from './types.js';

export function recordInteractionResults(
  executed: ExecutedInteraction[],
  results: InteractionResult[],
): InteractionResult[] {
  return results.map((r) => ({
    ...r,
    noVerdict: true as const,
    warnings: [
      ...r.warnings,
      'Outcome recorded only — no pass/fail, quality score, or visual verification',
    ],
  }));
}

export function summarizeInteractionCount(results: InteractionResult[]): number {
  return results.length;
}
