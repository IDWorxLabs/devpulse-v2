/**
 * Live Preview Reality Authority — determines actual preview usability for founders.
 */

import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import type {
  LivePreviewDimensionResult,
  LivePreviewFeedEvent,
  LivePreviewRealityAssessment,
  LivePreviewRealityInput,
  LivePreviewRealityState,
} from './live-preview-reality-types.js';

const STATE_LABELS: Record<LivePreviewRealityState, string> = {
  NO_PREVIEW: 'No preview available',
  PREVIEW_STARTING: 'Preview starting',
  PREVIEW_LOADING: 'Preview loading',
  PREVIEW_VISIBLE: 'Preview visible',
  PREVIEW_INTERACTIVE: 'Preview interactive',
  PREVIEW_STALE: 'Preview stale',
  PREVIEW_DEGRADED: 'Preview degraded',
  PREVIEW_READY: 'Preview ready for validation',
};

function session(session: LivePreviewRealityInput['activeSession']): LivePreviewRealityInput['activeSession'] {
  return session;
}

function hasCapability(s: LivePreviewRealityInput['activeSession'], cap: string): boolean {
  return Boolean(s?.previewCapabilities?.includes(cap));
}

function isStale(input: LivePreviewRealityInput): boolean {
  const s = session(input.activeSession);
  if (!s) return false;
  if (input.projectCount === 0) return false;
  if (!input.latestProjectId) return false;
  return s.projectId !== input.latestProjectId;
}

function isBlocked(input: LivePreviewRealityInput): boolean {
  const s = session(input.activeSession);
  if (!s) return input.diagnostics.blockedPreviewCount > 0;
  return (
    s.previewState === 'PREVIEW_BLOCKED' ||
    (s.blockedReasons?.length ?? 0) > 0 ||
    input.diagnostics.blockedPreviewCount > 0
  );
}

function contentRendered(input: LivePreviewRealityInput, state: LivePreviewRealityState): boolean {
  const s = session(input.activeSession);
  if (!s?.previewUrl) return false;
  if (input.clientLoadError) return false;
  if (s.previewState !== 'PREVIEW_READY' && state !== 'PREVIEW_DEGRADED') return false;
  if (input.clientLoaded === false && state === 'PREVIEW_LOADING') return false;
  return ['PREVIEW_VISIBLE', 'PREVIEW_INTERACTIVE', 'PREVIEW_STALE', 'PREVIEW_DEGRADED', 'PREVIEW_READY'].includes(
    state,
  );
}

function isInteractive(input: LivePreviewRealityInput, state: LivePreviewRealityState): boolean {
  const s = session(input.activeSession);
  if (!s || !contentRendered(input, state)) return false;
  if (!hasCapability(s, 'INTERACTION_TESTING')) return false;
  if ((s.warnings?.length ?? 0) > 0 && state === 'PREVIEW_DEGRADED') return false;
  return state === 'PREVIEW_INTERACTIVE' || state === 'PREVIEW_READY';
}

function resolveState(input: LivePreviewRealityInput): LivePreviewRealityState {
  const s = session(input.activeSession);
  const hasRuntime = input.connected || input.sessions.length > 0 || input.diagnostics.registeredTargetCount > 0;

  if (!hasRuntime && !input.previewUrl) {
    return 'NO_PREVIEW';
  }

  if (isBlocked(input)) {
    return 'PREVIEW_DEGRADED';
  }

  if (!input.previewUrl) {
    return 'PREVIEW_STARTING';
  }

  if (!s || s.previewState !== 'PREVIEW_READY') {
    return 'PREVIEW_LOADING';
  }

  if (input.clientLoadError) {
    return 'PREVIEW_DEGRADED';
  }

  if (isStale(input)) {
    return 'PREVIEW_STALE';
  }

  const visible = hasCapability(s, 'LIVE_VIEW');
  const interactive =
    hasCapability(s, 'INTERACTION_TESTING') && (s.warnings?.length ?? 0) === 0 && (s.blockedReasons?.length ?? 0) === 0;
  const validationCaps =
    hasCapability(s, 'VISUAL_VERIFICATION') || hasCapability(s, 'SELF_VISION') || hasCapability(s, 'SCREEN_CAPTURE');

  if (visible && interactive && validationCaps) {
    return 'PREVIEW_READY';
  }

  if (visible && interactive) {
    return 'PREVIEW_INTERACTIVE';
  }

  if (visible) {
    return 'PREVIEW_VISIBLE';
  }

  if ((s.warnings?.length ?? 0) > 0) {
    return 'PREVIEW_DEGRADED';
  }

  return 'PREVIEW_LOADING';
}

