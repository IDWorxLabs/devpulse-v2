/**
 * Cross Device Runtime Foundation — device handoff management (metadata only).
 */

import {
  nextDeviceHandoffId,
  storeDeviceHandoff,
  getStoredDeviceHandoff,
  listStoredDeviceHandoffs,
  getStoredCrossDeviceSession,
  storeCrossDeviceSession,
} from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { DeviceHandoff, CrossDeviceCategory } from './cross-device-types.js';

export function registerDeviceHandoff(input: {
  crossDeviceId: string;
  handoffType: CrossDeviceCategory;
  sourceDeviceId: string;
  targetDeviceId: string;
  projectId: string;
  handoffContext?: string;
  handoffReason?: string;
}): DeviceHandoff | null {
  const session = getStoredCrossDeviceSession(input.crossDeviceId);
  if (!session) return null;

  const handoff: DeviceHandoff = {
    handoffId: nextDeviceHandoffId(),
    crossDeviceId: input.crossDeviceId,
    handoffType: input.handoffType,
    sourceDeviceId: input.sourceDeviceId,
    targetDeviceId: input.targetDeviceId,
    projectId: input.projectId,
    handoffContext: input.handoffContext ?? 'Authority-only handoff metadata — no real sync',
    handoffStatus: 'AVAILABLE',
    handoffReason: input.handoffReason ?? 'Cross device handoff registered',
    handoffTimestamp: Date.now(),
    handoffAllowed: input.handoffType !== 'FOUNDER_CROSS_DEVICE',
    handoffBlockedReason: input.handoffType === 'FOUNDER_CROSS_DEVICE' ? 'Founder review required' : null,
  };

  storeDeviceHandoff(handoff);
  storeCrossDeviceSession({
    ...session,
    deviceHandoffs: [...session.deviceHandoffs, handoff],
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId: input.crossDeviceId,
    category: 'HANDOFF',
    summary: `Device handoff ${handoff.handoffId}: ${input.sourceDeviceId} → ${input.targetDeviceId}`,
    scopeUsed: handoff.handoffId,
  });

  return handoff;
}

export function getDeviceHandoff(handoffId: string): DeviceHandoff | null {
  return getStoredDeviceHandoff(handoffId);
}

export function listDeviceHandoffs(crossDeviceId?: string): DeviceHandoff[] {
  const all = listStoredDeviceHandoffs();
  if (!crossDeviceId) return all;
  return all.filter((h) => h.crossDeviceId === crossDeviceId);
}
