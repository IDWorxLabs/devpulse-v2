/** Status surface — canonical BuildOutcome projection only. */
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  blockedProjectionContainsNoSuccessWording,
  projectBuildStatusFromBuildOutcome,
  resolveBuildContextOutcome,
} from '../build-context-integrity/index.js';
import type { BuildContextIntegrityReport, BuildOutcome, BuildStatusProjection } from '../build-context-integrity/build-context-types.js';
import type { ContractToModuleTraceabilityReport } from '../contract-to-module-traceability/contract-to-module-traceability-types.js';

export function resolveProductionSurfaceBuildOutcome(input: {
  readonly gpcaHardStop?: boolean;
  readonly gpcaBlockedMaterialization?: boolean;
  readonly gpcaBlockedPreviewActivation?: boolean;
  readonly traceabilityReport?: Pick<ContractToModuleTraceabilityReport, 'complianceOutcome' | 'buildOutcome'> | null;
  readonly buildContextReport?: Pick<BuildContextIntegrityReport, 'complianceOutcome'> | null;
  readonly failed?: boolean;
}): BuildOutcome {
  if (input.gpcaHardStop || input.gpcaBlockedMaterialization || input.gpcaBlockedPreviewActivation) {
    return resolveBuildContextOutcome({ gpcaBlocked: true });
  }
  if (input.traceabilityReport && input.traceabilityReport.complianceOutcome !== 'TRACEABILITY_COMPLIANT') {
    return resolveBuildContextOutcome({ traceabilityBlocked: true });
  }
  return resolveBuildContextOutcome({
    buildContextReport: input.buildContextReport ?? null,
    failed: input.failed,
  });
}

export function resolveProductionSurfaceBuildOutcomeFromResult(
  result: Pick<
    OnePromptLivePreviewBuildResult,
    'gpcaHardStop' | 'gpcaBlockedMaterialization' | 'gpcaBlockedPreviewActivation' | 'status' | 'npmBuildOk'
  >,
): BuildOutcome {
  if (result.gpcaHardStop || result.gpcaBlockedMaterialization || result.gpcaBlockedPreviewActivation) {
    return 'BUILD_BLOCKED_GPCA';
  }
  if (result.status === 'FAILED' || result.status === 'ABORTED') {
    return 'BUILD_FAILED';
  }
  if (result.status === 'READY' && result.npmBuildOk) {
    return 'BUILD_SUCCEEDED';
  }
  if (result.status === 'READY') {
    return 'BUILD_SUCCEEDED';
  }
  return 'BUILD_FAILED';
}

export function projectProductionSurfaceStatus(outcome: BuildOutcome): BuildStatusProjection {
  return projectBuildStatusFromBuildOutcome(outcome);
}

export function blockedStatusContainsNoIndependentSuccessWording(projection: BuildStatusProjection): boolean {
  return blockedProjectionContainsNoSuccessWording(projection);
}

export function rejectIndependentStatusComputation(sourceLabel: string): boolean {
  return !/(independent status|legacy status|cached status|parallel status projection|resolveAeeControlledBuildStatus only)/i.test(
    sourceLabel,
  );
}
