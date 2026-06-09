/**
 * Progress blocker analyzer — visible blockers affecting progress.
 */

import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { readPortfolioProjects } from '../portfolio-intelligence/index.js';
import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import type { ProgressBlocker } from './progress-intelligence-types.js';

let blockerCounter = 0;

function nextBlockerId(): string {
  blockerCounter += 1;
  return `pblk-${blockerCounter.toString().padStart(4, '0')}`;
}

export function analyzeProgressBlockers(query: string): ProgressBlocker[] {
  const profile = getCurrentProjectProfile();
  const context = buildDecisionContext(query);
  const projects = readPortfolioProjects(query);
  const blockers: ProgressBlocker[] = [];

  for (const item of profile.blockedItems) {
    blockers.push({
      blockerId: nextBlockerId(),
      summary: item,
      projectId: profile.projectId,
      visibilityOnly: true,
    });
  }

  for (const dep of context.dependencyBlockers.slice(0, 4)) {
    blockers.push({
      blockerId: nextBlockerId(),
      summary: dep,
      projectId: profile.projectId,
      visibilityOnly: true,
    });
  }

  for (const project of projects.filter((p) => p.blocked)) {
    blockers.push({
      blockerId: nextBlockerId(),
      summary: `${project.projectName} is blocked at ${project.phase}`,
      projectId: project.projectId,
      visibilityOnly: true,
    });
  }

  return blockers;
}

export function resetProgressBlockerCounterForTests(): void {
  blockerCounter = 0;
}
