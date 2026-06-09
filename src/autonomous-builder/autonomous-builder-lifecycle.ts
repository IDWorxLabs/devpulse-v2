/**
 * Autonomous Builder Foundation — lifecycle events.
 */

import {
  nextAutonomousBuildLifecycleEventId,
  storeAutonomousBuildLifecycleEvent,
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildLifecycleEvents,
} from './autonomous-builder-store.js';
import { setAutonomousBuildState } from './autonomous-builder-state-manager.js';
import type {
  AutonomousBuildLifecycleEvent,
  AutonomousBuildLifecycleEventType,
  AutonomousBuildState,
} from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

const STATE_MAP: Partial<Record<AutonomousBuildLifecycleEventType, AutonomousBuildState>> = {
  BUILD_CREATED: 'CREATED',
  BUILD_PLANNING: 'PLANNING',
  BUILD_GOAL_CREATED: 'PLANNING',
  BUILD_PLAN_CREATED: 'PLANNING',
  BUILD_STAGE_CREATED: 'PLANNING',
  BUILD_READINESS_EVALUATED: 'PLANNING',
  BUILD_READY: 'READY',
  BUILD_WAITING: 'WAITING',
  BUILD_IN_PROGRESS: 'IN_PROGRESS',
  BUILD_PAUSED: 'PAUSED',
  BUILD_BLOCKED: 'BLOCKED',
  BUILD_COMPLETED: 'COMPLETED',
  BUILD_FAILED: 'FAILED',
  BUILD_ARCHIVED: 'ARCHIVED',
};

export function recordAutonomousBuildLifecycleEvent(
  autonomousBuildId: string,
  eventType: AutonomousBuildLifecycleEventType,
  notes = '',
): void {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return;

  const targetState = STATE_MAP[eventType];
  const newState = targetState ?? record.buildState;

  storeAutonomousBuildLifecycleEvent({
    eventId: nextAutonomousBuildLifecycleEventId(),
    autonomousBuildId,
    eventType,
    previousState: record.buildState,
    newState,
    timestamp: Date.now(),
    sourceModule: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    notes,
  });

  if (targetState && record.buildState !== targetState) {
    setAutonomousBuildState(autonomousBuildId, targetState, eventType === 'BUILD_CREATED');
  }
}

export function listAutonomousBuildLifecycleEvents(autonomousBuildId: string): AutonomousBuildLifecycleEvent[] {
  return listStoredAutonomousBuildLifecycleEvents().filter((e) => e.autonomousBuildId === autonomousBuildId);
}
