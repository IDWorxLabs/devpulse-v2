/**
 * Timeline milestone analyzer.
 */

import type { TimelineEvent } from './timeline-types.js';
import type { TimelineState } from './timeline-types.js';

export interface MilestoneAnalysis {
  totalMilestones: number;
  mostImportant: TimelineEvent | null;
  recentMilestones: TimelineEvent[];
  summary: string;
}

export function analyzeTimelineMilestones(events: readonly TimelineEvent[], state: TimelineState): MilestoneAnalysis {
  const milestones = events.filter((e) => e.category === 'MILESTONE' || e.category === 'PHASE_COMPLETED');
  const sorted = [...milestones].sort((a, b) => {
    const impactOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const diff = impactOrder[b.impactLevel] - impactOrder[a.impactLevel];
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });

  const mostImportant = sorted[0] ?? null;
  const recentMilestones = [...milestones].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  return {
    totalMilestones: state.completedMilestones.length,
    mostImportant,
    recentMilestones,
    summary: `${state.completedMilestones.length} milestones registered across ${state.completedPhases.length} completed phases.`,
  };
}

export function findPhaseIntroduction(events: readonly TimelineEvent[], featureQuery: string): TimelineEvent | null {
  const lower = featureQuery.toLowerCase();
  const matches = events.filter(
    (e) =>
      (e.category === 'PHASE_COMPLETED' || e.category === 'MILESTONE' || e.category === 'PHASE_STARTED') &&
      (e.title.toLowerCase().includes(lower) ||
        e.description.toLowerCase().includes(lower) ||
        e.relatedSystems.some((s) => s.toLowerCase().includes(lower))),
  );
  return matches.sort((a, b) => a.timestamp - b.timestamp)[0] ?? null;
}
