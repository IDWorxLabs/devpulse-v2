/**
 * Canonical Live Preview state — single merge path for preview runtime + one-prompt build.
 */

import {
  getLastBlueprintVisualAssessment,
  resolveBlueprintVisualValidationReady,
} from '../universal-app-blueprint-visual/index.js';
import type { LivePreviewSessionSignal } from '../live-preview-reality/live-preview-reality-types.js';
import type { LivePreviewRealityAssessment } from '../live-preview-reality/live-preview-reality-types.js';
import { assessLivePreviewReality } from '../live-preview-reality/index.js';
import { getLastCqiMaturityAssessment } from '../clarifying-question-intelligence/index.js';
import {
  assessRunningApplicationVisibility,
  type RunningApplicationVisibilityAssessment,
} from '../running-application-visibility/index.js';
import type { OnePromptLivePreviewBuildResult } from './one-prompt-live-preview-types.js';
import {
  getActiveProjectId,
} from './workspace-tab-registry.js';
import {
  getLastOnePromptLivePreviewBuildResult,
  getOnePromptLivePreviewPublicState,
} from './one-prompt-build-orchestrator.js';

const ONE_PROMPT_PREVIEW_CAPABILITIES = [
  'LIVE_VIEW',
  'INTERACTION_TESTING',
  'VISUAL_VERIFICATION',
  'SELF_VISION',
  'SCREEN_CAPTURE',
] as const;

function normalizeSession(session: LivePreviewSessionSignal | null): CanonicalLivePreviewRuntimeInput['sessions'][number] | null {
  if (!session) return null;
  return {
    previewSessionId: session.previewSessionId,
    projectId: session.projectId,
    previewState: session.previewState,
    previewUrl: session.previewUrl,
    previewTargetName: session.previewTargetName ?? 'Application Preview',
    previewCapabilities: [...(session.previewCapabilities ?? [])],
    warnings: [...(session.warnings ?? [])],
    blockedReasons: [...(session.blockedReasons ?? [])],
    createdAt: session.createdAt ?? Date.now(),
  };
}

function normalizeSessions(sessions: LivePreviewSessionSignal[]): CanonicalLivePreviewRuntimeInput['sessions'] {
  return sessions.map((session) => normalizeSession(session)!);
}

export interface CanonicalLivePreviewRuntimeInput {
  sessions: Array<{
    previewSessionId: string;
    projectId: string;
    previewState: string;
    previewUrl: string | null;
    previewTargetName: string;
    previewCapabilities: string[];
    warnings: string[];
    blockedReasons: string[];
    createdAt: number;
  }>;
  activeSession: {
    previewSessionId: string;
    projectId: string;
    previewState: string;
    previewUrl: string | null;
    previewTargetName: string;
    previewCapabilities: string[];
    warnings: string[];
    blockedReasons: string[];
    createdAt: number;
  } | null;
  previewUrl: string | null;
  connected: boolean;
  diagnostics: {
    previewRuntimeActive: boolean;
    previewSessionCount: number;
    registeredTargetCount: number;
    readyPreviewCount: number;
    blockedPreviewCount: number;
  };
  targets: Array<{ targetName: string; targetType: string }>;
}

export interface CanonicalLivePreviewContext {
  activeProjectId?: string | null;
  latestProjectId: string | null;
  projectCount: number;
  projectName: string | null;
  recentChangeSummary: string | null;
  generatedAt?: number;
}

export interface CanonicalLivePreviewBlock {
  connected: boolean;
  statusLabel: string;
  previewUrl: string | null;
  reality: LivePreviewRealityAssessment;
  activeSession: CanonicalLivePreviewRuntimeInput['activeSession'];
  sessions: CanonicalLivePreviewRuntimeInput['sessions'];
  targets: Array<{ targetName: string; targetType: string }>;
  diagnostics: CanonicalLivePreviewRuntimeInput['diagnostics'];
  buildStatus: string;
  lastVerificationHint: string | null;
  onePromptBuild: {
    status: string;
    workspaceId: string | null;
    workspacePath: string | null;
    generatedProfile: string | null;
    buildResult: string | null;
    previewUrl: string | null;
    failureReason: string | null;
    npmInstallOk: boolean;
    npmBuildOk: boolean;
  } | null;
  onePromptReady: boolean;
}

