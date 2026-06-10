/**
 * Reality Verification Expansion — reality source registry.
 */

import type { RealitySourceId, RealitySourceRegistration } from './reality-verification-types.js';
import { getCachedRealitySource, setCachedRealitySource } from './reality-verification-cache.js';

const DEFAULT_SOURCES: readonly { sourceId: RealitySourceId; label: string }[] = [
  { sourceId: 'UNIFIED_TRUST_RUNTIME', label: 'Unified Trust Runtime' },
  { sourceId: 'EVIDENCE_INTELLIGENCE', label: 'Evidence Intelligence' },
  { sourceId: 'AUTONOMOUS_VERIFICATION', label: 'Autonomous Verification' },
  { sourceId: 'AUTONOMOUS_COMPLETION_ENGINE', label: 'Autonomous Completion Engine' },
  { sourceId: 'MULTI_PROJECT_VERIFICATION', label: 'Multi Project Verification' },
  { sourceId: 'MULTI_PROJECT_MONITORING', label: 'Multi Project Monitoring' },
  { sourceId: 'SELF_EVOLUTION_GOVERNANCE', label: 'Self Evolution Governance' },
  { sourceId: 'WORLD2', label: 'World 2' },
  { sourceId: 'TRUST_ENGINE', label: 'Trust Engine' },
];

const sourceRegistry = new Map<RealitySourceId, RealitySourceRegistration>();
let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const now = Date.now();
  for (const entry of DEFAULT_SOURCES) {
    sourceRegistry.set(entry.sourceId, {
      sourceId: entry.sourceId,
      label: entry.label,
      registeredAt: now,
      active: true,
    });
  }
  initialized = true;
}

export function registerRealitySource(sourceId: RealitySourceId, label?: string): RealitySourceRegistration {
  ensureInitialized();
  const existing = sourceRegistry.get(sourceId);
  if (existing) return existing;

  const registration: RealitySourceRegistration = {
    sourceId,
    label: label ?? sourceId,
    registeredAt: Date.now(),
    active: true,
  };
  sourceRegistry.set(sourceId, registration);
  return registration;
}

export function getRealitySource(sourceId: RealitySourceId): RealitySourceRegistration | undefined {
  ensureInitialized();
  const cached = getCachedRealitySource(sourceId);
  if (cached) return cached;

  const source = sourceRegistry.get(sourceId);
  if (source) setCachedRealitySource(sourceId, source);
  return source;
}

export function listRealitySources(): RealitySourceRegistration[] {
  ensureInitialized();
  return [...sourceRegistry.values()];
}

export function getRealitySourceCount(): number {
  ensureInitialized();
  return sourceRegistry.size;
}

export function isKnownRealitySource(sourceId: string): sourceId is RealitySourceId {
  ensureInitialized();
  return sourceRegistry.has(sourceId as RealitySourceId);
}

export function listKnownRealitySourceIds(): RealitySourceId[] {
  ensureInitialized();
  return [...sourceRegistry.keys()];
}

export function resetRealitySourceRegistryForTests(): void {
  sourceRegistry.clear();
  initialized = false;
}
