/**
 * Phase 26.96 — Founder simulation stage auditor.
 */

import type {
  FounderSimulationStageExecutionOutcome,
  FounderSimulationStageTrace,
} from './founder-simulation-completion-boundary-repair-types.js';

export function auditFounderSimulationStage(
  outcome: FounderSimulationStageExecutionOutcome<unknown> | null,
  runtimeMonitorActive: boolean,
): FounderSimulationStageTrace {
  if (!outcome) {
    return {
      readOnly: true,
      simulationStarted: false,
      resultProduced: false,
      completionDetected: false,
      completionEventEmitted: false,
      completionEventId: null,
      nextStageEligible: false,
      runtimeMonitorActive,
      diagnosticStored: false,
      failureClass: 'SIMULATION_NOT_STARTED',
      detail: 'Founder simulation stage outcome missing',
    };
  }

  const resultProduced = outcome.result !== null || outcome.errorMessage !== null;
  const completionDetected = Boolean(outcome.completionEventId);
  const completionEventEmitted = completionDetected;
  const nextStageEligible = outcome.crossSystemOrchestrationEligible;
  const diagnosticStored = Boolean(outcome.diagnosticMarkdown);

  let failureClass = null as FounderSimulationStageTrace['failureClass'];
  if (!resultProduced) failureClass = 'SIMULATION_RESULT_MISSING';
  else if (!completionDetected) failureClass = 'COMPLETION_DETECTION_MISSING';
  else if (!completionEventEmitted) failureClass = 'COMPLETION_EVENT_NOT_EMITTED';
  else if (!nextStageEligible) failureClass = 'NEXT_STAGE_NOT_ELIGIBLE';
  else if (!runtimeMonitorActive && !outcome.degraded) {
    failureClass = 'RUNTIME_MONITOR_STOPPED_EARLY';
  }

  return {
    readOnly: true,
    simulationStarted: true,
    resultProduced,
    completionDetected,
    completionEventEmitted,
    completionEventId: outcome.completionEventId,
    nextStageEligible,
    runtimeMonitorActive,
    diagnosticStored,
    failureClass,
    detail: outcome.errorMessage ?? outcome.completionMessage,
  };
}
