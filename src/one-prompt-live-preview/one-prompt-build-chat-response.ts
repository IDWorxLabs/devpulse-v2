/**
 * Command Center chat response helpers for one-prompt build path.
 * Chat explains; Execution Trace records runtime evidence.
 */

import type { OnePromptLivePreviewBuildResult } from './one-prompt-live-preview-types.js';
import { composeOnePromptBuildChatResponse, getOnePromptLivePreviewPublicState } from './one-prompt-build-orchestrator.js';
import { analyzeBuildProfileClassification } from '../build-result-conversational-intelligence/build-result-classification-evidence.js';
import {
  buildAeeControlledResponseEnvelope,
  buildAeeControlledTraceEvent,
  composeAeeAwareBuildChatResponse,
  deriveAeeFinalReportFromDecision,
  refineProfileClassificationForAeeBuild,
  BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
} from '../autonomous-engineering-executive/index.js';
import { summarizeAelEvidenceForResponse } from '../autonomous-engineering-loop/index.js';
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
  const buildResult: OnePromptLivePreviewBuildResult = {
    ...input.buildResult,
    aeeFinalReport:
      input.buildResult.aeeFinalReport ??
      deriveAeeFinalReportFromDecision(
        input.buildResult,
        input.buildResult.aeeExecutiveDecision ?? null,
      ),
  };
  const buildLivePreview = getOnePromptLivePreviewPublicState(buildResult.projectId);
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

  const buildRun = getBuildIntentRun(buildResult.buildId);
  const ranking = rankBuildProfiles(input.message);
  const classificationEvidence = refineProfileClassificationForAeeBuild(
    buildResult,
    analyzeBuildProfileClassification(input.message, buildResult.generatedProfile),
  );
  const aeeControlledResponse = buildAeeControlledResponseEnvelope(buildResult);
  const aeeTraceEvent = buildAeeControlledTraceEvent(buildResult);

  const executionTraceEvents = [
    ...buildOnePromptExecutionTraceEvents(buildResult, input.message),
    {
      eventId: `${buildResult.buildId}-trace-aee-response-source`,
      timestamp: Date.parse(buildResult.updatedAt) || Date.now(),
      runtimeStage: 'Build',
      component: 'autonomous_engineering_executive',
      severity: 'INFO' as const,
      eventTitle: aeeTraceEvent.eventTitle,
      technicalDetail: aeeTraceEvent.technicalDetail,
      status: 'Completed' as const,
      metadata: aeeTraceEvent.metadata,
      informationalOnly: true,
      section: 'Build',
      action: aeeTraceEvent.eventTitle,
      detail: aeeTraceEvent.technicalDetail,
      stepIndex: 0,
      stepTotal: 0,
    },
  ];
  const executionTraceEvidence = buildOnePromptExecutionTraceEvidence(
    buildResult,
    input.message,
  );
  const operatorFeedEvents = executionTraceEventsToOperatorFeed(executionTraceEvents);

  return {
    responseId: `brain-build-${buildResult.buildId}`,
    userMessage: input.message,
    brainResponse: composeAeeAwareBuildChatResponse(buildResult),
    category: 'BUILD',
    buildResponseSource: BUILD_RESPONSE_SOURCE_AEE_CONTROLLED,
    aeeControlledResponse,
    aeeExecutiveDecision: buildResult.aeeExecutiveDecision ?? null,
    aeeFinalReport: buildResult.aeeFinalReport ?? null,
    aelEvidence:
      buildResult.aelReport && buildResult.aelEvidence
        ? summarizeAelEvidenceForResponse(buildResult.aelEvidence, buildResult.aelReport)
        : null,
    aelReport: buildResult.aelReport ?? null,
    aelFinalOutcome: buildResult.aelFinalOutcome ?? null,
    buildRunId: buildResult.buildId,
    activeProjectId: buildResult.projectId ?? getActiveProjectId(),
    multiProjectWorkspaces: listMultiProjectWorkspaces(),
    buildExecution: {
      buildRunId: buildResult.buildId,
      projectId: buildResult.projectId,
      projectName: buildResult.projectName,
      status: buildResult.status,
      stage: buildRun?.stage ?? buildResult.status,
      workspacePath: buildResult.workspacePath,
      previewUrl: buildResult.previewUrl,
      generatedProfile: buildResult.generatedProfile,
      planTaskCount: buildRun?.planTaskCount ?? null,
      architectureSummary: buildRun?.architectureSummary ?? null,
      livePreviewPending: buildResult.status === 'BUILDING',
      livePreviewAvailable: buildResult.livePreviewAvailable,
    },
    classification: classificationEvidence,
    profileAlignment: {
      verdict: classificationEvidence.alignmentVerdict,
      reason: classificationEvidence.alignmentReason,
      selectedProfile: buildResult.generatedProfile,
      rankedProfile: ranking.selectedProfile,
      matchedKeywords: classificationEvidence.matchedKeywords,
      profileMismatchWarnings: classificationEvidence.profileMismatchWarnings,
    },
    systemsReferenced: [
      'code_generation_engine',
      'one_prompt_live_preview',
      'autonomous_engineering_loop',
      'build_result_conversational_intelligence',
      'execution_trace',
    ],
    executionTraceEvents,
    executionTraceEvidence,
    operatorFeedEvents,
    materializationEvidence: materializationEvidenceSummaryForChat(
      buildResult.materializationManifest,
    ),
    materializationManifest: buildResult.materializationManifest,
    onePromptLivePreview: buildResult,
    buildLivePreview,
    livePreviewWorkspaceSync,
    buildChatTemplateFallback: composeAeeAwareBuildChatResponse(buildResult),
    confirmation: {
      intelligenceOnly: false,
      noExecutionPerformed: false,
      noCommandsExecuted: false,
      noFilesModified: false,
      noCodeGenerated: false,
      noDeploymentPerformed: true,
      noAutoFixPerformed:
        !(buildResult.buildAutofixAttempts && buildResult.buildAutofixAttempts > 0) &&
        !(buildResult.previewRecoveryAttempts && buildResult.previewRecoveryAttempts > 0),
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
    diagnosticPreviewUrl: null,
    limitedPreviewUrl: null,
    devServerRunning: false,
    livePreviewAvailable: false,
    failureReason: input.failureReason,
    featureSignals: null,
    livePreviewGate: null,
    autonomousSoftwareEngineering: null,
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
