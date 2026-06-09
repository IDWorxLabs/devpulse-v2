/**
 * Build Strategy Engine — build confidence evaluation (strategy/planning only).
 */

import {
  nextBuildStrategyConfidenceId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyConfidence,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyConfidenceEvaluation } from './build-strategy-types.js';

export function evaluateBuildConfidence(input: {
  buildStrategyId: string;
  confidenceLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  confidenceReason?: string;
}): BuildStrategyConfidenceEvaluation | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const hasClassification = record.strategyClassification !== null;
  const hasMode = record.strategyMode !== null;
  const hasAutonomy = record.strategyAutonomy !== null;
  const hasRisk = record.strategyRisk !== null;

  let confidenceLevel = input.confidenceLevel;
  if (!confidenceLevel) {
    const score = [hasClassification, hasMode, hasAutonomy, hasRisk].filter(Boolean).length;
    if (score >= 4) confidenceLevel = 'HIGH';
    else if (score >= 2) confidenceLevel = 'MEDIUM';
    else confidenceLevel = 'LOW';
  }

  const confidence: BuildStrategyConfidenceEvaluation = {
    confidenceId: nextBuildStrategyConfidenceId(),
    buildStrategyId: input.buildStrategyId,
    confidenceLevel,
    confidenceReason: input.confidenceReason ?? `Confidence ${confidenceLevel} — strategy metadata evaluation only`,
    evaluatedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyConfidence(confidence);
  storeBuildStrategyRecord({ ...record, strategyConfidence: confidence, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'CONFIDENCE',
    summary: `Confidence ${confidence.confidenceId}: level=${confidenceLevel}`,
    scopeUsed: confidence.confidenceId,
  });

  recordBuildStrategyLifecycleEvent(input.buildStrategyId, 'STRATEGY_CONFIDENCE_EVALUATED', confidence.confidenceReason);

  return confidence;
}

export function getBuildStrategyConfidence(buildStrategyId: string): BuildStrategyConfidenceEvaluation | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyConfidence ?? null;
}
