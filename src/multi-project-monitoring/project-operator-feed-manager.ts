/**
 * Multi Project Monitoring — isolated operator feed per project.
 */

import type { ProjectOperatorFeed } from './monitoring-types.js';
import { getCachedFeed, setCachedFeed } from './monitoring-cache.js';

const feeds = new Map<string, ProjectOperatorFeed>();
const feedEvents = new Map<string, string[]>();

let feedCounter = 0;

export function createProjectOperatorFeed(projectId: string): ProjectOperatorFeed {
  if (feeds.has(projectId)) {
    return feeds.get(projectId)!;
  }

  feedCounter += 1;
  const feed: ProjectOperatorFeed = {
    projectId,
    feedId: `operator-feed-${projectId}-${feedCounter}`,
    eventCount: 0,
    isolated: true,
  };

  feeds.set(projectId, feed);
  feedEvents.set(projectId, []);
  setCachedFeed(feed);
  return feed;
}

export function getProjectOperatorFeed(projectId: string): ProjectOperatorFeed | undefined {
  const cached = getCachedFeed(projectId);
  if (cached) return cached;
  const feed = feeds.get(projectId);
  if (feed) setCachedFeed(feed);
  return feed;
}

export function appendProjectOperatorEvent(
  projectId: string,
  eventSummary: string,
  category: 'progress' | 'verification' | 'completion' | 'event' = 'event',
): ProjectOperatorFeed | undefined {
  const feed = feeds.get(projectId);
  if (!feed) return undefined;

  const allowed = ['progress', 'verification', 'completion', 'event'];
  if (!allowed.includes(category)) return feed;

  const events = feedEvents.get(projectId) ?? [];
  events.push(`${category}:${eventSummary}`);
  feedEvents.set(projectId, events);

  const updated: ProjectOperatorFeed = {
    ...feed,
    eventCount: events.length,
    isolated: true,
  };
  feeds.set(projectId, updated);
  setCachedFeed(updated);
  return updated;
}

export function getProjectOperatorFeedEvents(projectId: string): string[] {
  return [...(feedEvents.get(projectId) ?? [])];
}

export function listProjectOperatorFeeds(): ProjectOperatorFeed[] {
  return [...feeds.values()];
}

export function getProjectOperatorFeedCount(): number {
  return feeds.size;
}

export function resetProjectOperatorFeedManagerForTests(): void {
  feeds.clear();
  feedEvents.clear();
  feedCounter = 0;
}
