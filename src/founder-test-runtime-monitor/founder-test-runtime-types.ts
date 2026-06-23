/**
 * Founder Test Runtime Monitor — foundation types (V1).
 */

export type FounderTestRuntimeState =
  | 'IDLE'
  | 'STARTING'
  | 'RUNNING'
  | 'COMPLETING'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED'
  | 'STALLED';

export type FounderTestStageStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';

export type StallHealth = 'HEALTHY' | 'SLOW' | 'STALLED';

export type FounderTestTraceEventStatus =
  | 'RUNNING'
  | 'SLOW'
  | 'STALLED'
  | 'FAILED'
  | 'COMPLETE'
  | 'PASSED'
  | 'WAITING';

export interface FounderTestRuntimeOperationRef {
  readOnly: true;
  operationId: string;
  operationLabel: string;
  stageId: string | null;
  stageLabel: string | null;
  stageOrder: number | null;
}

export interface FounderTestRuntimeTraceEvent {
  readOnly: true;
  traceEventId: string;
  operationId: string;
  stageId: string | null;
  stageOrder: number | null;
  stageLabel: string | null;
  operationLabel: string;
  status: FounderTestTraceEventStatus;
  timestamp: string;
  displayTime: string;
  displayLine: string;
}

export interface FounderTestRuntimeStageRecord {
  readOnly: true;
  stageId: string;
  label: string;
  order: number;
  status: FounderTestStageStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  lastHeartbeatAt: string | null;
}

export interface FounderTestProgress {
  readOnly: true;
  currentStage: string | null;
  currentStageLabel: string | null;
  currentStageOrder: number;
  totalStages: number;
  completedStages: number;
  remainingStages: number;
  percentComplete: number;
  elapsedMs: number;
  estimatedRemainingMs: number | null;
}

export interface FounderTestRuntimeFeedEvent {
  readOnly: true;
  eventId: string;
  timestamp: string;
  displayTime: string;
  message: string;
  stageId: string | null;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface FounderTestRuntimeFeed {
  readOnly: true;
  events: readonly FounderTestRuntimeFeedEvent[];
}

export interface StallAnalysis {
  readOnly: true;
  health: StallHealth;
  currentStageId: string | null;
  stageElapsedMs: number;
  stageAverageMs: number | null;
  warningMessage: string | null;
  stallReason: string | null;
  currentStageTimeoutMs: number | null;
  secondsSinceLastHeartbeat: number;
}

export interface FounderTestRuntimeSnapshot {
  readOnly: true;
  runId: string | null;
  state: FounderTestRuntimeState;
  startedAt: string | null;
  endedAt: string | null;
  progress: FounderTestProgress;
  stages: readonly FounderTestRuntimeStageRecord[];
  feed: FounderTestRuntimeFeed;
  stallAnalysis: StallAnalysis;
  elapsedMs: number;
  alreadyRunning: boolean;
  lastHeartbeatAt: string | null;
  secondsSinceLastHeartbeat: number;
  currentStageTimeoutMs: number | null;
  stallReason: string | null;
  currentOperation: string | null;
  lastCompletedOperation: string | null;
  nextExpectedOperation: string | null;
  lastSuccessfulOperation: string | null;
  traceStageStatus: FounderTestTraceEventStatus | 'IDLE';
  traceEvents: readonly FounderTestRuntimeTraceEvent[];
  activeArtifactBuildSubstep: string | null;
  activeArtifactBuildSubstepOperationId: string | null;
  artifactBuildSubstepElapsedMs: number;
  artifactBuildSubstepStallReason: string | null;
  lastSuccessfulArtifactSubstep: string | null;
  missingCompletionBoundary: string | null;
  stage2CompletionGap: boolean;
  stage2CompletionGapReason: string | null;
  handlerAlive: boolean;
  handlerLastAliveAt: string | null;
  postTimedOut: boolean;
  chatStressStartedCount: number;
  chatStressSettledCount: number;
  chatStressPendingCount: number;
  chatStressLastScenario: string | null;
  chatStressPendingScenarioIds: readonly string[];
  chatStressActiveScenarioId: string | null;
  chatStressLastSettledScenarioId: string | null;
  chatStressTimeoutScenarioIds: readonly string[];
  chatStressFailedScenarioIds: readonly string[];
  chatStressWatchdogArmedScenarioIds: readonly string[];
  chatStressWatchdogDeadlineByScenarioId: Readonly<Record<string, number>>;
  chatStressWatchdogOverdueScenarioIds: readonly string[];
  chatStressMaxPendingElapsedMs: number;
  chatStressActiveScenarioIds: readonly string[];
  chatStressActiveScenarioCount: number;
  chatStressOldestPendingElapsedMs: number;
  chatStressNextScenarioDeadlineMs: number | null;
  chatStressMsUntilNextDeadline: number | null;
  chatStressBatchDeadlineMs: number | null;
  chatStressMsUntilBatchDeadline: number | null;
  uiSummary: {
    headline: string;
    stageLine: string;
    elapsedLine: string;
    remainingLine: string;
  };
  /** Public-facing completion state (may differ from internal `state`). */
  publicState?: string;
  /** Report handoff pipeline stage for Operator Feed. */
  handoffState?: string;
  handoffStateLabel?: string;
  /** Internal runtime state before public reconciliation. */
  internalState?: FounderTestRuntimeState;
}

export interface BeginFounderTestRuntimeResult {
  readOnly: true;
  accepted: boolean;
  errorCode: string | null;
  snapshot: FounderTestRuntimeSnapshot;
}

export interface FounderTestRuntimeHistoryEntry {
  runId: string;
  startedAt: string;
  endedAt: string | null;
  finalState: FounderTestRuntimeState;
  totalDurationMs: number | null;
  completedStageCount: number;
  stallDetected: boolean;
}

export interface FounderTestRuntimeMonitorReport {
  readOnly: true;
  generatedAt: string;
  totalRuns: number;
  latestSnapshot: FounderTestRuntimeSnapshot | null;
  historySummary: {
    totalRuns: number;
    completeCount: number;
    failedCount: number;
    stalledCount: number;
    averageDurationMs: number;
  };
}
