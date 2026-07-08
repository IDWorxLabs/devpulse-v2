/**
 * Canonical Live Preview state — single merge path for preview runtime + one-prompt build.
 * Preview unlock follows Live Preview Gate authority only (AEP Phase 1).
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
  diagnosticPreviewUrl: string | null;
  limitedPreviewUrl: string | null;
  devServerRunning: boolean;
  livePreviewAvailable: boolean;
  livePreviewGateState: string | null;
  gateBlockerSummary: string | null;
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
    diagnosticPreviewUrl: string | null;
    limitedPreviewUrl: string | null;
    devServerRunning: boolean;
    livePreviewAvailable: boolean;
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

function buildLockedDevServerReality(
  base: LivePreviewRealityAssessment,
  gateState: string | null,
  gateSummary: string | null,
): LivePreviewRealityAssessment {
  const lockLabel = gateState ?? 'PREVIEW_LOCKED';
  return {
    ...base,
    state: lockLabel,
    displayLabel: 'App server running — Live Preview locked',
    summaryLines: [
      'Dev server is running (BUILD_COMPILED, FILES_GENERATED).',
      gateSummary ??
        'Live Preview remains locked while AiDevEngine completes launch evidence.',
    ],
    problems: gateSummary ? [gateSummary] : base.problems,
    recommendedActions: [
      'Wait for AiDevEngine to complete autonomous validation and repair.',
      'Do not treat the dev server URL as a launch-ready preview.',
    ],
    validationReady: false,
    validationReadyReason: 'Live Preview Gate has not unlocked preview',
    interactivity: {
      passed: false,
      reason: 'Preview is locked until gate unlocks',
    },
    availability: {
      passed: false,
      reason: 'Launch-ready preview is not available',
    },
    falsePositiveReadiness: true,
  };
}

function buildLimitedPreviewReality(
  base: LivePreviewRealityAssessment,
): LivePreviewRealityAssessment {
  return {
    ...base,
    state: 'LIMITED_PREVIEW_REVIEW_ONLY',
    displayLabel: 'Limited preview — review only, not launch-ready',
    summaryLines: [
      'A limited review preview is available.',
      'This is not launch-ready Live Preview — verification is still required.',
    ],
    validationReady: false,
    validationReadyReason: 'Limited preview is for internal review only',
    falsePositiveReadiness: true,
  };
}

export function resolveCanonicalLivePreviewState(
  runtime: CanonicalLivePreviewRuntimeInput,
  context: CanonicalLivePreviewContext,
): CanonicalLivePreviewWorkspaceSlice {
  const resolvedActiveProjectId = context.activeProjectId ?? getActiveProjectId();
  const onePromptPublic = getOnePromptLivePreviewPublicState(resolvedActiveProjectId);
  const onePromptLast = getLastOnePromptLivePreviewBuildResult(resolvedActiveProjectId);
  const livePreviewUnlocked = onePromptPublic.livePreviewAvailable === true;
  const devServerRunning = onePromptPublic.devServerRunning;
  const mergedPreviewUrl = livePreviewUnlocked ? onePromptPublic.previewUrl : null;
  const diagnosticPreviewUrl = onePromptPublic.diagnosticPreviewUrl;
  const limitedPreviewUrl = onePromptPublic.limitedPreviewUrl;
  const mergedConnected = livePreviewUnlocked || devServerRunning || runtime.connected;
  const normalizedSessions = normalizeSessions(runtime.sessions);
  const normalizedActiveSession = normalizeSession(runtime.activeSession);
  const mergedSessions =
    livePreviewUnlocked && onePromptLast?.previewUrl
      ? [buildOnePromptSession(onePromptLast), ...normalizedSessions]
      : normalizedSessions;
  const mergedActiveSession =
    livePreviewUnlocked && onePromptLast?.previewUrl
      ? buildOnePromptSession(onePromptLast)
      : normalizedActiveSession;

  const generatedAt = context.generatedAt ?? Date.now();
  const reality = assessLivePreviewReality({
    uiSurfacePresent: true,
    connected: mergedConnected,
    previewUrl: mergedPreviewUrl ?? limitedPreviewUrl,
    activeSession: mergedActiveSession,
    sessions: mergedSessions,
    diagnostics: runtime.diagnostics,
    latestProjectId: context.latestProjectId,
    projectCount: context.projectCount,
    generatedAt,
  });

  let resolvedReality = reality;
  if (limitedPreviewUrl && !livePreviewUnlocked) {
    resolvedReality = buildLimitedPreviewReality(reality);
  } else if (devServerRunning && !livePreviewUnlocked) {
    resolvedReality = buildLockedDevServerReality(
      reality,
      onePromptPublic.livePreviewGateState,
      onePromptPublic.gateBlockerSummary,
    );
  } else if (livePreviewUnlocked && mergedPreviewUrl) {
    const blueprintVisualReady = resolveBlueprintVisualValidationReady();
    const blueprintVisualAssessment = getLastBlueprintVisualAssessment();
    resolvedReality = {
      ...reality,
      state: 'PREVIEW_READY',
      displayLabel: 'Live Preview unlocked (gate approved)',
      summaryLines: [
        'Live Preview Gate approved this preview.',
        'Generated application is running and available for founder validation.',
      ],
      validationReady: true,
      validationReadyReason:
        blueprintVisualAssessment && blueprintVisualReady.validationReady
          ? blueprintVisualReady.validationReadyReason
          : 'Live Preview Gate unlocked preview with required evidence',
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
      problems:
        blueprintVisualAssessment && !blueprintVisualReady.validationReady
          ? [blueprintVisualReady.validationReadyReason]
          : reality.problems,
      recommendedActions:
        blueprintVisualAssessment && !blueprintVisualReady.validationReady
          ? ['Run Universal App Blueprint visual validation against Live Preview']
          : ['Interact with the running app in Live Preview'],
    };
  }

  const buildStatus = onePromptPublic.buildStatusLabel;
  const livePreviewBlock: CanonicalLivePreviewBlock = {
    connected: mergedConnected,
    statusLabel: livePreviewUnlocked
      ? 'Live Preview unlocked'
      : devServerRunning
        ? 'Dev server running — Live Preview locked'
        : resolvedReality.displayLabel,
    previewUrl: mergedPreviewUrl,
    diagnosticPreviewUrl,
    limitedPreviewUrl,
    devServerRunning,
    livePreviewAvailable: livePreviewUnlocked,
    livePreviewGateState: onePromptPublic.livePreviewGateState,
    gateBlockerSummary: onePromptPublic.gateBlockerSummary,
    reality: resolvedReality,
    activeSession: mergedActiveSession,
    sessions: mergedSessions,
    targets: runtime.targets,
    diagnostics: runtime.diagnostics,
    buildStatus,
    lastVerificationHint:
      livePreviewUnlocked
        ? 'Live Preview Gate unlocked — preview ready for founder validation'
        : devServerRunning
          ? 'Dev server running — preview locked until gate unlocks'
          : null,
    onePromptBuild: onePromptLast
      ? {
          status: onePromptLast.status,
          workspaceId: onePromptLast.workspaceId,
          workspacePath: onePromptLast.workspacePath,
          generatedProfile: onePromptLast.generatedProfile,
          buildResult: onePromptLast.buildResult,
          previewUrl: onePromptLast.livePreviewAvailable ? onePromptLast.previewUrl : null,
          diagnosticPreviewUrl: onePromptLast.diagnosticPreviewUrl,
          limitedPreviewUrl: onePromptLast.limitedPreviewUrl,
          devServerRunning: onePromptLast.devServerRunning,
          livePreviewAvailable: onePromptLast.livePreviewAvailable,
          failureReason: onePromptLast.failureReason,
          npmInstallOk: onePromptLast.npmInstallOk ?? false,
          npmBuildOk: onePromptLast.npmBuildOk ?? false,
        }
      : null,
    onePromptReady: livePreviewUnlocked,
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
    previewUrl: mergedPreviewUrl ?? limitedPreviewUrl,
    buildStatus: livePreviewBlock.buildStatus,
    latestProjectId: context.latestProjectId,
    projectCount: context.projectCount,
    projectName:
      livePreviewUnlocked && onePromptLast
        ? onePromptLast.projectName
        : context.projectName,
    recentChangeSummary:
      livePreviewUnlocked && onePromptLast
        ? `Generated ${onePromptLast.generatedProfile ?? 'application'} for ${onePromptLast.projectName} at ${onePromptLast.workspacePath ?? onePromptLast.workspaceId ?? 'workspace'}`
        : context.recentChangeSummary,
    targetType: runtime.targets[0]?.targetType ?? (livePreviewUnlocked ? 'WEB_APP' : null),
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
