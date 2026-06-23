/**
 * Phase 26.96 — Founder simulation transition analyzer.
 */

import {
  FOUNDER_SIMULATION_COMPLETE,
  FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS,
  POST_FOUNDER_SIMULATION_STAGES,
} from './founder-simulation-completion-boundary-repair-registry.js';
import type { FounderSimulationCompletionEventId } from './founder-simulation-completion-boundary-repair-types.js';

export function isCrossSystemOrchestrationProofEligible(
  completionEventId: FounderSimulationCompletionEventId | null,
): boolean {
  return (
    completionEventId === FOUNDER_SIMULATION_COMPLETE ||
    completionEventId === FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS
  );
}

export function resolveNextStageAfterFounderSimulation(
  completionEventId: FounderSimulationCompletionEventId | null,
): string | null {
  if (!isCrossSystemOrchestrationProofEligible(completionEventId)) {
    return null;
  }
  return POST_FOUNDER_SIMULATION_STAGES[0] ?? 'CROSS_SYSTEM_ORCHESTRATION_PROOF';
}

export function analyzeFounderSimulationTransition(input: {
  completionEventId: FounderSimulationCompletionEventId | null;
  stageCompleted: boolean;
}): {
  readOnly: true;
  transitionAllowed: boolean;
  nextStageId: string | null;
  failureClass: 'STAGE_TRANSITION_FAILED' | 'NEXT_STAGE_NOT_ELIGIBLE' | null;
  detail: string;
} {
  const nextStageId = resolveNextStageAfterFounderSimulation(input.completionEventId);
  const transitionAllowed = input.stageCompleted && nextStageId !== null;

  if (!input.stageCompleted) {
    return {
      readOnly: true,
      transitionAllowed: false,
      nextStageId: null,
      failureClass: 'STAGE_TRANSITION_FAILED',
      detail: 'Founder simulation stage not marked complete',
    };
  }

  if (!nextStageId) {
    return {
      readOnly: true,
      transitionAllowed: false,
      nextStageId: null,
      failureClass: 'NEXT_STAGE_NOT_ELIGIBLE',
      detail: 'Cross-System Orchestration Proof not eligible — completion event missing',
    };
  }

  return {
    readOnly: true,
    transitionAllowed: true,
    nextStageId,
    failureClass: null,
    detail: `Next stage eligible: ${nextStageId}`,
  };
}
