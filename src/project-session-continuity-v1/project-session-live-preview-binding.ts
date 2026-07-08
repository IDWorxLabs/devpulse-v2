/**
 * Project Session Continuity V1 — live preview binding to active project/session/buildRunId.
 */

import {
  getLastOnePromptLivePreviewBuildResult,
  getOnePromptLivePreviewPublicState,
} from '../one-prompt-live-preview/one-prompt-build-orchestrator.js';
import type { LivePreviewSessionBinding, ProjectSessionRecord } from './project-session-continuity-types.js';

export function resolveLivePreviewSessionBinding(input: {
  session: Pick<
    ProjectSessionRecord,
    'projectId' | 'sessionId' | 'activeBuildRunId' | 'previewUrl' | 'buildStatus'
  >;
  rootDir?: string;
}): LivePreviewSessionBinding {
  void input.rootDir;
  const build = getLastOnePromptLivePreviewBuildResult(input.session.projectId);
  const publicState = getOnePromptLivePreviewPublicState(input.session.projectId);
  const buildRunId = input.session.activeBuildRunId ?? build?.buildId ?? null;

  const gateUnlocked = publicState.livePreviewAvailable === true;
  const runtimePreviewUrl = gateUnlocked ? publicState.previewUrl : null;
  const storedPreviewUrl = input.session.previewUrl;
  const buildPreviewUrl =
    build?.livePreviewAvailable && build.previewUrl ? build.previewUrl : null;
  const previewUrl = runtimePreviewUrl ?? buildPreviewUrl ?? storedPreviewUrl ?? null;
  const previewReady = Boolean(previewUrl && (gateUnlocked || build?.status === 'READY'));

  if (previewReady && previewUrl) {
    return {
      readOnly: true,
      projectId: input.session.projectId,
      sessionId: input.session.sessionId,
      buildRunId,
      previewUrl,
      previewReady: true,
      bindingReason: gateUnlocked
        ? 'Live Preview Gate unlocked — preview bound to active session build'
        : 'Build reported preview ready — bound to session buildRunId',
      repairAction: null,
      iframeRenderable: true,
    };
  }

  if (publicState.devServerRunning && !gateUnlocked) {
    return {
      readOnly: true,
      projectId: input.session.projectId,
      sessionId: input.session.sessionId,
      buildRunId,
      previewUrl: publicState.diagnosticPreviewUrl ?? null,
      previewReady: false,
      bindingReason:
        publicState.gateBlockerSummary ??
        'Dev server running but Live Preview Gate has not unlocked preview',
      repairAction: 'Wait for autonomous validation to complete, or run repair from Command Center',
      iframeRenderable: false,
    };
  }

  if (build?.status === 'FAILED') {
    return {
      readOnly: true,
      projectId: input.session.projectId,
      sessionId: input.session.sessionId,
      buildRunId,
      previewUrl: null,
      previewReady: false,
      bindingReason: build.failureReason ?? 'Last build failed — no preview URL available',
      repairAction: 'Resume or repair the build from Command Center with the original prompt',
      iframeRenderable: false,
    };
  }

  if (!buildRunId) {
    return {
      readOnly: true,
      projectId: input.session.projectId,
      sessionId: input.session.sessionId,
      buildRunId: null,
      previewUrl: null,
      previewReady: false,
      bindingReason: 'No build has been attached to this project session yet',
      repairAction: 'Send a build prompt from Command Center to generate a preview',
      iframeRenderable: false,
    };
  }

  return {
    readOnly: true,
    projectId: input.session.projectId,
    sessionId: input.session.sessionId,
    buildRunId,
    previewUrl: null,
    previewReady: false,
    bindingReason:
      input.session.buildStatus === 'READY'
        ? 'Build completed but preview URL is missing from session and runtime'
        : 'Preview URL missing — build may still be in progress or gate blocked',
    repairAction: 'Refresh Live Preview or re-run build from Command Center',
    iframeRenderable: false,
  };
}

export function mergeSessionPreviewIntoWorkspaceFields(
  binding: LivePreviewSessionBinding,
  workspaceFields: {
    previewUrl?: string | null;
    buildStatus?: string | null;
    livePreviewAvailable?: boolean;
  },
): {
  previewUrl: string | null;
  buildStatus: string | null;
  livePreviewAvailable: boolean;
  previewBindingReason: string;
  previewRepairAction: string | null;
} {
  return {
    previewUrl: binding.previewReady ? binding.previewUrl : workspaceFields.previewUrl ?? null,
    buildStatus: workspaceFields.buildStatus ?? null,
    livePreviewAvailable: binding.previewReady || workspaceFields.livePreviewAvailable === true,
    previewBindingReason: binding.bindingReason,
    previewRepairAction: binding.repairAction,
  };
}
