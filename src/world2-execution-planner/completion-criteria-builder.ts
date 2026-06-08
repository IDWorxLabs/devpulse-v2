/**
 * Completion criteria builder — defines plan completion criteria.
 * Planning only. No execution.
 */

import type { CompletionCriterion, CompletionCriterionType, PlannerInput } from './types.js';

let criterionCounter = 0;

export function resetCompletionCounterForTests(): void {
  criterionCounter = 0;
}

function createCriterionId(): string {
  criterionCounter += 1;
  return `world2-complete-${criterionCounter.toString().padStart(4, '0')}`;
}

const CRITERION_DEFINITIONS: Array<{ type: CompletionCriterionType; description: (input: PlannerInput) => string }> = [
  {
    type: 'requirementsMet',
    description: (input) => `${input.requirements.length} requirements must be met for ${input.projectId}`,
  },
  {
    type: 'verificationPassed',
    description: (input) => `All verification points must pass for workspace ${input.workspaceId}`,
  },
  {
    type: 'governanceSatisfied',
    description: () => 'Phase 6 governance stack must be satisfied before any execution',
  },
  {
    type: 'workspaceReady',
    description: (input) => `Workspace ${input.workspaceId} must be ready for handoff`,
  },
];

export function buildCompletionCriteria(input: PlannerInput): CompletionCriterion[] {
  return CRITERION_DEFINITIONS.map((def) => ({
    criterionId: createCriterionId(),
    criterionType: def.type,
    description: def.description(input),
  }));
}

export function completionOutputKey(criteria: CompletionCriterion[]): string {
  return criteria.map((c) => c.criterionType).join(';');
}
