/**
 * Multi Project Monitoring — independent project progress tracking.
 */

import type { ProjectProgress } from './monitoring-types.js';
import { getCachedProgress, setCachedProgress } from './monitoring-cache.js';

const progressMap = new Map<string, ProjectProgress>();

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function computeOverall(p: Omit<ProjectProgress, 'overall' | 'updatedAt'>): number {
  const values = [p.planning, p.build, p.testing, p.fixing, p.verification, p.completion];
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function updateProjectProgress(
  projectId: string,
  updates: Partial<Pick<ProjectProgress, 'planning' | 'build' | 'testing' | 'fixing' | 'verification' | 'completion'>>,
): ProjectProgress {
  const existing = progressMap.get(projectId) ?? {
    projectId,
    planning: 0,
    build: 0,
    testing: 0,
    fixing: 0,
    verification: 0,
    completion: 0,
    overall: 0,
    updatedAt: Date.now(),
  };

  const updated: ProjectProgress = {
    projectId,
    planning: clamp(updates.planning ?? existing.planning),
    build: clamp(updates.build ?? existing.build),
    testing: clamp(updates.testing ?? existing.testing),
    fixing: clamp(updates.fixing ?? existing.fixing),
    verification: clamp(updates.verification ?? existing.verification),
    completion: clamp(updates.completion ?? existing.completion),
    overall: 0,
    updatedAt: Date.now(),
  };

  updated.overall = computeOverall(updated);
  progressMap.set(projectId, updated);
  setCachedProgress(updated);
  return updated;
}

export function getProjectProgress(projectId: string): ProjectProgress | undefined {
  const cached = getCachedProgress(projectId);
  if (cached) return cached;
  const progress = progressMap.get(projectId);
  if (progress) setCachedProgress(progress);
  return progress;
}

export function listProjectProgress(): ProjectProgress[] {
  return [...progressMap.values()];
}

export function resetProjectProgressTrackerForTests(): void {
  progressMap.clear();
}
