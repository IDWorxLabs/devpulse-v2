/**
 * Multi Project Monitoring — lookup cache.
 */

import type {
  MonitoringAlert,
  ProjectOperatorFeed,
  ProjectProgress,
  ProjectPreviewSession,
  TimelineEvent,
} from './monitoring-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const feedCache = new Map<string, ProjectOperatorFeed>();
const timelineCache = new Map<string, TimelineEvent[]>();
const previewCache = new Map<string, ProjectPreviewSession[]>();
const progressCache = new Map<string, ProjectProgress>();
const alertCache = new Map<string, MonitoringAlert[]>();

export function getCachedFeed(projectId: string): ProjectOperatorFeed | undefined {
  const cached = feedCache.get(projectId);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedFeed(feed: ProjectOperatorFeed): void {
  feedCache.set(feed.projectId, feed);
}

export function getCachedTimeline(projectId: string): TimelineEvent[] | undefined {
  const cached = timelineCache.get(projectId);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedTimeline(projectId: string, events: TimelineEvent[]): void {
  timelineCache.set(projectId, events);
}

export function getCachedPreviewSessions(projectId: string): ProjectPreviewSession[] | undefined {
  const cached = previewCache.get(projectId);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPreviewSessions(projectId: string, sessions: ProjectPreviewSession[]): void {
  previewCache.set(projectId, sessions);
}

export function getCachedProgress(projectId: string): ProjectProgress | undefined {
  const cached = progressCache.get(projectId);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedProgress(progress: ProjectProgress): void {
  progressCache.set(progress.projectId, progress);
}

export function getCachedAlerts(projectId: string): MonitoringAlert[] | undefined {
  const cached = alertCache.get(projectId);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedAlerts(projectId: string, alerts: MonitoringAlert[]): void {
  alertCache.set(projectId, alerts);
}

export function getMonitoringCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetMonitoringCacheForTests(): void {
  feedCache.clear();
  timelineCache.clear();
  previewCache.clear();
  progressCache.clear();
  alertCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
