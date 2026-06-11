/**
 * Mobile Runtime Experience Reality — bounded assessment registry.
 */

import { MAX_REGISTRY_ENTRIES } from './mobile-runtime-experience-reality-bounds.js';

export interface MobileRuntimeRegistryEntry {
  assessmentId: string;
  mobileRuntimeExperienceScore: number;
  mobileExperienceCompleteness: string;
  assessedAt: number;
}

const registry = new Map<string, MobileRuntimeRegistryEntry>();

export function resetMobileRuntimeExperienceRegistryForTests(): void {
  registry.clear();
}

export function storeMobileRuntimeRegistryEntry(entry: MobileRuntimeRegistryEntry): void {
  registry.set(entry.assessmentId, entry);
  if (registry.size > MAX_REGISTRY_ENTRIES) {
    const oldest = [...registry.values()].sort((a, b) => a.assessedAt - b.assessedAt)[0];
    if (oldest) registry.delete(oldest.assessmentId);
  }
}

export function getMobileRuntimeRegistryCount(): number {
  return registry.size;
}

export function listMobileRuntimeRegistryEntries(): MobileRuntimeRegistryEntry[] {
  return [...registry.values()].sort((a, b) => b.assessedAt - a.assessedAt);
}
