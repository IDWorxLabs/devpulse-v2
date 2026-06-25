/**
 * Command Center chat response helpers for one-prompt build path.
 * Chat explains; Execution Trace records runtime evidence.
 */

import type { OnePromptLivePreviewBuildResult } from './one-prompt-live-preview-types.js';
import { composeOnePromptBuildChatResponse, getOnePromptLivePreviewPublicState } from './one-prompt-build-orchestrator.js';
import { analyzeBuildProfileClassification } from '../build-result-conversational-intelligence/build-result-classification-evidence.js';
import { rankBuildProfiles } from '../build-profile-classification/index.js';
import { buildOnePromptLivePreviewWorkspaceSync } from './canonical-live-preview-state.js';
import { getPreviewRuntimeDiagnostics, listPreviewSessions, listPreviewTargets } from '../live-preview-runtime/index.js';
import { getBuildIntentRun } from '../build-intent-routing/build-intent-run-store.js';
import {
  buildOnePromptExecutionTraceEvents,
  buildOnePromptExecutionTraceEvidence,
  buildOnePromptOperatorFeedEvents,
  executionTraceEventsToOperatorFeed,
} from '../execution-trace/index.js';
import { materializationEvidenceSummaryForChat } from '../materialization-evidence/index.js';
import {
  getActiveProjectId,
  listMultiProjectWorkspaces,
  registerProjectBuildResult,
  resolveProjectContext,
} from './workspace-tab-registry.js';

export { buildOnePromptOperatorFeedEvents, buildOnePromptExecutionTraceEvents };

