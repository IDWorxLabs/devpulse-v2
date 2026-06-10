/**
 * Multi Project Monitoring — isolated project event streams.
 */

import type { ProjectEvent } from './monitoring-types.js';

const streams = new Map<string, string>();
const events = new Map<string, ProjectEvent[]>();

let streamCounter = 0;
let eventCounter = 0;

const VALID_EVENT_TYPES: ProjectEvent['eventType'][] = [
  'BUILD', 'TESTING', 'FIXING', 'VERIFICATION', 'COMPLETION', 'PROGRESS',
];

export function createProjectEventStream(projectId: string): string {
  if (streams.has(projectId)) {
    return streams.get(projectId)!;
  }

  streamCounter += 1;
  const streamId = `event-stream-${projectId}-${streamCounter}`;
  streams.set(projectId, streamId);
  events.set(projectId, []);
  return streamId;
}

export function appendProjectEvent(
  projectId: string,
  eventType: ProjectEvent['eventType'],
  summary: string,
): ProjectEvent | undefined {
  if (!streams.has(projectId)) return undefined;
  if (!VALID_EVENT_TYPES.includes(eventType)) return undefined;

  eventCounter += 1;
  const event: ProjectEvent = {
    eventId: `project-event-${eventCounter}`,
    projectId,
    eventType,
    summary,
    timestamp: Date.now(),
  };

  const list = events.get(projectId) ?? [];
  list.push(event);
  events.set(projectId, list);
  return event;
}

export function getProjectEventStream(projectId: string): ProjectEvent[] {
  return [...(events.get(projectId) ?? [])];
}

export function getProjectEventStreamCount(): number {
  return streams.size;
}

export function resetProjectEventStreamManagerForTests(): void {
  streams.clear();
  events.clear();
  streamCounter = 0;
  eventCounter = 0;
}
