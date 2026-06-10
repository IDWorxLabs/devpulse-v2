/**
 * Security Hardening — registry.
 */

import type {
  SecurityHardeningRecord,
  SecurityRiskLevel,
  SecurityState,
} from './security-hardening-types.js';

const bySecurityId = new Map<string, SecurityHardeningRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<SecurityRiskLevel, Set<string>>();
const byState = new Map<SecurityState, Set<string>>();

function indexRecord(record: SecurityHardeningRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.securityId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.securityId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.securityId);
}

export function registerSecurityHardeningRecord(record: SecurityHardeningRecord): SecurityHardeningRecord {
  bySecurityId.set(record.securityId, record);
  indexRecord(record);
  return record;
}

export function getSecurityHardeningRecord(securityId: string): SecurityHardeningRecord | undefined {
  return bySecurityId.get(securityId);
}

export function lookupSecurityByProjectId(projectId: string): SecurityHardeningRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => bySecurityId.get(id)!).filter(Boolean);
}

export function lookupSecurityByWorkspaceId(workspaceId: string): SecurityHardeningRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => bySecurityId.get(id)!).filter(Boolean);
}

export function lookupSecurityByRiskLevel(riskLevel: SecurityRiskLevel): SecurityHardeningRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => bySecurityId.get(id)!).filter(Boolean);
}

export function lookupSecurityByState(state: SecurityState): SecurityHardeningRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => bySecurityId.get(id)!).filter(Boolean);
}

export function listSecurityHardeningRecords(): SecurityHardeningRecord[] {
  return [...bySecurityId.values()];
}

export function getSecurityHardeningRecordCount(): number {
  return bySecurityId.size;
}

export function resetSecurityHardeningRegistryForTests(): void {
  bySecurityId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byState.clear();
}
