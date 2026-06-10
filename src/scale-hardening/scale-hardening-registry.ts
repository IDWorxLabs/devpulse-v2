/**
 * Scale Hardening — registry.
 */

import type {
  ScaleHardeningRecord,
  ScaleRiskLevel,
  ScaleState,
} from './scale-hardening-types.js';

const byScaleId = new Map<string, ScaleHardeningRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<ScaleRiskLevel, Set<string>>();
const byState = new Map<ScaleState, Set<string>>();

function indexRecord(record: ScaleHardeningRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.scaleId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.scaleId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.scaleId);
}

export function registerScaleHardeningRecord(record: ScaleHardeningRecord): ScaleHardeningRecord {
  byScaleId.set(record.scaleId, record);
  indexRecord(record);
  return record;
}

export function getScaleHardeningRecord(scaleId: string): ScaleHardeningRecord | undefined {
  return byScaleId.get(scaleId);
}

export function lookupScaleByProjectId(projectId: string): ScaleHardeningRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byScaleId.get(id)!).filter(Boolean);
}

export function lookupScaleByWorkspaceId(workspaceId: string): ScaleHardeningRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byScaleId.get(id)!).filter(Boolean);
}

export function lookupScaleByRiskLevel(riskLevel: ScaleRiskLevel): ScaleHardeningRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => byScaleId.get(id)!).filter(Boolean);
}

export function lookupScaleByState(state: ScaleState): ScaleHardeningRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byScaleId.get(id)!).filter(Boolean);
}

export function listScaleHardeningRecords(): ScaleHardeningRecord[] {
  return [...byScaleId.values()];
}

export function getScaleHardeningRecordCount(): number {
  return byScaleId.size;
}

export function resetScaleHardeningRegistryForTests(): void {
  byScaleId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byState.clear();
}
