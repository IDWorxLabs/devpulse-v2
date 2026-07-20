/**
 * Universal Capability Composition Engine V1 — orchestrator.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { CapabilityPackMaterializationInput } from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import { buildUniversalCapabilityCompositionPlan, resetCompositionEngineForTests } from './capability-composition-plan-builder.js';
import {
  augmentWorkspaceFilesWithCapabilityComposition,
  buildCompositionSharedRuntimeFiles,
  requireCompositionPlanForMaterialization,
  shouldMaterializeCapabilityComposition,
  isProviderApprovedForMaterialization,
  toB7CapabilityCompositionPlan,
} from './capability-composition-materialization-controller.js';
import { envelopeFingerprint, loadAllCapabilityRequirements } from './capability-composition-requirement-loader.js';
import type { CompositionPlanBuildInput, CompositionMaterializationInput } from './universal-capability-composition-types.js';

export function buildCompositionMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  contractId: string;
  compositionPlan: ReturnType<typeof buildUniversalCapabilityCompositionPlan>;
  rawPrompt?: string;
}): CompositionMaterializationInput {
  return {
    envelope: input.envelope,
    appTitle: input.appTitle,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
  };
}

export function buildCapabilityPackMaterializationInputFromCompositionPlan(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  plan: ReturnType<typeof buildUniversalCapabilityCompositionPlan>;
  rawPrompt?: string;
}): CapabilityPackMaterializationInput {
  const { plan } = input;
  return {
    appTitle: input.appTitle,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
    moduleIds: input.moduleIds,
    crudBacked: plan.nativeEngineEligibility.crud,
    actionBacked: plan.nativeEngineEligibility.actions,
    workflowBacked: plan.nativeEngineEligibility.workflows,
    relationshipBacked: plan.nativeEngineEligibility.relationships,
    runtimeBacked: plan.nativeEngineEligibility.runtime,
    ruleBacked: plan.nativeEngineEligibility.businessRules,
    rawPrompt: input.rawPrompt,
  };
}

export function runUniversalCapabilityComposition(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  moduleEligibility: CompositionPlanBuildInput['moduleEligibility'];
  rawPrompt?: string;
}): ReturnType<typeof buildUniversalCapabilityCompositionPlan> {
  const preliminaryInput: CapabilityPackMaterializationInput = {
    appTitle: input.appTitle,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
    moduleIds: input.moduleIds,
    crudBacked: input.moduleIds.some((m) => input.moduleEligibility.crudByModule[m]),
    actionBacked: input.moduleIds.some((m) => input.moduleEligibility.actionByModule[m]),
    workflowBacked: input.moduleIds.some((m) => input.moduleEligibility.workflowByModule[m]),
    relationshipBacked: input.moduleIds.some((m) => input.moduleEligibility.actionByModule[m]),
    runtimeBacked: input.moduleIds.some((m) => input.moduleEligibility.runtimeByModule[m]),
    ruleBacked: input.moduleIds.some((m) => input.moduleEligibility.ruleByModule[m]),
  };

  return buildUniversalCapabilityCompositionPlan(
    {
      envelope: input.envelope,
      appTitle: input.appTitle,
      moduleIds: input.moduleIds,
      moduleEligibility: input.moduleEligibility,
    },
    preliminaryInput,
  );
}

export {
  buildUniversalCapabilityCompositionPlan,
  resetCompositionEngineForTests,
  augmentWorkspaceFilesWithCapabilityComposition,
  buildCompositionSharedRuntimeFiles,
  requireCompositionPlanForMaterialization,
  shouldMaterializeCapabilityComposition,
  isProviderApprovedForMaterialization,
  toB7CapabilityCompositionPlan,
  envelopeFingerprint,
  loadAllCapabilityRequirements,
};

export {
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
} from './universal-capability-composition-types.js';

export { isUniversalCapabilityCompositionPlanValid, requireUniversalCapabilityCompositionPlan } from './capability-composition-plan-validator.js';
export { fingerprintUniversalCapabilityCompositionPlan, validatePlanFingerprint, planFingerprintDrift } from './capability-composition-plan-fingerprint.js';
export { assignProvidersForRequirements } from './capability-provider-assignment.js';
export { listNativeCapabilityProviders, NATIVE_PROVIDER_IDS, NATIVE_CAPABILITY_KEYS } from './native-capability-provider-registry.js';
export { buildCompositionVerificationRequirements, verificationPlanMatchesComposition } from './capability-composition-b8-verification-plan.js';
export { buildCompositionCoverageContext, providerSelectedByComposition, coveragePlanMatchesComposition } from './capability-composition-b9-coverage-integration.js';
export { reconcilePlannedVsActual, reconciliationPassed } from './capability-composition-reconciliation.js';
export { buildCapabilityCompositionReport } from './capability-composition-report.js';
export { diagnoseCapabilityComposition, detectParallelCompositionTruth, detectStaticCompositionShell } from './capability-composition-diagnostics.js';
export { buildCompositionTraceabilityChains, traceabilityCoverageComplete } from './capability-composition-traceability.js';
