/**
 * DevPulse V2 Phase 12.6 — Portfolio Intelligence types.
 * Intelligence only — multi-project awareness, comparison, and portfolio advisory.
 */

import type { RiskLevel } from '../foundation/types.js';

export const PORTFOLIO_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_PORTFOLIO_INTELLIGENCE_FOUNDATION_V1_PASS';
export const PORTFOLIO_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_portfolio_intelligence';

export type PortfolioHealthLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
export type PortfolioConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PortfolioProject {
  projectId: string;
  projectName: string;
  phase: string;
  health: PortfolioHealthLevel;
  riskLevel: RiskLevel;
  priority: number;
  dependencyCount: number;
  workspaceCount: number;
  summary: string;
  active: boolean;
  blocked: boolean;
  readOnly: true;
}

export interface PortfolioHealth {
  overallLevel: PortfolioHealthLevel;
  score: number;
  healthiestProjectId: string;
  healthiestProjectName: string;
  projectCount: number;
  activeProjectCount: number;
  blockedProjectCount: number;
  summary: string;
  readOnly: true;
}

export interface PortfolioRisk {
  riskId: string;
  projectId: string;
  projectName: string;
  riskLevel: RiskLevel;
  summary: string;
  reason: string;
  readOnly: true;
}

export interface PortfolioPriority {
  priorityId: string;
  projectId: string;
  projectName: string;
  priority: number;
  reason: string;
  focusRecommended: boolean;
  readOnly: true;
}

export interface PortfolioSummary {
  summaryId: string;
  title: string;
  body: string;
  confidence: PortfolioConfidence;
  projectCount: number;
  sources: string[];
  readOnly: true;
}

export interface PortfolioComparison {
  comparisonId: string;
  projectAId: string;
  projectAName: string;
  projectBId: string;
  projectBName: string;
  healthComparison: string;
  riskComparison: string;
  priorityComparison: string;
  recommendation: string;
  confidence: PortfolioConfidence;
  readOnly: true;
}

export interface PortfolioAnalysis {
  query: string;
  projects: PortfolioProject[];
  health: PortfolioHealth;
  risks: PortfolioRisk[];
  priorities: PortfolioPriority[];
  summary: PortfolioSummary;
  comparison: PortfolioComparison | null;
}

export interface PortfolioAnswer {
  query: string;
  analysis: PortfolioAnalysis;
  responseText: string;
}

export interface PortfolioIntelligenceDiagnostics {
  portfolioIntelligenceActive: boolean;
  projectCount: number;
  activeProjectCount: number;
  portfolioHealth: PortfolioHealthLevel;
  highestRiskProject: string | null;
  highestPriorityProject: string | null;
  lastPortfolioQuery: string | null;
}

export const PORTFOLIO_QUESTION_SIGNALS = [
  'portfolio',
  'what projects exist',
  'projects exist',
  'healthiest project',
  'riskiest project',
  'focus on next',
  'should we focus on',
  'projects are blocked',
  'projects are active',
  'active projects',
  'compare project',
  'compare devpulse',
  'compare ',
  'portfolio summary',
  'projects need attention',
  'multi-project',
  'project comparison',
  'which project should',
  'across projects',
  'all projects',
  'multiple projects',
] as const;

export const FORBIDDEN_PORTFOLIO_DUPLICATES = [
  'portfolio_brain',
  'brain_v2',
  'project_brain',
  'memory_brain',
  'multi_project_brain',
  'portfolio_engine',
  'multi_project_intelligence',
  'second_portfolio_intelligence',
] as const;

export function isPortfolioIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  const matches = PORTFOLIO_QUESTION_SIGNALS.some((s) => lower.includes(s));
  if (!matches) return false;

  const singularWorkspace =
    (lower.includes('active project') ||
      lower.includes('project is currently active') ||
      lower.includes('which workspace') ||
      lower.includes('what workspace')) &&
    !lower.includes('active projects') &&
    !lower.includes('projects are active') &&
    !lower.includes('what projects') &&
    !lower.includes('all projects');

  if (singularWorkspace) return false;
  return true;
}

export function isDuplicatePortfolioBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('create a new portfolio brain') ||
    lower.includes('portfolio brain') ||
    lower.includes('second portfolio intelligence') ||
    lower.includes('multi project brain') ||
    lower.includes('replace portfolio intelligence')
  );
}
