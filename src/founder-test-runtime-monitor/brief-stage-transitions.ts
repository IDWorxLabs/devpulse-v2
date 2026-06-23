/**
 * Brief stage transitions — auto-complete synthetic zero-work brief stages (V1).
 * Patches runtime monitor only; no new authority layer.
 */

import type {
  FounderTestRuntimeStageRecord,
  FounderTestRuntimeTraceEvent,
} from './founder-test-runtime-types.js';
import { hasPassedTraceEvent } from './stage2-completion-tracker.js';

export const BRIEF_STAGE_TRANSITIONS_PASS = 'BRIEF_STAGE_TRANSITIONS_PASS';

export const PLANNING_BRIEF_PASSED_OPERATION_ID = 'planning-brief-passed';
export const PLANNING_BRIEF_PASSED_MESSAGE = 'Planning Brief Generated';

export const ARCHITECTURE_BRIEF_PASSED_OPERATION_ID = 'architecture-brief-passed';
export const ARCHITECTURE_BRIEF_PASSED_MESSAGE = 'Architecture Brief Generated';

export const BUILD_PLAN_PASSED_OPERATION_ID = 'build-plan-passed';
export const BUILD_PLAN_PASSED_MESSAGE = 'Build Plan Generated';

export interface BriefStageTransitionSnapshot {
  state: string;
  stages: readonly FounderTestRuntimeStageRecord[];
  traceEvents: readonly FounderTestRuntimeTraceEvent[];
  activeArtifactBuildSubstep: string | null;
  missingCompletionBoundary: string | null;
  handlerAlive: boolean;
}

export interface BriefStageTransitionDef {
  stageId: 'PLANNING_BRIEF' | 'ARCHITECTURE_BRIEF' | 'BUILD_PLAN';
  prerequisiteStageId: string;
  nextStageId: string;
  passedOperationId: string;
  passedMessage: string;
  startedOperationIds: readonly string[];
}

export const BRIEF_STAGE_TRANSITIONS: readonly BriefStageTransitionDef[] = [
  {
    stageId: 'PLANNING_BRIEF',
    prerequisiteStageId: 'PLANNING_GATE',
    nextStageId: 'ARCHITECTURE_BRIEF',
    passedOperationId: PLANNING_BRIEF_PASSED_OPERATION_ID,
    passedMessage: PLANNING_BRIEF_PASSED_MESSAGE,
    startedOperationIds: ['planning-brief-started'],
  },
  {
    stageId: 'ARCHITECTURE_BRIEF',
    prerequisiteStageId: 'PLANNING_BRIEF',
    nextStageId: 'BUILD_PLAN',
    passedOperationId: ARCHITECTURE_BRIEF_PASSED_OPERATION_ID,
    passedMessage: ARCHITECTURE_BRIEF_PASSED_MESSAGE,
    startedOperationIds: ['architecture-brief-started'],
  },
  {
    stageId: 'BUILD_PLAN',
    prerequisiteStageId: 'ARCHITECTURE_BRIEF',
    nextStageId: 'FOUNDER_SIMULATION_ENGINE',
    passedOperationId: BUILD_PLAN_PASSED_OPERATION_ID,
    passedMessage: BUILD_PLAN_PASSED_MESSAGE,
    startedOperationIds: ['build-plan-started'],
  },
] as const;

export interface BriefStageTransitionHandlers {
  onCompleteStage: (stageId: string, message: string) => void;
  onAdvanceStage: (stageId: string) => void;
}

export interface BriefStageTransitionInput {
  getSnapshot: () => BriefStageTransitionSnapshot;
  handlers: BriefStageTransitionHandlers;
}

function stageStarted(
  stage: FounderTestRuntimeStageRecord | undefined,
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
  startedOperationIds: readonly string[],
): boolean {
  if (stage?.startedAt != null) return true;
  return startedOperationIds.some((operationId) => hasPassedTraceEvent(traceEvents, operationId));
}

export function shouldAutoCompleteBriefStage(
  input: BriefStageTransitionSnapshot,
  transition: BriefStageTransitionDef,
): boolean {
  if (input.state !== 'RUNNING' || !input.handlerAlive) {
    return false;
  }
  if (input.activeArtifactBuildSubstep != null) {
    return false;
  }
  if (input.missingCompletionBoundary != null) {
    return false;
  }

  const prerequisiteStage = input.stages.find((stage) => stage.stageId === transition.prerequisiteStageId);
  const briefStage = input.stages.find((stage) => stage.stageId === transition.stageId);
  if (prerequisiteStage?.status !== 'PASSED' || briefStage?.status !== 'RUNNING') {
    return false;
  }

  if (hasPassedTraceEvent(input.traceEvents, transition.passedOperationId)) {
    return false;
  }

  if (!stageStarted(briefStage, input.traceEvents, transition.startedOperationIds)) {
    return false;
  }

  return true;
}

export function reconcileBriefStageTransitionsOnSnapshot(input: BriefStageTransitionInput): boolean {
  let applied = false;

  for (const transition of BRIEF_STAGE_TRANSITIONS) {
    const snapshot = input.getSnapshot();
    if (!shouldAutoCompleteBriefStage(snapshot, transition)) {
      continue;
    }

    input.handlers.onCompleteStage(transition.stageId, transition.passedMessage);

    const nextStage = input.getSnapshot().stages.find((stage) => stage.stageId === transition.nextStageId);
    if (nextStage?.status === 'PENDING') {
      input.handlers.onAdvanceStage(transition.nextStageId);
    }

    applied = true;
  }

  return applied;
}
