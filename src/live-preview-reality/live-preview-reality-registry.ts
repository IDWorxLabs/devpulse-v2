/**
 * Live Preview Reality — bounded assessment registry.
 */

import { MAX_REGISTRY_ENTRIES } from './live-preview-reality-bounds.js';

export interface LivePreviewRegistryEntry {
  assessmentId: string;
  livePreviewRealityScore: number;
  founderBottleneck: string;
  assessedAt: number;
}

const registry = new Map<string, LivePreviewRegistryEntry>();

export function resetLivePreviewRealityRegistryForTests(): void {
  registry.clear();
}

export function storeLivePreviewRegistryEntry(entry: LivePreviewRegistryEntry): void {
  registry.set(entry.assessmentId, entry);
  if (registry.size > MAX_REGISTRY_ENTRIES) {
    const oldest = [...registry.values()].sort((a, b) => a.assessedAt - b.assessedAt)[0];
    if (oldest) registry.delete(oldest.assessmentId);
  }
}

export function getLivePreviewRegistryCount(): number {
  return registry.size;
}

export function listLivePreviewRegistryEntries(): LivePreviewRegistryEntry[] {
  return [...registry.values()].sort((a, b) => b.assessedAt - a.assessedAt);
}
