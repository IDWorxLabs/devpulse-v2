/**
 * Timeline context builder — assembles reasoning context from query.
 */

import { analyzeTimelineBlockers } from './timeline-blocker-analyzer.js';
import { analyzeTimelineMilestones } from './timeline-milestone-analyzer.js';
import { getTimelineEvents, getMostRecentEvents } from './timeline-event-store.js';
import { buildTimelineState } from './timeline-state-model.js';
import type { TimelineEvent, TimelineIntent, TimelineReasoningContext } from './timeline-types.js';

function resolveTimelineIntent(query: string): TimelineIntent {
  const lower = query.toLowerCase();

  if (lower.includes('what phase are we') || lower.includes('currently in')) return 'CURRENT_PHASE';
  if (lower.includes('came before') || lower.includes('before shared memory') || lower.includes('before cross-system')) {
    return 'WHAT_CAME_BEFORE';
  }
  if (
    lower.includes('should happen after') ||
    lower.includes('after timeline') ||
    lower.includes('what comes after')
  ) {
    return 'WHAT_COMES_AFTER';
  }
  if (lower.includes('has been completed') || lower.includes('was completed') || lower.includes('completed recently')) {
    return 'COMPLETED';
  }
  if (lower.includes('blocking') || lower.includes('blocker')) return 'BLOCKING';
  if (lower.includes('milestone mattered') || lower.includes('most important milestone')) return 'MILESTONE_IMPORTANCE';
  if (lower.includes('roadmap sequence') || lower.includes('sequence should work')) return 'ROADMAP_SEQUENCE';
  if (lower.includes('phase introduced') || lower.includes('introduced shared memory') || lower.includes('introduced cross-system')) {
    return 'PHASE_INTRODUCTION';
  }
  if (lower.includes('most recently') || lower.includes('what changed') || lower.includes('how did we get here')) {
    return 'RECENT_ACTIVITY';
  }
  if (lower.includes('should happen next')) return 'WHAT_COMES_AFTER';

  return 'GENERAL_TIMELINE';
}

function selectRelevantEvents(query: string, events: readonly TimelineEvent[], intent: TimelineIntent): TimelineEvent[] {
  const lower = query.toLowerCase();
  const tokens = lower.split(/[^a-z0-9.]+/).filter((t) => t.length > 2);

  if (intent === 'RECENT_ACTIVITY') return getMostRecentEvents(8);
  if (intent === 'BLOCKING') return events.filter((e) => e.category === 'BLOCKER' || e.category === 'RISK');
  if (intent === 'MILESTONE_IMPORTANCE') {
    return events.filter((e) => e.category === 'MILESTONE' || e.category === 'PHASE_COMPLETED');
  }
  if (intent === 'PHASE_INTRODUCTION') {
    return events.filter(
      (e) =>
        tokens.some(
          (t) =>
            e.title.toLowerCase().includes(t) ||
            e.phase.toLowerCase().includes(t) ||
            e.relatedSystems.some((s) => s.toLowerCase().includes(t)),
        ) || lower.includes('shared memory') && e.title.toLowerCase().includes('shared memory') ||
        lower.includes('cross-system') && e.title.toLowerCase().includes('cross-system'),
    );
  }

  return [...events]
    .map((event) => {
      let score = 0;
      for (const token of tokens) {
        if (event.title.toLowerCase().includes(token)) score += 2;
        if (event.phase.toLowerCase().includes(token)) score += 1.5;
        if (event.description.toLowerCase().includes(token)) score += 1;
        if (event.relatedSystems.some((s) => s.toLowerCase().includes(token))) score += 1;
      }
      return { event, score };
    })
    .filter((entry) => entry.score > 0 || intent === 'GENERAL_TIMELINE' || intent === 'ROADMAP_SEQUENCE')
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((entry) => entry.event);
}

export function buildTimelineContext(query: string): TimelineReasoningContext {
  const state = buildTimelineState();
  const events = getTimelineEvents();
  const intent = resolveTimelineIntent(query);
  const relevantEvents = selectRelevantEvents(query, events, intent);

  return {
    query,
    state,
    events: [...events],
    relevantEvents,
    intent,
  };
}

export function buildTimelineAnalysisSnapshot(query: string): {
  context: TimelineReasoningContext;
  milestoneAnalysis: ReturnType<typeof analyzeTimelineMilestones>;
  blockerAnalysis: ReturnType<typeof analyzeTimelineBlockers>;
} {
  const context = buildTimelineContext(query);
  const milestoneAnalysis = analyzeTimelineMilestones(context.events, context.state);
  const blockerAnalysis = analyzeTimelineBlockers(context.state, context.events);
  return { context, milestoneAnalysis, blockerAnalysis };
}

export function intentKey(intent: TimelineIntent): string {
  return intent;
}
