/**
 * Form interaction tester — field interaction and submission simulation without correctness.
 */

import type { ExecutedInteraction, InteractionPlan, InteractionResult } from './types.js';

let execCounter = 0;

function nextExecId(): string {
  execCounter += 1;
  return `fexec-${execCounter.toString().padStart(4, '0')}`;
}

export function resetFormInteractionCounterForTests(): void {
  execCounter = 0;
}

export function executeFormInteractions(
  plans: InteractionPlan[],
): { executed: ExecutedInteraction[]; results: InteractionResult[] } {
  const formPlans = plans.filter((p) => p.interactionType === 'FORM_INTERACTION');

  const executed: ExecutedInteraction[] = [];
  const results: InteractionResult[] = [];
  const now = Date.now();

  for (const plan of formPlans) {
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
      endTime: now + 120,
      observedOutcome: `Form interaction simulated on ${plan.target} — input and submission attempt recorded`,
      warnings: ['No UI quality scoring or correctness verdict'],
      noVerdict: true,
    });
  }

  return { executed, results };
}
