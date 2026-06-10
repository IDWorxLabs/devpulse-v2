/**
 * Performance Hardening — registry.
 */

import type {
  PerformanceHardeningRecord,
  PerformanceRiskLevel,
  PerformanceState,
} from './performance-hardening-types.js';

const byPerformanceId = new Map<string, PerformanceHardeningRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<PerformanceRiskLevel, Set<string>>();
const byState = new Map<PerformanceState, Set<string>>();

function indexRecord(record: PerformanceHardeningRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.performanceId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.performanceId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.performanceId);
}

export function registerPerformanceHardeningRecord(record: PerformanceHardeningRecord): PerformanceHardeningRecord {
  byPerformanceId.set(record.performanceId, record);
  indexRecord(record);
  return record;
}

export function getPerformanceHardeningRecord(performanceId: string): PerformanceHardeningRecord | undefined {
  return byPerformanceId.get(performanceId);
}

export function lookupPerformanceByProjectId(projectId: string): PerformanceHardeningRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byPerformanceId.get(id)!).filter(Boolean);
}

export function lookupPerformanceByWorkspaceId(workspaceId: string): PerformanceHardeningRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byPerformanceId.get(id)!).filter(Boolean);
}

export function lookupPerformanceByRiskLevel(riskLevel: PerformanceRiskLevel): PerformanceHardeningRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => byPerformanceId.get(id)!).filter(Boolean);
}

export function lookupPerformanceByState(state: PerformanceState): PerformanceHardeningRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byPerformanceId.get(id)!).filter(Boolean);
}

export function listPerformanceHardeningRecords(): PerformanceHardeningRecord[] {
  return [...byPerformanceId.values()];
}

export function getPerformanceHardeningRecordCount(): number {
  return byPerformanceId.size;
}

export function resetPerformanceHardeningRegistryForTests(): void {
  byPerformanceId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byState.clear();
}
