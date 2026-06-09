/**
 * Timeline next-step engine — future sequence recommendations.
 */

import type { TimelineState } from './timeline-types.js';

export interface TimelineNextStepResult {
  recommendedNextStep: string;
  sequence: string[];
  summary: string;
}

export function recommendTimelineNextSteps(state: TimelineState): TimelineNextStepResult {
  const sequence = [
    `Complete ${state.nextPhase}`,
    'Validate timeline reasoning integration with General Question Router',
    'Advance toward controlled execution only after intelligence foundations stabilize',
    'Defer cloud runtime until local runtime understanding is proven',
  ];

  const recommendedNextStep = state.recommendedNextSteps[0] ?? sequence[0]!;

  return {
    recommendedNextStep,
    sequence,
    summary: `Current phase: ${state.currentPhase}. Next: ${state.nextPhase}.`,
  };
}

export function getRoadmapSequence(state: TimelineState): string[] {
  return [...state.completedPhases, state.currentPhase, state.nextPhase];
}
