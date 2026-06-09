/**
 * Portfolio health analyzer — aggregate and per-project health assessment.
 */

import type { PortfolioHealth, PortfolioHealthLevel, PortfolioProject } from './portfolio-intelligence-types.js';

const HEALTH_SCORE: Record<PortfolioHealthLevel, number> = {
  EXCELLENT: 5,
  GOOD: 4,
  FAIR: 3,
  POOR: 2,
  CRITICAL: 1,
};

function scoreToLevel(score: number): PortfolioHealthLevel {
  if (score >= 4.5) return 'EXCELLENT';
  if (score >= 3.5) return 'GOOD';
  if (score >= 2.5) return 'FAIR';
  if (score >= 1.5) return 'POOR';
  return 'CRITICAL';
}

export function analyzePortfolioHealth(projects: PortfolioProject[]): PortfolioHealth {
  if (projects.length === 0) {
    return {
      overallLevel: 'CRITICAL',
      score: 0,
      healthiestProjectId: 'none',
      healthiestProjectName: 'None',
      projectCount: 0,
      activeProjectCount: 0,
      blockedProjectCount: 0,
      summary: 'No portfolio projects detected.',
      readOnly: true,
    };
  }

  const scores = projects.map((p) => HEALTH_SCORE[p.health]);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const healthiest = [...projects].sort((a, b) => HEALTH_SCORE[b.health] - HEALTH_SCORE[a.health])[0]!;
  const activeCount = projects.filter((p) => p.active).length;
  const blockedCount = projects.filter((p) => p.blocked).length;
  const overall = scoreToLevel(avg);

  return {
    overallLevel: overall,
    score: Math.round(avg * 10) / 10,
    healthiestProjectId: healthiest.projectId,
    healthiestProjectName: healthiest.projectName,
    projectCount: projects.length,
    activeProjectCount: activeCount,
    blockedProjectCount: blockedCount,
    summary: `Portfolio health is ${overall} across ${projects.length} projects (${activeCount} active, ${blockedCount} blocked). Healthiest: ${healthiest.projectName}.`,
    readOnly: true,
  };
}

export function findHealthiestProject(projects: PortfolioProject[]): PortfolioProject | null {
  if (projects.length === 0) return null;
  return [...projects].sort((a, b) => HEALTH_SCORE[b.health] - HEALTH_SCORE[a.health])[0] ?? null;
}
