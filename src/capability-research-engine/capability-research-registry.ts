/**
 * Capability Research Engine — research record registry.
 */

import type { CapabilityResearchDecision, CapabilityResearchRecord } from './capability-research-types.js';

const registry = new Map<string, CapabilityResearchRecord>();

export function registerCapabilityResearch(record: CapabilityResearchRecord): void {
  registry.set(record.researchId, record);
}

export function getCapabilityResearch(researchId: string): CapabilityResearchRecord | undefined {
  return registry.get(researchId);
}

export function listCapabilityResearch(): CapabilityResearchRecord[] {
  return [...registry.values()];
}

export function listCapabilityResearchByDomain(domain: string): CapabilityResearchRecord[] {
  return listCapabilityResearch().filter((r) => r.capabilityDomain === domain);
}

export function listCapabilityResearchByDecision(decision: CapabilityResearchDecision): CapabilityResearchRecord[] {
  return listCapabilityResearch().filter((r) => r.decision === decision);
}

export function getCapabilityResearchCount(): number {
  return registry.size;
}

export function resetCapabilityResearchRegistryForTests(): void {
  registry.clear();
}
