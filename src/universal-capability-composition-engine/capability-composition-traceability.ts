/**
 * Universal Capability Composition Engine V1 — end-to-end traceability chains.
 */

import type { UniversalCapabilityCompositionPlan } from './universal-capability-composition-types.js';
import { UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE } from './universal-capability-composition-types.js';

export interface CompositionTraceabilityChain {
  readonly traceId: string;
  readonly requirementId: string;
  readonly capabilityKey: string;
  readonly providerId: string;
  readonly contributionIds: readonly string[];
  readonly verificationScenarioId: string | null;
  readonly coverageExpectation: string | null;
  readonly provenance: readonly string[];
}

export function buildCompositionTraceabilityChains(
  plan: UniversalCapabilityCompositionPlan,
): CompositionTraceabilityChain[] {
  return plan.providerAssignments
    .filter((a) => a.outcome === 'SATISFIED')
    .map((assignment) => {
      const contributions = plan.contributionAllowlist
        .filter((c) => c.providerId === assignment.providerId)
        .map((c) => c.contributionId);
      const verification = plan.verificationRequirements.find(
        (v) => v.capabilityKey === assignment.capabilityKey,
      );
      return {
        traceId: `trace-${assignment.requirementId}`,
        requirementId: assignment.requirementId,
        capabilityKey: assignment.capabilityKey,
        providerId: assignment.providerId,
        contributionIds: contributions,
        verificationScenarioId: verification?.scenarioId ?? null,
        coverageExpectation: `${assignment.capabilityKey}:PRODUCTION_READY`,
        provenance: [
          UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
          assignment.requirementId,
          assignment.providerId,
        ],
      };
    })
    .sort((a, b) => a.traceId.localeCompare(b.traceId));
}

export function traceabilityCoverageComplete(chains: readonly CompositionTraceabilityChain[]): boolean {
  return chains.every((c) => c.providerId.length > 0 && c.requirementId.length > 0);
}