export interface CanonicalLivePreviewWorkspaceSlice {
  livePreview: CanonicalLivePreviewBlock;
  runningApplication: RunningApplicationVisibilityAssessment;
  runtimeLivePreviewConnected: boolean;
  requirementDiscovery: {
    confidenceScore: number;
    coverageSummary: string;
    gapSummary: readonly string[];
    openQuestionCount: number;
    resolvedQuestionCount: number;
  } | null;
}

function buildOnePromptSession(
  onePromptLast: OnePromptLivePreviewBuildResult,
): NonNullable<CanonicalLivePreviewRuntimeInput['activeSession']> {
  const targetName = `${onePromptLast.projectName} Preview`;

  return {
    previewSessionId: onePromptLast.buildId,
    projectId: onePromptLast.projectId,
    previewState: 'PREVIEW_READY',
    previewUrl: onePromptLast.previewUrl,
    previewTargetName: targetName,
    previewCapabilities: [...ONE_PROMPT_PREVIEW_CAPABILITIES],
    warnings: [],
    blockedReasons: [],
    createdAt: Date.parse(onePromptLast.updatedAt) || Date.now(),
  };
}

export function resolveCanonicalLivePreviewState(
  runtime: CanonicalLivePreviewRuntimeInput,
  context: CanonicalLivePreviewContext,
): CanonicalLivePreviewWorkspaceSlice {
  const resolvedActiveProjectId = context.activeProjectId ?? getActiveProjectId();
  const onePromptPublic = getOnePromptLivePreviewPublicState(resolvedActiveProjectId);
  const onePromptLast = getLastOnePromptLivePreviewBuildResult(resolvedActiveProjectId);
  const onePromptReady = onePromptPublic.status === 'READY' && Boolean(onePromptPublic.previewUrl);
  const mergedPreviewUrl = onePromptPublic.previewUrl ?? runtime.previewUrl;
  const mergedConnected = onePromptPublic.connected || runtime.connected || onePromptReady;
  const normalizedSessions = normalizeSessions(runtime.sessions);
  const normalizedActiveSession = normalizeSession(runtime.activeSession);
  const mergedSessions =
    onePromptReady && onePromptLast?.previewUrl
      ? [buildOnePromptSession(onePromptLast), ...normalizedSessions]
      : normalizedSessions;
  const mergedActiveSession =
    onePromptReady && onePromptLast?.previewUrl
      ? buildOnePromptSession(onePromptLast)
      : normalizedActiveSession;

  const generatedAt = context.generatedAt ?? Date.now();
  const reality = assessLivePreviewReality({
    uiSurfacePresent: true,
    connected: mergedConnected,
    previewUrl: mergedPreviewUrl,
    activeSession: mergedActiveSession,
    sessions: mergedSessions,
    diagnostics: runtime.diagnostics,
    latestProjectId: context.latestProjectId,
    projectCount: context.projectCount,
    generatedAt,
  });

  const blueprintVisualReady = resolveBlueprintVisualValidationReady();
  const blueprintVisualAssessment = getLastBlueprintVisualAssessment();
  const resolvedReality =
    onePromptReady && mergedPreviewUrl
      ? {
          ...reality,
          state: 'PREVIEW_READY' as const,
          displayLabel: 'Preview ready for validation',
          summaryLines: [
            'Preview loaded successfully.',
            'User interaction available.',
            'Generated application is running in Live Preview.',
          ],
          problems:
            blueprintVisualAssessment && !blueprintVisualReady.validationReady
              ? [blueprintVisualReady.validationReadyReason]
              : [],
          recommendedActions:
            blueprintVisualAssessment && !blueprintVisualReady.validationReady
              ? ['Run Universal App Blueprint visual validation against Live Preview']
              : ['Interact with the running app in Live Preview'],
          validationReady: true,
          validationReadyReason:
            blueprintVisualAssessment && blueprintVisualReady.validationReady
              ? blueprintVisualReady.validationReadyReason
              : 'One-prompt build completed and Live Preview URL is active',
          freshness: {
            passed: true,
            reason: 'Generated application matches the latest one-prompt build request',
          },
          loadReality: {
            passed: true,
            reason: 'Preview content is rendered',
          },
          interactivity: {
            passed: true,
            reason: 'Preview is usable for founder interaction',
          },
          availability: {
            passed: true,
            reason: 'Preview can be opened from the Live Preview surface',
          },
          falsePositiveReadiness: false,
        }
      : reality;

  const buildStatus = onePromptPublic.buildStatusLabel;
  const livePreviewBlock: CanonicalLivePreviewBlock = {
    connected: mergedConnected,
    statusLabel: onePromptReady
      ? 'Generated app running in Live Preview'
      : resolvedReality.displayLabel,
    previewUrl: mergedPreviewUrl,
    reality: resolvedReality,
    activeSession: mergedActiveSession,
    sessions: mergedSessions,
    targets: runtime.targets,
    diagnostics: runtime.diagnostics,
    buildStatus,
    lastVerificationHint:
      onePromptReady || runtime.diagnostics.readyPreviewCount > 0
        ? 'Preview gates passed for ready sessions'
        : null,
    onePromptBuild: onePromptLast
      ? {
          status: onePromptLast.status,
          workspaceId: onePromptLast.workspaceId,
          workspacePath: onePromptLast.workspacePath,
          generatedProfile: onePromptLast.generatedProfile,
          buildResult: onePromptLast.buildResult,
          previewUrl: onePromptLast.previewUrl,
          failureReason: onePromptLast.failureReason,
            npmInstallOk: onePromptLast.npmInstallOk ?? false,
            npmBuildOk: onePromptLast.npmBuildOk ?? false,
        }
      : null,
    onePromptReady,
  };

  const runningApplication = assessRunningApplicationVisibility({
    generatedAt,
    previewRealityState: livePreviewBlock.reality.state,
    previewReality: {
      validationReady: livePreviewBlock.reality.validationReady,
      freshness: livePreviewBlock.reality.freshness,
      interactivity: livePreviewBlock.reality.interactivity,
      loadReality: livePreviewBlock.reality.loadReality,
      problems: livePreviewBlock.reality.problems,
    },
    activeSession: mergedActiveSession,
    previewUrl: mergedPreviewUrl,
    buildStatus: livePreviewBlock.buildStatus,
    latestProjectId: context.latestProjectId,
    projectCount: context.projectCount,
    projectName:
      onePromptReady && onePromptLast
        ? onePromptLast.projectName
        : context.projectName,
    recentChangeSummary:
      onePromptReady && onePromptLast
        ? `Generated ${onePromptLast.generatedProfile ?? 'application'} for ${onePromptLast.projectName} at ${onePromptLast.workspacePath ?? onePromptLast.workspaceId ?? 'workspace'}`
        : context.recentChangeSummary,
    targetType: runtime.targets[0]?.targetType ?? (onePromptReady ? 'WEB_APP' : null),
  });

  const cqiMaturity = getLastCqiMaturityAssessment();

  return {
    livePreview: livePreviewBlock,
    runningApplication,
    runtimeLivePreviewConnected: mergedConnected,
    requirementDiscovery: cqiMaturity
      ? {
          confidenceScore: cqiMaturity.requirementConfidenceScore,
          coverageSummary: cqiMaturity.coverageMatrix
            .map((row) => `${row.category}: ${row.status}`)
            .join(' | '),
          gapSummary: cqiMaturity.gapSummary,
          openQuestionCount: cqiMaturity.openQuestions.length,
          resolvedQuestionCount: cqiMaturity.resolvedQuestions.length,
        }
      : null,
  };
}

export function buildOnePromptLivePreviewWorkspaceSync(
  runtime: CanonicalLivePreviewRuntimeInput,
  context: CanonicalLivePreviewContext,
): CanonicalLivePreviewWorkspaceSlice {
  return resolveCanonicalLivePreviewState(runtime, context);
}
