/**
 * Phase 26.81 — Live chat stress runner path alignment (V1).
 * Ensures Founder Test product-readiness path uses repaired settlement/completion modules
 * and emits live runtime feed markers.
 */

import {
  CHAT_STRESS_BATCH_DEADLINE_ARMED_OPERATION_ID,
  CHAT_STRESS_TERMINAL_SWEEP_SETTLED_OPERATION_ID,
  CHAT_STRESS_TERMINAL_SWEEP_STARTED_OPERATION_ID,
  forceSettlePendingStartedChatStressScenarios,
  getChatStressCompletionSnapshot,
  getChatStressScenarioLifecycleState,
  getChatStressScenarioLastUpdateTimeMs,
  isChatStressBatchFinalizerCompleted,
  reconcileChatStressBatchDeadlineFinalizer,
  reconcileChatStressTerminalSettlementIfNeeded,
  reconcileChatStressTerminalSettlementSweep,
  reconcileChatStressWatchdogHealth,
  shouldForceChatStressTerminalSettlementSweep,
  withChatStressPostWatchdogHealthReconcilersSuppressed,
} from './chat-stress-completion-tracker.js';
import {
  buildChatStressSettlementSummary,
  emitChatStressSimulationCompleteBoundaryIfNeeded,
  isChatStressSimulationComplete,
  type ChatStressSimulationCompleteBoundaryEmit,
} from './chat-stress-settlement-boundary.js';

export const LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS =
  'LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS';

export const LIVE_CHAT_STRESS_RUNNER_PATH_MARKER =
  'live-chat-stress-runner-path:repaired-settlement-v1';

export const CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND = 'CHAT_STRESS_RUNNER_IDLE_WITH_PENDING';

export const LIVE_CHAT_STRESS_BATCH_DEADLINE_ARMED = CHAT_STRESS_BATCH_DEADLINE_ARMED_OPERATION_ID;
export const LIVE_CHAT_STRESS_TERMINAL_SWEEP_STARTED = CHAT_STRESS_TERMINAL_SWEEP_STARTED_OPERATION_ID;
export const LIVE_CHAT_STRESS_TERMINAL_SWEEP_SETTLED = CHAT_STRESS_TERMINAL_SWEEP_SETTLED_OPERATION_ID;

export type LiveChatStressRuntimeTraceEmit = {
  operationId: string;
  operationLabel: string;
  phase: 'RUNNING' | 'PASSED' | 'SLOW' | 'FAILED';
  errorMessage?: string;
};

type LiveRuntimeTraceHandler = (event: LiveChatStressRuntimeTraceEmit) => void;

let liveRuntimeTraceHandler: LiveRuntimeTraceHandler | null = null;
let liveSettlementDriverInterval: ReturnType<typeof setInterval> | null = null;

export function registerLiveChatStressRuntimeTraceHandler(handler: LiveRuntimeTraceHandler | null): void {
  liveRuntimeTraceHandler = handler;
}

function emitLiveRuntimeTrace(event: LiveChatStressRuntimeTraceEmit): void {
  liveRuntimeTraceHandler?.(event);
}

export function startLiveChatStressSettlementDriver(pollMs = 250): () => void {
  stopLiveChatStressSettlementDriver();
  liveSettlementDriverInterval = setInterval(() => {
    reconcileLiveChatStressRuntimeSettlement(Date.now());
  }, pollMs);
  liveSettlementDriverInterval.unref?.();
  return stopLiveChatStressSettlementDriver;
}

export function stopLiveChatStressSettlementDriver(): void {
  if (liveSettlementDriverInterval != null) {
    clearInterval(liveSettlementDriverInterval);
    liveSettlementDriverInterval = null;
  }
}