function buildSummary(state: LivePreviewRealityState, input: LivePreviewRealityInput): string[] {
  const lines: string[] = [];
  switch (state) {
    case 'NO_PREVIEW':
      lines.push('No live preview session is running.');
      lines.push('Start or select a project to open a preview.');
      break;
    case 'PREVIEW_STARTING':
      lines.push('Preview environment is starting.');
      lines.push('Waiting for a preview URL and runtime connection.');
      break;
    case 'PREVIEW_LOADING':
      lines.push('Preview URL is available.');
      lines.push('Application content is still loading.');
      break;
    case 'PREVIEW_VISIBLE':
      lines.push('Preview loaded successfully.');
      lines.push('Content is visible in the preview surface.');
      break;
    case 'PREVIEW_INTERACTIVE':
      lines.push('Preview loaded successfully.');
      lines.push('User interaction available.');
      break;
    case 'PREVIEW_STALE':
      lines.push('Preview loaded but may not match the latest project.');
      lines.push('Latest project state was not detected in the active session.');
      break;
    case 'PREVIEW_DEGRADED':
      lines.push('Preview exists but is not fully usable.');
      if (input.clientLoadError) {
        lines.push('Preview frame failed to load content.');
      } else {
        lines.push('Interaction or runtime checks reported issues.');
      }
      break;
    case 'PREVIEW_READY':
      lines.push('Preview loaded successfully.');
      lines.push('User interaction available.');
      lines.push('Latest project state detected.');
      break;
    default:
      break;
  }
  return lines;
}

function buildProblems(state: LivePreviewRealityState, input: LivePreviewRealityInput): string[] {
  const problems: string[] = [];
  const s = session(input.activeSession);

  if (state === 'NO_PREVIEW') {
    problems.push('No preview can be opened right now.');
  }
  if (state === 'PREVIEW_STARTING') {
    problems.push('Preview is booting — URL not available yet.');
  }
  if (state === 'PREVIEW_LOADING') {
    problems.push('Preview has not finished loading application content.');
  }
  if (state === 'PREVIEW_STALE') {
    problems.push('Preview does not reflect latest project changes.');
  }
  if (state === 'PREVIEW_DEGRADED') {
    if (input.clientLoadError) {
      problems.push('Preview loaded but content failed to render in the frame.');
    } else {
      problems.push('Preview loaded but interaction or runtime checks failed.');
    }
    if (s?.blockedReasons?.length) {
      problems.push(...s.blockedReasons.slice(0, 2));
    }
    if (s?.warnings?.length) {
      problems.push(...s.warnings.slice(0, 2));
    }
  }
  if (state === 'PREVIEW_VISIBLE' && !hasCapability(s, 'INTERACTION_TESTING')) {
    problems.push('Preview is visible but interaction testing is not available.');
  }
  return problems;
}

