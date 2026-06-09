/**
 * Timeline state model — derived past/present/future state from events.
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { getTimelineEvents } from './timeline-event-store.js';
import type { TimelineState } from './timeline-types.js';

export function buildTimelineState(): TimelineState {
  const roadmap = getBrainRoadmapContext();
  const profile = getCurrentProjectProfile();
  const events = getTimelineEvents();

  const completedPhases = roadmap.completedPhases;
  const completedMilestones = events
    .filter((e) => e.category === 'MILESTONE' || e.category === 'PHASE_COMPLETED')
    .map((e) => e.title);

  const activeBlockers = [
    ...profile.blockedItems,
    ...events.filter((e) => e.category === 'BLOCKER').map((e) => e.description),
  ];

  const activeRisks = [
    ...profile.riskItems,
    ...events.filter((e) => e.category === 'RISK').map((e) => e.description),
  ];

  const recommendedNextSteps = [
    profile.nextRecommendedStep,
    ...events.filter((e) => e.category === 'RECOMMENDATION').map((e) => e.description),
  ];

  return {
    completedPhases,
    currentPhase: roadmap.currentPhase,
    nextPhase: roadmap.nextPhase,
    completedMilestones: [...new Set(completedMilestones)],
    activeBlockers: [...new Set(activeBlockers)],
    activeRisks: [...new Set(activeRisks)],
    recommendedNextSteps: [...new Set(recommendedNextSteps)],
  };
}

export function timelineStateKey(state: TimelineState): string {
  return [
    state.currentPhase,
    state.nextPhase,
    state.completedPhases.length,
    state.completedMilestones.length,
    state.activeBlockers.length,
  ].join('|');
}
