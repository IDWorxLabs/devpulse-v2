/**
 * Universal Capability Composition Engine V1 — composition report.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { buildCompositionCoverageContext } from './capability-composition-b9-coverage-integration.js';
import { buildCompositionTraceabilityChains } from './capability-composition-traceability.js';
import { diagnoseCapabilityComposition, detectStaticCompositionShell } from './capability-composition-diagnostics.js';
import type {
  CompositionMaterializationInput,
  UniversalCapabilityCompositionPlan,
} from './universal-capability-composition-types.js';
import {
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
} from './universal-capability-composition-types.js';

export interface CapabilityCompositionReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION;
  readonly source: typeof UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE;
  readonly compositionPlanId: string;
  readonly planFingerprint: string;
  readonly approvedCapabilityRequirements: number;
  readonly nativeRequirements: number;
  readonly packRequirements: number;
  readonly selectedNativeProviders: readonly string[];
  readonly selectedPackProviders: readonly string[];
  readonly rejectedProviders: readonly { readonly providerId: string; readonly reason: string }[];
  readonly unresolvedRequirements: readonly string[];
  readonly optionalDeferredRequirements: readonly string[];
  readonly blockedRequirements: readonly string[];
  readonly dependencyGraph: UniversalCapabilityCompositionPlan['dependencyGraph'];
  readonly installationOrder: readonly string[];
  readonly materializationOrder: readonly string[];
  readonly compatibilityDecisions: UniversalCapabilityCompositionPlan['compatibilityDecisions'];
  readonly configurationStatus: 'RESOLVED' | 'INVALID' | 'PARTIAL';
  readonly securityDecisions: readonly string[];
  readonly contributionAllowlistCount: number;
  readonly collisions: UniversalCapabilityCompositionPlan['collisionDecisions'];
  readonly verificationRequirementCount: number;
  readonly productionReadiness: UniversalCapabilityCompositionPlan['productionReadiness'];
  readonly traceabilityCoverage: number;
  readonly engineeringFindings: readonly string[];
  readonly b9CoverageContext: ReturnType<typeof buildCompositionCoverageContext>;
}

export function buildCapabilityCompositionReport(input: {
  plan: UniversalCapabilityCompositionPlan;
  envelope: ApprovedProductionBuildEnvelope;
  materializationInput?: CompositionMaterializationInput;
}): CapabilityCompositionReport {
  const { plan } = input;
  const nativeKeys = new Set([
    'crud.entity-management',
    'actions.materialization',
    'workflows.state-machine',
    'relationships.intelligence',
    'runtime.state-coordination',
    'rules.business-evaluation',
  ]);

  const rejectedProviders = plan.providerAlternatives
    .filter((c) => !c.selected && c.rejectionReason)
    .map((c) => ({ providerId: c.providerId, reason: c.rejectionReason! }));

  const diagnostics = [
    ...diagnoseCapabilityComposition(plan),
    ...detectStaticCompositionShell(plan),
  ];

  const configInvalid = plan.compatibilityDecisions.some((d) => !d.passed);
  const traceability = buildCompositionTraceabilityChains(plan);

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
    source: UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
    compositionPlanId: plan.compositionPlanId,
    planFingerprint: plan.planFingerprint,
    approvedCapabilityRequirements: plan.capabilityRequirements.length,
    nativeRequirements: plan.capabilityRequirements.filter((r) => nativeKeys.has(r.capabilityKey)).length,
    packRequirements: plan.capabilityRequirements.filter((r) => !nativeKeys.has(r.capabilityKey)).length,
    selectedNativeProviders: plan.nativeCapabilityProviders.map((p) => p.providerId),
    selectedPackProviders: plan.selectedCapabilityPacks.map((p) => p.packId),
    rejectedProviders,
    unresolvedRequirements: plan.unresolvedRequirements,
    optionalDeferredRequirements: plan.optionalDeferredRequirements,
    blockedRequirements: plan.blockedRequirements,
    dependencyGraph: plan.dependencyGraph,
    installationOrder: plan.installationOrder,
    materializationOrder: plan.materializationOrder,
    compatibilityDecisions: plan.compatibilityDecisions,
    configurationStatus: configInvalid ? 'INVALID' : 'RESOLVED',
    securityDecisions: plan.compatibilityDecisions.filter((d) => d.code.includes('security')).map((d) => d.detail),
    contributionAllowlistCount: plan.contributionAllowlist.length,
    collisions: plan.collisionDecisions,
    verificationRequirementCount: plan.verificationRequirements.length,
    productionReadiness: plan.productionReadiness,
    traceabilityCoverage: traceability.length,
    engineeringFindings: diagnostics.map((d) => `${d.code}:${d.detail}`),
    b9CoverageContext: buildCompositionCoverageContext(plan),
  };
}
