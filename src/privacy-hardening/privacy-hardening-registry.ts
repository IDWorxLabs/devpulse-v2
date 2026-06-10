/**
 * Privacy Hardening — registry.
 */

import type {
  PrivacyHardeningRecord,
  PrivacyRiskLevel,
  PrivacyState,
} from './privacy-hardening-types.js';

const byPrivacyId = new Map<string, PrivacyHardeningRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<PrivacyRiskLevel, Set<string>>();
const byState = new Map<PrivacyState, Set<string>>();

function indexRecord(record: PrivacyHardeningRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.privacyId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.privacyId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.privacyId);
}

export function registerPrivacyHardeningRecord(record: PrivacyHardeningRecord): PrivacyHardeningRecord {
  byPrivacyId.set(record.privacyId, record);
  indexRecord(record);
  return record;
}

export function getPrivacyHardeningRecord(privacyId: string): PrivacyHardeningRecord | undefined {
  return byPrivacyId.get(privacyId);
}

export function lookupPrivacyByProjectId(projectId: string): PrivacyHardeningRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byPrivacyId.get(id)!).filter(Boolean);
}

export function lookupPrivacyByWorkspaceId(workspaceId: string): PrivacyHardeningRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byPrivacyId.get(id)!).filter(Boolean);
}

export function lookupPrivacyByRiskLevel(riskLevel: PrivacyRiskLevel): PrivacyHardeningRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => byPrivacyId.get(id)!).filter(Boolean);
}

export function lookupPrivacyByState(state: PrivacyState): PrivacyHardeningRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byPrivacyId.get(id)!).filter(Boolean);
}

export function listPrivacyHardeningRecords(): PrivacyHardeningRecord[] {
  return [...byPrivacyId.values()];
}

export function getPrivacyHardeningRecordCount(): number {
  return byPrivacyId.size;
}

export function resetPrivacyHardeningRegistryForTests(): void {
  byPrivacyId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byState.clear();
}
