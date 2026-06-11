/**
 * Autonomous Builder Reality — bounded assessment registry.
 */

import { MAX_REGISTRY_ENTRIES } from './autonomous-builder-reality-bounds.js';
import type { BuilderRealityRegistryEntry } from './autonomous-builder-reality-types.js';

const registry = new Map<string, BuilderRealityRegistryEntry>();

export function resetAutonomousBuilderRealityRegistryForTests(): void {
  registry.clear();
}

export function storeBuilderRealityRegistryEntry(entry: BuilderRealityRegistryEntry): void {
  registry.set(entry.assessmentId, entry);
  if (registry.size > MAX_REGISTRY_ENTRIES) {
    const oldest = [...registry.values()].sort((a, b) => a.assessedAt - b.assessedAt)[0];
    if (oldest) registry.delete(oldest.assessmentId);
  }
}

export function getBuilderRealityRegistryEntry(assessmentId: string): BuilderRealityRegistryEntry | null {
  return registry.get(assessmentId) ?? null;
}

export function listBuilderRealityRegistryEntries(): BuilderRealityRegistryEntry[] {
  return [...registry.values()].sort((a, b) => b.assessedAt - a.assessedAt);
}

export function getBuilderRealityRegistryCount(): number {
  return registry.size;
}
