/**
 * Recovery Strategy Engine — evidence-ranked strategy selection.
 */

import type {
  RecoveryStrategy,
  RecoveryStrategyInput,
  RecoveryStrategySelection,
} from './recovery-strategy-engine-types.js';

let strategyCounter = 0;

export function resetRecoveryStrategyEngineForTests(): void {
  strategyCounter = 0;
}

export function generateRecoveryStrategies(input: RecoveryStrategyInput): RecoveryStrategy[] {
  return input.plan.candidates.map((candidate, index) => {
    strategyCounter += 1;
    const strategyId = `strategy-${strategyCounter}`;
    const deterministicKey = `${input.rootCause.category}:${candidate.operation}:${input.plan.failureStage}`;
    return {
      readOnly: true,
      strategyId,
      operation: candidate.operation,
      selectedReason: candidate.reason,
      expectedOutcome: expectedOutcomeForOperation(candidate.operation, input.rootCause.category),
      evidenceRefs: [...(input.evidenceRefs ?? []), ...candidate.evidenceRefs],
      confidence: candidate.confidence,
      rank: candidate.rank,
      deterministicKey,
    };
  });
}

export function selectSafestRecoveryStrategy(strategies: readonly RecoveryStrategy[]): RecoveryStrategySelection {
  if (strategies.length === 0) {
    return {
      readOnly: true,
      selected: null,
      alternatives: [],
      selectionReason: 'No recovery strategies available.',
    };
  }

  const sorted = [...strategies].sort((a, b) => b.confidence - a.confidence || a.rank - b.rank);
  const selected = sorted[0]!;
  return {
    readOnly: true,
    selected,
    alternatives: sorted.slice(1),
    selectionReason: `Selected ${selected.operation} with confidence ${selected.confidence} (${selected.selectedReason}).`,
  };
}

export function selectNextAlternativeStrategy(
  strategies: readonly RecoveryStrategy[],
  attemptedStrategyIds: readonly string[],
): RecoveryStrategy | null {
  const remaining = strategies
    .filter((s) => !attemptedStrategyIds.includes(s.strategyId))
    .sort((a, b) => b.confidence - a.confidence);
  return remaining[0] ?? null;
}

function expectedOutcomeForOperation(
  operation: RecoveryStrategy['operation'],
  category: string,
): string {
  switch (operation) {
    case 'REPLAY':
      return 'Validation replay passes with refreshed evidence.';
    case 'RESTART':
      return 'Runtime or preview service restarts successfully.';
    case 'REGENERATE':
      return 'Missing artifacts regenerated and verified.';
    case 'REBUILD':
      return 'Workspace rebuilt to stable engineering boundary.';
    case 'REPAIR':
      return `Root cause ${category} repaired with autonomous debugging evidence.`;
    case 'RETRY':
      return 'Failed stage completes on bounded retry.';
    case 'RESUME':
      return 'Pipeline resumes from last stable boundary.';
    case 'CONTINUE':
      return 'Engineering pipeline continues without user action.';
    default:
      return 'Engineering recovers and continues autonomously.';
  }
}
