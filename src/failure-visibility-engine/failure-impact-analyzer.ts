/**
 * Failure impact analyzer — affected systems and capability blocks.
 */

import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import { getDependencyGraph } from '../dependency-intelligence/dependency-graph-builder.js';
import { displayNameFor } from '../dependency-intelligence/dependency-intelligence-types.js';
import type { FailureImpact } from './failure-visibility-types.js';

let impactCounter = 0;

function nextImpactId(): string {
  impactCounter += 1;
  return `fimp-${impactCounter.toString().padStart(4, '0')}`;
}

export function analyzeFailureImpacts(query: string): FailureImpact[] {
  const context = buildDecisionContext(query);
  const graph = getDependencyGraph();
  const impacts: FailureImpact[] = [];

  const blockedEdges = graph.edges.filter((e) => e.blocked).slice(0, 6);
  for (const edge of blockedEdges) {
    impacts.push({
      impactId: nextImpactId(),
      summary: `${displayNameFor(edge.source)} impacted by blocked ${displayNameFor(edge.target)}`,
      affectedSystems: [edge.source, edge.target],
      visibilityOnly: true,
    });
  }

  for (const system of context.relatedSystems.slice(0, 4)) {
    impacts.push({
      impactId: nextImpactId(),
      summary: `${system} may be affected by active governance or dependency failures`,
      affectedSystems: [system],
      visibilityOnly: true,
    });
  }

  if (context.workspaceMismatchCount > 0) {
    impacts.push({
      impactId: nextImpactId(),
      summary: `Workspace isolation mismatch affects ${context.workspaceMismatchCount} boundary checks`,
      affectedSystems: ['workspace_intelligence', 'project_understanding'],
      visibilityOnly: true,
    });
  }

  return impacts;
}

export function collectBlockedCapabilities(query: string): string[] {
  const context = buildDecisionContext(query);
  const graph = getDependencyGraph();
  const caps = new Set<string>();

  for (const item of context.blockedItems) {
    caps.add(item);
  }

  for (const blocker of context.dependencyBlockers) {
    caps.add(blocker);
  }

  for (const edge of graph.edges.filter((e) => e.blocked)) {
    caps.add(`${displayNameFor(edge.source)} blocked by ${displayNameFor(edge.target)}`);
  }

  return [...caps];
}

export function resetFailureImpactCounterForTests(): void {
  impactCounter = 0;
}
