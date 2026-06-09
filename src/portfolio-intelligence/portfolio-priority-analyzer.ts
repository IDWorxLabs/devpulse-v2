/**
 * Portfolio priority analyzer — cross-project focus and priority ranking.
 */

import type { PortfolioPriority, PortfolioProject } from './portfolio-intelligence-types.js';

let priorityCounter = 0;

function nextPriorityId(): string {
  priorityCounter += 1;
  return `port-pri-${priorityCounter.toString().padStart(4, '0')}`;
}

export function analyzePortfolioPriorities(projects: PortfolioProject[]): PortfolioPriority[] {
  const sorted = [...projects].sort((a, b) => a.priority - b.priority);

  return sorted.map((project, index) => {
    const focusRecommended = index === 0 || (project.active && project.priority <= 2);
    let reason = `Priority rank ${project.priority} in portfolio inventory.`;
    if (project.active) reason += ' Currently active primary project.';
    if (project.blocked) reason += ' Blocked — resolve gates before advancing.';
    if (focusRecommended) reason += ' Recommended portfolio focus.';

    return {
      priorityId: nextPriorityId(),
      projectId: project.projectId,
      projectName: project.projectName,
      priority: project.priority,
      reason,
      focusRecommended,
      readOnly: true,
    };
  });
}

export function findHighestPriorityProject(projects: PortfolioProject[]): PortfolioProject | null {
  if (projects.length === 0) return null;
  return [...projects].sort((a, b) => a.priority - b.priority)[0] ?? null;
}

export function resetPortfolioPriorityCounterForTests(): void {
  priorityCounter = 0;
}
