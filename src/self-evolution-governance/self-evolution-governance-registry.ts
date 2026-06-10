/**
 * Self Evolution Governance — governance record registry.
 */

import type { SelfEvolutionGovernanceDecision, SelfEvolutionGovernanceRecord } from './self-evolution-governance-types.js';

const registry = new Map<string, SelfEvolutionGovernanceRecord>();

export function registerGovernanceRecord(record: SelfEvolutionGovernanceRecord): void {
  registry.set(record.governanceId, record);
}

export function getGovernanceRecord(governanceId: string): SelfEvolutionGovernanceRecord | undefined {
  return registry.get(governanceId);
}

export function listGovernanceRecords(): SelfEvolutionGovernanceRecord[] {
  return [...registry.values()];
}

export function listGovernanceRecordsByDecision(decision: SelfEvolutionGovernanceDecision): SelfEvolutionGovernanceRecord[] {
  return listGovernanceRecords().filter((r) => r.decision === decision);
}

export function getGovernanceRecordCount(): number {
  return registry.size;
}

export function resetGovernanceRegistryForTests(): void {
  registry.clear();
}
