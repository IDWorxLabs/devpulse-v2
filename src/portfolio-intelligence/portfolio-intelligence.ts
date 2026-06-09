/**
 * Portfolio Intelligence — orchestrates multi-project awareness and advisory answers.
 */

import { analyzePortfolioHealth, findHealthiestProject } from './portfolio-health-analyzer.js';
import { comparePortfolioProjects } from './portfolio-comparison-engine.js';
import {
  getPortfolioIntelligenceDiagnostics,
  updatePortfolioIntelligenceDiagnostics,
} from './portfolio-intelligence-diagnostics.js';
import {
  isDuplicatePortfolioBrainQuestion,
  type PortfolioAnalysis,
  type PortfolioAnswer,
} from './portfolio-intelligence-types.js';
import { analyzePortfolioPriorities, findHighestPriorityProject } from './portfolio-priority-analyzer.js';
import { readPortfolioProjects } from './portfolio-project-reader.js';
import { analyzePortfolioRisks, findRiskiestProject } from './portfolio-risk-analyzer.js';
import { publishOperatorFeedStage } from '../operator-feed/index.js';
import { buildPortfolioSummary } from './portfolio-summary-builder.js';

export function analyzePortfolio(query: string): PortfolioAnalysis {
  const projects = readPortfolioProjects(query);
  const health = analyzePortfolioHealth(projects);
  const risks = analyzePortfolioRisks(projects);
  const priorities = analyzePortfolioPriorities(projects);
  const comparison = comparePortfolioProjects(query, projects);
  const summary = buildPortfolioSummary(projects, health, risks, priorities);

  const analysis: PortfolioAnalysis = {
    query,
    projects,
    health,
    risks,
    priorities,
    summary,
    comparison,
  };

  updatePortfolioIntelligenceDiagnostics(query, analysis);
  return analysis;
}

function composeResponse(query: string, analysis: PortfolioAnalysis): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Portfolio Intelligence Response', ''];

  if (isDuplicatePortfolioBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push('Why: Phase 12.6 Portfolio Intelligence extends multi-project awareness — do not create portfolio_brain or multi_project_brain.');
    lines.push('Next safe action: Extend Portfolio Intelligence into existing Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('what projects exist') || lower.includes('projects exist')) {
    lines.push('Portfolio projects:');
    for (const p of analysis.projects) {
      lines.push(`• ${p.projectName} (${p.projectId}) — ${p.phase}`);
    }
  } else if (lower.includes('healthiest')) {
    const best = findHealthiestProject(analysis.projects);
    if (best) {
      lines.push(`Healthiest project: ${best.projectName}`);
      lines.push(`Health level: ${best.health}`);
      lines.push(`Phase: ${best.phase}`);
      lines.push(`Summary: ${best.summary}`);
    }
  } else if (lower.includes('riskiest')) {
    const worst = findRiskiestProject(analysis.projects);
    if (worst) {
      lines.push(`Riskiest project: ${worst.projectName}`);
      lines.push(`Risk level: ${worst.riskLevel}`);
      lines.push(`Blocked: ${worst.blocked ? 'Yes' : 'No'}`);
    }
    if (analysis.risks.length > 0) {
      lines.push('', 'Portfolio risks:');
      for (const r of analysis.risks.slice(0, 5)) {
        lines.push(`• ${r.projectName}: ${r.summary}`);
      }
    }
  } else if (lower.includes('focus on next') || lower.includes('should we focus')) {
    const focus = findHighestPriorityProject(analysis.projects);
    if (focus) {
      lines.push(`Recommended portfolio focus: ${focus.projectName}`);
      lines.push(`Priority rank: ${focus.priority}`);
      lines.push(`Health: ${focus.health}`);
      lines.push(`Phase: ${focus.phase}`);
    }
  } else if (lower.includes('blocked')) {
    const blocked = analysis.projects.filter((p) => p.blocked);
    if (blocked.length === 0) {
      lines.push('No blocked projects detected in portfolio inventory.');
    } else {
      lines.push('Blocked projects:');
      for (const p of blocked) {
        lines.push(`• ${p.projectName} — ${p.phase}`);
      }
    }
  } else if (lower.includes('active projects') || lower.includes('projects are active')) {
    const active = analysis.projects.filter((p) => p.active);
    lines.push(`Active projects (${active.length}):`);
    for (const p of active) {
      lines.push(`• ${p.projectName}`);
    }
  } else if (lower.includes('compare') && analysis.comparison) {
    const c = analysis.comparison;
    lines.push(`Comparison: ${c.projectAName} vs ${c.projectBName}`);
    lines.push(`Health: ${c.healthComparison}`);
    lines.push(`Risk: ${c.riskComparison}`);
    lines.push(`Priority: ${c.priorityComparison}`);
    lines.push(`Recommendation: ${c.recommendation}`);
  } else if (lower.includes('need attention')) {
    const attention = analysis.projects.filter((p) => p.blocked || p.riskLevel === 'high' || p.riskLevel === 'critical');
    lines.push('Projects needing attention:');
    for (const p of attention) {
      lines.push(`• ${p.projectName} — risk ${p.riskLevel}${p.blocked ? ', blocked' : ''}`);
    }
  } else if (lower.includes('portfolio summary') || lower.includes('portfolio')) {
    lines.push(analysis.summary.title);
    lines.push(analysis.summary.body);
  } else {
    lines.push(analysis.summary.title);
    lines.push(analysis.summary.body);
  }

  lines.push('');
  lines.push(`Portfolio health: ${analysis.health.overallLevel}`);
  lines.push(`Project count: ${analysis.projects.length}`);
  lines.push(`Active: ${analysis.health.activeProjectCount}`);
  lines.push('');
  lines.push('Advisory only — intelligence across projects, no execution or file modification.');
  return lines.join('\n').trim();
}

export function processPortfolioIntelligenceRequest(query: string): PortfolioAnswer {
  publishOperatorFeedStage('Generating Portfolio Summary', 'portfolio_intelligence', { query });
  const analysis = analyzePortfolio(query);
  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function getPortfolioIntelligenceContext(query: string): {
  analysis: PortfolioAnalysis;
  diagnostics: ReturnType<typeof getPortfolioIntelligenceDiagnostics>;
  portfolioHealth: string;
  portfolioRisks: string[];
  portfolioPriorities: string[];
  portfolioSummary: string;
} {
  const analysis = analyzePortfolio(query);
  return {
    analysis,
    diagnostics: getPortfolioIntelligenceDiagnostics(),
    portfolioHealth: analysis.health.summary,
    portfolioRisks: analysis.risks.map((r) => r.summary),
    portfolioPriorities: analysis.priorities.map((p) => `${p.projectName} (priority ${p.priority})`),
    portfolioSummary: analysis.summary.body,
  };
}
