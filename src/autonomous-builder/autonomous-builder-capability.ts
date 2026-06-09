/**
 * Autonomous Builder Foundation — capability metadata (planning only).
 */

import {
  nextAutonomousBuildCapabilityId,
  getStoredAutonomousBuildRecord,
  storeAutonomousBuildRecord,
  storeAutonomousBuildCapability,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildCapability } from './autonomous-builder-types.js';

export function registerCapability(input: {
  autonomousBuildId: string;
  capabilityName?: string;
  capabilityReason?: string;
}): AutonomousBuildCapability | null {
  const record = getStoredAutonomousBuildRecord(input.autonomousBuildId);
  if (!record) return null;

  const capability: AutonomousBuildCapability = {
    capabilityId: nextAutonomousBuildCapabilityId(),
    autonomousBuildId: input.autonomousBuildId,
    capabilityName: input.capabilityName ?? 'build_planning',
    capabilityReason: input.capabilityReason ?? 'Autonomous build planning metadata capability',
    registeredAt: Date.now(),
    planningOnly: true,
  };

  storeAutonomousBuildCapability(capability);
  const updated = [...record.buildCapabilities, capability];
  storeAutonomousBuildRecord({ ...record, buildCapabilities: updated, updatedAt: Date.now() });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId: input.autonomousBuildId,
    category: 'CAPABILITY',
    summary: `Capability ${capability.capabilityId}: ${capability.capabilityName}`,
    scopeUsed: capability.capabilityId,
  });

  return capability;
}

export function getAutonomousBuildCapabilities(autonomousBuildId: string): AutonomousBuildCapability[] {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildCapabilities ?? [];
}