/** Documented live Founder Test call chain (read-only). */
export const LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN = [
  'runFounderTestingModeV4',
  'executeFounderTestLaunchReadinessOrchestration',
  'runFullProductReadinessSimulation',
  'runFounderTestChatStressSimulation',
  'simulateChatStressBatch',
  'simulateChatStressResponse',
  'registerChatStressScenarioHardWatchdog',
  'tryMarkChatStressScenarioSettled',
  'forceSettlePendingStartedChatStressScenarios',
  'buildChatStressSettlementSummary',
  'isChatStressSimulationComplete',
  'chat-stress-completion-propagation registry',
] as const;

export interface ChatStressRunnerIdleWithPending {
  readOnly: true;
  kind: typeof CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND;
  pendingScenarioIds: string[];
  pendingWithoutActiveWorkerScenarioIds: string[];
  activeScenarioIds: readonly string[];
  activeScenarioCount: number;
  lastStateByScenarioId: Readonly<Record<string, string>>;
  lastUpdateTimeByScenarioId: Readonly<Record<string, string | null>>;
  forcedSettlementCount: number;
  detectedAt: string;
}

type IdleWithPendingHandler = (event: ChatStressRunnerIdleWithPending) => void;
type CompletionBoundaryEmitter = (event: ChatStressSimulationCompleteBoundaryEmit) => void;

let idleWithPendingHandler: IdleWithPendingHandler | null = null;
let completionBoundaryEmitter: CompletionBoundaryEmitter | null = null;
let lastIdleWithPending: ChatStressRunnerIdleWithPending | null = null;

export function resetLiveChatStressRunnerPathForTests(): void {
  idleWithPendingHandler = null;
  completionBoundaryEmitter = null;
  liveRuntimeTraceHandler = null;
  stopLiveChatStressSettlementDriver();
  lastIdleWithPending = null;
}

export function registerChatStressRunnerIdleWithPendingHandler(
  handler: IdleWithPendingHandler | null,
): void {
  idleWithPendingHandler = handler;
}

export function registerLiveChatStressCompletionBoundaryEmitter(
  handler: CompletionBoundaryEmitter | null,
): void {
  completionBoundaryEmitter = handler;
}

/** Propagate chat-stress-simulation-complete to live runtime feed when settlement is terminal. */
export function reconcileLiveChatStressCompletionBoundaryPropagation(
  nowMs = Date.now(),
): boolean {
  return emitChatStressSimulationCompleteBoundaryIfNeeded(
    completionBoundaryEmitter ?? undefined,
    nowMs,
  );
}

export function getLastChatStressRunnerIdleWithPending(): ChatStressRunnerIdleWithPending | null {
  return lastIdleWithPending;
}

export function shouldPropagateLiveChatStressRuntimeFeed(operationId: string): boolean {
  if (operationId.startsWith('live-chat-stress-runner-path:')) return true;
  if (operationId.startsWith('chat-stress-scenario-settled:')) return true;
  if (operationId.startsWith('chat-stress-scenario-timed-out-settled:')) return true;
  if (operationId === 'chat-stress-pending-count-updated') return true;
  if (operationId === 'chat-stress-completion-condition-satisfied') return true;
  if (operationId === 'chat-stress-runner-idle-with-pending') return true;
  if (operationId === 'chat-stress-simulation-complete') return true;
  if (operationId === 'chat-stress-simulation-complete-emitted') return true;
  if (operationId === 'chat-stress-degraded-incomplete') return true;
  if (operationId === 'chat-stress-non-blocking-started') return true;
  if (operationId === 'chat-stress-non-blocking-window-elapsed') return true;
  if (operationId === 'chat-stress-batch-deadline-armed') return true;
  if (operationId === 'chat-stress-terminal-sweep-started') return true;
  if (operationId === 'chat-stress-terminal-sweep-settled') return true;
  if (operationId === 'product-readiness-simulation-complete') return true;
  if (operationId === 'product-readiness-simulation-complete-emitted') return true;
  if (operationId === 'PRODUCT_READINESS_COMPLETION_CHECK') return true;
  if (operationId === 'PRODUCT_READINESS_COMPLETED') return true;
  if (operationId === 'PRODUCT_READINESS_PROPAGATION_START') return true;
  if (operationId === 'PRODUCT_READINESS_PROPAGATION_STEP') return true;
  if (operationId === 'PRODUCT_READINESS_PROPAGATION_COMPLETE') return true;
  if (operationId === 'intake-validation-complete') return true;
  if (operationId === 'intake-validation-complete-emitted') return true;
  if (operationId === 'planning-gate-started') return true;
  return false;
}

