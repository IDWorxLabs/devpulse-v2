/**
 * Portfolio Intelligence diagnostics — runtime advisory counters.
 */

import type {
  PortfolioAnalysis,
  PortfolioIntelligenceDiagnostics,
} from './portfolio-intelligence-types.js';

let diagnostics: PortfolioIntelligenceDiagnostics = {
  portfolioIntelligenceActive: false,
  projectCount: 0,
  activeProjectCount: 0,
  portfolioHealth: 'FAIR',
  highestRiskProject: null,
  highestPriorityProject: null,
  lastPortfolioQuery: null,
};

export function getPortfolioIntelligenceDiagnostics(): PortfolioIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function updatePortfolioIntelligenceDiagnostics(
  query: string,
  analysis: PortfolioAnalysis,
): void {
  const riskiest = analysis.risks[0]?.projectName ?? null;
  const highestPri = analysis.priorities[0]?.projectName ?? null;

  diagnostics = {
    portfolioIntelligenceActive: true,
    projectCount: analysis.projects.length,
    activeProjectCount: analysis.health.activeProjectCount,
    portfolioHealth: analysis.health.overallLevel,
    highestRiskProject: riskiest,
    highestPriorityProject: highestPri,
    lastPortfolioQuery: query,
  };
}

export function resetPortfolioIntelligenceDiagnostics(): void {
  diagnostics = {
    portfolioIntelligenceActive: false,
    projectCount: 0,
    activeProjectCount: 0,
    portfolioHealth: 'FAIR',
    highestRiskProject: null,
    highestPriorityProject: null,
    lastPortfolioQuery: null,
  };
}

export function portfolioIntelligenceKey(): string {
  const d = diagnostics;
  return [
    String(d.portfolioIntelligenceActive),
    String(d.projectCount),
    d.portfolioHealth,
    d.highestRiskProject ?? 'none',
    d.highestPriorityProject ?? 'none',
  ].join('|');
}
