/**
 * Continuous Product Improvement Engine — improvement history.
 */

import { DEFAULT_MAX_IMPROVEMENT_HISTORY } from './continuous-improvement-types.js';
import type { ContinuousImprovementPipelineResult } from './continuous-improvement-types.js';

const history: Array<{
  pipelineId: string;
  verdict: string;
  signalCount: number;
  appliedCount: number;
  deferredCount: number;
  qualityScore: number;
  completedAt: number;
}> = [];

export function resetImprovementHistoryForTests(): void {
  history.length = 0;
}

export function recordImprovementHistory(result: ContinuousImprovementPipelineResult): void {
  history.push({
    pipelineId: result.pipelineId,
    verdict: result.permissionVerdict,
    signalCount: result.signals.length,
    appliedCount: result.improvementAttempts.filter((a) => a.outcome === 'APPLIED').length,
    deferredCount: result.deferredOpportunities.length,
    qualityScore: result.qualityScore.overallScore,
    completedAt: result.completedAt,
  });
  while (history.length > DEFAULT_MAX_IMPROVEMENT_HISTORY) {
    history.shift();
  }
}

export function getImprovementHistorySize(): number {
  return history.length;
}