/** Drive watchdog reconcile + terminal sweep + completion boundary (live UI path). */
export function reconcileLiveChatStressRuntimeSettlement(nowMs = Date.now()): {
  pendingCount: number;
  settledCount: number;
  swept: boolean;
  boundaryEmitted: boolean;
} {
  return withChatStressPostWatchdogHealthReconcilersSuppressed(() => {
    reconcileChatStressWatchdogHealth(nowMs);
    reconcileChatStressBatchDeadlineFinalizer(nowMs);
    const before = getChatStressCompletionSnapshot(nowMs);
    let swept = reconcileChatStressTerminalSettlementIfNeeded(nowMs);
    if (
      !swept &&
      before.pendingCount > 0 &&
      shouldForceChatStressTerminalSettlementSweep(before)
    ) {
      emitLiveRuntimeTrace({
        operationId: LIVE_CHAT_STRESS_TERMINAL_SWEEP_STARTED,
        operationLabel: `Terminal settlement sweep started (started=${before.startedCount}, settled=${before.settledCount}, pending=${before.pendingCount})`,
        phase: 'SLOW',
      });
      reconcileChatStressTerminalSettlementSweep({
        nowMs,
        forceUnresolved: true,
        reason: CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
      });
      swept = true;
    }
    const snap = getChatStressCompletionSnapshot(nowMs);
    if ((swept || snap.settledCount > before.settledCount) && snap.settledCount > before.settledCount) {
      emitLiveRuntimeTrace({
        operationId: LIVE_CHAT_STRESS_TERMINAL_SWEEP_SETTLED,
        operationLabel: `Terminal settlement sweep settled=${snap.settledCount} pending=${snap.pendingCount}`,
        phase: snap.pendingCount === 0 ? 'PASSED' : 'SLOW',
      });
    }
    const boundaryEmitted = reconcileLiveChatStressCompletionBoundaryPropagation(nowMs);
    if (boundaryEmitted) {
      emitLiveRuntimeTrace({
        operationId: 'chat-stress-simulation-complete',
        operationLabel: `Chat stress simulation complete (settled=${snap.settledCount}, pending=${snap.pendingCount})`,
        phase: 'PASSED',
      });
    }
    return {
      pendingCount: snap.pendingCount,
      settledCount: snap.settledCount,
      swept: swept || snap.settledCount > before.settledCount,
      boundaryEmitted,
    };
  });
}

