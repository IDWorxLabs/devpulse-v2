/**
 * Button interaction tester — discovery, simulation, outcome recording without correctness.
 */

import type { ExecutedInteraction, InteractionPlan, InteractionResult } from './types.js';

let execCounter = 0;

function nextExecId(): string {
  execCounter += 1;
  return `bexec-${execCounter.toString().padStart(4, '0')}`;
}

export function resetButtonInteractionCounterForTests(): void {
  execCounter = 0;
}

export function executeButtonInteractions(
  plans: InteractionPlan[],
): { executed: ExecutedInteraction[]; results: InteractionResult[] } {
  const buttonPlans = plans.filter(
    (p) => p.interactionType === 'BUTTON_INTERACTION' || p.interactionType === 'MENU_INTERACTION',
  );

  const executed: ExecutedInteraction[] = [];
  const results: InteractionResult[] = [];
  const now = Date.now();

  for (const plan of buttonPlans) {
    const execId = nextExecId();
    executed.push({
      executionId: execId,
      planId: plan.planId,
      interactionType: plan.interactionType,
      target: plan.target,
      state: 'COMPLETED',
      simulated: true,
    });
    results.push({
      interactionId: execId,
      interactionType: plan.interactionType,
      target: plan.target,
      startTime: now,
      endTime: now + 50,
      observedOutcome: `Button/menu interaction simulated on ${plan.target} — outcome recorded, no verdict`,
      warnings: ['Simulation only — no correctness determination'],
      noVerdict: true,
    });
  }

  return { executed, results };
}
