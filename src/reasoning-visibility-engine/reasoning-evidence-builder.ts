/**
 * Reasoning evidence builder — gathers structured evidence from intelligence sources.
 */

import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import { reasonOverDecision } from '../unified-decision-layer/index.js';
import type { ReasoningConfidence, ReasoningEvidence } from './reasoning-visibility-types.js';

let evidenceCounter = 0;

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `revid-${evidenceCounter.toString().padStart(4, '0')}`;
}

function evidence(
  statement: string,
  sourceSystem: string,
  confidence: ReasoningConfidence = 'HIGH',
): ReasoningEvidence {
  return {
    evidenceId: nextEvidenceId(),
    statement,
    sourceSystem,
    confidence,
    visibilityOnly: true,
  };
}

export function buildReasoningEvidence(query: string): ReasoningEvidence[] {
  const context = buildDecisionContext(query);
  const trace = reasonOverDecision(query);
  const items: ReasoningEvidence[] = [];

  for (const fact of context.supportingFacts.slice(0, 6)) {
    items.push(evidence(fact, 'project_understanding_engine'));
  }

  for (const blocker of context.blockedItems.slice(0, 4)) {
    items.push(evidence(`Blocker: ${blocker}`, 'project_understanding_engine', 'HIGH'));
  }

  for (const risk of context.riskFacts.slice(0, 4)) {
    items.push(evidence(`Risk: ${risk}`, 'unified_decision_layer', 'MEDIUM'));
  }

  for (const dep of context.dependencyPaths.slice(0, 3)) {
    items.push(evidence(`Dependency path: ${dep}`, 'dependency_intelligence'));
  }

  for (const change of context.recentChanges.slice(0, 2)) {
    items.push(evidence(`Recent change: ${change}`, 'project_history_intelligence'));
  }

  if (context.latestExecutiveSummary.length > 0) {
    items.push(
      evidence(
        `Executive summary: ${context.latestExecutiveSummary.split('\n')[0]}`,
        'project_summarization_engine',
      ),
    );
  }

  if (context.portfolioSummary.length > 0) {
    items.push(
      evidence(
        `Portfolio: ${context.portfolioSummary.split('\n')[0]}`,
        'portfolio_intelligence',
      ),
    );
  }

  items.push(
    evidence(
      `Primary recommendation: ${trace.recommendation.recommendation}`,
      'unified_decision_layer',
      trace.recommendation.confidence,
    ),
  );

  items.push(
    evidence(`Current phase: ${context.currentPhase}`, 'timeline_intelligence', 'HIGH'),
  );

  return items;
}

export function resetReasoningEvidenceCounterForTests(): void {
  evidenceCounter = 0;
}
