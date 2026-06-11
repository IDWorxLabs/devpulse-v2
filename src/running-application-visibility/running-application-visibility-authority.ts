/**
 * Running Application Visibility Authority — what app/build is running and whether it is testable.
 * Uses Live Preview Reality as one input; does not duplicate preview load/interaction logic.
 */

import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';
import type {
  BuildOutputInfo,
  BuildOutputType,
  RequestAlignmentState,
  RunningAppOutputState,
  RunningApplicationFeedEvent,
  RunningApplicationVisibilityAssessment,
  RunningApplicationVisibilityInput,
  TestReadinessState,
} from './running-application-visibility-types.js';

const OUTPUT_STATE_LABELS: Record<RunningAppOutputState, string> = {
  NO_RUNNING_APP: 'No running application',
  OUTPUT_STARTING: 'Output starting',
  OUTPUT_VISIBLE: 'Output visible',
  OUTPUT_INTERACTIVE: 'Output interactive',
  OUTPUT_STALE: 'Output stale',
  OUTPUT_DEGRADED: 'Output degraded',
  OUTPUT_READY_FOR_TESTING: 'Ready for testing',
};

function mapPreviewToOutputState(
  previewState: string,
  input: RunningApplicationVisibilityInput,
): RunningAppOutputState {
  if (previewState === 'NO_PREVIEW') return 'NO_RUNNING_APP';
  if (previewState === 'PREVIEW_STARTING') return 'OUTPUT_STARTING';
  if (previewState === 'PREVIEW_LOADING') return 'OUTPUT_VISIBLE';
  if (previewState === 'PREVIEW_VISIBLE') return 'OUTPUT_VISIBLE';
  if (previewState === 'PREVIEW_INTERACTIVE') return 'OUTPUT_INTERACTIVE';
  if (previewState === 'PREVIEW_STALE') return 'OUTPUT_STALE';
  if (previewState === 'PREVIEW_DEGRADED') return 'OUTPUT_DEGRADED';
  if (previewState === 'PREVIEW_READY') return 'OUTPUT_READY_FOR_TESTING';

  if (!input.previewUrl && !input.activeSession) return 'NO_RUNNING_APP';
  if (!input.previewUrl) return 'OUTPUT_STARTING';
  return 'OUTPUT_VISIBLE';
}

function resolveAlignment(input: RunningApplicationVisibilityInput): {
  state: RequestAlignmentState;
  reason: string;
} {
  const session = input.activeSession;
  if (!session) {
    return {
      state: input.projectCount === 0 ? 'UNKNOWN' : 'NOT_ALIGNED',
      reason:
        input.projectCount === 0
          ? 'No active preview session and no project context to compare.'
          : 'No active preview session linked to a project.',
    };
  }

  if (input.projectCount === 0) {
    return {
      state: 'UNKNOWN',
      reason: 'Preview session exists, but no stored project context is available yet.',
    };
  }

  if (!input.latestProjectId) {
    return {
      state: 'UNKNOWN',
      reason: 'Latest project is not confirmed — alignment cannot be verified.',
    };
  }

  if (session.projectId !== input.latestProjectId) {
    return {
      state: 'STALE',
      reason: `Active preview targets project ${session.projectId}, but the latest project is ${input.latestProjectId}.`,
    };
  }

  if (input.previewReality.validationReady) {
    return {
      state: 'ALIGNED',
      reason: 'Active preview matches the latest project and preview readiness checks passed.',
    };
  }

  if (input.previewReality.loadReality.passed) {
    return {
      state: 'PARTIALLY_ALIGNED',
      reason: 'Preview is visible, but latest generated project state is not fully confirmed.',
    };
  }

  return {
    state: 'PARTIALLY_ALIGNED',
    reason: 'Preview session is registered, but output readiness is not fully confirmed.',
  };
}

