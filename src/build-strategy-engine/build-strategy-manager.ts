/**
 * Build Strategy Engine — strategy session manager (planning only).
 */

import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { registerBuildStrategyOwnership } from './build-strategy-ownership.js';
import { classifyBuildStrategy } from './build-strategy-classifier.js';
import { selectBuildMode } from './build-strategy-mode.js';
import { selectAutonomyLevel } from './build-strategy-autonomy.js';
import { evaluateBuildRisk } from './build-strategy-risk.js';
import { evaluateBuildConfidence } from './build-strategy-confidence.js';
import { selectBuildDepth } from './build-strategy-depth.js';
import { recommendBuildStages } from './build-strategy-stage-recommender.js';
import { evaluateBuildReadiness } from './build-strategy-readiness.js';
import { applyBuildPolicy } from './build-strategy-policy.js';
import { registerBuildConstraint } from './build-strategy-constraint.js';
import { registerBuildDependency } from './build-strategy-dependency.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategySession, BuildStrategyOwnership } from './build-strategy-types.js';

export function createBuildStrategy(record: BuildStrategySession): BuildStrategySession {
  storeBuildStrategyRecord(record);
  registerBuildStrategyOwnership(record.buildStrategyId, record.strategyOwnership);
  recordBuildStrategyLifecycleEvent(
    record.buildStrategyId,
    'STRATEGY_CREATED',
    `Created ${record.strategyMetadata.strategyName}`,
  );
  return record;
}

export function getBuildStrategy(buildStrategyId: string): BuildStrategySession | null {
  return getStoredBuildStrategyRecord(buildStrategyId);
}

export function listBuildStrategies(): BuildStrategySession[] {
  return listStoredBuildStrategyRecords();
}

export function blockBuildStrategy(buildStrategyId: string, reason = 'Strategy blocked'): BuildStrategySession | null {
  recordBuildStrategyLifecycleEvent(buildStrategyId, 'STRATEGY_BLOCKED', reason);
  return getStoredBuildStrategyRecord(buildStrategyId);
}

export function completeBuildStrategy(buildStrategyId: string): BuildStrategySession | null {
  recordBuildStrategyLifecycleEvent(
    buildStrategyId,
    'STRATEGY_COMPLETED',
    'Strategy planning marked complete — metadata only, no execution',
  );
  return getStoredBuildStrategyRecord(buildStrategyId);
}

export function archiveBuildStrategy(buildStrategyId: string): BuildStrategySession | null {
  recordBuildStrategyLifecycleEvent(buildStrategyId, 'STRATEGY_ARCHIVED');
  return getStoredBuildStrategyRecord(buildStrategyId);
}

export function trackBuildStrategyMetadata(
  buildStrategyId: string,
  metadata: Partial<BuildStrategySession['strategyMetadata']>,
): BuildStrategySession | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const updated: BuildStrategySession = {
    ...record,
    strategyMetadata: { ...record.strategyMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeBuildStrategyRecord(updated);
  return updated;
}

export function trackBuildStrategyOwnership(
  buildStrategyId: string,
  ownership: Partial<BuildStrategyOwnership>,
): BuildStrategySession | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const updatedOwnership = { ...record.strategyOwnership, ...ownership };
  registerBuildStrategyOwnership(buildStrategyId, updatedOwnership);

  const updated: BuildStrategySession = {
    ...record,
    strategyOwnership: updatedOwnership,
    updatedAt: Date.now(),
  };
  storeBuildStrategyRecord(updated);
  return updated;
}

export function runBuildStrategyPlanningPipeline(buildStrategyId: string): BuildStrategySession | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  classifyBuildStrategy({ buildStrategyId });
  selectBuildMode({ buildStrategyId });
  selectAutonomyLevel({ buildStrategyId });
  evaluateBuildRisk({ buildStrategyId });
  evaluateBuildConfidence({ buildStrategyId });
  selectBuildDepth({ buildStrategyId });
  recommendBuildStages(buildStrategyId);
  evaluateBuildReadiness(buildStrategyId);
  registerBuildConstraint({ buildStrategyId });
  registerBuildDependency({ buildStrategyId });
  applyBuildPolicy({ buildStrategyId });
  completeBuildStrategy(buildStrategyId);
  return getStoredBuildStrategyRecord(buildStrategyId);
}

export { classifyBuildStrategy } from './build-strategy-classifier.js';
export { selectBuildMode } from './build-strategy-mode.js';
export { selectAutonomyLevel } from './build-strategy-autonomy.js';
export { evaluateBuildRisk } from './build-strategy-risk.js';
export { evaluateBuildConfidence } from './build-strategy-confidence.js';
export { selectBuildDepth } from './build-strategy-depth.js';
export { recommendBuildStages } from './build-strategy-stage-recommender.js';
export { evaluateBuildReadiness } from './build-strategy-readiness.js';
export { applyBuildPolicy } from './build-strategy-policy.js';
export { registerBuildConstraint } from './build-strategy-constraint.js';
export { registerBuildDependency } from './build-strategy-dependency.js';
