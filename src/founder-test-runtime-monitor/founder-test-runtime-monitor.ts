/**
 * Founder Test Runtime Monitor — runtime observability orchestrator (V1).
 */

import { FOUNDER_TEST_ALREADY_RUNNING, FOUNDER_TEST_RUNTIME_STAGES } from './founder-test-runtime-registry.js';
import type {
  BeginFounderTestRuntimeResult,
  FounderTestRuntimeFeedEvent,
  FounderTestRuntimeSnapshot,
  FounderTestRuntimeStageRecord,
  FounderTestRuntimeState,
} from './founder-test-runtime-types.js';
import { appendRuntimeFeedEvent, buildRuntimeFeed, resetRuntimeFeedCounterForTests } from './runtime-feed-builder.js';
import { recordFounderTestRuntimeSnapshot, resetFounderTestRuntimeHistoryForTests } from './runtime-history.js';
import { estimateFounderTestProgress, formatDurationClock } from './runtime-progress-estimator.js';
import {
  analyzeArtifactBuildSubstepStall,
  createLaunchReadinessArtifactBuildTraceBridge,
  getLastFailedArtifactSubstep,
  getLastSuccessfulArtifactSubstep,
  markArtifactBuildSubstepSlowEmitted,
  markArtifactBuildSubstepStallEmitted,
  resetLaunchReadinessArtifactBuildTracerForTests,
  shouldEmitArtifactBuildSubstepSlow,
  shouldEmitArtifactBuildSubstepStall,
} from './launch-readiness-artifact-build-tracer.js';
import {
  appendRuntimeTraceEvent,
  resetRuntimeTraceCounterForTests,
  resolveNextExpectedOperation,
  resolveTraceStageStatus,
} from './runtime-trace-builder.js';
import type { FounderTestRuntimeTraceEvent, FounderTestTraceEventStatus } from './founder-test-runtime-types.js';
import {
  buildFounderTestRuntimeMonitorReport,
  buildFounderTestRuntimeMonitorReportMarkdown,
} from './runtime-report-builder.js';
import { analyzeRuntimeStall } from './runtime-stall-detector.js';
import {
  analyzeStage2CompletionGap,
  resolveChatStressRuntimeFields,
  resolveIntakeValidationNextExpected,
} from './stage2-completion-tracker.js';
import {
  getFounderTestHandlerLastAliveAt,
  isFounderTestHandlerAlive,
  markFounderTestHandlerAlive,
  resetFounderTestRunResultStoreForTests,
} from './founder-test-run-result-store.js';
import { reconcilePublicFounderTestRuntimeSnapshot } from './founder-test-complete-state-truth.js';
import {
  createInitialStageRecords,
  markStageComplete,
  markStageRunning,
  touchStageHeartbeat,
} from './runtime-stage-tracker.js';

interface ActiveRuntimeSession {
  runId: string;
  state: FounderTestRuntimeState;
  startedAt: string;
  endedAt: string | null;
  stages: FounderTestRuntimeStageRecord[];
  feedEvents: FounderTestRuntimeFeedEvent[];
  traceEvents: FounderTestRuntimeTraceEvent[];
  stallWarningEmitted: boolean;
  slowTraceEmitted: boolean;
  stallTraceEmitted: boolean;
  lastHeartbeatAt: string;
  currentOperation: string | null;
  lastCompletedOperation: string | null;
  nextExpectedOperation: string | null;
  lastSuccessfulOperation: string | null;
}

let activeSession: ActiveRuntimeSession | null = null;
const completedSnapshots: FounderTestRuntimeSnapshot[] = [];
const publishedSnapshotsByRunId = new Map<string, FounderTestRuntimeSnapshot>();

export const FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS =
  'FOUNDER_TEST_ACTIVE_RUN_RESULT_BINDING_V1_PASS';

function publishRuntimeSnapshot(snapshot: FounderTestRuntimeSnapshot): void {
  if (!snapshot.runId || snapshot.state === 'IDLE') return;
  publishedSnapshotsByRunId.set(snapshot.runId, snapshot);
}

