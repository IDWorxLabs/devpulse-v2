/**
 * Command Center chat response helpers for one-prompt build path.
 */

import type { OperatorFeedEvent } from '../command-center-brain/brain-types.js';
import type { OnePromptLivePreviewBuildResult } from './one-prompt-live-preview-types.js';
import { composeOnePromptBuildChatResponse, getOnePromptLivePreviewPublicState } from './one-prompt-build-orchestrator.js';
import { buildOnePromptLivePreviewWorkspaceSync } from './canonical-live-preview-state.js';
import { getPreviewRuntimeDiagnostics, listPreviewSessions, listPreviewTargets } from '../live-preview-runtime/index.js';
import { getBuildIntentRun } from '../build-intent-routing/build-intent-run-store.js';
import { tagOperatorFeedEventWithProjectId } from '../project-isolation-guard-v1/index.js';
import {
  getActiveProjectId,
  listMultiProjectWorkspaces,
  registerProjectBuildResult,
  resolveProjectContext,
} from './workspace-tab-registry.js';

const BUILD_FEED_STAGES: Array<{
  action: string;
  detail: string;
  eventType: OperatorFeedEvent['eventType'];
  section: string;
  when: (r: OnePromptLivePreviewBuildResult) => boolean;
}> = [
  {
    action: 'Detecting build prompt',
    detail: 'Recognized build request — routing to AiDevEngine build orchestration.',
    eventType: 'Classifying Request',
    section: 'Build',
    when: () => true,
  },
  {
    action: 'Planning contract',
    detail: 'Architecture, requirements, and build-ready plan contract produced.',
    eventType: 'Understanding Project',
    section: 'Build',
    when: (r) => Boolean(r.planningProofLevel),
  },
  {
    action: 'Materializing workspace',
    detail: 'Generated application source files under .generated-builder-workspaces/.',
    eventType: 'Gathering Facts',
    section: 'Build',
    when: (r) => Boolean(r.materializationProofLevel || r.workspacePath),
  },
  {
    action: 'Installing dependencies',
    detail: 'npm install completed for generated Vite React workspace.',
    eventType: 'Analyzing Project Status',
    section: 'Build',
    when: (r) => r.npmInstallOk,
  },
  {
    action: 'Building app',
    detail: 'npm run build completed for generated application.',
    eventType: 'Generating Response',
    section: 'Build',
    when: (r) => r.npmBuildOk,
  },
  {
    action: 'Starting Live Preview',
    detail: 'Vite dev server started for generated workspace.',
    eventType: 'Generating Response',
    section: 'Build',
    when: (r) => r.status === 'READY' && Boolean(r.previewUrl),
  },
];

function feedStatusForStage(
  result: OnePromptLivePreviewBuildResult,
  stageIndex: number,
  stageMatched: boolean,
  failedAt: number | null,
): OperatorFeedEvent['status'] {
  if (stageMatched) return 'Completed';
  if (result.status === 'FAILED' && failedAt === stageIndex) return 'Blocked';
  return 'Queued';
}

export function buildOnePromptOperatorFeedEvents(
  result: OnePromptLivePreviewBuildResult,
): OperatorFeedEvent[] {
  const events: OperatorFeedEvent[] = [];
  let step = 0;
  const total = BUILD_FEED_STAGES.length + 1;
  let failedAt: number | null = null;

  for (const stage of BUILD_FEED_STAGES) {
    step += 1;
    const matched = stage.when(result);
    if (!matched && failedAt === null && result.status === 'FAILED') {
      failedAt = step;
    }
    events.push({
      eventId: `${result.buildId}-feed-${step}`,
      eventType: stage.eventType,
      timestamp: Date.parse(result.updatedAt) || Date.now(),
      informationalOnly: true,
      section: stage.section,
      action: stage.action,
      detail:
        failedAt === step
          ? result.failureReason ?? `${stage.action} failed`
          : matched
            ? stage.detail
            : `${stage.action} — pending`,
      status: feedStatusForStage(result, step, matched, failedAt),
      stepIndex: step,
      stepTotal: total,
      evidence: matched ? 'one-prompt-live-preview' : undefined,
    });
  }

  step += 1;
  const finalAction = result.status === 'READY' ? 'Live Preview ready' : 'Build failed';
  const finalDetail =
    result.status === 'READY'
      ? `Live Preview available at ${result.previewUrl ?? 'unknown URL'}`
      : result.failureReason ?? 'One-prompt build failed';

  events.push({
    eventId: `${result.buildId}-feed-final`,
    eventType: result.status === 'READY' ? 'Response Ready' : 'Checking Blockers',
    timestamp: Date.parse(result.updatedAt) || Date.now(),
    informationalOnly: true,
    section: 'Build',
    action: finalAction,
    detail: finalDetail,
    status: result.status === 'READY' ? 'Completed' : 'Blocked',
    stepIndex: step,
    stepTotal: total,
    evidence: result.workspacePath ?? undefined,
  });

  return events.map((event) =>
    tagOperatorFeedEventWithProjectId(event, result.projectId ?? null, { scope: 'PROJECT' }),
  );
}

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
    classification: {
      category: 'BUILD',
      confidence: 'HIGH',
      matchedSignals: ['build intent', input.buildResult.generatedProfile ?? 'application'],
      reason: 'Build-intent prompt routed to AiDevEngine autonomous builder execution',
    },
    systemsReferenced: ['code_generation_engine', 'one_prompt_live_preview'],
    operatorFeedEvents: buildOnePromptOperatorFeedEvents(input.buildResult),
    onePromptLivePreview: input.buildResult,
    buildLivePreview,
    livePreviewWorkspaceSync,
    llmChatBrainDiagnostics: {
      llmConnected: false,
      usedLlm: false,
      skippedReason: 'One-prompt build path uses local deterministic generation — LLM not required',
    },
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