function resolveTestReadiness(
  outputState: RunningAppOutputState,
  alignment: RequestAlignmentState,
  input: RunningApplicationVisibilityInput,
): { state: TestReadinessState; reason: string } {
  if (outputState === 'NO_RUNNING_APP') {
    return { state: 'NOT_TESTABLE', reason: 'No running application is available to test.' };
  }
  if (outputState === 'OUTPUT_STARTING') {
    return { state: 'STARTING', reason: 'Build or preview output is still being prepared.' };
  }
  if (outputState === 'OUTPUT_STALE' || alignment === 'STALE') {
    return { state: 'STALE_TEST_TARGET', reason: 'Visible output may not reflect the latest project or request.' };
  }
  if (outputState === 'OUTPUT_DEGRADED') {
    return {
      state: 'TESTABLE_WITH_WARNINGS',
      reason: 'Output is visible but has known problems — review before final sign-off.',
    };
  }
  if (outputState === 'OUTPUT_READY_FOR_TESTING') {
    return { state: 'TESTABLE', reason: 'Output is visible, current, interactive, and meaningful to test.' };
  }
  if (outputState === 'OUTPUT_INTERACTIVE') {
    return {
      state: alignment === 'ALIGNED' ? 'TESTABLE' : 'TESTABLE_WITH_WARNINGS',
      reason:
        alignment === 'ALIGNED'
          ? 'Application appears usable for testing.'
          : 'Application is interactive, but request alignment is not fully confirmed.',
    };
  }
  return {
    state: 'TESTABLE_WITH_WARNINGS',
    reason: 'Something is visible, but full test readiness is not proven.',
  };
}

function resolveOutputType(input: RunningApplicationVisibilityInput, outputState: RunningAppOutputState): BuildOutputType {
  if (outputState === 'NO_RUNNING_APP') return 'none';
  if (outputState === 'OUTPUT_DEGRADED') return 'degraded_output';
  if (input.targetType === 'STATIC_PAGE') return 'static_shell';
  if (input.activeSession?.previewState === 'PREVIEW_READY') return 'preview_app';
  if (input.previewUrl) return 'preview_app';
  return 'static_shell';
}

function withPreviewLabel(label: string): string {
  return /\bpreview\b/i.test(label) ? label : `${label} Preview`;
}

function buildRunningAppTitle(input: RunningApplicationVisibilityInput): string {
  const target = input.activeSession?.previewTargetName;
  const name = input.projectName;
  if (name && target) return `${name} — ${withPreviewLabel(target)}`;
  if (target) return withPreviewLabel(target);
  if (name) return withPreviewLabel(name);
  return 'No running application';
}

function buildChangeSummary(input: RunningApplicationVisibilityInput): string {
  if (input.recentChangeSummary) return input.recentChangeSummary;
  if (input.activeSession?.createdAt) {
    return `Preview session started for ${input.activeSession.previewTargetName || 'application target'}.`;
  }
  return 'No recent build change summary available.';
}

function buildSummary(
  outputState: RunningAppOutputState,
  alignment: RequestAlignmentState,
  testReadiness: TestReadinessState,
  input: RunningApplicationVisibilityInput,
): string[] {
  const lines: string[] = [];
  lines.push(`Running application: ${buildRunningAppTitle(input)}`);
  lines.push(`Output state: ${outputState}`);
  lines.push(`Request alignment: ${alignment}`);
  lines.push(`Testing status: ${testReadiness}`);
  if (input.buildStatus) {
    lines.push(`Build output: ${input.buildStatus}`);
  }
  return lines;
}

function buildWarnings(input: RunningApplicationVisibilityInput, outputState: RunningAppOutputState): string[] {
  const warnings = [...input.previewReality.problems];
  if (input.activeSession?.warnings?.length) {
    warnings.push(...input.activeSession.warnings.slice(0, 2));
  }
  if (outputState === 'OUTPUT_STALE') {
    warnings.push('Visible app may not match the latest project or request.');
  }
  return [...new Set(warnings)];
}

