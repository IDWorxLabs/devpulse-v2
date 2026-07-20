/**
 * Universal Capability Pack Framework V1 — canonical pack registry.
 */

import type { CapabilityPackDescriptor } from './universal-capability-pack-types.js';
import { FUTURE_CAPABILITY_PACK_CATALOG } from './future-capability-pack-catalog.js';

export interface PackRegistryValidationIssue {
  readonly code: 'duplicate_pack_id' | 'invalid_pack' | 'conflicting_version';
  readonly packId: string;
  readonly detail: string;
}

const registry = new Map<string, CapabilityPackDescriptor>();

export function registerPack(descriptor: CapabilityPackDescriptor): void {
  if (registry.has(descriptor.packId)) {
    throw new Error(`Duplicate pack ID: ${descriptor.packId}`);
  }
  registry.set(descriptor.packId, descriptor);
}

export function unregisterPack(packId: string): boolean {
  return registry.delete(packId);
}

export function getPack(packId: string): CapabilityPackDescriptor | undefined {
  return registry.get(packId);
}

export function listPacks(): readonly CapabilityPackDescriptor[] {
  return [...registry.values()].sort((a, b) => a.packId.localeCompare(b.packId));
}

export function listProductionReadyPacks(): readonly CapabilityPackDescriptor[] {
  return listPacks().filter((p) => p.productionReadiness && (p.supportStatus === 'PRODUCTION_READY' || p.supportStatus === 'FUNCTIONAL_REFERENCE'));
}

export function findProvidersForCapability(capabilityKey: string): readonly CapabilityPackDescriptor[] {
  return listPacks().filter((p) => p.providedCapabilities.includes(capabilityKey));
}

export function validatePack(descriptor: CapabilityPackDescriptor): PackRegistryValidationIssue[] {
  const issues: PackRegistryValidationIssue[] = [];
  if (!descriptor.packId.trim()) issues.push({ code: 'invalid_pack', packId: descriptor.packId, detail: 'Missing packId' });
  if (!descriptor.packVersion.trim()) issues.push({ code: 'invalid_pack', packId: descriptor.packId, detail: 'Missing packVersion' });
  if (descriptor.providedCapabilities.length === 0) issues.push({ code: 'invalid_pack', packId: descriptor.packId, detail: 'Pack provides no capabilities' });
  return issues;
}

export function fingerprintPack(descriptor: CapabilityPackDescriptor): string {
  return `${descriptor.packId}@${descriptor.packVersion}:${descriptor.providedCapabilities.join(',')}`;
}

export function detectDuplicateCapabilityProvider(capabilityKey: string): string[] {
  return findProvidersForCapability(capabilityKey).map((p) => p.packId);
}

export function bootstrapCapabilityPackRegistry(packs: readonly CapabilityPackDescriptor[]): void {
  registry.clear();
  for (const pack of [...packs].sort((a, b) => a.packId.localeCompare(b.packId))) {
    registerPack(pack);
  }
}

export function resetCapabilityPackRegistryForTests(): void {
  registry.clear();
}
