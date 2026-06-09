/**
 * Workflow interaction tester — step progression simulation without correctness.
 */

import type { ExecutedInteraction, InteractionPlan, InteractionResult } from './types.js';

let execCounter = 0;

function nextExecId(): string {
  execCounter += 1;
  return `wexec-${execCounter.toString().padStart(4, '0')}`;
}

export function resetWorkflowInteractionCounterForTests(): void {
  execCounter = 0;
}

export function executeWorkflowInteractions(
  plans: InteractionPlan[],
): { executed: ExecutedInteraction[]; results: InteractionResult[] } {
  const workflowPlans = plans.filter((p) => p.interactionType === 'WORKFLOW_INTERACTION');

  const executed: ExecutedInteraction[] = [];
  const results: InteractionResult[] = [];
  const now = Date.now();

  for (const plan of workflowPlans) {
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
      endTime: now + 200,
      observedOutcome: `Workflow path simulated on ${plan.target} — step progression recorded`,
      warnings: ['No workflow correctness verdict'],
      noVerdict: true,
    });
  }

  return { executed, results };
}
