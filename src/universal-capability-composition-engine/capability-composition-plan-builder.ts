/**
 * Universal Capability Composition Engine V1 — immutable composition plan builder.
 */

import { bootstrapCapabilityPackRegistry } from '../universal-capability-pack-framework/capability-pack-registry.js';
import { buildAllPackDescriptors } from '../universal-capability-pack-framework/capability-pack-descriptor-builder.js';
import { mergePackConfiguration } from '../universal-capability-pack-framework/capability-pack-configuration.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import type { CapabilityPackMaterializationInput } from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import { assignProvidersForRequirements } from './capability-provider-assignment.js';
import { buildCompositionDependencyGraph } from './capability-composition-dependency-graph.js';
import { buildCompositionPhases, buildMaterializationOrder } from './capability-composition-ordering.js';
import { validateCompositionCompatibility } from './capability-composition-compatibility-validator.js';
import { resolveCompositionConfiguration } from './capability-composition-configuration-resolver.js';
import { validateCompositionSecurity } from './capability-composition-security-validator.js';
import { buildContributionAllowlist } from './capability-composition-contribution-allowlist.js';
import { buildContributionBoundaries } from './capability-composition-boundary-validator.js';
import { detectCompositionCollisions } from './capability-composition-collision-detector.js';
import { resolveCompositionCollisions, hasUnresolvedCriticalCollisions } from './capability-composition-collision-resolver.js';
import { fingerprintUniversalCapabilityCompositionPlan } from './capability-composition-plan-fingerprint.js';
import {
  envelopeFingerprint,
  loadAllCapabilityRequirements,
} from './capability-composition-requirement-loader.js';
import {
  listNativeCapabilityProviders,
  NATIVE_PROVIDER_IDS,
} from './native-capability-provider-registry.js';
import type {
  CompositionPlanBuildInput,
  CompositionProductionReadiness,
  UniversalCapabilityCompositionPlan,
} from './universal-capability-composition-types.js';
import {
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
} from './universal-capability-composition-types.js';
import { buildCompositionVerificationRequirements } from './capability-composition-b8-verification-plan.js';

let registryBootstrapped = false;

function ensurePackRegistry(): void {
  if (!registryBootstrapped) {
    bootstrapCapabilityPackRegistry(buildAllPackDescriptors());
    registryBootstrapped = true;
  }
}

export function resetCompositionEngineForTests(): void {
  registryBootstrapped = false;
}

