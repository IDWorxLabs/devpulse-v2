/**
 * Execution Proof Authority Sync — map chain truth to legacy authority workspace signals (Phase 26.78).
 */

import type { ConnectedExecutionChainTruth } from './connected-execution-chain-truth.js';
import type { UpstreamRealityBundle } from '../end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-types.js';
import { collectUpstreamRealityBundle } from '../end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.js';
import type { VerificationModulePresenceEvidence } from '../verification-reality/verification-reality-types.js';
import { buildVerificationWorkspaceSignalsForValidation } from '../verification-reality/verification-reality-analyzers.js';
import type { LivePreviewRealityInput } from '../live-preview-reality/live-preview-reality-types.js';
import { buildPreviewWorkspaceSignalsFromLegacy } from '../live-preview-reality/index.js';
import type { AssessLivePreviewRealityAuthorityInput } from '../live-preview-reality/live-preview-reality-types.js';
import { assessLivePreviewReality } from '../live-preview-reality/live-preview-reality-authority.js';

export function buildUpstreamBundleFromChainTruth(
  rootDir: string,
  truth: ConnectedExecutionChainTruth,
): UpstreamRealityBundle {
  const base = collectUpstreamRealityBundle(rootDir, truth.buildProven);

  return {
    ...base,
    builderExecutionConnected: truth.buildProven,
    builderBuildCapability: truth.buildProven ? 'BUILD_CAPABILITY_PROVEN' : base.builderBuildCapability,
    previewRuntimeLevel: truth.runtimeProven ? 'RUNTIME_PROVEN' : base.previewRuntimeLevel,
    previewScore: truth.previewProven ? Math.max(base.previewScore, 72) : base.previewScore,
    previewBottleneck:
      truth.buildProven && truth.previewProven ? 'NONE' : truth.buildProven ? 'PREVIEW' : base.previewBottleneck,
    verificationStatus: truth.verificationProven ? 'VERIFICATION_PROVEN' : base.verificationStatus,
  };
}

export function buildVerificationSignalsFromChainTruth(
  moduleEvidence: VerificationModulePresenceEvidence,
  truth: ConnectedExecutionChainTruth,
): ReturnType<typeof buildVerificationWorkspaceSignalsForValidation> {
  return buildVerificationWorkspaceSignalsForValidation(moduleEvidence, {
    executionConnected: truth.buildProven,
    previewValidationReady: truth.previewProven,
    previewRuntimeActive: truth.previewProven,
    previewRealityState: truth.previewProven ? 'PREVIEW_READY' : 'NO_PREVIEW',
    verificationResultsLinked: truth.verificationProven || moduleEvidence.verificationResultsLinked,
    runtimeDiagnosticsActive: truth.runtimeProven,
    verificationReadiness: truth.verificationProven ? 'ready' : undefined,
  });
}

export function applyChainTruthToPreviewWorkspace(
  workspace: AssessLivePreviewRealityAuthorityInput['workspace'],
  truth: ConnectedExecutionChainTruth,
): AssessLivePreviewRealityAuthorityInput['workspace'] {
  if (!truth.buildProven && !truth.runtimeProven && !truth.previewProven) {
    return workspace;
  }

  return {
    ...workspace,
    connected: truth.previewProven || workspace.connected,
    previewRuntimeActive: truth.runtimeProven || workspace.previewRuntimeActive,
    loadRealityPassed: truth.previewProven || workspace.loadRealityPassed,
    validationReady: truth.previewProven || workspace.validationReady,
    interactivityPassed: truth.previewProven || workspace.interactivityPassed,
  };
}

export function buildPreviewWorkspaceFromChainTruth(
  legacyInput: LivePreviewRealityInput,
  truth: ConnectedExecutionChainTruth,
): AssessLivePreviewRealityAuthorityInput['workspace'] {
  const legacyAssessment = assessLivePreviewReality(legacyInput);
  const workspace = buildPreviewWorkspaceSignalsFromLegacy(
    legacyInput,
    truth.buildProven,
    legacyAssessment,
  );
  return applyChainTruthToPreviewWorkspace(workspace, truth);
}
