/**
 * Universal Capability Composition Engine V1 — materialization control.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { materializeSelectedPacks } from '../universal-capability-pack-framework/capability-pack-materializer.js';
import type { CapabilityCompositionPlan } from '../universal-capability-pack-framework/universal-capability-pack-types.js';
import { requireUniversalCapabilityCompositionPlan } from './capability-composition-plan-validator.js';
import { validateContributionWithinBoundary } from './capability-composition-boundary-validator.js';
import type {
  CompositionMaterializationInput,
  CompositionMaterializationReport,
  UniversalCapabilityCompositionPlan,
} from './universal-capability-composition-types.js';
import {
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE,
  UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
} from './universal-capability-composition-types.js';
import { reconcilePlannedVsActual } from './capability-composition-reconciliation.js';
import { buildCapabilityCompositionReport } from './capability-composition-report.js';
import { envelopeFingerprint } from './capability-composition-requirement-loader.js';

export function toB7CapabilityCompositionPlan(
  plan: UniversalCapabilityCompositionPlan,
): CapabilityCompositionPlan {
  return {
    readOnly: true,
    fingerprint: plan.planFingerprint,
    requirements: plan.capabilityRequirements,
    satisfiedByB1B6: plan.providerAssignments
      .filter((a) => a.providerKind === 'NATIVE' && a.outcome === 'SATISFIED')
      .map((a) => a.requirementId),
    selectedPacks: plan.selectedCapabilityPacks,
    dependencyOrder: plan.installationOrder,
    resolutions: plan.providerAssignments.map((a) => ({
      requirementId: a.requirementId,
      capabilityKey: a.capabilityKey,
      outcome: a.outcome === 'SATISFIED' ? 'SATISFIED' : a.outcome === 'BLOCKED' ? 'BLOCKED_BY_MISSING_PACK' : 'INFORMATIONAL',
      selectedPackId: a.packId,
      candidates: a.candidates.map((c) => ({
        packId: c.packId ?? c.providerId,
        packVersion: c.version,
        supportStatus: (c.supportStatus ?? 'PRODUCTION_READY') as 'PRODUCTION_READY',
        selected: c.selected,
        rejectionReason: c.rejectionReason,
      })),
      provenance: a.provenance,
    })),
    unresolvedRequirements: plan.unresolvedRequirements,
    blockedRequirements: plan.blockedRequirements,
    lifecycleStage: plan.productionReadiness === 'PRODUCTION_READY' ? 'CONFIGURED' : 'BLOCKED',
    provenance: plan.provenance,
  };
}

export function requireCompositionPlanForMaterialization(
  plan: UniversalCapabilityCompositionPlan | null | undefined,
): UniversalCapabilityCompositionPlan {
  return requireUniversalCapabilityCompositionPlan(plan);
}

export function isProviderApprovedForMaterialization(
  plan: UniversalCapabilityCompositionPlan,
  providerId: string,
): boolean {
  return plan.materializationOrder.includes(providerId) ||
    plan.nativeCapabilityProviders.some((p) => p.providerId === providerId) ||
    plan.selectedCapabilityPacks.some((p) => p.packId === providerId);
}

export function validateFileContributionApproved(
  plan: UniversalCapabilityCompositionPlan,
  relativePath: string,
  providerId: string,
): boolean {
  const boundary = plan.contributionBoundaries.find((b) => b.providerId === providerId);
  if (!boundary) return false;
  return validateContributionWithinBoundary(boundary, { path: relativePath });
}

export function materializeApprovedPackContributions(
  plan: UniversalCapabilityCompositionPlan,
): GeneratedWorkspaceFile[] {
  requireCompositionPlanForMaterialization(plan);
  if (plan.selectedCapabilityPacks.length === 0) return [];
  const b7Plan = toB7CapabilityCompositionPlan(plan);
  return materializeSelectedPacks(b7Plan).files;
}

export function buildCompositionSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/universal-capability-composition-engine/runtime-marker.ts',
      content: `/** ${UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE} */
export const UNIVERSAL_CAPABILITY_COMPOSITION_MARKER = '${UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_SOURCE}' as const;
export const UNIVERSAL_CAPABILITY_COMPOSITION_VERSION = '${UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION}';
`,
    },
  ];
}

export function augmentWorkspaceFilesWithCapabilityComposition(
  workspaceFiles: GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  plan: UniversalCapabilityCompositionPlan,
  input: CompositionMaterializationInput,
): { files: GeneratedWorkspaceFile[]; report: CompositionMaterializationReport } {
  requireCompositionPlanForMaterialization(plan);

  if (plan.approvedEnvelopeFingerprint !== envelopeFingerprint(envelope)) {
    throw new Error('envelope_fingerprint_mismatch');
  }

  let files = [...workspaceFiles, ...buildCompositionSharedRuntimeFiles()];

  const packsAlreadyMaterialized = workspaceFiles.some((f) =>
    f.relativePath.startsWith('src/universal-capability-packs/') &&
    f.relativePath.endsWith('registry.ts'),
  );
  if (
    plan.nativeEngineEligibility.capabilityPacks &&
    plan.selectedCapabilityPacks.length > 0 &&
    !packsAlreadyMaterialized
  ) {
    files = [...files, ...materializeApprovedPackContributions(plan)];
  }

  const reportPayload = buildCapabilityCompositionReport({ plan, envelope, input });
  files.push({
    relativePath: 'src/universal-capability-composition-engine/capability-composition-plan.json',
    content: `${JSON.stringify(plan, null, 2)}\n`,
  });
  files.push({
    relativePath: 'src/universal-capability-composition-engine/capability-composition-report.json',
    content: `${JSON.stringify(reportPayload, null, 2)}\n`,
  });

  const reconciliation = reconcilePlannedVsActual({
    plan,
    workspaceFiles: files,
    executedProviderIds: plan.materializationOrder.filter((id) =>
      isProviderApprovedForMaterialization(plan, id),
    ),
  });

  return {
    files,
    report: {
      readOnly: true,
      engineVersion: UNIVERSAL_CAPABILITY_COMPOSITION_ENGINE_VERSION,
      plan,
      reconciliation,
    },
  };
}

export function shouldMaterializeCapabilityComposition(
  envelope?: ApprovedProductionBuildEnvelope | null,
): boolean {
  return envelope !== undefined && envelope !== null;
}
