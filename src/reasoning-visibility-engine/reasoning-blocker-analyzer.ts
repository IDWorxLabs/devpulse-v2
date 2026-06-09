/**
 * Reasoning blocker analyzer — visible blocker findings.
 */

import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import type { ReasoningBlocker } from './reasoning-visibility-types.js';

let blockerCounter = 0;

function nextBlockerId(): string {
  blockerCounter += 1;
  return `rblk-${blockerCounter.toString().padStart(4, '0')}`;
}

export function analyzeReasoningBlockers(query: string): ReasoningBlocker[] {
  const context = buildDecisionContext(query);
  const blockers: ReasoningBlocker[] = [];

  for (const item of context.blockedItems) {
    blockers.push({
      blockerId: nextBlockerId(),
      summary: item,
      sourceSystem: 'project_understanding_engine',
      visibilityOnly: true,
    });
  }

  for (const dep of context.dependencyBlockers.slice(0, 4)) {
    blockers.push({
      blockerId: nextBlockerId(),
      summary: dep,
      sourceSystem: 'dependency_intelligence',
      visibilityOnly: true,
    });
  }

  for (const tl of context.timelineBlockers.slice(0, 3)) {
    blockers.push({
      blockerId: nextBlockerId(),
      summary: tl,
      sourceSystem: 'timeline_intelligence',
      visibilityOnly: true,
    });
  }

  return blockers;
}

export function resetReasoningBlockerCounterForTests(): void {
  blockerCounter = 0;
}
