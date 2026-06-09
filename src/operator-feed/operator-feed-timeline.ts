/**
 * Operator Feed timeline — ordered visibility event stream.
 */

import type { OperatorFeedTimeline } from './operator-feed-types.js';
import type { OperatorFeedEvent } from './operator-feed-types.js';

let timelineCounter = 0;

function nextTimelineId(): string {
  timelineCounter += 1;
  return `oftl-${timelineCounter.toString().padStart(4, '0')}`;
}

export function buildOperatorFeedTimeline(
  query: string,
  events: OperatorFeedEvent[],
  primaryCapability: string | null,
  sourceSystems: string[],
  startedAt: number,
): OperatorFeedTimeline {
  const completedAt = events.length > 0 ? events[events.length - 1]!.timestamp : startedAt;
  const finalStage = events.length > 0 ? events[events.length - 1]!.stage : 'Response Ready';

  return {
    timelineId: nextTimelineId(),
    query,
    events,
    stageCount: events.length,
    sourceSystems,
    primaryCapability,
    finalStage,
    responseReady: finalStage === 'Response Ready',
    startedAt,
    completedAt,
  };
}

export function isTimelineOrdered(timeline: OperatorFeedTimeline): boolean {
  if (timeline.events.length === 0) return false;
  for (let i = 1; i < timeline.events.length; i += 1) {
    if (timeline.events[i]!.timestamp < timeline.events[i - 1]!.timestamp) return false;
  }
  return timeline.events[timeline.events.length - 1]!.stage === 'Response Ready';
}

export function resetOperatorFeedTimelineCounterForTests(): void {
  timelineCounter = 0;
}