export function reconcileChatStressRunnerIdleWithPending(
  nowMs = Date.now(),
): ChatStressRunnerIdleWithPending | null {
  const snap = getChatStressCompletionSnapshot(nowMs);
  if (snap.pendingCount <= 0) return null;
  if (snap.aggregateComplete) return null;

  const batchDeadlineExpired =
    snap.batchDeadlineMs != null && (snap.msUntilBatchDeadline ?? 0) <= 0;
  const shouldForceTerminalSweep = shouldForceChatStressTerminalSettlementSweep(snap);

  if (
    snap.activeScenarioCount > 0 &&
    !batchDeadlineExpired &&
    !shouldForceTerminalSweep
  ) {
    return null;
  }

  if (isChatStressBatchFinalizerCompleted() && snap.pendingCount <= 0) {
    return null;
  }

  let forced: Array<{ scenarioId: string; reason: string }> = [];
  if (batchDeadlineExpired || shouldForceTerminalSweep) {
    emitLiveRuntimeTrace({
      operationId: LIVE_CHAT_STRESS_TERMINAL_SWEEP_STARTED,
      operationLabel: `Terminal settlement sweep started (started=${snap.startedCount}, settled=${snap.settledCount}, pending=${snap.pendingCount})`,
      phase: 'SLOW',
    });
    reconcileChatStressTerminalSettlementSweep({
      nowMs,
      forceUnresolved: true,
      reason: CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
    });
    forced = forceSettlePendingStartedChatStressScenarios(
      CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
    );
    const snapAfter = getChatStressCompletionSnapshot(nowMs);
    emitLiveRuntimeTrace({
      operationId: LIVE_CHAT_STRESS_TERMINAL_SWEEP_SETTLED,
      operationLabel: `Terminal settlement sweep settled=${snapAfter.settledCount} pending=${snapAfter.pendingCount}`,
      phase: snapAfter.pendingCount === 0 ? 'PASSED' : 'SLOW',
    });
    reconcileLiveChatStressCompletionBoundaryPropagation(nowMs);
    if (snapAfter.pendingCount <= 0) {
      return null;
    }
  }

  const lastStateByScenarioId: Record<string, string> = {};
  const lastUpdateTimeByScenarioId: Record<string, string | null> = {};
  for (const scenarioId of snap.pendingScenarioIds) {
    lastStateByScenarioId[scenarioId] = getChatStressScenarioLifecycleState(scenarioId);
    const lastUpdateMs = getChatStressScenarioLastUpdateTimeMs(scenarioId);
    lastUpdateTimeByScenarioId[scenarioId] =
      lastUpdateMs != null ? new Date(lastUpdateMs).toISOString() : null;
  }

  const event: ChatStressRunnerIdleWithPending = {
    readOnly: true,
    kind: CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
    pendingScenarioIds: [...snap.pendingScenarioIds],
    pendingWithoutActiveWorkerScenarioIds: [...snap.pendingWithoutActiveWorkerScenarioIds],
    activeScenarioIds: [...snap.activeScenarioIds],
    activeScenarioCount: snap.activeScenarioCount,
    lastStateByScenarioId,
    lastUpdateTimeByScenarioId,
    forcedSettlementCount: forced.length,
    detectedAt: new Date(nowMs).toISOString(),
  };

  lastIdleWithPending = event;
  idleWithPendingHandler?.(event);
  reconcileLiveChatStressCompletionBoundaryPropagation(nowMs);
  return event;
}

export function reconcileLiveChatStressSettlementAndBoundary(
  nowMs = Date.now(),
): { idleWithPending: ChatStressRunnerIdleWithPending | null; boundaryEmitted: boolean } {
  const idleWithPending = reconcileChatStressRunnerIdleWithPending(nowMs);
  const boundaryEmitted = reconcileLiveChatStressCompletionBoundaryPropagation(nowMs);
  return { idleWithPending, boundaryEmitted };
}

/** Poll-path terminal settlement for live UI — independent of hung worker promises. */
export function pollLiveChatStressTerminalSettlement(nowMs = Date.now()): {
  pendingCount: number;
  settledCount: number;
  sweepRan: boolean;
} {
  const result = reconcileLiveChatStressRuntimeSettlement(nowMs);
  return {
    pendingCount: result.pendingCount,
    settledCount: result.settledCount,
    sweepRan: result.swept,
  };
}

export function buildLiveChatStressRunnerPathStatus(nowMs = Date.now()): {
  readOnly: true;
  marker: string;
  callChain: readonly string[];
  settlementSummary: ReturnType<typeof buildChatStressSettlementSummary>;
  completionBoundaryReached: boolean;
} {
  const settlementSummary = buildChatStressSettlementSummary(nowMs);
  return {
    readOnly: true,
    marker: LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,
    callChain: LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN,
    settlementSummary,
    completionBoundaryReached: isChatStressSimulationComplete(nowMs),
  };
}