export function resetFounderTestRuntimeMonitorForTests(): void {
  activeSession = null;
  completedSnapshots.length = 0;
  publishedSnapshotsByRunId.clear();
  resetRuntimeFeedCounterForTests();
  resetRuntimeTraceCounterForTests();
  resetFounderTestRuntimeHistoryForTests();
  resetLaunchReadinessArtifactBuildTracerForTests();
  resetFounderTestRunResultStoreForTests();
}

function emitSessionTrace(input: {
  operationId: string;
  stageId?: string | null;
  operationLabel: string;
  status: FounderTestTraceEventStatus;
}): void {
  if (!activeSession) return;
  const result = appendRuntimeTraceEvent({
    events: activeSession.traceEvents,
    operationId: input.operationId,
    stageId: input.stageId,
    operationLabel: input.operationLabel,
    status: input.status,
  });
  activeSession.traceEvents = result.events;

  if (input.status === 'RUNNING' || input.status === 'SLOW' || input.status === 'STALLED') {
    activeSession.currentOperation = input.operationLabel;
  }

  if (input.status === 'PASSED' || input.status === 'COMPLETE') {
    activeSession.lastCompletedOperation = input.operationLabel;
    activeSession.lastSuccessfulOperation = input.operationLabel;
    if (input.status === 'COMPLETE' || input.operationId === 'runtime-completed') {
      activeSession.currentOperation = input.operationLabel;
    }
    if (input.stageId === 'INTAKE_VALIDATION') {
      activeSession.nextExpectedOperation = resolveIntakeValidationNextExpected(
        activeSession.traceEvents,
      );
    } else {
      activeSession.nextExpectedOperation = resolveNextExpectedOperation({
        operationId: input.operationId,
        stageId: input.stageId,
      });
    }
  }

  if (input.status === 'FAILED') {
    activeSession.lastCompletedOperation = input.operationLabel;
    activeSession.nextExpectedOperation = null;
  }
}

export function emitFounderTestRuntimeTrace(input: {
  operationId: string;
  stageId?: string | null;
  operationLabel: string;
  status: FounderTestTraceEventStatus;
}): FounderTestRuntimeSnapshot {
  emitSessionTrace(input);
  return composeSnapshot(activeSession);
}

function buildTraceFields(
  session: ActiveRuntimeSession,
  runtimeState: FounderTestRuntimeState,
  stallHealth: string,
): Pick<
  FounderTestRuntimeSnapshot,
  | 'currentOperation'
  | 'lastCompletedOperation'
  | 'nextExpectedOperation'
  | 'lastSuccessfulOperation'
  | 'traceStageStatus'
  | 'traceEvents'
> {
  const runningStage = session.stages.find((stage) => stage.status === 'RUNNING');
  let nextFromStage =
    session.nextExpectedOperation ??
    resolveNextExpectedOperation({ stageId: runningStage?.stageId ?? null });
  if (runningStage?.stageId === 'INTAKE_VALIDATION') {
    nextFromStage = resolveIntakeValidationNextExpected(session.traceEvents);
  }

  return {
    currentOperation: session.currentOperation,
    lastCompletedOperation: session.lastCompletedOperation,
    nextExpectedOperation: nextFromStage,
    lastSuccessfulOperation: session.lastSuccessfulOperation,
    traceStageStatus: resolveTraceStageStatus({ runtimeState, stallHealth }),
    traceEvents: [...session.traceEvents],
  };
}

