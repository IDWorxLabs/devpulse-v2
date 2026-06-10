/**
 * Reliability Hardening — registry.
 */

import type {
  ReliabilityHardeningRecord,
  ReliabilityRiskLevel,
  ReliabilityState,
} from './reliability-hardening-types.js';

const byReliabilityId = new Map<string, ReliabilityHardeningRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<ReliabilityRiskLevel, Set<string>>();
const byState = new Map<ReliabilityState, Set<string>>();

function indexRecord(record: ReliabilityHardeningRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.reliabilityId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.reliabilityId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.reliabilityId);
}

export function registerReliabilityHardeningRecord(record: ReliabilityHardeningRecord): ReliabilityHardeningRecord {
  byReliabilityId.set(record.reliabilityId, record);
  indexRecord(record);
  return record;
}

export function getReliabilityHardeningRecord(reliabilityId: string): ReliabilityHardeningRecord | undefined {
  return byReliabilityId.get(reliabilityId);
}

export function lookupReliabilityByProjectId(projectId: string): ReliabilityHardeningRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byReliabilityId.get(id)!).filter(Boolean);
}

export function lookupReliabilityByWorkspaceId(workspaceId: string): ReliabilityHardeningRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byReliabilityId.get(id)!).filter(Boolean);
}

export function lookupReliabilityByRiskLevel(riskLevel: ReliabilityRiskLevel): ReliabilityHardeningRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => byReliabilityId.get(id)!).filter(Boolean);
}

export function lookupReliabilityByState(state: ReliabilityState): ReliabilityHardeningRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byReliabilityId.get(id)!).filter(Boolean);
}

export function listReliabilityHardeningRecords(): ReliabilityHardeningRecord[] {
  return [...byReliabilityId.values()];
}

export function getReliabilityHardeningRecordCount(): number {
  return byReliabilityId.size;
}

export function resetReliabilityHardeningRegistryForTests(): void {
  byReliabilityId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byState.clear();
}