function buildRecommendedAction(
  testReadiness: TestReadinessState,
  outputState: RunningAppOutputState,
): string {
  if (testReadiness === 'TESTABLE') return 'Run Founder Testing or review the running application now.';
  if (testReadiness === 'STALE_TEST_TARGET') return 'Restart preview or rebuild before testing.';
  if (testReadiness === 'TESTABLE_WITH_WARNINGS') {
    return 'Run Founder Testing or refresh preview before final review.';
  }
  if (outputState === 'OUTPUT_STARTING') return 'Wait for build output, then open Live Preview.';
  if (outputState === 'NO_RUNNING_APP') return 'Start or select a project to launch a preview.';
  return 'Refresh preview and confirm the active target before testing.';
}

function buildOperatorFeed(
  outputState: RunningAppOutputState,
  alignment: RequestAlignmentState,
  testReadiness: TestReadinessState,
  input: RunningApplicationVisibilityInput,
): RunningApplicationFeedEvent[] {
  const events: RunningApplicationFeedEvent[] = [
    {
      section: 'Execution',
      action: 'Checking running application',
      detail: 'Identifying what application or build output is currently active.',
      status: 'Completed',
    },
  ];

  if (input.activeSession?.previewTargetName) {
    events.push({
      section: 'Execution',
      action: 'Reading active preview target',
      detail: `Active target: ${input.activeSession.previewTargetName}`,
      status: 'Completed',
      evidence: input.activeSession.previewTargetName,
    });
  } else {
    events.push({
      section: 'Execution',
      action: 'Reading active preview target',
      detail: 'No active preview target is registered.',
      status: outputState === 'NO_RUNNING_APP' ? 'Blocked' : 'Warning',
    });
  }

  events.push({
    section: 'Verification',
    action: 'Checking build output state',
    detail: input.buildStatus || 'No build output reported yet.',
    status: outputState === 'OUTPUT_STARTING' ? 'Active' : 'Completed',
    evidence: input.buildStatus || undefined,
  });

  events.push({
    section: 'Verification',
    action: 'Comparing output to latest request',
    detail: `Request alignment: ${alignment}`,
    status: alignment === 'STALE' || alignment === 'NOT_ALIGNED' ? 'Warning' : 'Completed',
  });

  events.push({
    section: 'Approvals',
    action: 'Verifying test readiness',
    detail: `Testing status: ${testReadiness}`,
    status:
      testReadiness === 'TESTABLE'
        ? 'Completed'
        : testReadiness === 'NOT_TESTABLE'
          ? 'Blocked'
          : 'Warning',
  });

  if (outputState === 'OUTPUT_READY_FOR_TESTING' && testReadiness === 'TESTABLE') {
    events.push({
      section: 'Learning',
      action: 'Running application ready for review',
      detail: 'The visible application is current, interactive, and ready for founder testing.',
      status: 'Completed',
    });
  }

  if (outputState === 'OUTPUT_STALE' || alignment === 'STALE') {
    events.push({
      section: 'Approvals',
      action: 'Running application stale or degraded',
      detail: 'Visible output may not match the latest project or request.',
      status: 'Warning',
    });
  }

  if (outputState === 'OUTPUT_DEGRADED') {
    events.push({
      section: 'Approvals',
      action: 'Running application stale or degraded',
      detail: 'Output is visible but has known problems.',
      status: 'Blocked',
    });
  }

  return events;
}