export function buildUniversalCapabilityCompositionPlan(
  input: CompositionPlanBuildInput,
  materializationInput: CapabilityPackMaterializationInput,
): UniversalCapabilityCompositionPlan {
  ensurePackRegistry();

  const requirements = loadAllCapabilityRequirements(input);
  const assignment = assignProvidersForRequirements(requirements);

  const validPackIds = assignment.selectedPackIds.filter((packId) => {
    const pack = getPack(packId);
    return pack !== undefined && pack.supportStatus !== 'NOT_IMPLEMENTED';
  });

  const dependencyGraph = buildCompositionDependencyGraph({
    selectedPackIds: validPackIds,
    selectedNativeProviderIds: assignment.selectedNativeProviderIds,
    requirementIds: requirements.map((r) => r.requirementId),
  });

  const configResult = resolveCompositionConfiguration({ selectedPackIds: validPackIds });
  const compatibilityDecisions = validateCompositionCompatibility({
    selectedPackIds: validPackIds,
    materializationInput,
    envelopeFingerprint: envelopeFingerprint(input.envelope),
  });
  const security = validateCompositionSecurity({
    requirements,
    selectedPackIds: validPackIds,
  });

  const rawCollisions = detectCompositionCollisions({
    selectedPackIds: validPackIds,
    moduleIds: input.moduleIds,
  });
  const collisionDecisions = resolveCompositionCollisions(rawCollisions);

  const selectedNativeProviders = listNativeCapabilityProviders().filter((p) =>
    assignment.selectedNativeProviderIds.includes(p.providerId),
  );

  const selectedCapabilityPacks = validPackIds.map((packId) => {
    const pack = getPack(packId)!;
    return {
      packId,
      packVersion: pack.packVersion,
      configuration: mergePackConfiguration(pack),
    };
  });

  const compositionPhases = buildCompositionPhases({
    selectedNativeProviderIds: assignment.selectedNativeProviderIds,
    selectedPackIds: validPackIds,
  });

  const materializationOrder = buildMaterializationOrder({
    installationOrder: dependencyGraph.installationOrder,
    selectedNativeProviderIds: assignment.selectedNativeProviderIds,
    selectedPackIds: validPackIds,
  });

  const contributionAllowlist = buildContributionAllowlist({
    selectedNativeProviderIds: assignment.selectedNativeProviderIds,
    selectedPackIds: validPackIds,
    moduleIds: input.moduleIds,
  });

  const contributionBoundaries = buildContributionBoundaries({
    selectedNativeProviderIds: assignment.selectedNativeProviderIds,
    selectedPackIds: validPackIds,
    moduleIds: input.moduleIds,
  });

  const envFp = envelopeFingerprint(input.envelope);
  const compositionPlanId = `composition-${input.envelope.traceability.contractId}-${input.envelope.traceability.buildId ?? 'build'}`;

  const nativeEngineEligibility = {
    crud: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.CRUD),
    actions: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.ACTION),
    workflows: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.WORKFLOW),
    relationships: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.RELATIONSHIP),
    runtime: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.RUNTIME),
    businessRules: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.RULE),
    capabilityPacks: validPackIds.length > 0 && assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.CRUD),
    behavioralVerification:
      assignment.selectedNativeProviderIds.length > 0 || validPackIds.length > 0,
    capabilityCoverage:
      assignment.selectedNativeProviderIds.length > 0 || validPackIds.length > 0,
  };

  const verificationRequirements = buildCompositionVerificationRequirements({
    providerAssignments: assignment.assignments,
    moduleIds: input.moduleIds,
  });

  let productionReadiness: CompositionProductionReadiness = 'PRODUCTION_READY';
  if (assignment.blockedRequirements.length > 0) {
    productionReadiness = 'BLOCKED_BY_REQUIRED_CAPABILITY';
  } else if (dependencyGraph.issues.length > 0) {
    productionReadiness = 'BLOCKED_BY_DEPENDENCY';
  } else if (configResult.issues.length > 0) {
    productionReadiness = 'BLOCKED_BY_CONFIGURATION';
  } else if (compatibilityDecisions.some((d) => !d.passed) || !security.passed) {
    productionReadiness = 'BLOCKED_BY_COMPATIBILITY';
  } else if (hasUnresolvedCriticalCollisions(collisionDecisions)) {
    productionReadiness = 'BLOCKED_BY_COLLISION';
  } else if (assignment.unresolvedRequirements.length > 0) {
    productionReadiness = 'PARTIALLY_READY';
  }

  const planWithoutFingerprint: Omit<UniversalCapabilityCompositionPlan, 'planFingerprint'> = {
    readOnly: true,
    compositionPlanId,
    compositionVersion: UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
    approvedEnvelopeFingerprint: envFp,
    approvedProductIdentity: input.envelope.approvedProductIdentity.displayName,
    capabilityRequirements: requirements,
    nativeCapabilityProviders: selectedNativeProviders,
    selectedCapabilityPacks,
    providerAssignments: assignment.assignments,
    providerAlternatives: assignment.assignments.flatMap((a) => a.candidates.filter((c) => !c.selected)),
    dependencyGraph,
    installationOrder: dependencyGraph.installationOrder,
    materializationOrder,
    compositionPhases,
    compatibilityDecisions,
    configurationBindings: configResult.bindings,
    contributionAllowlist,
    contributionBoundaries,
    routes: input.moduleIds.map((m) => `/features/${m}`),
    navigationEntries: input.moduleIds.map((m) => `nav:${m}`),
    runtimeScopes: assignment.selectedNativeProviderIds.map((id) => `runtime.${id}`),
    persistenceScopes: assignment.selectedNativeProviderIds.includes(NATIVE_PROVIDER_IDS.CRUD)
      ? ['persistence.entity']
      : [],
    actions: input.moduleIds.map((m) => `${m}.action`),
    workflows: input.moduleIds.map((m) => `${m}.workflow`),
    relationships: input.moduleIds.map((m) => `${m}.relationship`),
    businessRules: input.moduleIds.map((m) => `${m}.rule`),
    verificationRequirements,
    unresolvedRequirements: assignment.unresolvedRequirements,
    blockedRequirements: assignment.blockedRequirements,
    optionalDeferredRequirements: assignment.optionalDeferredRequirements,
    collisionDecisions,
    productionReadiness,
    provenance: [
      UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
      input.envelope.traceability.contractId,
      materializationInput.buildId,
    ],
    createdFromPipelineState: input.envelope.pipelineState.currentState,
    nativeEngineEligibility,
  };

  const planFingerprint = fingerprintUniversalCapabilityCompositionPlan(planWithoutFingerprint);

  return Object.freeze({
    ...planWithoutFingerprint,
    planFingerprint,
  }) as UniversalCapabilityCompositionPlan;
}
