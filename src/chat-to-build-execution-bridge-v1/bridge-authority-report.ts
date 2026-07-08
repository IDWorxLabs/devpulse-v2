/**
 * Chat-to-Build Execution Bridge V1 — engineering report builder.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { BootstrapProjectSessionResult } from '../project-session-continuity-v1/project-session-build-bridge.js';
import type { ChatToBuildEngineeringReport, ChatToBuildEngineeringState } from './bridge-types.js';
import { CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION } from './bridge-types.js';

function extractExtendedField(
  buildResult: OnePromptLivePreviewBuildResult,
  key: string,
): unknown {
  return (buildResult as unknown as Record<string, unknown>)[key] ?? null;
}

export function buildBridgeEngineeringReport(input: {
  bridgeRunId: string;
  buildResult: OnePromptLivePreviewBuildResult;
  sessionBootstrap: BootstrapProjectSessionResult;
  autofixApplied: boolean;
  autofixAttempts: number;
  finalState: ChatToBuildEngineeringState;
}): ChatToBuildEngineeringReport {
  const { buildResult, sessionBootstrap } = input;
  const remainingGaps: string[] = [];
  const qualityScore = extractExtendedField(buildResult, 'materializationQualityScore') as number | null;
  const manifestModules = buildResult.materializationManifest?.approvedModuleIds ?? [];
  const featureModules =
    (extractExtendedField(buildResult, 'featureModules') as string[] | null) ?? manifestModules;

  if (buildResult.status === 'FAILED') {
    remainingGaps.push(buildResult.failureReason ?? 'Build failed');
  }
  if (!buildResult.previewUrl) {
    remainingGaps.push('Live preview URL unavailable');
  }
  if (qualityScore != null && qualityScore < 70) {
    remainingGaps.push('Materialization quality below target threshold');
  }

  return {
    readOnly: true,
    contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
    bridgeRunId: input.bridgeRunId,
    projectName: buildResult.projectName ?? sessionBootstrap.projectName,
    projectId: buildResult.projectId ?? sessionBootstrap.projectId,
    projectIdentity:
      sessionBootstrap.projectIdentity?.resolvedProjectName ??
      buildResult.projectName ??
      sessionBootstrap.projectId,
    workspacePath: buildResult.workspacePath ?? null,
    resolutionMode: sessionBootstrap.projectIdentity?.resolutionMode ?? 'CONTINUE_EXISTING',
    generatedProfile: buildResult.generatedProfile ?? null,
    featureModules,
    featureContractReality: extractExtendedField(buildResult, 'featureContractRealityEvidence') as Record<
      string,
      unknown
    > | null,
    workspaceRealityAudit: extractExtendedField(buildResult, 'workspaceRealityAuditEvidence') as Record<
      string,
      unknown
    > | null,
    validationResults: extractExtendedField(buildResult, 'productionValidationEvidence') as Record<
      string,
      unknown
    > | null,
    qualityScore,
    livePreviewUrl: buildResult.previewUrl ?? null,
    productionProof: extractExtendedField(buildResult, 'universalProductionProofEvidence') as Record<
      string,
      unknown
    > | null,
    founderEvidence: extractExtendedField(buildResult, 'founderEvidence') as Record<string, unknown> | null,
    remainingGaps,
    buildStatus: buildResult.status,
    autofixApplied: input.autofixApplied,
    autofixAttempts: input.autofixAttempts,
    finalState: input.finalState,
  };
}