function buildUiSummary(snapshot: Omit<FounderTestRuntimeSnapshot, 'uiSummary'>): FounderTestRuntimeSnapshot['uiSummary'] {
  const progress = snapshot.progress;
  if (snapshot.state === 'IDLE') {
    return {
      headline: 'Ready to run Founder Test',
      stageLine: 'Press Run Founder Test to begin',
      elapsedLine: 'Elapsed: 00:00',
      remainingLine: 'Remaining: —',
    };
  }
  if (snapshot.state === 'COMPLETE') {
    return {
      headline: 'Founder Test Complete',
      stageLine: 'All stages finished',
      elapsedLine: `Elapsed: ${formatDurationClock(progress.elapsedMs)}`,
      remainingLine: 'Remaining: 00:00',
    };
  }
  if (snapshot.state === 'FAILED') {
    return {
      headline: 'Founder Test Failed',
      stageLine: progress.currentStageLabel ?? 'Execution stopped',
      elapsedLine: `Elapsed: ${formatDurationClock(progress.elapsedMs)}`,
      remainingLine: 'Remaining: —',
    };
  }

  const headline =
    snapshot.state === 'STALLED'
      ? 'Founder Test may be stalled'
      : snapshot.state === 'STARTING'
        ? 'Starting Founder Test...'
        : 'Running Founder Test...';

  return {
    headline,
    stageLine: `Stage ${progress.currentStageOrder}/${progress.totalStages} — ${progress.currentStageLabel ?? 'Initializing'}`,
    elapsedLine: `Elapsed: ${formatDurationClock(progress.elapsedMs)}`,
    remainingLine:
      progress.estimatedRemainingMs != null
        ? `Remaining: ~${formatDurationClock(progress.estimatedRemainingMs)}`
        : 'Remaining: —',
  };
}

