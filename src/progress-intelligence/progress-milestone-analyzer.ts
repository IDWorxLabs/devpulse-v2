/**
 * Progress milestone analyzer — completed and upcoming milestones.
 */

import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { readPortfolioProjects } from '../portfolio-intelligence/index.js';
import type { ProgressMilestone } from './progress-intelligence-types.js';

let milestoneCounter = 0;

function nextMilestoneId(): string {
  milestoneCounter += 1;
  return `pmil-${milestoneCounter.toString().padStart(4, '0')}`;
}

export function analyzeProgressMilestones(query: string): ProgressMilestone[] {
  const profile = getCurrentProjectProfile();
  const milestones: ProgressMilestone[] = [];

  for (const title of profile.completedMilestones) {
    milestones.push({
      milestoneId: nextMilestoneId(),
      title,
      completed: true,
      phase: profile.currentPhase,
      visibilityOnly: true,
    });
  }

  for (const gap of profile.missingCapabilities.slice(0, 6)) {
    milestones.push({
      milestoneId: nextMilestoneId(),
      title: gap,
      completed: false,
      phase: 'Upcoming',
      visibilityOnly: true,
    });
  }

  const projects = readPortfolioProjects(query);
  for (const project of projects.slice(0, 3)) {
    milestones.push({
      milestoneId: nextMilestoneId(),
      title: `${project.projectName} — ${project.phase}`,
      completed: project.health === 'EXCELLENT' || project.health === 'GOOD',
      phase: project.phase,
      visibilityOnly: true,
    });
  }

  return milestones;
}

export function resolveNextMilestone(query: string): string {
  const milestones = analyzeProgressMilestones(query);
  const next = milestones.find((m) => !m.completed);
  return next?.title ?? 'Phase 13.4 Progress Intelligence Foundation validation';
}

export function resetProgressMilestoneCounterForTests(): void {
  milestoneCounter = 0;
}
