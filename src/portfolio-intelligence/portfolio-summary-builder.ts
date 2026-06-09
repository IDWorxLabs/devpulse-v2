/**
 * Portfolio summary builder — unified portfolio-level summary.
 */

import type {
  PortfolioConfidence,
  PortfolioHealth,
  PortfolioPriority,
  PortfolioProject,
  PortfolioRisk,
  PortfolioSummary,
} from './portfolio-intelligence-types.js';

let summaryCounter = 0;

function nextSummaryId(): string {
  summaryCounter += 1;
  return `port-sum-${summaryCounter.toString().padStart(4, '0')}`;
}

export function buildPortfolioSummary(
  projects: PortfolioProject[],
  health: PortfolioHealth,
  risks: PortfolioRisk[],
  priorities: PortfolioPriority[],
): PortfolioSummary {
  const lines = [
    `Portfolio contains ${projects.length} projects (${health.activeProjectCount} active).`,
    `Overall health: ${health.overallLevel} (score ${health.score}).`,
    `Healthiest project: ${health.healthiestProjectName}.`,
  ];

  if (risks.length > 0) {
    lines.push(`Top risk: ${risks[0]!.projectName} — ${risks[0]!.summary}`);
  }

  const focus = priorities.find((p) => p.focusRecommended);
  if (focus) {
    lines.push(`Recommended focus: ${focus.projectName} (priority ${focus.priority}).`);
  }

  lines.push('', 'Project inventory:');
  for (const project of projects) {
    lines.push(
      `• ${project.projectName} — phase ${project.phase}, health ${project.health}, risk ${project.riskLevel}, priority ${project.priority}${project.active ? ' [ACTIVE]' : ''}${project.blocked ? ' [BLOCKED]' : ''}`,
    );
  }

  const confidence: PortfolioConfidence = projects.length >= 3 ? 'HIGH' : 'MEDIUM';

  return {
    summaryId: nextSummaryId(),
    title: 'Portfolio Summary',
    body: lines.join('\n'),
    confidence,
    projectCount: projects.length,
    sources: [
      'project_understanding_engine',
      'workspace_intelligence',
      'dependency_intelligence',
      'project_history_intelligence',
      'project_summarization_engine',
      'timeline_intelligence',
    ],
    readOnly: true,
  };
}

export function resetPortfolioSummaryCounterForTests(): void {
  summaryCounter = 0;
}