function composeSnapshot(session: ActiveRuntimeSession | null, nowMs = Date.now()): FounderTestRuntimeSnapshot {
  if (!session) {
    const idleProgress = estimateFounderTestProgress({
      stages: createInitialStageRecords().map((stage) => ({ ...stage, status: 'PENDING' as const, lastHeartbeatAt: null })),
      startedAt: null,
      totalStages: FOUNDER_TEST_RUNTIME_STAGES.length,
      now: nowMs,
    });
    const idleStall = analyzeRuntimeStall({ stages: [], now: nowMs });
    return {
      readOnly: true,
      runId: null,
      state: 'IDLE',
      startedAt: null,
      endedAt: null,
      progress: idleProgress,
      stages: createInitialStageRecords().map((stage) => ({ ...stage, status: 'PENDING', lastHeartbeatAt: null })),
      feed: buildRuntimeFeed([]),
      stallAnalysis: idleStall,
      elapsedMs: 0,
      alreadyRunning: false,
      lastHeartbeatAt: null,
      secondsSinceLastHeartbeat: 0,
      currentStageTimeoutMs: null,
      stallReason: null,
      currentOperation: null,
      lastCompletedOperation: null,
      nextExpectedOperation: null,
      lastSuccessfulOperation: null,
      traceStageStatus: 'IDLE',
      traceEvents: [],
      activeArtifactBuildSubstep: null,
      activeArtifactBuildSubstepOperationId: null,
      artifactBuildSubstepElapsedMs: 0,
      artifactBuildSubstepStallReason: null,
      lastSuccessfulArtifactSubstep: null,
      missingCompletionBoundary: null,
      stage2CompletionGap: false,
      stage2CompletionGapReason: null,
      handlerAlive: false,
      handlerLastAliveAt: null,
      postTimedOut: false,
      chatStressStartedCount: 0,
      chatStressSettledCount: 0,
      chatStressPendingCount: 0,
      chatStressLastScenario: null,
      chatStressPendingScenarioIds: [],
      chatStressActiveScenarioId: null,
      chatStressLastSettledScenarioId: null,
      chatStressTimeoutScenarioIds: [],
      chatStressFailedScenarioIds: [],
      chatStressWatchdogArmedScenarioIds: [],
      chatStressWatchdogDeadlineByScenarioId: {},
      chatStressWatchdogOverdueScenarioIds: [],
      chatStressMaxPendingElapsedMs: 0,
      uiSummary: buildUiSummary({
        readOnly: true,
        runId: null,
        state: 'IDLE',
        startedAt: null,
        endedAt: null,
        progress: idleProgress,
        stages: [],
        feed: buildRuntimeFeed([]),
        stallAnalysis: idleStall,
        elapsedMs: 0,
        alreadyRunning: false,
        lastHeartbeatAt: null,
        secondsSinceLastHeartbeat: 0,
        currentStageTimeoutMs: null,
        stallReason: null,
        currentOperation: null,
        lastCompletedOperation: null,
        nextExpectedOperation: null,
        lastSuccessfulOperation: null,
        traceStageStatus: 'IDLE',
        traceEvents: [],
        activeArtifactBuildSubstep: null,
        activeArtifactBuildSubstepOperationId: null,
        artifactBuildSubstepElapsedMs: 0,
        artifactBuildSubstepStallReason: null,
        lastSuccessfulArtifactSubstep: null,
        missingCompletionBoundary: null,
        stage2CompletionGap: false,
        stage2CompletionGapReason: null,
        handlerAlive: false,
        handlerLastAliveAt: null,
        postTimedOut: false,
        chatStressStartedCount: 0,
        chatStressSettledCount: 0,
        chatStressPendingCount: 0,
        chatStressLastScenario: null,
        chatStressPendingScenarioIds: [],
        chatStressActiveScenarioId: null,
        chatStressLastSettledScenarioId: null,
        chatStressTimeoutScenarioIds: [],
        chatStressFailedScenarioIds: [],
        chatStressWatchdogArmedScenarioIds: [],
        chatStressWatchdogDeadlineByScenarioId: {},
        chatStressWatchdogOverdueScenarioIds: [],
        chatStressMaxPendingElapsedMs: 0,
      }),
    };
  }

  const artifactSubstepStall = analyzeArtifactBuildSubstepStall(nowMs);
  if (
    artifactSubstepStall.health === 'SLOW' &&
    shouldEmitArtifactBuildSubstepSlow() &&
    session.state === 'RUNNING'
  ) {
    markArtifactBuildSubstepSlowEmitted();
    emitSessionTrace({
      operationId: `artifact-substep-slow:${artifactSubstepStall.operationId ?? 'unknown'}`,
      stageId: 'INTAKE_VALIDATION',
      operationLabel: artifactSubstepStall.reason ?? 'Artifact build sub-step slow',
      status: 'SLOW',
    });
  }
  if (
    artifactSubstepStall.health === 'STALLED' &&
    shouldEmitArtifactBuildSubstepStall() &&
    session.state === 'RUNNING'
  ) {
    markArtifactBuildSubstepStallEmitted();
    emitSessionTrace({
      operationId: `artifact-substep-stalled:${artifactSubstepStall.operationId ?? 'unknown'}`,
      stageId: 'INTAKE_VALIDATION',
      operationLabel: artifactSubstepStall.reason ?? 'Artifact build sub-step stalled',
      status: 'STALLED',
    });
    session.feedEvents = appendRuntimeFeedEvent({
      feed: session.feedEvents,
      message: artifactSubstepStall.reason ?? 'Artifact build sub-step stalled',
      stageId: 'INTAKE_VALIDATION',
      severity: 'WARNING',
    });
  }

  const stallAnalysis = analyzeRuntimeStall({
    stages: session.stages,
    lastHeartbeatAt: session.lastHeartbeatAt,
    now: nowMs,
  });
  if (
    stallAnalysis.health === 'STALLED' &&
    !session.stallTraceEmitted &&
    session.state === 'RUNNING'
  ) {
    session.stallTraceEmitted = true;
    emitSessionTrace({
      operationId: 'runtime-stall-detected',
      stageId: stallAnalysis.currentStageId,
      operationLabel: stallAnalysis.warningMessage ?? 'Stage stalled',
      status: 'STALLED',
    });
  } else if (
    stallAnalysis.health === 'SLOW' &&
    !session.slowTraceEmitted &&
    session.state === 'RUNNING'
  ) {
    session.slowTraceEmitted = true;
    emitSessionTrace({
      operationId: 'runtime-slow-detected',
      stageId: stallAnalysis.currentStageId,
      operationLabel: stallAnalysis.warningMessage ?? 'Stage running slow',
      status: 'SLOW',
    });
  }
  if (
    stallAnalysis.health === 'STALLED' &&
    !session.stallWarningEmitted &&
    session.state === 'RUNNING'
  ) {
    session.stallWarningEmitted = true;
    session.feedEvents = appendRuntimeFeedEvent({
      feed: session.feedEvents,
      message: stallAnalysis.warningMessage ?? 'Founder Test may be stalled',
      stageId: stallAnalysis.currentStageId,
      severity: 'WARNING',
    });
  }
  const state =
    stallAnalysis.health === 'STALLED' && session.state === 'RUNNING' ? 'STALLED' : session.state;
  const progress = estimateFounderTestProgress({
    stages: session.stages,
    startedAt: session.startedAt,
    totalStages: FOUNDER_TEST_RUNTIME_STAGES.length,
    now: nowMs,
  });

  const traceFields = buildTraceFields(session, state, stallAnalysis.health);
  const failedArtifact = getLastFailedArtifactSubstep();
  const chatStressFields = resolveChatStressRuntimeFields();
  const stage2Gap = analyzeStage2CompletionGap({
    readOnly: true,
    runId: session.runId,
    state,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    progress,
    stages: session.stages,
    feed: buildRuntimeFeed(session.feedEvents),
    stallAnalysis,
    elapsedMs: progress.elapsedMs,
    alreadyRunning: session.state === 'RUNNING' || session.state === 'STARTING' || session.state === 'COMPLETING',
    lastHeartbeatAt: session.lastHeartbeatAt,
    secondsSinceLastHeartbeat: stallAnalysis.secondsSinceLastHeartbeat,
    currentStageTimeoutMs: stallAnalysis.currentStageTimeoutMs,
    stallReason: null,
    ...traceFields,
    activeArtifactBuildSubstep: artifactSubstepStall.operationLabel,
    activeArtifactBuildSubstepOperationId: artifactSubstepStall.operationId,
    artifactBuildSubstepElapsedMs: artifactSubstepStall.elapsedMs,
    artifactBuildSubstepStallReason: artifactSubstepStall.reason,
    lastSuccessfulArtifactSubstep: getLastSuccessfulArtifactSubstep(),
    missingCompletionBoundary: null,
    stage2CompletionGap: false,
    stage2CompletionGapReason: null,
    handlerAlive: isFounderTestHandlerAlive(),
    handlerLastAliveAt: getFounderTestHandlerLastAliveAt(),
    postTimedOut: false,
    ...chatStressFields,
  });

  let resolvedState = state;
  if (stage2Gap.stage2CompletionGap && session.state === 'RUNNING') {
    resolvedState = 'STALLED';
  }

  const base = {
    readOnly: true as const,
    runId: session.runId,
    state: resolvedState,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    progress,
    stages: session.stages,
    feed: buildRuntimeFeed(session.feedEvents),
    stallAnalysis,
    elapsedMs: progress.elapsedMs,
    alreadyRunning: session.state === 'RUNNING' || session.state === 'STARTING' || session.state === 'COMPLETING',
    lastHeartbeatAt: session.lastHeartbeatAt,
    secondsSinceLastHeartbeat: stallAnalysis.secondsSinceLastHeartbeat,
    currentStageTimeoutMs: stallAnalysis.currentStageTimeoutMs,
    stallReason:
      stage2Gap.stage2CompletionGapReason ??
      artifactSubstepStall.reason ??
      stallAnalysis.stallReason ??
      (failedArtifact.error ? `${failedArtifact.operation}: ${failedArtifact.error}` : null),
    ...traceFields,
    activeArtifactBuildSubstep: artifactSubstepStall.operationLabel,
    activeArtifactBuildSubstepOperationId: artifactSubstepStall.operationId,
    artifactBuildSubstepElapsedMs: artifactSubstepStall.elapsedMs,
    artifactBuildSubstepStallReason: artifactSubstepStall.reason,
    lastSuccessfulArtifactSubstep: getLastSuccessfulArtifactSubstep(),
    missingCompletionBoundary: stage2Gap.missingCompletionBoundary,
    stage2CompletionGap: stage2Gap.stage2CompletionGap,
    stage2CompletionGapReason: stage2Gap.stage2CompletionGapReason,
    handlerAlive: isFounderTestHandlerAlive(),
    handlerLastAliveAt: getFounderTestHandlerLastAliveAt(),
    postTimedOut: false,
    ...chatStressFields,
  };

  return {
    ...base,
    uiSummary: buildUiSummary(base),
  };
}

