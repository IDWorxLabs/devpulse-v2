/**
 * Autonomous Builder Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildCloudLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function linkAutonomousBuildToCloud(
  autonomousBuildId: string,
  runtimeId: string,
): AutonomousBuildCloudLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const runtime = getRuntime(runtimeId);
  if (!record || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== record.buildOwnership.projectId;
  const link: AutonomousBuildCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeAutonomousBuildRecord({
    ...record,
    buildCloudLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'CLOUD',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForAutonomousBuild(autonomousBuildId: string): string | null {
  return getStoredAutonomousBuildRecord(autonomousBuildId)?.buildCloudLink.runtimeId ?? null;
}

export function listAutonomousBuildsByCloud(runtimeId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter((r) => r.buildCloudLink.runtimeId === runtimeId);
}

export function detectAutonomousBuildCloudMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const runtime = getRuntime(record.buildCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== record.buildOwnership.projectId ||
    record.buildCloudLink.mismatchDetected
  );
}
