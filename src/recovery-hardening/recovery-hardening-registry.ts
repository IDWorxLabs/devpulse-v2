/**
 * Recovery Hardening — registry.
 */

import type {
  RecoveryHardeningRecord,
  RecoveryRiskLevel,
  RecoveryState,
} from './recovery-hardening-types.js';

const byRecoveryId = new Map<string, RecoveryHardeningRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<RecoveryRiskLevel, Set<string>>();
const byState = new Map<RecoveryState, Set<string>>();

function indexRecord(record: RecoveryHardeningRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.recoveryId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.recoveryId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.recoveryId);
}

export function registerRecoveryHardeningRecord(record: RecoveryHardeningRecord): RecoveryHardeningRecord {
  byRecoveryId.set(record.recoveryId, record);
  indexRecord(record);
  return record;
}

export function getRecoveryHardeningRecord(recoveryId: string): RecoveryHardeningRecord | undefined {
  return byRecoveryId.get(recoveryId);
}

export function lookupRecoveryByProjectId(projectId: string): RecoveryHardeningRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byRecoveryId.get(id)!).filter(Boolean);
}

export function lookupRecoveryByWorkspaceId(workspaceId: string): RecoveryHardeningRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byRecoveryId.get(id)!).filter(Boolean);
}

export function lookupRecoveryByRiskLevel(riskLevel: RecoveryRiskLevel): RecoveryHardeningRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => byRecoveryId.get(id)!).filter(Boolean);
}

export function lookupRecoveryByState(state: RecoveryState): RecoveryHardeningRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byRecoveryId.get(id)!).filter(Boolean);
}

export function listRecoveryHardeningRecords(): RecoveryHardeningRecord[] {
  return [...byRecoveryId.values()];
}

export function getRecoveryHardeningRecordCount(): number {
  return byRecoveryId.size;
}

export function resetRecoveryHardeningRegistryForTests(): void {
  byRecoveryId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byState.clear();
}
