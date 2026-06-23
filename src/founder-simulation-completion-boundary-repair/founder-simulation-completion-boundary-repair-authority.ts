/**
 * Phase 26.96 — Founder Simulation Completion Boundary Repair authority (V1).
 * Read-only orchestration helpers. No nested validators.
 */

import { createHash } from 'node:crypto';
import {
  emitFounderTestRuntimeTrace,
  getFounderTestRuntimeStatus,
  markFounderTestHandlerAlive,
  recordFounderTestRuntimeSubstep,
  touchFounderTestRuntimeHeartbeat,
} from '../founder-test-runtime-monitor/index.js';
import { applyFounderSimulationDegradationRootCauseSync } from '../founder-simulation-degradation-root-cause-repair/index.js';
import {
  detectFounderSimulationCompletion,
  emitFounderSimulationCompletionOnce,
  resetFounderSimulationCompletionDetectionForTests,
} from './founder-simulation-completion-detector.js';
import {
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_CACHE_KEY_PREFIX,
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
  FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS,
  FOUNDER_SIMULATION_HEARTBEAT_INTERVAL_MS,
  FOUNDER_SIMULATION_RUNNING,
  FOUNDER_SIMULATION_STAGE_BUDGET_MS,
} from './founder-simulation-completion-boundary-repair-registry.js';
import {
  recordFounderSimulationCompletionReport,
  resetFounderSimulationCompletionHistoryForTests,
} from './founder-simulation-completion-history.js';
import { auditFounderSimulationStage } from './founder-simulation-stage-auditor.js';
import {
  buildFounderSimulationDiagnosticMarkdown,
  planFounderSimulationStageCompletion,
} from './founder-simulation-repair-planner.js';
import { isCrossSystemOrchestrationProofEligible } from './founder-simulation-transition-analyzer.js';
import type {
  AssessFounderSimulationCompletionBoundaryInput,
  ExecuteFounderSimulationStageInput,
  FounderSimulationCompletionBoundaryAssessment,
  FounderSimulationCompletionBoundaryReport,
  FounderSimulationStageExecutionOutcome,
} from './founder-simulation-completion-boundary-repair-types.js';

let repairCounter = 0;

export function resetFounderSimulationCompletionBoundaryRepairCounterForTests(): void {
  repairCounter = 0;
}

export function resetFounderSimulationCompletionBoundaryRepairModuleForTests(): void {
  resetFounderSimulationCompletionBoundaryRepairCounterForTests();
  resetFounderSimulationCompletionHistoryForTests();
  resetFounderSimulationCompletionDetectionForTests();
}

function nextRepairId(): string {
  repairCounter += 1;
  return `founder-simulation-completion-boundary-${repairCounter}-${Date.now()}`;
}

