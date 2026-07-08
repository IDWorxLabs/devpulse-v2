/**
 * Unified Build Conversation Layer V1 — structured evidence for LLM (no mechanical template).
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { BuildResultConversationalContext } from './build-result-conversational-types.js';
import { resolveExpectedProfileLabel } from './build-profile-mismatch-response.js';
import type { ExecutionTraceEvidenceBundle } from '../execution-trace/execution-trace-types.js';
import { executionTraceEvidenceForLlm } from '../execution-trace/index.js';
import { materializationEvidenceSummaryForChat } from '../materialization-evidence/index.js';
import {
  buildAeeControlledResponseEnvelope,
  buildSpineReachedInstallOrBeyond,
  isStaleAseFailureReason,
  previewStageWasAttempted,
  refineProfileClassificationForAeeBuild,
  resolveAeeControlledBuildStatus,
  resolveAeeControlledFailureReason,
} from '../autonomous-engineering-executive/index.js';

export interface BuildResultStructuredEvidence {
  readOnly: true;
  originalUserPrompt: string;
  activeProjectId: string;
  activeProjectName: string;
  buildRunId: string;
  selectedProfile: string | null;
  expectedProfile: string | null;
  profileAlignmentVerdict: string;
  profileAlignmentReason: string;
  confidence: string;
  matchedKeywords: string[];
  rejectedProfiles: string[];
  rejectionReasons: string[];
  fallbackReason: string | null;
  inferredProductIntent: string | null;
  profileMismatchWarnings: string[];
  workspacePath: string | null;
  buildStatus: string;
  buildStage: string;
  buildResult: string | null;
  previewUrl: string | null;
  livePreviewAvailable: boolean;
  failureReason: string | null;
  planningProofLevel: string | null;
  materializationProofLevel: string | null;
  architectureSummary: string | null;
  planTaskCount: number | null;
  generatedFilesCount: number | null;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  blueprintWarnings: string[];
  outcomeCategory:
    | 'SUCCESS'
    | 'FAILED'
    | 'PARTIAL'
    | 'PROFILE_MISMATCH'
    | 'PREVIEW_UNAVAILABLE'
    | 'IN_PROGRESS'
    | 'AEE_SPINE_PARTIAL';
  buildResponseSource: string;
  aeeControlledResponse: Record<string, unknown>;
  aeeFinalReport: Record<string, unknown> | null;
  aeeExecutiveDecision: Record<string, unknown> | null;
  executionTraceEvidence: Record<string, unknown> | null;
  materializationEvidence: Record<string, unknown> | null;
}

function inferBuildStage(
  buildResult: OnePromptLivePreviewBuildResult,
  buildRunStage: string | null,
): string {
  if (buildRunStage) return buildRunStage;
  if (buildResult.status === 'BUILDING') return 'materializing';
  if (buildResult.status === 'READY') return 'complete';
  if (buildResult.status === 'FAILED') return 'failed';
  return buildResult.status;
}

function inferOutcomeCategory(
  context: BuildResultConversationalContext,
  buildResult: OnePromptLivePreviewBuildResult,
): BuildResultStructuredEvidence['outcomeCategory'] {
  const aeeStatus = resolveAeeControlledBuildStatus(buildResult);
  if (aeeStatus.outcomeCategory !== 'FAILED') {
    return aeeStatus.outcomeCategory;
  }

  const mismatch =
    context.classification.alignmentVerdict === 'PROFILE_MISMATCH' ||
    context.classification.profileMismatchWarnings.length > 0;

  if (buildResult.status === 'BUILDING') return 'IN_PROGRESS';
  if (buildResult.status === 'FAILED') return 'FAILED';
  if (mismatch && buildResult.status === 'READY') return 'PROFILE_MISMATCH';
  if (
    buildResult.status === 'READY' &&
    (buildResult.planningProofLevel === 'PARTIAL' ||
      buildResult.materializationProofLevel === 'PARTIAL' ||
      buildResult.buildResult === 'FAIL')
  ) {
    return 'PARTIAL';
  }
  if (buildResult.status === 'READY' && !buildResult.livePreviewAvailable) return 'PREVIEW_UNAVAILABLE';
  if (buildResult.status === 'READY') return 'SUCCESS';
  return 'PARTIAL';
}

function collectBlueprintWarnings(
  context: BuildResultConversationalContext,
  buildResult: OnePromptLivePreviewBuildResult,
): string[] {
  const warnings: string[] = [...context.classification.profileMismatchWarnings];

  if (buildResult.planningProofLevel === 'PARTIAL') {
    warnings.push('Planning proof is partial — blueprint or plan contract may be incomplete.');
  }
  if (buildResult.materializationProofLevel === 'PARTIAL') {
    warnings.push('Materialization proof is partial — workspace files may be incomplete.');
  }
  if (buildResult.status === 'READY' && !buildResult.livePreviewAvailable) {
    warnings.push('Build reached READY but Live Preview is not available.');
  }
  if (!buildResult.npmInstallOk) {
    warnings.push('npm install did not succeed.');
  }
  if (!buildResult.npmBuildOk) {
    warnings.push('npm build did not succeed.');
  }
  if (context.classification.fallbackReason) {
    warnings.push(`Profile fallback used: ${context.classification.fallbackReason}`);
  }
  const controlledFailure = resolveAeeControlledFailureReason(buildResult);
  if (controlledFailure && !isStaleAseFailureReason(controlledFailure)) {
    warnings.push(`Remaining gap: ${controlledFailure}`);
  } else if (buildResult.failureReason && !isStaleAseFailureReason(buildResult.failureReason)) {
    warnings.push(`Failure: ${buildResult.failureReason}`);
  }

  if (buildSpineReachedInstallOrBeyond(buildResult)) {
    warnings.push(
      `Build spine reached npm install/build under AEE control (install=${buildResult.npmInstallOk ? 'PASS' : 'FAIL'}, build=${buildResult.npmBuildOk ? 'PASS' : 'FAIL'}).`,
    );
  }
  if (!previewStageWasAttempted(buildResult) && buildResult.status === 'FAILED') {
    warnings.push('Preview stage was not attempted — do not claim live preview could not be generated.');
  }

  return warnings;
}

export function buildBuildResultStructuredEvidence(
  context: BuildResultConversationalContext,
  buildResult: OnePromptLivePreviewBuildResult,
  executionTraceBundle?: ExecutionTraceEvidenceBundle | null,
): BuildResultStructuredEvidence {
  const refinedClassification = refineProfileClassificationForAeeBuild(
    buildResult,
    context.classification,
  );
  const aeeControlledResponse = buildAeeControlledResponseEnvelope(buildResult);
  const controlledFailure = resolveAeeControlledFailureReason(buildResult);

  return {
    readOnly: true,
    originalUserPrompt: context.userPrompt,
    activeProjectId: context.activeProjectId,
    activeProjectName: context.activeProjectName,
    buildRunId: context.buildRunId,
    selectedProfile: context.selectedProfile,
    expectedProfile: resolveExpectedProfileLabel(context),
    profileAlignmentVerdict: refinedClassification.alignmentVerdict,
    profileAlignmentReason: refinedClassification.alignmentReason,
    confidence: refinedClassification.confidence,
    matchedKeywords: [...refinedClassification.matchedKeywords],
    rejectedProfiles: [...refinedClassification.rejectedProfiles],
    rejectionReasons: [...refinedClassification.rejectionReasons],
    fallbackReason: refinedClassification.fallbackReason,
    inferredProductIntent: refinedClassification.inferredProductIntent,
    profileMismatchWarnings: [...refinedClassification.profileMismatchWarnings],
    workspacePath: context.workspacePath,
    buildStatus: context.buildStatus,
    buildStage: inferBuildStage(buildResult, context.buildStage),
    buildResult: context.buildResult,
    previewUrl: context.previewUrl,
    livePreviewAvailable: buildResult.livePreviewAvailable,
    failureReason: controlledFailure,
    planningProofLevel: buildResult.planningProofLevel,
    materializationProofLevel: buildResult.materializationProofLevel,
    architectureSummary: context.architectureSummary,
    planTaskCount: context.planTaskCount,
    generatedFilesCount: context.generatedFilesCount,
    npmInstallOk: buildResult.npmInstallOk,
    npmBuildOk: buildResult.npmBuildOk,
    blueprintWarnings: collectBlueprintWarnings(
      { ...context, classification: refinedClassification },
      buildResult,
    ),
    outcomeCategory: inferOutcomeCategory(
      { ...context, classification: refinedClassification },
      buildResult,
    ),
    buildResponseSource: String(aeeControlledResponse.buildResponseSource ?? 'AEE_CONTROLLED_RESULT'),
    aeeControlledResponse,
    aeeFinalReport: (buildResult.aeeFinalReport as unknown as Record<string, unknown>) ?? null,
    aeeExecutiveDecision: (buildResult.aeeExecutiveDecision as unknown as Record<string, unknown>) ?? null,
    executionTraceEvidence: executionTraceBundle
      ? executionTraceEvidenceForLlm(executionTraceBundle)
      : null,
    materializationEvidence: materializationEvidenceSummaryForChat(
      buildResult.materializationManifest,
    ),
  };
}
