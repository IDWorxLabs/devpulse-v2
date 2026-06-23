/**
 * Launch Readiness Artifact Build Tracer — bridges build trace to runtime monitor (V1).
 */

import type {
  LaunchReadinessBuildTraceCallback,
  LaunchReadinessBuildTraceEvent,
} from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import { getChatStressCompletionSnapshot } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import { shouldPropagateLiveChatStressRuntimeFeed } from '../founder-test-chat-stress-simulation/live-chat-stress-runner-path.js';
import { isChatStressSimulationComplete } from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import { PINNED_RUNTIME_TRACE_OPERATION_IDS } from './runtime-trace-registry.js';
import {
  STALL_SLOW_THRESHOLD_MS,
  STALL_STALLED_THRESHOLD_MS,
} from './founder-test-runtime-registry.js';
import { resolveChatStressWorstCaseBatchDeadlineMs } from '../founder-test-product-readiness/product-readiness-simulation-budget.js';
import type { FounderTestTraceEventStatus } from './founder-test-runtime-types.js';

export const LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS =
  'LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_V1_PASS';

export const LAUNCH_READINESS_ARTIFACT_BUILD_TRACE_REPORT_TITLE =
  'Launch Readiness Artifact Build Trace Report';

/** Suspected primary blocker when Stage 2 stalls after generic artifact build message. */
export const SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION =
  'running-product-readiness-simulation';

export interface ActiveArtifactBuildSubstep {
  operationId: string;
  operationLabel: string;
  startedAt: string;
  slowEmitted: boolean;
  stallEmitted: boolean;
}

let activeArtifactBuildSubstep: ActiveArtifactBuildSubstep | null = null;
let lastSuccessfulArtifactSubstep: string | null = null;
let lastFailedArtifactSubstep: string | null = null;
let lastFailedArtifactError: string | null = null;

export function resetLaunchReadinessArtifactBuildTracerForTests(): void {
  activeArtifactBuildSubstep = null;
  lastSuccessfulArtifactSubstep = null;
  lastFailedArtifactSubstep = null;
  lastFailedArtifactError = null;
}

export function getActiveArtifactBuildSubstep(): ActiveArtifactBuildSubstep | null {
  return activeArtifactBuildSubstep ? { ...activeArtifactBuildSubstep } : null;
}

export function getLastSuccessfulArtifactSubstep(): string | null {
  return lastSuccessfulArtifactSubstep;
}

export function getLastFailedArtifactSubstep(): { operation: string | null; error: string | null } {
  return { operation: lastFailedArtifactSubstep, error: lastFailedArtifactError };
}

export function beginArtifactBuildSubstep(input: {
  operationId: string;
  operationLabel: string;
  at?: Date;
}): void {
  const at = input.at ?? new Date();
  activeArtifactBuildSubstep = {
    operationId: input.operationId,
    operationLabel: input.operationLabel,
    startedAt: at.toISOString(),
    slowEmitted: false,
    stallEmitted: false,
  };
}

const PRODUCT_READINESS_CHAT_STRESS_SUBSTEP_ID = 'product-readiness-chat-stress-started';

export function clearChatStressArtifactSubstepIfSettled(input: {
  operationLabel?: string;
  withWarnings?: boolean;
} = {}): boolean {
  const active = getActiveArtifactBuildSubstep();
  if (active?.operationId !== PRODUCT_READINESS_CHAT_STRESS_SUBSTEP_ID) {
    return false;
  }
  const snap = getChatStressCompletionSnapshot();
  const chatStressComplete = isChatStressSimulationComplete();
  if (!chatStressComplete) {
    return false;
  }
  completeArtifactBuildSubstep({
    operationId: PRODUCT_READINESS_CHAT_STRESS_SUBSTEP_ID,
    operationLabel:
      input.operationLabel ??
      (input.withWarnings
        ? 'Chat stress complete (degraded — budget exceeded)'
        : 'Chat stress complete'),
    status: 'PASSED',
  });
  return true;
}

export function reconcileActiveArtifactSubstepAfterChatStressSettled(nowMs = Date.now()): boolean {
  const snap = getChatStressCompletionSnapshot(nowMs);
  return clearChatStressArtifactSubstepIfSettled({
    withWarnings: snap.pendingCount > 0 || snap.startedCount !== snap.settledCount,
  });
}

export function completeArtifactBuildSubstep(input: {
  operationId: string;
  operationLabel: string;
  status: 'PASSED' | 'FAILED';
  errorMessage?: string;
}): void {
  if (input.status === 'PASSED') {
    lastSuccessfulArtifactSubstep = input.operationLabel;
  } else {
    lastFailedArtifactSubstep = input.operationLabel;
    lastFailedArtifactError = input.errorMessage ?? 'unknown error';
  }
  if (activeArtifactBuildSubstep?.operationId === input.operationId) {
    activeArtifactBuildSubstep = null;
  }
}

