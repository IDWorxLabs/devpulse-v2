/**
 * Portfolio risk analyzer — cross-project risk aggregation.
 */

import type { PortfolioProject, PortfolioRisk } from './portfolio-intelligence-types.js';
import type { RiskLevel } from '../foundation/types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `port-risk-${riskCounter.toString().padStart(4, '0')}`;
}

const RISK_ORDER: Record<RiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function analyzePortfolioRisks(projects: PortfolioProject[]): PortfolioRisk[] {
  const risks: PortfolioRisk[] = [];

  for (const project of projects) {
    if (project.blocked) {
      risks.push({
        riskId: nextRiskId(),
        projectId: project.projectId,
        projectName: project.projectName,
        riskLevel: 'high',
        summary: `${project.projectName} has active blockers.`,
        reason: 'Blocked gates or deferred execution constraints detected in project profile.',
        readOnly: true,
      });
    }
    if (project.riskLevel === 'high' || project.riskLevel === 'critical') {
      risks.push({
        riskId: nextRiskId(),
        projectId: project.projectId,
        projectName: project.projectName,
        riskLevel: project.riskLevel,
        summary: `${project.projectName} carries elevated portfolio risk.`,
        reason: `Risk level ${project.riskLevel} — review isolation and governance before advancing.`,
        readOnly: true,
      });
    }
    if (!project.active && project.priority <= 2) {
      risks.push({
        riskId: nextRiskId(),
        projectId: project.projectId,
        projectName: project.projectName,
        riskLevel: 'medium',
        summary: `${project.projectName} is high-priority but not currently active.`,
        reason: 'Portfolio attention drift — inactive high-priority project may stall roadmap alignment.',
        readOnly: true,
      });
    }
  }

  return risks.sort((a, b) => RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel]);
}

export function findRiskiestProject(projects: PortfolioProject[]): PortfolioProject | null {
  if (projects.length === 0) return null;
  return [...projects].sort((a, b) => RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel])[0] ?? null;
}

export function resetPortfolioRiskCounterForTests(): void {
  riskCounter = 0;
}