function buildActions(state: LivePreviewRealityState): string[] {
  switch (state) {
    case 'NO_PREVIEW':
      return ['Start or select a project', 'Open Command Center for preview guidance'];
    case 'PREVIEW_STARTING':
      return ['Wait for preview environment', 'Restart preview', 'Check project selection'];
    case 'PREVIEW_LOADING':
      return ['Refresh preview', 'Wait for application load', 'Open preview in new tab'];
    case 'PREVIEW_STALE':
      return ['Restart preview', 'Rebuild project', 'Refresh preview'];
    case 'PREVIEW_DEGRADED':
      return ['Restart preview', 'Refresh preview', 'Open validation report'];
    case 'PREVIEW_VISIBLE':
      return ['Refresh preview', 'Open preview in new tab'];
    case 'PREVIEW_INTERACTIVE':
      return ['Run Founder Testing validation', 'Refresh preview if behavior looks wrong'];
    case 'PREVIEW_READY':
      return ['Run Founder Testing validation', 'Open validation report'];
    default:
      return ['Refresh preview'];
  }
}

function buildOperatorFeed(state: LivePreviewRealityState, input: LivePreviewRealityInput): LivePreviewFeedEvent[] {
  const events: LivePreviewFeedEvent[] = [
    {
      section: 'Execution',
      action: 'Preview requested',
      detail: 'Checking whether a live preview can be opened for this project.',
      status: 'Completed',
    },
  ];

  if (state === 'NO_PREVIEW') {
    events.push({
      section: 'Execution',
      action: 'No preview available',
      detail: 'No preview session or target is registered yet.',
      status: 'Blocked',
    });
    return events;
  }

  events.push({
    section: 'Execution',
    action: 'Preview environment starting',
    detail: 'Preview runtime and session registration detected.',
    status: state === 'PREVIEW_STARTING' ? 'Active' : 'Completed',
  });

  if (input.previewUrl) {
    events.push({
      section: 'Execution',
      action: 'Preview loading application',
      detail: 'Preview URL assigned — loading application content.',
      status: state === 'PREVIEW_LOADING' ? 'Active' : 'Completed',
    });
  }

  if (contentRendered(input, state)) {
    events.push({
      section: 'Verification',
      action: 'Preview rendering content',
      detail: 'Application content is visible in the preview surface.',
      status: 'Completed',
    });
  }

  if (isInteractive(input, state)) {
    events.push({
      section: 'Verification',
      action: 'Preview interaction check passed',
      detail: 'Preview supports interaction testing for founder validation.',
      status: 'Completed',
    });
  } else if (state === 'PREVIEW_DEGRADED' || state === 'PREVIEW_VISIBLE') {
    events.push({
      section: 'Verification',
      action: 'Preview loaded but interaction failed',
      detail: 'Preview is not fully interactive for validation.',
      status: 'Warning',
    });
  }

  if (state === 'PREVIEW_STALE') {
    events.push({
      section: 'Approvals',
      action: 'Preview freshness check failed',
      detail: 'Active preview does not match the latest project state.',
      status: 'Warning',
    });
  } else if (state === 'PREVIEW_READY' || state === 'PREVIEW_INTERACTIVE') {
    events.push({
      section: 'Verification',
      action: 'Preview freshness check passed',
      detail: 'Active preview matches the current project context.',
      status: 'Completed',
    });
  }

  if (state === 'PREVIEW_DEGRADED') {
    events.push({
      section: 'Approvals',
      action: 'Preview marked degraded',
      detail: 'Preview exists but is not validation-ready.',
      status: 'Blocked',
    });
  }

  if (state === 'PREVIEW_READY') {
    events.push({
      section: 'Learning',
      action: 'Preview ready for validation',
      detail: 'Live preview is visible, interactive, current, and usable for Founder Testing.',
      status: 'Completed',
    });
  }

  return events;
}

function falsePositiveReadiness(input: LivePreviewRealityInput, state: LivePreviewRealityState): boolean {
  const optimisticSignals =
    input.connected || Boolean(input.previewUrl) || input.diagnostics.previewSessionCount > 0;
  const actuallyReady = state === 'PREVIEW_READY';
  return optimisticSignals && !actuallyReady && state !== 'NO_PREVIEW';
}

