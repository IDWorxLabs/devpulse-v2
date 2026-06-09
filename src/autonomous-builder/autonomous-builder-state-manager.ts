/**
 * Autonomous Builder Foundation — state manager.
 */

import {
  getStoredAutonomousBuildRecord,
  appendAutonomousBuildStateHistory,
  storeAutonomousBuildRecord,
  getStoredAutonomousBuildStateHistory,
} from './autonomous-builder-store.js';
import type { AutonomousBuildState, AutonomousBuildStateHistoryEntry } from './autonomous-builder-types.js';
import { isValidAutonomousBuildStateTransition } from './autonomous-builder-types.js';

export function setAutonomousBuildState(
  autonomousBuildId: string,
  newState: AutonomousBuildState,
  force = false,
): { ok: boolean; previousState: AutonomousBuildState | null; error?: string } {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) {
    return { ok: false, previousState: null, error: `Build record not found: ${autonomousBuildId}` };
  }

  const previousState = record.buildState;
  if (!force && !isValidAutonomousBuildStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeAutonomousBuildRecord({
    ...record,
    buildState: newState,
    buildStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendAutonomousBuildStateHistory({
    autonomousBuildId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getAutonomousBuildState(autonomousBuildId: string): AutonomousBuildState | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildState ?? null;
}

export function trackAutonomousBuildStateHistory(autonomousBuildId: string): AutonomousBuildStateHistoryEntry[] {
  return getStoredAutonomousBuildStateHistory(autonomousBuildId);
}

function resolveStatusForState(
  state: AutonomousBuildState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'READY' || state === 'COMPLETED') return 'HEALTHY';
  if (state === 'FAILED' || state === 'BLOCKED') return 'BLOCKED';
  if (state === 'CREATED' || state === 'PLANNING' || state === 'WAITING' || state === 'IN_PROGRESS') {
    return 'WAITING';
  }
  if (state === 'PAUSED' || state === 'ARCHIVED') return 'DEGRADED';
  return 'UNKNOWN';
}
