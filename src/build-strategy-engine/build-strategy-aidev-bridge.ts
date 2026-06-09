/**
 * Build Strategy Engine — AiDev metadata bridge.
 */

import { getLatestAiDevSummary } from '../aidev-engine/index.js';
import {
  getStoredBuildStrategyRecord,
  listStoredBuildStrategyRecords,
  storeBuildStrategyRecord,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import type { BuildStrategySession, BuildStrategyAiDevLink } from './build-strategy-types.js';
import { BUILD_STRATEGY_ENGINE_OWNER_MODULE } from './build-strategy-types.js';

export function validateAiDevOperationId(aidevOperationId: string): boolean {
  if (!aidevOperationId) return false;
  const summary = getLatestAiDevSummary();
  if (!summary) return false;
  return summary.requestId === aidevOperationId || summary.summary.includes(aidevOperationId);
}

export function linkBuildStrategyToAiDev(
  buildStrategyId: string,
  aidevOperationId: string,
): BuildStrategyAiDevLink | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return null;

  const exists = validateAiDevOperationId(aidevOperationId);
  const link: BuildStrategyAiDevLink = {
    aidevOperationId,
    linkedAt: Date.now(),
    linkAuthority: BUILD_STRATEGY_ENGINE_OWNER_MODULE,
    mismatchDetected: !exists,
  };

  storeBuildStrategyRecord({
    ...record,
    strategyAiDevLink: link,
    updatedAt: Date.now(),
  });

  recordBuildStrategyHistoryEntry({
    buildStrategyId,
    category: 'AIDEV',
    summary: `Linked to aidev operation ${aidevOperationId}${link.mismatchDetected ? ' — MISMATCH' : ''}`,
    scopeUsed: aidevOperationId,
  });

  return link;
}

export function getAiDevForBuildStrategy(buildStrategyId: string): string | null {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  const operationId = record?.strategyAiDevLink.aidevOperationId;
  return operationId && operationId.length > 0 ? operationId : null;
}

export function listBuildStrategiesByAiDev(aidevOperationId: string): BuildStrategySession[] {
  return listStoredBuildStrategyRecords().filter(
    (r) => r.strategyAiDevLink.aidevOperationId === aidevOperationId,
  );
}

export function detectBuildStrategyAiDevMismatch(buildStrategyId: string): boolean {
  const record = getStoredBuildStrategyRecord(buildStrategyId);
  if (!record) return true;
  const operationId = record.strategyAiDevLink.aidevOperationId;
  if (!operationId) return true;
  return record.strategyAiDevLink.mismatchDetected || !validateAiDevOperationId(operationId);
}
