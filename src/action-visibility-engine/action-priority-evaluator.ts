/**
 * Action priority evaluator — ranks visible actions by priority.
 */

import type { ActionCandidate } from './action-visibility-types.js';

export function rankActionsByPriority(candidates: ActionCandidate[]): ActionCandidate[] {
  return [...candidates].sort((a, b) => a.priority - b.priority);
}

export function findHighestPriorityAction(candidates: ActionCandidate[]): ActionCandidate | null {
  const ranked = rankActionsByPriority(candidates);
  return ranked[0] ?? null;
}

export function filterActionsByStatus(
  candidates: ActionCandidate[],
  status: ActionCandidate['status'],
): ActionCandidate[] {
  return candidates.filter((c) => c.status === status);
}

export function filterActionsBySource(
  candidates: ActionCandidate[],
  sourceSystem: string,
): ActionCandidate[] {
  const lower = sourceSystem.toLowerCase();
  return candidates.filter(
    (c) =>
      c.sourceSystem === lower ||
      c.sourceSystem.includes(lower) ||
      lower.includes(c.sourceSystem.split('_')[0] ?? ''),
  );
}
