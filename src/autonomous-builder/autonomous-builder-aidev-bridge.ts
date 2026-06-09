/**
 * Autonomous Builder Foundation — AiDev metadata bridge.
 */

import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import {
  getStoredAutonomousBuildRecord,
  listStoredAutonomousBuildRecords,
  storeAutonomousBuildRecord,
} from './autonomous-builder-store.js';
import { recordAutonomousBuildHistoryEntry } from './autonomous-builder-history.js';
import type { AutonomousBuildSession, AutonomousBuildAiDevLink } from './autonomous-builder-types.js';
import { AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE } from './autonomous-builder-types.js';

export function validateAiDevOperationId(aidevOperationId: string): boolean {
  if (!aidevOperationId) return false;
  const summary = getLatestAiDevSummary();
  if (!summary) return false;
  return summary.requestId === aidevOperationId || summary.summary.includes(aidevOperationId);
}

export function linkAutonomousBuildToAiDev(
  autonomousBuildId: string,
  aidevOperationId: string,
): AutonomousBuildAiDevLink | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return null;

  const exists = validateAiDevOperationId(aidevOperationId);
  const link: AutonomousBuildAiDevLink = {
    aidevOperationId,
    linkedAt: Date.now(),
    linkAuthority: AUTONOMOUS_BUILDER_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !exists,
  };

  storeAutonomousBuildRecord({
    ...record,
    buildAiDevLink: link,
    updatedAt: Date.now(),
  });

  recordAutonomousBuildHistoryEntry({
    autonomousBuildId,
    category: 'AIDEV',
    summary: `Linked to aidev operation ${aidevOperationId}${link.mismatchDetected ? ' — MISMATCH' : ''}`,
    scopeUsed: aidevOperationId,
  });

  return link;
}

export function getAiDevForAutonomousBuild(autonomousBuildId: string): string | null {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  const operationId = record?.buildAiDevLink.aidevOperationId;
  return operationId && operationId.length > 0 ? operationId : null;
}

export function listAutonomousBuildsByAiDev(aidevOperationId: string): AutonomousBuildSession[] {
  return listStoredAutonomousBuildRecords().filter(
    (r) => r.buildAiDevLink.aidevOperationId === aidevOperationId,
  );
}

export function detectAutonomousBuildAiDevMismatch(autonomousBuildId: string): boolean {
  const record = getStoredAutonomousBuildRecord(autonomousBuildId);
  if (!record) return true;
  const operationId = record.buildAiDevLink.aidevOperationId;
  if (!operationId) return true;
  return record.buildAiDevLink.mismatchDetected || !validateAiDevOperationId(operationId);
}