function stableCacheKey(repairId: string, eventId: string | null): string {
  const digest = createHash('sha256')
    .update([FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS, repairId, eventId ?? 'none'].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_SIMULATION_COMPLETION_BOUNDARY_CACHE_KEY_PREFIX}:${digest}`;
}

function emitRunningTrace(): void {
  emitFounderTestRuntimeTrace({
    operationId: FOUNDER_SIMULATION_RUNNING,
    stageId: 'FOUNDER_SIMULATION_ENGINE',
    operationLabel: 'Founder simulation running',
    status: 'RUNNING',
  });
}

function emitCompletionTrace(eventId: string, message: string): void {
  emitFounderTestRuntimeTrace({
    operationId: eventId,
    stageId: 'FOUNDER_SIMULATION_ENGINE',
    operationLabel: message,
    status: 'PASSED',
  });
  emitFounderTestRuntimeTrace({
    operationId: `${eventId}-emitted`,
    stageId: 'FOUNDER_SIMULATION_ENGINE',
    operationLabel: `${eventId} emitted`,
    status: 'PASSED',
  });
}

export function executeFounderSimulationStageWithCompletionBoundary<T>(
  input: ExecuteFounderSimulationStageInput<T>,
): FounderSimulationStageExecutionOutcome<T> {
  const startedAt = Date.now();
  emitRunningTrace();
  markFounderTestHandlerAlive();

  let heartbeatCount = 0;
  const heartbeat = setInterval(() => {
    heartbeatCount += 1;
    markFounderTestHandlerAlive();
    touchFounderTestRuntimeHeartbeat('FOUNDER_SIMULATION_ENGINE');
    recordFounderTestRuntimeSubstep({
      stageId: 'FOUNDER_SIMULATION_ENGINE',
      operationId: `founder-simulation-v5-progress-${heartbeatCount}`,
      message: `Founder simulation V5 in progress (${heartbeatCount * (FOUNDER_SIMULATION_HEARTBEAT_INTERVAL_MS / 1000)}s)`,
    });
    input.onSubstep?.(
      `founder-simulation-v5-progress-${heartbeatCount}`,
      `Founder simulation V5 in progress`,
    );
  }, FOUNDER_SIMULATION_HEARTBEAT_INTERVAL_MS);

  try {
    const result = input.execute();
    const elapsedMs = Date.now() - startedAt;
    const budgetExceeded = elapsedMs > FOUNDER_SIMULATION_STAGE_BUDGET_MS;
    const detection = detectFounderSimulationCompletion({
      resultProduced: true,
      degraded: budgetExceeded,
      budgetExceeded,
      errorMessage: null,
      elapsedMs,
    });
    const emission = emitFounderSimulationCompletionOnce(detection.eventId);
    const planned = planFounderSimulationStageCompletion({
      eventId: detection.eventId,
      errorMessage: budgetExceeded ? 'V5 exceeded stage budget' : null,
    });
    if (emission.emitted) {
      emitCompletionTrace(detection.eventId, planned.completionMessage);
    }

    applyFounderSimulationDegradationRootCauseSync({
      simulationElapsedMs: elapsedMs,
      completionEventId: detection.eventId,
      degraded: detection.eventId.endsWith('_WITH_WARNINGS') || budgetExceeded,
      budgetExceeded,
      errorMessage: budgetExceeded ? 'Founder simulation exceeded stage budget' : null,
      skipHistoryRecording: input.skipHistoryRecording ?? true,
    });

    return {
      readOnly: true,
      result,
      degraded: detection.eventId.endsWith('_WITH_WARNINGS') || budgetExceeded,
      budgetExceeded,
      errorMessage: budgetExceeded ? 'Founder simulation exceeded stage budget' : null,
      completionEventId: detection.eventId,
      completionMessage: planned.completionMessage,
      stageStatus: planned.stageStatus,
      crossSystemOrchestrationEligible: isCrossSystemOrchestrationProofEligible(detection.eventId),
      diagnosticMarkdown: budgetExceeded
        ? buildFounderSimulationDiagnosticMarkdown({
            errorMessage: 'Founder simulation exceeded stage budget',
            elapsedMs,
            eventId: detection.eventId,
          })
        : null,
      elapsedMs,
    };
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    const errorMessage = err instanceof Error ? err.message : 'Founder simulation failed';
    const detection = detectFounderSimulationCompletion({
      resultProduced: false,
      degraded: true,
      budgetExceeded: elapsedMs > FOUNDER_SIMULATION_STAGE_BUDGET_MS,
      errorMessage,
      elapsedMs,
    });
    const emission = emitFounderSimulationCompletionOnce(detection.eventId);
    const planned = planFounderSimulationStageCompletion({
      eventId: detection.eventId,
      errorMessage,
    });
    if (emission.emitted) {
      emitCompletionTrace(detection.eventId, planned.completionMessage);
    }

    applyFounderSimulationDegradationRootCauseSync({
      simulationElapsedMs: elapsedMs,
      completionEventId: detection.eventId,
      degraded: true,
      budgetExceeded: elapsedMs > FOUNDER_SIMULATION_STAGE_BUDGET_MS,
      errorMessage,
      skipHistoryRecording: input.skipHistoryRecording ?? true,
    });

    return {
      readOnly: true,
      result: null,
      degraded: true,
      budgetExceeded: elapsedMs > FOUNDER_SIMULATION_STAGE_BUDGET_MS,
      errorMessage,
      completionEventId: detection.eventId,
      completionMessage: planned.completionMessage,
      stageStatus: planned.stageStatus,
      crossSystemOrchestrationEligible: isCrossSystemOrchestrationProofEligible(detection.eventId),
      diagnosticMarkdown: buildFounderSimulationDiagnosticMarkdown({
        errorMessage,
        elapsedMs,
        eventId: detection.eventId,
      }),
      elapsedMs,
    };
  } finally {
    clearInterval(heartbeat);
    markFounderTestHandlerAlive();
  }
}

export function assessFounderSimulationCompletionBoundary(
  input: AssessFounderSimulationCompletionBoundaryInput = {},
): FounderSimulationCompletionBoundaryAssessment {
  const repairId = nextRepairId();
  const generatedAt = new Date().toISOString();
  const runtime = getFounderTestRuntimeStatus();
  const runtimeMonitorActive =
    runtime.state === 'RUNNING' || runtime.state === 'STALLED' || runtime.state === 'COMPLETING';

  const outcome = input.outcome ?? null;
  const trace = auditFounderSimulationStage(outcome, runtimeMonitorActive);

  const passToken =
    trace.simulationStarted &&
    trace.completionEventEmitted &&
    trace.nextStageEligible &&
    !trace.failureClass
      ? FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_PASS
      : null;

  const report: FounderSimulationCompletionBoundaryReport = {
    readOnly: true,
    repairId,
    generatedAt,
    coreQuestion: FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_CORE_QUESTION,
    trace,
    elapsedMs: outcome?.elapsedMs ?? 0,
    degraded: outcome?.degraded ?? false,
    budgetExceeded: outcome?.budgetExceeded ?? false,
    completionMessage: outcome?.completionMessage ?? 'n/a',
    stageStatus: outcome?.stageStatus ?? 'FAILED',
    crossSystemOrchestrationEligible: outcome?.crossSystemOrchestrationEligible ?? false,
    passToken,
  };

  if (!input.skipHistoryRecording) {
    recordFounderSimulationCompletionReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_SIMULATION_COMPLETION_BOUNDARY_REPAIR_COMPLETE',
    report,
    cacheKey: stableCacheKey(repairId, trace.completionEventId),
  };
}
