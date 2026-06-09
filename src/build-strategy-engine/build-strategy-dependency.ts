/**
 * Build Strategy Engine — dependency metadata (strategy/planning only).
 */

import {
  nextBuildStrategyDependencyId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyDependency,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategyDependency } from './build-strategy-types.js';

export function registerBuildDependency(input: {
  buildStrategyId: string;
  dependencyName?: string;
  dependencyReason?: string;
}): BuildStrategyDependency | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const dependency: BuildStrategyDependency = {
    dependencyId: nextBuildStrategyDependencyId(),
    buildStrategyId: input.buildStrategyId,
    dependencyName: input.dependencyName ?? 'autonomous_builder_foundation',
    dependencyReason: input.dependencyReason ?? 'Primary upstream dependency — autonomous builder planning authority',
    registeredAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyDependency(dependency);
  const updated = [...record.strategyDependencies, dependency];
  storeBuildStrategyRecord({ ...record, strategyDependencies: updated, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'DEPENDENCY',
    summary: `Dependency ${dependency.dependencyId}: ${dependency.dependencyName}`,
    scopeUsed: dependency.dependencyId,
  });

  return dependency;
}

export function getBuildStrategyDependencies(buildStrategyId: string): BuildStrategyDependency[] {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyDependencies ?? [];
}
