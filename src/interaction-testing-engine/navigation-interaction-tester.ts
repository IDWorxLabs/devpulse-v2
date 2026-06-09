/**
 * Navigation interaction tester — route/menu/tab traversal without correctness.
 */

import type { ExecutedInteraction, InteractionPlan, InteractionResult } from './types.js';

let execCounter = 0;

function nextExecId(): string {
  execCounter += 1;
  return `nexec-${execCounter.toString().padStart(4, '0')}`;
}

export function resetNavigationInteractionCounterForTests(): void {
  execCounter = 0;
}

export function executeNavigationInteractions(
  plans: InteractionPlan[],
): { executed: ExecutedInteraction[]; results: InteractionResult[] } {
  const navPlans = plans.filter(
    (p) =>
      p.interactionType === 'NAVIGATION_INTERACTION' ||
      p.interactionType === 'ROUTE_INTERACTION' ||
      p.interactionType === 'TAB_INTERACTION',
  );

  const executed: ExecutedInteraction[] = [];
  const results: InteractionResult[] = [];
  const now = Date.now();

  for (const plan of navPlans) {
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
      endTime: now + 80,
      observedOutcome: `Navigation simulated on ${plan.target} — traversal recorded, no verdict`,
      warnings: ['No correctness or regression pass/fail determination'],
      noVerdict: true,
    });
  }

  return { executed, results };
}