export function assessLivePreviewReality(input: LivePreviewRealityInput): LivePreviewRealityAssessment {
  const state = resolveState(input);
  const summaryLines = buildSummary(state, input);
  const problems = buildProblems(state, input);
  const recommendedActions = buildActions(state);

  const canOpen =
    input.uiSurfacePresent &&
    (input.connected || Boolean(input.previewUrl) || input.sessions.length > 0 || input.diagnostics.registeredTargetCount > 0);

  const availability: LivePreviewDimensionResult = {
    passed: canOpen && state !== 'NO_PREVIEW',
    reason: canOpen
      ? state === 'NO_PREVIEW'
        ? 'Preview surface exists but no session is openable'
        : 'Preview can be opened from the Live Preview surface'
      : 'No preview surface or runtime path available',
  };

  const loadPass = contentRendered(input, state);
  const loadReality: LivePreviewDimensionResult = {
    passed: loadPass,
    reason: loadPass
      ? 'Preview content is rendered'
      : state === 'PREVIEW_LOADING' || state === 'PREVIEW_STARTING'
        ? 'Preview has not finished loading content'
        : 'No rendered preview content detected',
  };

  const interactivePass = isInteractive(input, state);
  const interactivity: LivePreviewDimensionResult = {
    passed: interactivePass,
    reason: interactivePass
      ? 'Preview is usable for founder interaction'
      : state === 'PREVIEW_VISIBLE'
        ? 'Preview is visible but not fully interactive'
        : 'Preview is not interactive yet',
  };

  const freshPass = !isStale(input) && state !== 'PREVIEW_STALE';
  const freshness: LivePreviewDimensionResult = {
    passed: freshPass && state !== 'NO_PREVIEW' && state !== 'PREVIEW_STARTING',
    reason: freshPass
      ? input.projectCount === 0
        ? 'No project mismatch detected'
        : 'Preview matches latest project context'
      : 'Preview does not reflect latest project state',
  };

  const validationReady = state === 'PREVIEW_READY';
  const validationReadyReason = validationReady
    ? 'Preview is visible, interactive, current, and validation-capable'
    : problems[0] ?? 'Preview is not validation-ready';

  return {
    state,
    displayLabel: STATE_LABELS[state],
    summaryLines,
    problems,
    recommendedActions,
    availability,
    loadReality,
    interactivity,
    freshness,
    validationReady,
    validationReadyReason,
    operatorFeedEvents: buildOperatorFeed(state, input),
    falsePositiveReadiness: falsePositiveReadiness(input, state),
  };
}

export function buildLivePreviewRealityInputFromWorkspace(
  workspace: ProductWorkspaceSnapshot,
  uiSurfacePresent = true,
): LivePreviewRealityInput {
  const lp = workspace.livePreview;
  const active = lp.activeSession
    ? {
        previewSessionId: lp.activeSession.previewSessionId,
        projectId: lp.activeSession.projectId,
        previewState: lp.activeSession.previewState,
        previewUrl: lp.activeSession.previewUrl,
        previewCapabilities: lp.activeSession.previewCapabilities,
        warnings: lp.activeSession.warnings,
        blockedReasons: lp.activeSession.blockedReasons,
        createdAt: lp.activeSession.createdAt,
        previewTargetName: lp.activeSession.previewTargetName,
      }
    : null;

  return {
    uiSurfacePresent,
    connected: lp.connected,
    previewUrl: lp.previewUrl,
    activeSession: active,
    sessions: lp.sessions.map((s) => ({
      previewSessionId: s.previewSessionId,
      projectId: s.projectId,
      previewState: s.previewState,
      previewUrl: s.previewUrl,
      previewCapabilities: s.previewCapabilities,
      warnings: s.warnings,
      blockedReasons: s.blockedReasons,
      createdAt: s.createdAt,
      previewTargetName: s.previewTargetName,
    })),
    diagnostics: lp.diagnostics,
    latestProjectId: workspace.projectMemory.vaultState.latestProjectId,
    projectCount: workspace.projectMemory.vaultState.projectCount,
    generatedAt: workspace.generatedAt,
  };
}

export function livePreviewStatusLabelFromReality(assessment: LivePreviewRealityAssessment): string {
  return assessment.displayLabel;
}
