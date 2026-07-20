/**
 * Universal Capability Coverage Intelligence V1 — traceability chains.
 */

import type {
  CapabilityTraceabilityChain,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';

export function buildCapabilityTraceabilityChain(
  descriptor: UniversalCapabilityDescriptor,
): CapabilityTraceabilityChain {
  return {
    capabilityKey: descriptor.capabilityKey,
    approvedRequirementPath: descriptor.provenance.find((p) => p.includes('envelope') || p.includes('canonical')) ?? descriptor.provenance[descriptor.provenance.length - 1] ?? 'unknown',
    generatorAuthority: descriptor.providedBy,
    packId: descriptor.supportingPacks[0] ?? null,
    runtimeArtifactPath: descriptor.milestoneChecks.find((c) => c.milestoneId.startsWith('runtime.'))?.milestoneId.replace('runtime.', '') ?? null,
    behaviorEvidenceId: descriptor.verificationEvidence[0] ?? null,
    coverageFingerprint: descriptor.fingerprint,
  };
}

export function buildCapabilityTraceabilityChains(
  capabilities: readonly UniversalCapabilityDescriptor[],
): CapabilityTraceabilityChain[] {
  return capabilities.map(buildCapabilityTraceabilityChain).sort((a, b) => a.capabilityKey.localeCompare(b.capabilityKey));
}

export function traceabilityIsComplete(chain: CapabilityTraceabilityChain): boolean {
  return chain.generatorAuthority.length > 0 && chain.coverageFingerprint.length > 0;
}