function finalizeSnapshot(snapshot: FounderTestRuntimeSnapshot): FounderTestRuntimeSnapshot {
  publishRuntimeSnapshot(snapshot);
  return snapshot;
}

export function getFounderTestRuntimeStatus(now?: number): FounderTestRuntimeSnapshot {
  return reconcilePublicFounderTestRuntimeSnapshot(
    finalizeSnapshot(composeSnapshot(activeSession, now ?? Date.now())),
  );
}

export function getFounderTestRuntimeStatusForRun(
  runId?: string | null,
  now?: number,
): FounderTestRuntimeSnapshot {
  const live = finalizeSnapshot(composeSnapshot(activeSession, now ?? Date.now()));
  if (!runId) return reconcilePublicFounderTestRuntimeSnapshot(live);
  if (live.runId === runId && live.state !== 'IDLE') {
    return reconcilePublicFounderTestRuntimeSnapshot(live);
  }
  const published = publishedSnapshotsByRunId.get(runId);
  if (published) return reconcilePublicFounderTestRuntimeSnapshot(published);
  return reconcilePublicFounderTestRuntimeSnapshot(live);
}

function touchSessionHeartbeat(stageId?: string | null, at = new Date()): void {
  if (!activeSession) return;
  const iso = at.toISOString();
  activeSession.lastHeartbeatAt = iso;
  if (stageId) {
    activeSession.stages = touchStageHeartbeat(activeSession.stages, stageId, at);
  }
}

