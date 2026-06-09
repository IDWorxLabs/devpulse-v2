/**
 * Reasoning source analyzer — identifies systems consulted for visible reasoning.
 */

import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import type { ReasoningSource } from './reasoning-visibility-types.js';

let sourceCounter = 0;

function nextSourceId(): string {
  sourceCounter += 1;
  return `rsrc-${sourceCounter.toString().padStart(4, '0')}`;
}

export function analyzeReasoningSources(query: string): ReasoningSource[] {
  const context = buildDecisionContext(query);
  const sources: ReasoningSource[] = [];

  const add = (sourceSystem: string, contribution: string, consulted: boolean) => {
    sources.push({
      sourceId: nextSourceId(),
      sourceSystem,
      contribution,
      consulted,
      visibilityOnly: true,
    });
  };

  add('unified_decision_layer', 'Advisory recommendation and option ranking', true);
  add('project_understanding_engine', 'Project facts, blockers, and gaps', context.supportingFacts.length > 0);
  add('dependency_intelligence', 'Dependency paths and blockers', context.dependencyCount > 0);
  add('workspace_intelligence', 'Workspace risks and isolation', context.workspaceRisks.length > 0);
  add('project_history_intelligence', 'Recent changes and milestones', context.recentChanges.length > 0);
  add('project_summarization_engine', 'Executive and health summaries', context.latestExecutiveSummary.length > 0);
  add('portfolio_intelligence', 'Portfolio health and priorities', context.portfolioSummary.length > 0);
  add('timeline_intelligence', 'Phase and timeline blockers', context.timelineBlockers.length > 0);

  return sources.filter((s) => s.consulted);
}

export function systemsConsulted(sources: ReasoningSource[]): string[] {
  return [...new Set(sources.map((s) => s.sourceSystem))];
}

export function resetReasoningSourceCounterForTests(): void {
  sourceCounter = 0;
}
