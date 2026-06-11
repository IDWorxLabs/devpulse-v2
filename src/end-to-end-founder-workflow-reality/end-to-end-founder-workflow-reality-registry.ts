/**
 * End-to-End Founder Workflow Reality — bounded assessment registry.
 */

import { MAX_REGISTRY_ENTRIES } from './end-to-end-founder-workflow-reality-bounds.js';

export interface FounderWorkflowRegistryEntry {
  assessmentId: string;
  founderWorkflowRealityScore: number;
  currentBottleneck: string;
  lastProvenStage: string;
  assessedAt: number;
}

const registry = new Map<string, FounderWorkflowRegistryEntry>();

export function resetFounderWorkflowRealityRegistryForTests(): void {
  registry.clear();
}

export function storeFounderWorkflowRegistryEntry(entry: FounderWorkflowRegistryEntry): void {
  registry.set(entry.assessmentId, entry);
  if (registry.size > MAX_REGISTRY_ENTRIES) {
    const oldest = [...registry.values()].sort((a, b) => a.assessedAt - b.assessedAt)[0];
    if (oldest) registry.delete(oldest.assessmentId);
  }
}

export function getFounderWorkflowRegistryCount(): number {
  return registry.size;
}

export function listFounderWorkflowRegistryEntries(): FounderWorkflowRegistryEntry[] {
  return [...registry.values()].sort((a, b) => b.assessedAt - a.assessedAt);
}
