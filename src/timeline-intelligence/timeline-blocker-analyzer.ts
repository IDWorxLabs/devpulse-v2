/**
 * Timeline blocker analyzer.
 */

import type { TimelineEvent, TimelineState } from './timeline-types.js';

export interface BlockerAnalysis {
  blockerCount: number;
  primaryBlocker: string | null;
  blockers: string[];
  summary: string;
}

export function analyzeTimelineBlockers(state: TimelineState, events: readonly TimelineEvent[]): BlockerAnalysis {
  const eventBlockers = events.filter((e) => e.category === 'BLOCKER').map((e) => e.description);
  const blockers = [...new Set([...state.activeBlockers, ...eventBlockers])];

  return {
    blockerCount: blockers.length,
    primaryBlocker: blockers[0] ?? null,
    blockers,
    summary:
      blockers.length > 0
        ? `${blockers.length} active blockers constrain roadmap progress — execution and cloud runtime remain deferred.`
        : 'No active blockers registered in timeline state.',
  };
}
