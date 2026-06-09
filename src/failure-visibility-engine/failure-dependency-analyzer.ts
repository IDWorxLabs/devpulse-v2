/**
 * Failure dependency analyzer — impacted dependency chains.
 */

import { getDependencyGraph } from '../dependency-intelligence/dependency-graph-builder.js';
import { displayNameFor } from '../dependency-intelligence/dependency-intelligence-types.js';
import type { FailureDependencyImpact } from './failure-visibility-types.js';

let depCounter = 0;

function nextDepImpactId(): string {
  depCounter += 1;
  return `fdpi-${depCounter.toString().padStart(4, '0')}`;
}

export function analyzeFailureDependencyImpacts(query: string): FailureDependencyImpact[] {
  buildDependencySnapshot(query);
  const graph = getDependencyGraph();
  const impacts: FailureDependencyImpact[] = [];

  for (const edge of graph.edges.filter((e) => e.blocked).slice(0, 8)) {
    impacts.push({
      dependencyImpactId: nextDepImpactId(),
      chainSummary: `${displayNameFor(edge.source)} → ${displayNameFor(edge.target)} (${edge.dependencyType})`,
      blockedPath: edge.reason,
      visibilityOnly: true,
    });
  }

  const highRisk = graph.edges.filter((e) => e.riskLevel === 'critical' || e.riskLevel === 'high').slice(0, 4);
  for (const edge of highRisk) {
    impacts.push({
      dependencyImpactId: nextDepImpactId(),
      chainSummary: `High-risk chain: ${displayNameFor(edge.source)} → ${displayNameFor(edge.target)}`,
      blockedPath: edge.blocked ? edge.reason : `Risk: ${edge.riskLevel}`,
      visibilityOnly: true,
    });
  }

  return impacts;
}

function buildDependencySnapshot(_query: string): void {
  getDependencyGraph();
}

export function resetFailureDependencyCounterForTests(): void {
  depCounter = 0;
}
