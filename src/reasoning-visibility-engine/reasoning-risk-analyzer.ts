/**
 * Reasoning risk analyzer — visible risk findings for reasoning transparency.
 */

import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import type { ReasoningRisk } from './reasoning-visibility-types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `rrisk-${riskCounter.toString().padStart(4, '0')}`;
}

export function analyzeReasoningRisks(query: string): ReasoningRisk[] {
  const context = buildDecisionContext(query);
  const risks: ReasoningRisk[] = [];

  for (const risk of context.riskFacts) {
    risks.push({
      riskId: nextRiskId(),
      summary: risk,
      sourceSystem: 'project_understanding_engine',
      level: 'medium',
      visibilityOnly: true,
    });
  }

  for (const depRisk of context.dependencyRisks.slice(0, 4)) {
    risks.push({
      riskId: nextRiskId(),
      summary: depRisk,
      sourceSystem: 'dependency_intelligence',
      level: 'high',
      visibilityOnly: true,
    });
  }

  for (const wsRisk of context.workspaceRisks.slice(0, 3)) {
    risks.push({
      riskId: nextRiskId(),
      summary: wsRisk,
      sourceSystem: 'workspace_intelligence',
      level: 'medium',
      visibilityOnly: true,
    });
  }

  for (const portRisk of context.portfolioRisks.slice(0, 2)) {
    risks.push({
      riskId: nextRiskId(),
      summary: portRisk,
      sourceSystem: 'portfolio_intelligence',
      level: 'medium',
      visibilityOnly: true,
    });
  }

  return risks;
}

export function resetReasoningRiskCounterForTests(): void {
  riskCounter = 0;
}
