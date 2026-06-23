/**
 * Planning Gate transition — auto-complete when intake passed and gate is idle (V1).
 * Patches runtime monitor only; no new authority layer.
 */

import type {
  FounderTestRuntimeStageRecord,
  FounderTestRuntimeTraceEvent,
} from './founder-test-runtime-types.js';
import { hasPassedTraceEvent } from './stage2-completion-tracker.js';

export const PLANNING_GATE_TRANSITION_PASS = 'PLANNING_GATE_TRANSITION_PASS';

export const PLANNING_GATE_PASSED_OPERATION_ID = 'planning-gate-passed';

export const PLANNING_GATE_PASSED_MESSAGE = 'Planning Gate Passed';

export interface PlanningGateTransitionSnapshot {
  state: string;
  stages: readonly FounderTestRuntimeStageRecord[];
  traceEvents: readonly FounderTestRuntimeTraceEvent[];
  activeArtifactBuildSubstep: string | null;
  missingCompletionBoundary: string | null;
  handlerAlive: boolean;
}

export interface PlanningGateTransitionHandlers {
  onCompletePlanningGate: () => void;
  onAdvancePlanningBrief: () => void;
}

export function shouldAutoCompletePlanningGate(input: PlanningGateTransitionSnapshot): boolean {
  if (input.state !== 'RUNNING' || !input.handlerAlive) {
    return false;
  }
  if (input.activeArtifactBuildSubstep != null) {
    return false;
  }
  if (input.missingCompletionBoundary != null) {
    return false;
  }

  const intakeStage = input.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION');
  const planningGateStage = input.stages.find((stage) => stage.stageId === 'PLANNING_GATE');
  if (intakeStage?.status !== 'PASSED' || planningGateStage?.status !== 'RUNNING') {
    return false;
  }

  if (hasPassedTraceEvent(input.traceEvents, PLANNING_GATE_PASSED_OPERATION_ID)) {
    return false;
  }

  const planningGateStarted =
    hasPassedTraceEvent(input.traceEvents, 'planning-gate-started') ||
    hasPassedTraceEvent(input.traceEvents, 'planning-gate-entered') ||
    planningGateStage.startedAt != null;
  if (!planningGateStarted) {
    return false;
  }

  return true;
}

export function reconcilePlanningGateTransitionOnSnapshot(
  input: PlanningGateTransitionSnapshot,
  handlers: PlanningGateTransitionHandlers,
): boolean {
  if (!shouldAutoCompletePlanningGate(input)) {
    return false;
  }

  handlers.onCompletePlanningGate();

  const planningBriefStage = input.stages.find((stage) => stage.stageId === 'PLANNING_BRIEF');
  if (planningBriefStage?.status === 'PENDING') {
    handlers.onAdvancePlanningBrief();
  }

  return true;
}