export function assessRunningApplicationVisibility(
  input: RunningApplicationVisibilityInput,
): RunningApplicationVisibilityAssessment {
  const outputState = mapPreviewToOutputState(input.previewRealityState, input);
  const alignmentResult = resolveAlignment(input);
  const testResult = resolveTestReadiness(outputState, alignmentResult.state, input);
  const buildOutput: BuildOutputInfo = {
    lastBuildLabel: input.buildStatus || 'No build output reported',
    buildState: input.activeSession?.previewState ?? 'none',
    lastUpdatedAt: input.activeSession?.createdAt ?? null,
    outputType: resolveOutputType(input, outputState),
    changeSummary: buildChangeSummary(input),
  };

  const warnings = buildWarnings(input, outputState);
  const runningAppTitle = buildRunningAppTitle(input);

  return {
    outputState,
    outputStateLabel: OUTPUT_STATE_LABELS[outputState],
    activeApplication: {
      projectId: input.activeSession?.projectId ?? input.latestProjectId,
      projectName: input.projectName,
      previewTargetName: input.activeSession?.previewTargetName ?? null,
      activeRouteView: 'live-preview',
      sessionId: input.activeSession?.previewSessionId ?? null,
    },
    buildOutput,
    requestAlignment: alignmentResult.state,
    alignmentReason: alignmentResult.reason,
    testReadiness: testResult.state,
    testReadinessReason: testResult.reason,
    recommendedAction: buildRecommendedAction(testResult.state, outputState),
    runningAppTitle,
    summaryLines: buildSummary(outputState, alignmentResult.state, testResult.state, input),
    warnings,
    operatorFeedEvents: buildOperatorFeed(outputState, alignmentResult.state, testResult.state, input),
    identifiable: Boolean(input.activeSession?.previewTargetName || input.projectName),
    outputStateExplicit: true,
    buildOutputVisible: Boolean(input.buildStatus && input.buildStatus !== 'No build output reported yet'),
    alignmentHonest: alignmentResult.state !== 'ALIGNED' || input.previewReality.validationReady,
    testReadinessExplicit: testResult.state !== 'NOT_TESTABLE' || outputState === 'NO_RUNNING_APP',
    staleDetected: outputState === 'OUTPUT_STALE' || alignmentResult.state === 'STALE',
    degradedDetected: outputState === 'OUTPUT_DEGRADED',
    readyForTesting: outputState === 'OUTPUT_READY_FOR_TESTING' && testResult.state === 'TESTABLE',
  };
}

export function buildRunningApplicationVisibilityInputFromWorkspace(
  workspace: ProductWorkspaceSnapshot,
): RunningApplicationVisibilityInput {
  const lp = workspace.livePreview;
  const reality = lp.reality;
  const session = lp.activeSession;
  const latestProject =
    workspace.projectMemory.projects.find((p) => p.projectId === workspace.projectMemory.vaultState.latestProjectId) ??
    workspace.projectMemory.projects[0] ??
    null;
  const targetType = lp.targets[0]?.targetType ?? null;
  const recentFacts = latestProject?.recentFacts ?? [];
  const recentChangeSummary =
    recentFacts.length > 0
      ? `Latest known change: ${recentFacts[recentFacts.length - 1]}`
      : latestProject?.summary ?? null;

  return {
    generatedAt: workspace.generatedAt,
    previewRealityState: reality.state,
    previewReality: {
      validationReady: reality.validationReady,
      freshness: reality.freshness,
      interactivity: reality.interactivity,
      loadReality: reality.loadReality,
      problems: reality.problems,
    },
    activeSession: session
      ? {
          previewSessionId: session.previewSessionId,
          projectId: session.projectId,
          previewState: session.previewState,
          previewUrl: session.previewUrl,
          previewTargetName: session.previewTargetName,
          createdAt: session.createdAt,
          warnings: session.warnings,
          blockedReasons: session.blockedReasons,
        }
      : null,
    previewUrl: lp.previewUrl,
    buildStatus: lp.buildStatus,
    latestProjectId: workspace.projectMemory.vaultState.latestProjectId,
    projectCount: workspace.projectMemory.vaultState.projectCount,
    projectName: latestProject?.name ?? null,
    recentChangeSummary,
    targetType,
  };
}

export function assessRunningApplicationVisibilityFromWorkspace(
  workspace: ProductWorkspaceSnapshot,
): RunningApplicationVisibilityAssessment {
  return assessRunningApplicationVisibility(buildRunningApplicationVisibilityInputFromWorkspace(workspace));
}
