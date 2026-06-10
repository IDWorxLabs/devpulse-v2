/**
 * Unified Trust Score — registry.
 */

import type {
  UnifiedTrustDecision,
  UnifiedTrustScoreLevel,
  UnifiedTrustScoreRecord,
} from './unified-trust-score-types.js';

const byScoreId = new Map<string, UnifiedTrustScoreRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byTrustLevel = new Map<UnifiedTrustScoreLevel, Set<string>>();
const byDecision = new Map<UnifiedTrustDecision, Set<string>>();

function indexRecord(record: UnifiedTrustScoreRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.scoreId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byTrustLevel.has(record.trustLevel)) byTrustLevel.set(record.trustLevel, new Set());
  byTrustLevel.get(record.trustLevel)!.add(record.scoreId);
  if (!byDecision.has(record.decision)) byDecision.set(record.decision, new Set());
  byDecision.get(record.decision)!.add(record.scoreId);
}

export function registerUnifiedTrustScoreRecord(record: UnifiedTrustScoreRecord): UnifiedTrustScoreRecord {
  byScoreId.set(record.scoreId, record);
  indexRecord(record);
  return record;
}

export function getUnifiedTrustScoreRecord(scoreId: string): UnifiedTrustScoreRecord | undefined {
  return byScoreId.get(scoreId);
}

export function lookupTrustScoreByProjectId(projectId: string): UnifiedTrustScoreRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byScoreId.get(id)!).filter(Boolean);
}

export function lookupTrustScoreByWorkspaceId(workspaceId: string): UnifiedTrustScoreRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byScoreId.get(id)!).filter(Boolean);
}

export function lookupTrustScoreByTrustLevel(trustLevel: UnifiedTrustScoreLevel): UnifiedTrustScoreRecord[] {
  const ids = byTrustLevel.get(trustLevel);
  if (!ids) return [];
  return [...ids].map((id) => byScoreId.get(id)!).filter(Boolean);
}

export function lookupTrustScoreByDecision(decision: UnifiedTrustDecision): UnifiedTrustScoreRecord[] {
  const ids = byDecision.get(decision);
  if (!ids) return [];
  return [...ids].map((id) => byScoreId.get(id)!).filter(Boolean);
}

export function listUnifiedTrustScoreRecords(): UnifiedTrustScoreRecord[] {
  return [...byScoreId.values()];
}

export function getUnifiedTrustScoreRecordCount(): number {
  return byScoreId.size;
}

export function resetUnifiedTrustScoreRegistryForTests(): void {
  byScoreId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byTrustLevel.clear();
  byDecision.clear();
}
