/**
 * Build Strategy Engine — readiness evaluation (strategy/planning only).
 */

import {
  nextBuildStrategyReadinessId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyReadiness,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyReadiness } from './build-strategy-types.js';

export function evaluateBuildReadiness(buildStrategyId: string): BuildStrategyReadiness | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const hasClassification = record.strategyClassification !== null;
  const hasMode = record.strategyMode !== null;
  const hasAutonomy = record.strategyAutonomy !== null;
  const hasRisk = record.strategyRisk !== null;
  const hasConfidence = record.strategyConfidence !== null;
  const hasDepth = record.strategyDepth !== null;
  const hasStages = record.strategyStages.length > 0;
  const ready = hasClassification && hasMode && hasAutonomy && hasRisk && hasConfidence && hasDepth && hasStages;

  const readiness: BuildStrategyReadiness = {
    readinessId: nextBuildStrategyReadinessId(),
    buildStrategyId,
    ready,
    readinessReason: ready
      ? 'Classification, mode, autonomy, risk, confidence, depth, and stages present — strategy metadata ready'
      : 'Missing strategy pipeline artifacts for readiness',
    evaluatedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyReadiness(readiness);
  storeBuildStrategyRecord({ ...record, strategyReadiness: readiness, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'READINESS',
    summary: `Readiness ${readiness.readinessId}: ready=${ready}`,
    scopeUsed: readiness.readinessId,
  });

  recordBuildStrategyLifecycleEvent(buildStrategyId, 'STRATEGY_READINESS_EVALUATED', readiness.readinessReason);

  if (ready) {
    recordBuildStrategyLifecycleEvent(buildStrategyId, 'STRATEGY_READY', 'Strategy metadata ready — no execution');
  }

  return readiness;
}

export function getBuildStrategyReadiness(buildStrategyId: string): BuildStrategyReadiness | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyReadiness ?? null;
}