export function analyzeArtifactBuildSubstepStall(nowMs = Date.now()): {
  health: 'HEALTHY' | 'SLOW' | 'STALLED';
  operationId: string | null;
  operationLabel: string | null;
  elapsedMs: number;
  reason: string | null;
  traceStatus: FounderTestTraceEventStatus | null;
} {
  if (!activeArtifactBuildSubstep) {
    return {
      health: 'HEALTHY',
      operationId: null,
      operationLabel: null,
      elapsedMs: 0,
      reason: null,
      traceStatus: null,
    };
  }

  const elapsedMs = Math.max(
    0,
    nowMs - new Date(activeArtifactBuildSubstep.startedAt).getTime(),
  );
  const label = activeArtifactBuildSubstep.operationLabel;
  const opId = activeArtifactBuildSubstep.operationId;
  const stalledThresholdMs =
    opId === 'product-readiness-chat-stress-started' ||
    opId.startsWith('product-readiness-chat-stress') ||
    opId === SUSPECTED_LAUNCH_READINESS_BLOCKING_OPERATION
      ? resolveChatStressWorstCaseBatchDeadlineMs()
      : STALL_STALLED_THRESHOLD_MS;

  if (elapsedMs >= stalledThresholdMs) {
    return {
      health: 'STALLED',
      operationId: opId,
      operationLabel: label,
      elapsedMs,
      reason: `${label} has not advanced for ${Math.round(elapsedMs / 1000)}s`,
      traceStatus: 'STALLED',
    };
  }
  if (elapsedMs >= STALL_SLOW_THRESHOLD_MS) {
    return {
      health: 'SLOW',
      operationId: opId,
      operationLabel: label,
      elapsedMs,
      reason: `${label} is taking longer than usual (${Math.round(elapsedMs / 1000)}s elapsed)`,
      traceStatus: 'SLOW',
    };
  }

  return {
    health: 'HEALTHY',
    operationId: opId,
    operationLabel: label,
    elapsedMs,
    reason: null,
    traceStatus: 'RUNNING',
  };
}

export function markArtifactBuildSubstepSlowEmitted(): void {
  if (activeArtifactBuildSubstep) activeArtifactBuildSubstep.slowEmitted = true;
}

export function markArtifactBuildSubstepStallEmitted(): void {
  if (activeArtifactBuildSubstep) activeArtifactBuildSubstep.stallEmitted = true;
}

export function shouldEmitArtifactBuildSubstepSlow(): boolean {
  return activeArtifactBuildSubstep != null && !activeArtifactBuildSubstep.slowEmitted;
}

export function shouldEmitArtifactBuildSubstepStall(): boolean {
  return activeArtifactBuildSubstep != null && !activeArtifactBuildSubstep.stallEmitted;
}

