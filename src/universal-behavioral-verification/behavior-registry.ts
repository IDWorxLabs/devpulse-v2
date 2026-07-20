/**
 * Universal Behavioral Verification Engine V1 — canonical behavior registry.
 */

import type { UniversalBehaviorDescriptor } from './universal-behavior-types.js';
import { fingerprintBehavior } from './universal-behavior-types.js';

const registry = new Map<string, UniversalBehaviorDescriptor>();

export function registerBehavior(descriptor: UniversalBehaviorDescriptor): void {
  if (registry.has(descriptor.behaviorId)) {
    throw new Error(`Duplicate behavior ID rejected: ${descriptor.behaviorId}`);
  }
  registry.set(descriptor.behaviorId, descriptor);
}

export function unregisterBehavior(behaviorId: string): boolean {
  return registry.delete(behaviorId);
}

export function listBehaviors(): UniversalBehaviorDescriptor[] {
  return [...registry.values()].sort((a, b) => a.behaviorId.localeCompare(b.behaviorId));
}

export function lookupBehavior(behaviorId: string): UniversalBehaviorDescriptor | null {
  return registry.get(behaviorId) ?? null;
}

export function validateBehavior(descriptor: UniversalBehaviorDescriptor): readonly string[] {
  const issues: string[] = [];
  if (!descriptor.behaviorId.trim()) issues.push('missing_behavior_id');
  if (!descriptor.sourceEnvelopePath.trim()) issues.push('missing_envelope_path');
  if (!descriptor.normalizedKey.trim()) issues.push('missing_normalized_key');
  if (descriptor.fingerprint !== fingerprintBehavior({ ...descriptor, fingerprint: '' })) {
    issues.push('fingerprint_mismatch');
  }
  return issues;
}

export function fingerprintBehaviorDescriptor(descriptor: UniversalBehaviorDescriptor): string {
  return fingerprintBehavior(descriptor);
}

export function detectDuplicates(descriptors: readonly UniversalBehaviorDescriptor[]): readonly string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const d of descriptors) {
    const fp = fingerprintBehavior(d);
    if (seen.has(fp)) duplicates.push(`${d.behaviorId}|${seen.get(fp)}`);
    else seen.set(fp, d.behaviorId);
  }
  return duplicates;
}

export function detectMissingVerification(
  descriptors: readonly UniversalBehaviorDescriptor[],
  verifiedIds: ReadonlySet<string>,
): readonly string[] {
  return descriptors
    .filter((d) => d.supportClassification === 'EXECUTABLE' && d.criticality === 'REQUIRED')
    .filter((d) => !verifiedIds.has(d.behaviorId))
    .map((d) => d.behaviorId);
}

export function inspectDependencies(descriptor: UniversalBehaviorDescriptor): readonly string[] {
  return [...descriptor.runtimeRequirements];
}

export function bootstrapBehaviorRegistry(descriptors: readonly UniversalBehaviorDescriptor[]): void {
  registry.clear();
  for (const d of descriptors) registerBehavior(d);
}

export function resetBehaviorRegistryForTests(): void {
  registry.clear();
}

export function registerBehaviors(descriptors: readonly UniversalBehaviorDescriptor[]): void {
  for (const d of descriptors) registerBehavior(d);
}
