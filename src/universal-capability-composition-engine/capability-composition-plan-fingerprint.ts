/**
 * Universal Capability Composition Engine V1 — deterministic plan fingerprinting.
 */

import type { UniversalCapabilityCompositionPlan } from './universal-capability-composition-types.js';

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(stableSerialize).join(',');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .map((k) => `${k}=${stableSerialize(obj[k])}`)
      .join('&');
  }
  return String(value);
}

export function fingerprintUniversalCapabilityCompositionPlan(
  plan: Omit<UniversalCapabilityCompositionPlan, 'planFingerprint'>,
): string {
  const parts = [
    plan.approvedEnvelopeFingerprint,
    plan.compositionPlanId,
    plan.compositionVersion,
    ...plan.capabilityRequirements.map((r) => r.requirementId).sort(),
    ...plan.providerAssignments.map((a) => `${a.requirementId}:${a.providerId}:${a.outcome}`).sort(),
    ...plan.selectedCapabilityPacks.map((p) => `${p.packId}@${p.packVersion}`).sort(),
    ...plan.nativeCapabilityProviders.map((p) => p.providerId).sort(),
    ...plan.installationOrder,
    ...plan.materializationOrder,
    stableSerialize(plan.configurationBindings),
    ...plan.collisionDecisions.map((c) => `${c.collisionCode}:${c.policy}`).sort(),
    plan.productionReadiness,
  ];
  return parts.join('|');
}

export function validatePlanFingerprint(plan: UniversalCapabilityCompositionPlan): boolean {
  const expected = fingerprintUniversalCapabilityCompositionPlan(plan);
  return plan.planFingerprint === expected;
}

export function planFingerprintDrift(
  original: UniversalCapabilityCompositionPlan,
  mutated: UniversalCapabilityCompositionPlan,
): boolean {
  return (
    original.planFingerprint !== mutated.planFingerprint ||
    !validatePlanFingerprint(mutated)
  );
}