export function createLaunchReadinessArtifactBuildTraceBridge(handlers: {
  onSubstepRunning: (input: { operationId: string; operationLabel: string; stageId: string }) => void;
  onSubstepPassed: (input: { operationId: string; operationLabel: string; stageId: string }) => void;
  onSubstepFailed: (input: {
    operationId: string;
    operationLabel: string;
    stageId: string;
    errorMessage?: string;
  }) => void;
}): LaunchReadinessBuildTraceCallback {
  const stageId = 'INTAKE_VALIDATION';

  function skipsRuntimeTracePropagation(operationId: string): boolean {
    if (PINNED_RUNTIME_TRACE_OPERATION_IDS.has(operationId)) {
      return false;
    }
    if (shouldPropagateLiveChatStressRuntimeFeed(operationId)) {
      return false;
    }
    return skipsArtifactSubstepMutation(operationId);
  }

  function skipsArtifactSubstepMutation(operationId: string): boolean {
    return (
      operationId.startsWith('chat-stress-scenario:') ||
      operationId === 'chat-stress-simulation-started' ||
      operationId === 'chat-stress-simulation-slow' ||
      operationId === 'chat-stress-simulation-stalled' ||
      operationId === 'chat-stress-simulation-budget-exceeded' ||
      operationId === 'chat-stress-simulation-complete' ||
      operationId === 'chat-stress-completion-condition-satisfied' ||
      operationId === 'chat-stress-simulation-complete-emitted' ||
      operationId === 'product-readiness-simulation-complete-emitted' ||
      operationId.startsWith('chat-stress-scenario-slow:') ||
      operationId.startsWith('chat-stress-scenario-duplicate-ignored:') ||
      operationId.startsWith('chat-stress-watchdog-armed:') ||
      operationId.startsWith('chat-stress-watchdog-fired:') ||
      operationId.startsWith('chat-stress-scenario-settled:') ||
      operationId.startsWith('chat-stress-scenario-timed-out-settled:') ||
      operationId === 'chat-stress-pending-count-updated' ||
      operationId === 'chat-stress-pending-leak' ||
      operationId === 'chat-stress-batch-deadline-armed' ||
      operationId === 'chat-stress-terminal-sweep-started' ||
      operationId === 'chat-stress-terminal-sweep-settled' ||
      operationId === 'product-readiness-chat-stress-complete' ||
      operationId === 'PRODUCT_READINESS_COMPLETION_CHECK' ||
      operationId === 'PRODUCT_READINESS_COMPLETED' ||
      operationId === 'PRODUCT_READINESS_COMPLETE' ||
      operationId === 'PRODUCT_READINESS_FORCED_COMPLETION' ||
      operationId === 'PRODUCT_READINESS_PROPAGATION_START' ||
      operationId === 'PRODUCT_READINESS_PROPAGATION_STEP' ||
      operationId === 'PRODUCT_READINESS_PROPAGATION_COMPLETE' ||
      operationId === 'PRODUCT_READINESS_PROPAGATION_FAILURE' ||
      operationId.startsWith('REAL_FOUNDER_')
    );
  }

  function completeParentProductReadinessChatStressSubstep(input: {
    operationLabel: string;
    status: 'PASSED' | 'FAILED';
    errorMessage?: string;
  }): void {
    completeArtifactBuildSubstep({
      operationId: PRODUCT_READINESS_CHAT_STRESS_SUBSTEP_ID,
      operationLabel: input.operationLabel,
      status: input.status,
      errorMessage: input.errorMessage,
    });
  }

  function handleProductReadinessChatStressComplete(event: {
    operationLabel: string;
    phase: LaunchReadinessBuildTraceEvent['phase'];
    errorMessage?: string;
  }): void {
    const snap = getChatStressCompletionSnapshot();
    const chatSettled = isChatStressSimulationComplete();
    const degraded =
      event.phase === 'BUDGET_EXCEEDED' || event.phase === 'STALLED' || event.phase === 'SLOW';

    if (degraded || event.phase === 'PASSED' || chatSettled) {
      completeParentProductReadinessChatStressSubstep({
        operationLabel:
          degraded && event.phase === 'BUDGET_EXCEEDED'
            ? `${event.operationLabel} (degraded — budget exceeded)`
            : event.operationLabel,
        status: 'PASSED',
        errorMessage: event.errorMessage,
      });
      return;
    }

    completeParentProductReadinessChatStressSubstep({
      operationLabel: event.operationLabel,
      status: 'FAILED',
      errorMessage: event.errorMessage,
    });
  }

  return (event) => {
    if (event.phase === 'RUNNING') {
      if (!skipsArtifactSubstepMutation(event.operationId)) {
        beginArtifactBuildSubstep({
          operationId: event.operationId,
          operationLabel: event.operationLabel,
        });
      }
      if (!skipsRuntimeTracePropagation(event.operationId)) {
        handlers.onSubstepRunning({
          operationId: event.operationId,
          operationLabel: event.operationLabel,
          stageId,
        });
      }
      return;
    }
    if (event.phase === 'BUDGET_EXCEEDED' || event.phase === 'STALLED' || event.phase === 'SLOW') {
      if (event.operationId === 'product-readiness-chat-stress-complete') {
        handleProductReadinessChatStressComplete(event);
      } else if (
        event.operationId === 'product-readiness-simulation-stalled' ||
        event.operationId === 'product-readiness-simulation-slow'
      ) {
        reconcileActiveArtifactSubstepAfterChatStressSettled();
      } else if (!skipsArtifactSubstepMutation(event.operationId)) {
        completeArtifactBuildSubstep({
          operationId: event.operationId,
          operationLabel: event.operationLabel,
          status: 'PASSED',
          errorMessage: event.errorMessage,
        });
      }
      if (!skipsRuntimeTracePropagation(event.operationId)) {
        handlers.onSubstepPassed({
          operationId: event.operationId,
          operationLabel: event.operationLabel,
          stageId,
        });
      }
      return;
    }
    if (event.phase === 'PASSED') {
      if (event.operationId === 'product-readiness-chat-stress-complete') {
        handleProductReadinessChatStressComplete(event);
      } else if (event.operationId === 'chat-stress-simulation-complete') {
        handleProductReadinessChatStressComplete(event);
        reconcileActiveArtifactSubstepAfterChatStressSettled();
      } else if (!skipsArtifactSubstepMutation(event.operationId)) {
        completeArtifactBuildSubstep({
          operationId: event.operationId,
          operationLabel: event.operationLabel,
          status: 'PASSED',
        });
      }
      if (!skipsRuntimeTracePropagation(event.operationId)) {
        handlers.onSubstepPassed({
          operationId: event.operationId,
          operationLabel: event.operationLabel,
          stageId,
        });
      }
      return;
    }
    if (event.operationId === 'product-readiness-chat-stress-complete') {
      handleProductReadinessChatStressComplete({
        operationLabel: event.operationLabel,
        phase: 'FAILED',
        errorMessage: event.errorMessage,
      });
    } else if (!skipsArtifactSubstepMutation(event.operationId)) {
      completeArtifactBuildSubstep({
        operationId: event.operationId,
        operationLabel: event.operationLabel,
        status: 'FAILED',
        errorMessage: event.errorMessage,
      });
    }
    if (!skipsRuntimeTracePropagation(event.operationId)) {
      handlers.onSubstepFailed({
        operationId: event.operationId,
        operationLabel: event.operationLabel,
        stageId,
        errorMessage: event.errorMessage,
      });
    }
  };
}
