/**
 * Universal Capability Composition Engine V1 — B9 coverage integration.
 */

import type { UniversalCapabilityCompositionPlan } from './universal-capability-composition-types.js';
import { UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE } from './universal-capability-composition-types.js';

export interface CompositionCoverageContext {
  readonly compositionPlanId: string;
  readonly planFingerprint: string;
  readonly approvedRequirementIds: readonly string[];
  readonly selectedProviderIds: readonly string[];
  readonly unresolvedRequirementIds: readonly string[];
  readonly blockedRequirementIds: readonly string[];
  readonly expectedMaturity: readonly string[];
}

export function buildCompositionCoverageContext(
  plan: UniversalCapabilityCompositionPlan,
): CompositionCoverageContext {
  const selectedProviderIds = [
    ...plan.nativeCapabilityProviders.map((p) => p.providerId),
    ...plan.selectedCapabilityPacks.map((p) => p.packId),
  ].sort();

  return {
    compositionPlanId: plan.compositionPlanId,
    planFingerprint: plan.planFingerprint,
    approvedRequirementIds: plan.capabilityRequirements.map((r) => r.requirementId),
    selectedProviderIds,
    unresolvedRequirementIds: plan.unresolvedRequirements,
    blockedRequirementIds: plan.blockedRequirements,
    expectedMaturity: plan.providerAssignments
      .filter((a) => a.outcome === 'SATISFIED')
      .map((a) => `${a.capabilityKey}:PRODUCTION_READY`),
  };
}

/**
 * Provider-identity reconciliation between B9 (capability coverage) and B10 (composition).
 *
 * The two subsystems name the same native engine providers differently: the coverage engine
 * labels them with `B<n>_UNIVERSAL_*_ENGINE` (its historical provenance tags), while the
 * composition engine's authoritative registry uses `native.universal-*.v1` provider ids. They
 * denote the SAME provider. Without this map, a coverage capability whose `providedBy` is a
 * `B<n>_*` id can never be found among the composition-selected `native.*` ids, producing a false
 * `capability_coverage_inflated` readiness blocker for every native engine on every build. This is
 * a pure identity alias — it changes no threshold and asserts no new coverage; it only lets the
 * two id spaces recognize each other (No Parallel Truth).
 *
 * The map covers the six requirement-satisfying native engines (B1–B6) plus the two always-present
 * meta-engines: behavioral verification (B8) and capability coverage (B9). The meta-engines are
 * not requirement providers — they participate in every plan through the authoritative composition
 * phases (VERIFICATION / COVERAGE), so `providerSelectedByComposition` also consults those phases.
 */
const COVERAGE_ENGINE_PROVIDER_ALIASES: Readonly<Record<string, string>> = {
  B1_UNIVERSAL_CRUD_GENERATION_ENGINE: 'native.universal-crud-generation-engine.v1',
  B2_UNIVERSAL_ACTION_MATERIALIZATION_ENGINE: 'native.universal-action-materialization-engine.v1',
  B3_UNIVERSAL_WORKFLOW_GENERATION_ENGINE: 'native.universal-workflow-generation-engine.v1',
  B4_UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE: 'native.universal-relationship-intelligence-engine.v1',
  B5_UNIVERSAL_RUNTIME_STATE_ENGINE: 'native.universal-runtime-state-engine.v1',
  B6_UNIVERSAL_BUSINESS_RULE_ENGINE: 'native.universal-business-rule-engine.v1',
  B8_UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE: 'native.universal-behavioral-verification-engine.v1',
  B9_UNIVERSAL_CAPABILITY_COVERAGE_ENGINE: 'native.universal-capability-coverage-intelligence.v1',
};

export function canonicalCompositionProviderId(providerId: string): string {
  return COVERAGE_ENGINE_PROVIDER_ALIASES[providerId] ?? providerId;
}

export function providerSelectedByComposition(
  plan: UniversalCapabilityCompositionPlan,
  providerId: string,
): boolean {
  // Authoritative selected-provider surface: requirement-satisfying native providers + selected
  // packs (from the coverage context) PLUS every provider carried by the composition phases. The
  // phases include the always-present meta-engines (VERIFICATION / COVERAGE / REPORTING) that are
  // part of every plan but are not requirement providers, so they never appear in
  // `nativeCapabilityProviders`. Consulting the phases lets their coverage capabilities reconcile.
  const selected = new Set<string>(buildCompositionCoverageContext(plan).selectedProviderIds);
  for (const phase of plan.compositionPhases) {
    for (const id of phase.providerIds) selected.add(id);
  }
  if (selected.has(providerId)) return true;
  const alias = COVERAGE_ENGINE_PROVIDER_ALIASES[providerId];
  return alias ? selected.has(alias) : false;
}

export function coveragePlanMatchesComposition(input: {
  compositionSelectedProviders: readonly string[];
  coverageCountedProviders: readonly string[];
}): boolean {
  return input.coverageCountedProviders.every((p) => input.compositionSelectedProviders.includes(p));
}

export function filterUnselectedCoverageProviders(input: {
  compositionSelectedProviders: readonly string[];
  coverageCountedProviders: readonly string[];
}): string[] {
  const selected = new Set(input.compositionSelectedProviders);
  return input.coverageCountedProviders.filter((p) => !selected.has(p));
}

export const B9_COVERAGE_INTEGRATION_SOURCE = UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE;