export function composeOnePromptBuildBrainApiPayload(input: {
  message: string;
  buildResult: OnePromptLivePreviewBuildResult;
}): Record<string, unknown> {
  const buildLivePreview = getOnePromptLivePreviewPublicState(input.buildResult.projectId);
  const brainResponse = composeOnePromptBuildChatResponse(input.buildResult);
  const previewDiag = getPreviewRuntimeDiagnostics();
  const sessions = listPreviewSessions();
  const targets = listPreviewTargets();
  const readySession =
    sessions.find((s) => s.previewState === 'PREVIEW_READY') ??
    sessions.find((s) => s.previewUrl) ??
    sessions[0] ??
    null;
  const livePreviewWorkspaceSync = buildOnePromptLivePreviewWorkspaceSync(
    {
      sessions: sessions.map((s) => ({
        previewSessionId: s.previewSessionId,
        projectId: s.projectId,
        previewState: s.previewState,
        previewUrl: s.previewUrl,
        previewTargetName: s.previewTargetName,
        previewCapabilities: [...s.previewCapabilities],
        warnings: [...s.warnings],
        blockedReasons: [...s.blockedReasons],
        createdAt: s.createdAt,
      })),
      activeSession: readySession
        ? {
            previewSessionId: readySession.previewSessionId,
            projectId: readySession.projectId,
            previewState: readySession.previewState,
            previewUrl: readySession.previewUrl,
            previewTargetName: readySession.previewTargetName,
            previewCapabilities: [...readySession.previewCapabilities],
            warnings: [...readySession.warnings],
            blockedReasons: [...readySession.blockedReasons],
            createdAt: readySession.createdAt,
          }
        : null,
      previewUrl: readySession?.previewUrl ?? null,
      connected: sessions.length > 0 || targets.length > 0,
      diagnostics: {
        previewRuntimeActive: previewDiag.previewRuntimeActive,
        previewSessionCount: previewDiag.previewSessionCount,
        registeredTargetCount: previewDiag.registeredTargetCount,
        readyPreviewCount: previewDiag.readyPreviewCount,
        blockedPreviewCount: previewDiag.blockedPreviewCount,
      },
      targets: targets.map((t) => ({ targetName: t.targetName, targetType: t.targetType })),
    },
    {
      activeProjectId: input.buildResult.projectId,
      latestProjectId: input.buildResult.projectId,
      projectCount: listMultiProjectWorkspaces().length,
      projectName: input.buildResult.projectName,
      recentChangeSummary: null,
      generatedAt: Date.now(),
    },
  );

  const buildRun = getBuildIntentRun(input.buildResult.buildId);
  const ranking = rankBuildProfiles(input.message);
  const classificationEvidence = analyzeBuildProfileClassification(
    input.message,
    input.buildResult.generatedProfile,
  );

  const executionTraceEvents = buildOnePromptExecutionTraceEvents(
    input.buildResult,
    input.message,
  );
  const executionTraceEvidence = buildOnePromptExecutionTraceEvidence(
    input.buildResult,
    input.message,
  );
  const operatorFeedEvents = executionTraceEventsToOperatorFeed(executionTraceEvents);

  return {
    responseId: `brain-build-${input.buildResult.buildId}`,
    userMessage: input.message,
    brainResponse,
    category: 'BUILD',
    buildRunId: input.buildResult.buildId,
    activeProjectId: input.buildResult.projectId ?? getActiveProjectId(),
    multiProjectWorkspaces: listMultiProjectWorkspaces(),
    buildExecution: {
      buildRunId: input.buildResult.buildId,
      projectId: input.buildResult.projectId,
      projectName: input.buildResult.projectName,
      status: input.buildResult.status,
      stage: buildRun?.stage ?? input.buildResult.status,
      workspacePath: input.buildResult.workspacePath,
      previewUrl: input.buildResult.previewUrl,
      generatedProfile: input.buildResult.generatedProfile,
      planTaskCount: buildRun?.planTaskCount ?? null,
      architectureSummary: buildRun?.architectureSummary ?? null,
      livePreviewPending: input.buildResult.status === 'BUILDING',
      livePreviewAvailable: input.buildResult.livePreviewAvailable,
    },
    classification: classificationEvidence,
    profileAlignment: {
      verdict: classificationEvidence.alignmentVerdict,
      reason: classificationEvidence.alignmentReason,
      selectedProfile: input.buildResult.generatedProfile,
      rankedProfile: ranking.selectedProfile,
      matchedKeywords: classificationEvidence.matchedKeywords,
      profileMismatchWarnings: classificationEvidence.profileMismatchWarnings,
    },
    systemsReferenced: [
      'code_generation_engine',
      'one_prompt_live_preview',
      'build_result_conversational_intelligence',
      'execution_trace',
    ],
    executionTraceEvents,
    executionTraceEvidence,
    operatorFeedEvents,
    materializationEvidence: materializationEvidenceSummaryForChat(
      input.buildResult.materializationManifest,
    ),
    materializationManifest: input.buildResult.materializationManifest,
    onePromptLivePreview: input.buildResult,
    buildLivePreview,
    livePreviewWorkspaceSync,
    buildChatTemplateFallback: brainResponse,
    confirmation: {
      intelligenceOnly: false,
      noExecutionPerformed: false,
      noCommandsExecuted: false,
      noFilesModified: false,
      noCodeGenerated: false,
      noDeploymentPerformed: true,
      noAutoFixPerformed: true,
      noRuntimeMutation: false,
      noExternalAiCalls: true,
      noPersistence: false,
      noSystemReplacement: true,
    },
  };
}

export function composeOnePromptBuildFailurePayload(input: {
  message: string;
  failureReason: string;
  projectId?: string | null;
  projectName?: string | null;
}): Record<string, unknown> {
  const projectContext = resolveProjectContext({
    projectId: input.projectId,
    projectName: input.projectName,
    createIfMissing: true,
  });
  const failedResult = {
    readOnly: true as const,
    buildId: `one-prompt-build-error-${Date.now()}`,
    projectId: projectContext.projectId,
    projectName: projectContext.projectName,
    status: 'FAILED' as const,
    prompt: input.message,
    requestType: 'CHAT_BUILD' as const,
    workspaceId: null,
    workspacePath: null,
    generatedProfile: null,
    planningProofLevel: null,
    materializationProofLevel: null,
    buildResult: 'FAIL' as const,
    npmInstallOk: false,
    npmBuildOk: false,
    previewUrl: null,
    livePreviewAvailable: false,
    failureReason: input.failureReason,
    featureSignals: null,
    materializationManifest: null,
    updatedAt: new Date().toISOString(),
  };

  registerProjectBuildResult({
    projectId: projectContext.projectId,
    projectName: projectContext.projectName,
    build: failedResult,
  });

  return composeOnePromptBuildBrainApiPayload({
    message: input.message,
    buildResult: failedResult,
  });
}
