/**
 * Multi Project Monitoring — isolated project timelines.
 */

import type { TimelineEvent } from './monitoring-types.js';
import { getCachedTimeline, setCachedTimeline } from './monitoring-cache.js';

const timelines = new Map<string, string>();
const timelineEvents = new Map<string, TimelineEvent[]>();

let timelineCounter = 0;
let eventCounter = 0;

export function createProjectTimeline(projectId: string): string {
  if (timelines.has(projectId)) {
    return timelines.get(projectId)!;
  }

  timelineCounter += 1;
  const timelineId = `timeline-${projectId}-${timelineCounter}`;
  timelines.set(projectId, timelineId);
  timelineEvents.set(projectId, []);
  return timelineId;
}

export function appendTimelineEvent(
  projectId: string,
  category: string,
  summary: string,
): TimelineEvent | undefined {
  if (!timelines.has(projectId)) return undefined;

  eventCounter += 1;
  const event: TimelineEvent = {
    eventId: `timeline-event-${eventCounter}`,
    projectId,
    category,
    summary,
    timestamp: Date.now(),
  };

  const list = timelineEvents.get(projectId) ?? [];
  list.push(event);
  list.sort((a, b) => a.timestamp - b.timestamp);
  timelineEvents.set(projectId, list);
  setCachedTimeline(projectId, list);
  return event;
}

export function getProjectTimeline(projectId: string): TimelineEvent[] {
  const cached = getCachedTimeline(projectId);
  if (cached) return cached;
  const result = [...(timelineEvents.get(projectId) ?? [])];
  setCachedTimeline(projectId, result);
  return result;
}

export function getProjectTimelineCount(): number {
  return timelines.size;
}

export function resetProjectTimelineManagerForTests(): void {
  timelines.clear();
  timelineEvents.clear();
  timelineCounter = 0;
  eventCounter = 0;
}
