/**
 * Build Strategy Engine — constraint metadata (strategy/planning only).
 */

import {
  nextBuildStrategyConstraintId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyConstraint,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategyConstraint } from './build-strategy-types.js';

export function registerBuildConstraint(input: {
  buildStrategyId: string;
  constraintName?: string;
  constraintReason?: string;
}): BuildStrategyConstraint | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const constraint: BuildStrategyConstraint = {
    constraintId: nextBuildStrategyConstraintId(),
    buildStrategyId: input.buildStrategyId,
    constraintName: input.constraintName ?? 'strategy_only',
    constraintReason: input.constraintReason ?? 'No code modification, execution, builds, tests, fixes, or deploys',
    registeredAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyConstraint(constraint);
  const updated = [...record.strategyConstraints, constraint];
  storeBuildStrategyRecord({ ...record, strategyConstraints: updated, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'CONSTRAINT',
    summary: `Constraint ${constraint.constraintId}: ${constraint.constraintName}`,
    scopeUsed: constraint.constraintId,
  });

  return constraint;
}

export function getBuildStrategyConstraints(buildStrategyId: string): BuildStrategyConstraint[] {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyConstraints ?? [];
}
