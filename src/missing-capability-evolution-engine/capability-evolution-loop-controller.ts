/**
 * Missing Capability Evolution Engine — Stage 13: evolution loop controller.
 */

import type {
  EvolutionAttemptRecord,
  EvolutionLoopBudget,
  HumanReviewEscalation,
  MissingCapabilityIntakeItem,
} from './missing-capability-evolution-types.js';
import {
  DEFAULT_EVOLUTION_LOOP_MAX_ATTEMPTS,
  DEFAULT_EVOLUTION_MAX_GENERATED_FILES,
  DEFAULT_EVOLUTION_MAX_MODIFIED_FILES,
} from './missing-capability-evolution-types.js';

let attemptCounter = 0;

export function resetCapabilityEvolutionLoopControllerForTests(): void {
  attemptCounter = 0;
}

export function createEvolutionLoopBudget(): EvolutionLoopBudget {
  return {
    readOnly: true,
    maxEvolutionAttempts: DEFAULT_EVOLUTION_LOOP_MAX_ATTEMPTS,
    maxGeneratedFiles: DEFAULT_EVOLUTION_MAX_GENERATED_FILES,
    maxModifiedFiles: DEFAULT_EVOLUTION_MAX_MODIFIED_FILES,
    maxValidationFailures: 2,
    maxInstallAttempts: 2,
    maxRiskIncrease: 1,
    maxTimeBudgetMs: 120_000,
  };
}

export function recordEvolutionAttempt(input: {
  capabilityId: string;
  attemptNumber: number;
  outcome: EvolutionAttemptRecord['outcome'];
  reason: string;
}): EvolutionAttemptRecord {
  attemptCounter += 1;
  return {
    readOnly: true,
    attemptId: `evo-attempt-${attemptCounter}`,
    capabilityId: input.capabilityId,
    attemptNumber: input.attemptNumber,
    outcome: input.outcome,
    reason: input.reason,
    timestamp: Date.now(),
  };
}

export function isEvolutionBudgetExhausted(input: {
  budget: EvolutionLoopBudget;
  attempts: readonly EvolutionAttemptRecord[];
  generatedFiles: number;
  validationFailures: number;
}): boolean {
  return (
    input.attempts.filter((a) => a.outcome === 'FAILED' || a.outcome === 'ROLLED_BACK').length >=
      input.budget.maxEvolutionAttempts ||
    input.generatedFiles > input.budget.maxGeneratedFiles ||
    input.validationFailures >= input.budget.maxValidationFailures
  );
}

export function escalateEvolutionToHumanReview(input: {
  item: MissingCapabilityIntakeItem;
  attempts: readonly EvolutionAttemptRecord[];
  remainingGap: string;
  safetyVerdict: HumanReviewEscalation['safetyVerdict'];
}): HumanReviewEscalation {
  return {
    readOnly: true,
    escalationId: `evo-escalation-${attemptCounter + 1}`,
    problemSummary: `Capability evolution exhausted for ${input.item.capabilityName}`,
    missingCapabilityName: input.item.capabilityName,
    safetyVerdict: input.safetyVerdict,
    evolutionAttempts: input.attempts,
    remainingGap: input.remainingGap,
    recommendedSafeNextAction: 'Review evolution evidence and approve manual capability design or adjust requirements',
  };
}
