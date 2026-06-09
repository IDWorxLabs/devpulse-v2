/**
 * Build Strategy Engine — build risk evaluation (strategy/planning only).
 */

import {
  nextBuildStrategyRiskId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyRisk,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyRiskEvaluation } from './build-strategy-types.js';

export function evaluateBuildRisk(input: {
  buildStrategyId: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  riskReason?: string;
}): BuildStrategyRiskEvaluation | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const highRiskCategories = ['SELF_EVOLUTION_BUILD_STRATEGY', 'AUTONOMOUS_BUILD_STRATEGY', 'WORLD2_BUILD_STRATEGY'];
  const mediumRiskCategories = ['FULL_STACK_BUILD_STRATEGY', 'CLOUD_BUILD_STRATEGY', 'REFACTOR_BUILD_STRATEGY'];

  let riskLevel = input.riskLevel;
  if (!riskLevel) {
    if (highRiskCategories.includes(record.strategyCategory)) riskLevel = 'HIGH';
    else if (mediumRiskCategories.includes(record.strategyCategory)) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
  }

  const risk: BuildStrategyRiskEvaluation = {
    riskId: nextBuildStrategyRiskId(),
    buildStrategyId: input.buildStrategyId,
    riskLevel,
    riskReason: input.riskReason ?? `Risk ${riskLevel} for ${record.strategyCategory} — metadata evaluation only`,
    evaluatedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyRisk(risk);
  storeBuildStrategyRecord({ ...record, strategyRisk: risk, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'RISK',
    summary: `Risk ${risk.riskId}: level=${riskLevel}`,
    scopeUsed: risk.riskId,
  });

  recordBuildStrategyLifecycleEvent(input.buildStrategyId, 'STRATEGY_RISK_EVALUATED', risk.riskReason);

  return risk;
}

export function getBuildStrategyRisk(buildStrategyId: string): BuildStrategyRiskEvaluation | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyRisk ?? null;
}