export function touchFounderTestRuntimeHeartbeat(stageId?: string | null): FounderTestRuntimeSnapshot {
  touchSessionHeartbeat(stageId ?? getCurrentRunningStageId());
  return composeSnapshot(activeSession);
}

function getCurrentRunningStageId(): string | null {
  if (!activeSession) return null;
  return activeSession.stages.find((stage) => stage.status === 'RUNNING')?.stageId ?? null;
}

export function recordFounderTestRuntimeSubstep(input: {
  stageId: string;
  operationId: string;
  message: string;
}): FounderTestRuntimeSnapshot {
  if (!activeSession) return composeSnapshot(null);
  touchSessionHeartbeat(input.stageId);
  activeSession.feedEvents = appendRuntimeFeedEvent({
    feed: activeSession.feedEvents,
    message: input.message,
    stageId: input.stageId,
    severity: 'INFO',
  });
  emitSessionTrace({
    operationId: input.operationId,
    stageId: input.stageId,
    operationLabel: input.message,
    status: 'RUNNING',
  });
  return composeSnapshot(activeSession);
}

export async function runFounderTestRuntimeStageWork<T>(
  stageId: string,
  work: () => Promise<T>,
): Promise<T> {
  touchSessionHeartbeat(stageId);
  markFounderTestHandlerAlive();
  try {
    return await work();
  } finally {
    markFounderTestHandlerAlive();
  }
}

export function buildLaunchReadinessArtifactBuildTraceBridge() {
  return createLaunchReadinessArtifactBuildTraceBridge({
    onSubstepRunning: ({ operationId, operationLabel, stageId }) => {
      recordFounderTestRuntimeSubstep({ stageId, operationId, message: operationLabel });
    },
    onSubstepPassed: ({ operationId, operationLabel, stageId }) => {
      touchSessionHeartbeat(stageId);
      emitSessionTrace({
        operationId,
        stageId,
        operationLabel,
        status: 'PASSED',
      });
    },
    onSubstepFailed: ({ operationId, operationLabel, stageId, errorMessage }) => {
      touchSessionHeartbeat(stageId);
      emitSessionTrace({
        operationId,
        stageId,
        operationLabel: errorMessage ? `${operationLabel}: ${errorMessage}` : operationLabel,
        status: 'FAILED',
      });
      emitFounderTestRuntimeWarning(
        errorMessage ? `${operationLabel} failed: ${errorMessage}` : `${operationLabel} failed`,
        stageId,
      );
    },
  });
}

