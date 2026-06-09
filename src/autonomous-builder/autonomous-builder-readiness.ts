/**
 * Autonomous Builder Foundation — readiness evaluation (planning only).
 */

import {
  nextAutonomousBuildReadinessId,
  getStoredAutonomousBuildRecord,
  storeAutonomousBuildRecord,
  storeAutonomousBuildReadiness,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import { recordAutonomousBuildLifecycleEvent } from './autonomous-builder-lifecycle.js';
import type { AutonomousBuildReadiness } from './autonomous-builder-types.js';

export function evaluateReadiness(autonomousBuildId: string): AutonomousBuildReadiness | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const hasGoal = record.buildGoal !== null;
  const hasPlan = record.buildPlan !== null;
  const hasStages = record.buildStages.length > 0;
  const ready = hasGoal && hasPlan && hasStages;

  const readiness: AutonomousBuildReadiness = {
    readinessId: nextAutonomousBuildReadinessId(),
    autonomousBuildId,
    ready,
    readinessReason: ready
      ? 'Goal, plan, and stages present — metadata planning ready'
      : 'Missing goal, plan, or stages for readiness',
    evaluatedAt: Date.now(),
    planningOnly: true,
  };

  storeAutonomousBuildReadiness(readiness);
  storeAutonomousBuildRecord({ ...record, buildReadiness: readiness, updatedAt: Date.now() });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'READINESS',
    summary: `Readiness ${readiness.readinessId}: ready=${ready}`,
    scopeUsed: readiness.readinessId,
  });

  recordAutonomousBuildLifecycleEvent(
    autonomousBuildId,
    'BUILD_READINESS_EVALUATED',
    readiness.readinessReason,
  );

  if (ready) {
    recordAutonomousBuildLifecycleEvent(autonomousBuildId, 'BUILD_READY', 'Build metadata ready — no execution');
  }

  return readiness;
}

export function getAutonomousBuildReadiness(autonomousBuildId: string): AutonomousBuildReadiness | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildReadiness ?? null;
}
