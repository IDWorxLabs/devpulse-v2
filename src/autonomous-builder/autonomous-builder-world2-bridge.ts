/**
 * Autonomous Builder Foundation — World2 metadata bridge.
 */

import { readSystemSummariesForAutonomousBuilder } from './read-cache.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildWorld2Link } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

function listWorld2SystemSummaries(): ReturnType<typeof readSystemSummariesForAutonomousBuilder> {
  return readSystemSummariesForAutonomousBuilder().filter((s) => s.systemId.includes('world2'));
}

export function validateWorld2OperationId(world2OperationId: string): boolean {
  if (!world2OperationId) return false;
  return listWorld2SystemSummaries().some(
    (s) => s.systemId.includes(world2OperationId) || s.summary.includes(world2OperationId),
  );
}

export function linkAutonomousBuildToWorld2(
  autonomousBuildId: string,
  world2OperationId: string,
): AutonomousBuildWorld2Link | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const exists = validateWorld2OperationId(world2OperationId);
  const link: AutonomousBuildWorld2Link = {
    world2OperationId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !exists,
  };

  storeAutonomousBuildRecord({
    ...record,
    buildWorld2Link: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'WORLD2',
    summary: `Linked to world2 operation ${world2OperationId}${link.mismatchDetected ? ' — MISMATCH' : ''}`,
    scopeUsed: world2OperationId,
  });

  return link;
}

export function getWorld2ForAutonomousBuild(autonomousBuildId: string): string | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const operationId = record?.buildWorld2Link.world2OperationId;
  return operationId && operationId.length > 0 ? operationId : null;
}

export function listAutonomousBuildsByWorld2(world2OperationId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter(
    (r) => r.buildWorld2Link.world2OperationId === world2OperationId,
  );
}

export function detectAutonomousBuildWorld2Mismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const operationId = record.buildWorld2Link.world2OperationId;
  if (!operationId) return true;
  return record.buildWorld2Link.mismatchDetected || !validateWorld2OperationId(operationId);
}