export function beginFounderTestRuntime(input: { runId?: string } = {}): BeginFounderTestRuntimeResult {
  if (activeSession && (activeSession.state === 'RUNNING' || activeSession.state === 'STARTING' || activeSession.state === 'COMPLETING')) {
    return {
      readOnly: true,
      accepted: false,
      errorCode: FOUNDER_TEST_ALREADY_RUNNING,
      snapshot: composeSnapshot(activeSession),
    };
  }

  const startedAt = new Date().toISOString();
  const stages = createInitialStageRecords();
  const feedEvents = appendRuntimeFeedEvent({
    feed: [],
    message: 'Founder Test Started',
    stageId: 'FOUNDER_TEST_STARTED',
  });

  activeSession = {
    runId: input.runId ?? `founder-test-runtime-${Date.now()}`,
    state: 'STARTING',
    startedAt,
    endedAt: null,
    stages,
    feedEvents,
    traceEvents: [],
    stallWarningEmitted: false,
    slowTraceEmitted: false,
    stallTraceEmitted: false,
    lastHeartbeatAt: startedAt,
    currentOperation: 'Runtime session created',
    lastCompletedOperation: null,
    nextExpectedOperation: resolveNextExpectedOperation({ operationId: 'runtime-session-created' }),
    lastSuccessfulOperation: null,
  };

  activeSession.state = 'RUNNING';
  emitSessionTrace({
    operationId: 'runtime-session-created',
    stageId: 'FOUNDER_TEST_STARTED',
    operationLabel: 'Runtime session created',
    status: 'RUNNING',
  });

  return {
    readOnly: true,
    accepted: true,
    errorCode: null,
    snapshot: composeSnapshot(activeSession),
  };
}

export function advanceFounderTestRuntimeStage(input: {
  stageId: string;
  message?: string;
}): FounderTestRuntimeSnapshot {
  if (!activeSession) return composeSnapshot(null);

  activeSession.stages = markStageRunning(activeSession.stages, input.stageId);
  touchSessionHeartbeat(input.stageId);
  activeSession.feedEvents = appendRuntimeFeedEvent({
    feed: activeSession.feedEvents,
    message: input.message ?? `${labelForStage(input.stageId)} Running`,
    stageId: input.stageId,
  });
  emitSessionTrace({
    operationId: `${slugStageId(input.stageId)}-started`,
    stageId: input.stageId,
    operationLabel: input.message ?? `${labelForStage(input.stageId)} running`,
    status: 'RUNNING',
  });

  return composeSnapshot(activeSession);
}

export function completeFounderTestRuntimeStage(input: {
  stageId: string;
  message?: string;
  status?: 'PASSED' | 'FAILED' | 'SKIPPED';
  skipFeed?: boolean;
}): FounderTestRuntimeSnapshot {
  if (!activeSession) return composeSnapshot(null);

  activeSession.stages = markStageComplete(activeSession.stages, input.stageId, input.status ?? 'PASSED');
  touchSessionHeartbeat(input.stageId);
  if (!input.skipFeed) {
    const suffix =
      input.status === 'FAILED' ? 'Failed' : input.status === 'SKIPPED' ? 'Skipped' : 'Passed';
    activeSession.feedEvents = appendRuntimeFeedEvent({
      feed: activeSession.feedEvents,
      message: input.message ?? `${labelForStage(input.stageId)} ${suffix}`,
      stageId: input.stageId,
      severity: input.status === 'FAILED' ? 'ERROR' : 'INFO',
    });
  }

  emitSessionTrace({
    operationId: `${slugStageId(input.stageId)}-${(input.status ?? 'PASSED') === 'FAILED' ? 'failed' : 'passed'}`,
    stageId: input.stageId,
    operationLabel: input.message ?? `${labelForStage(input.stageId)} ${input.status ?? 'PASSED'}`,
    status: input.status === 'FAILED' ? 'FAILED' : 'PASSED',
  });

  return composeSnapshot(activeSession);
}

