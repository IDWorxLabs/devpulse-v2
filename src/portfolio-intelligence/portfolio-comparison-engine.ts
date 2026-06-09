/**
 * Portfolio comparison engine — compare two projects across health, risk, and priority.
 */

import { findPortfolioProject } from './portfolio-project-reader.js';
import type {
  PortfolioComparison,
  PortfolioConfidence,
  PortfolioProject,
} from './portfolio-intelligence-types.js';

let comparisonCounter = 0;

function nextComparisonId(): string {
  comparisonCounter += 1;
  return `port-cmp-${comparisonCounter.toString().padStart(4, '0')}`;
}

function extractComparisonTargets(query: string, projects: PortfolioProject[]): [string, string] | null {
  const lower = query.toLowerCase();

  const andMatch = lower.match(/compare\s+(.+?)\s+and\s+(.+?)[\.\?]?$/);
  if (andMatch) {
    return [andMatch[1]!.trim(), andMatch[2]!.trim()];
  }

  const vsMatch = lower.match(/compare\s+(.+?)\s+vs\.?\s+(.+?)[\.\?]?$/);
  if (vsMatch) {
    return [vsMatch[1]!.trim(), vsMatch[2]!.trim()];
  }

  if (lower.includes('devpulse') && (lower.includes('world 2') || lower.includes('world2'))) {
    return ['devpulse', 'world 2'];
  }

  if (projects.length >= 2) {
    return [projects[0]!.projectName, projects[1]!.projectName];
  }

  return null;
}

export function comparePortfolioProjects(
  query: string,
  projects: PortfolioProject[],
): PortfolioComparison | null {
  const targets = extractComparisonTargets(query, projects);
  if (!targets) return null;

  const [nameA, nameB] = targets;
  const projectA = findPortfolioProject(projects, nameA);
  const projectB = findPortfolioProject(projects, nameB);

  if (!projectA || !projectB) return null;

  const healthComparison =
    projectA.health === projectB.health
      ? `Both ${projectA.projectName} and ${projectB.projectName} share ${projectA.health} health.`
      : `${projectA.projectName} (${projectA.health}) vs ${projectB.projectName} (${projectB.health}).`;

  const riskComparison =
    projectA.riskLevel === projectB.riskLevel
      ? `Equal risk level (${projectA.riskLevel}).`
      : `${projectA.projectName} risk: ${projectA.riskLevel}; ${projectB.projectName} risk: ${projectB.riskLevel}.`;

  const priorityComparison =
    projectA.priority < projectB.priority
      ? `${projectA.projectName} has higher portfolio priority (rank ${projectA.priority} vs ${projectB.priority}).`
      : projectB.priority < projectA.priority
        ? `${projectB.projectName} has higher portfolio priority (rank ${projectB.priority} vs ${projectA.priority}).`
        : `Equal portfolio priority (rank ${projectA.priority}).`;

  let recommendation = 'Advisory comparison only — no execution or project switching performed.';
  if (projectA.active && !projectB.active) {
    recommendation = `Focus remains on active ${projectA.projectName}; ${projectB.projectName} stays isolated until gates clear.`;
  } else if (!projectA.active && projectB.active) {
    recommendation = `Focus remains on active ${projectB.projectName}; ${projectA.projectName} stays isolated until gates clear.`;
  } else if (projectA.priority < projectB.priority) {
    recommendation = `Portfolio advisory: prioritize ${projectA.projectName} next among compared projects.`;
  } else {
    recommendation = `Portfolio advisory: prioritize ${projectB.projectName} next among compared projects.`;
  }

  const confidence: PortfolioConfidence =
    projectA.dependencyCount > 0 && projectB.dependencyCount > 0 ? 'HIGH' : 'MEDIUM';

  return {
    comparisonId: nextComparisonId(),
    projectAId: projectA.projectId,
    projectAName: projectA.projectName,
    projectBId: projectB.projectId,
    projectBName: projectB.projectName,
    healthComparison,
    riskComparison,
    priorityComparison,
    recommendation,
    confidence,
    readOnly: true,
  };
}

export function resetPortfolioComparisonCounterForTests(): void {
  comparisonCounter = 0;
}