export function emitFounderTestRuntimeWarning(message: string, stageId?: string | null): FounderTestRuntimeSnapshot {
  if (!activeSession) return composeSnapshot(null);
  activeSession.feedEvents = appendRuntimeFeedEvent({
    feed: activeSession.feedEvents,
    message,
    stageId: stageId ?? null,
    severity: 'WARNING',
  });
  return composeSnapshot(activeSession);
}

export function finishFounderTestRuntime(input: {
  state?: 'COMPLETE' | 'FAILED' | 'CANCELLED';
  message?: string;
}): FounderTestRuntimeSnapshot {
  if (!activeSession) return composeSnapshot(null);

  activeSession.state = input.state === 'FAILED' ? 'FAILED' : input.state === 'CANCELLED' ? 'CANCELLED' : 'COMPLETING';

  const reportStage = activeSession.stages.find((stage) => stage.stageId === 'REPORT_GENERATION');
  if (reportStage && reportStage.status !== 'PASSED' && reportStage.status !== 'SKIPPED') {
    activeSession.stages = markStageComplete(activeSession.stages, 'REPORT_GENERATION', 'PASSED');
  }

  activeSession.stages = markStageComplete(activeSession.stages, 'COMPLETE', input.state === 'FAILED' ? 'FAILED' : 'PASSED');
  activeSession.feedEvents = appendRuntimeFeedEvent({
    feed: activeSession.feedEvents,
    message: input.message ?? (input.state === 'FAILED' ? 'Founder Test Failed' : 'Founder Test Complete'),
    stageId: 'COMPLETE',
    severity: input.state === 'FAILED' ? 'ERROR' : 'INFO',
  });

  emitSessionTrace({
    operationId: input.state === 'FAILED' ? 'runtime-failed' : 'runtime-completed',
    stageId: 'COMPLETE',
    operationLabel: input.message ?? (input.state === 'FAILED' ? 'Runtime failed' : 'Runtime completed'),
    status: input.state === 'FAILED' ? 'FAILED' : 'COMPLETE',
  });

  activeSession.state = input.state === 'FAILED' ? 'FAILED' : input.state === 'CANCELLED' ? 'CANCELLED' : 'COMPLETE';
  activeSession.endedAt = new Date().toISOString();

  const snapshot = finalizeSnapshot(composeSnapshot(activeSession));
  completedSnapshots.unshift(snapshot);
  if (completedSnapshots.length > 16) completedSnapshots.length = 16;
  recordFounderTestRuntimeSnapshot(snapshot);
  activeSession = null;
  return snapshot;
}

/** Test helper — drop live session without clearing published run snapshots. */
export function clearFounderTestRuntimeSessionOnlyForTests(): void {
  activeSession = null;
}

function labelForStage(stageId: string): string {
  return FOUNDER_TEST_RUNTIME_STAGES.find((stage) => stage.stageId === stageId)?.label ?? stageId;
}

function slugStageId(stageId: string): string {
  return stageId.toLowerCase().replace(/_/g, '-');
}

export function buildFounderTestRuntimeMonitorArtifacts(input: {
  snapshots?: readonly FounderTestRuntimeSnapshot[];
} = {}): {
  report: import('./founder-test-runtime-types.js').FounderTestRuntimeMonitorReport;
  markdown: string;
} {
  const snapshots = input.snapshots ?? completedSnapshots;
  const report = buildFounderTestRuntimeMonitorReport({
    snapshots,
    history: snapshots
      .filter((snapshot) => snapshot.runId && snapshot.startedAt)
      .map((snapshot) => ({
        runId: snapshot.runId!,
        startedAt: snapshot.startedAt!,
        endedAt: snapshot.endedAt,
        finalState: snapshot.state,
        totalDurationMs: snapshot.elapsedMs,
        completedStageCount: snapshot.progress.completedStages,
        stallDetected: snapshot.stallAnalysis.health === 'STALLED',
      })),
  });

  return {
    report,
    markdown: buildFounderTestRuntimeMonitorReportMarkdown(report, snapshots.slice(0, 1)),
  };
}
