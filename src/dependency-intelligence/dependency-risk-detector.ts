/**
 * Dependency risk detector — highest-risk and impact assessment.
 */

import type { DependencyEdge, DependencyGraph } from './dependency-intelligence-types.js';
import { displayNameFor } from './dependency-intelligence-types.js';

const RISK_ORDER: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function compareRisk(a: DependencyEdge, b: DependencyEdge): number {
  const ra = RISK_ORDER[a.riskLevel] ?? 0;
  const rb = RISK_ORDER[b.riskLevel] ?? 0;
  if (rb !== ra) return rb - ra;
  if (a.required !== b.required) return a.required ? 1 : -1;
  if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
  return 0;
}

export function findHighestRiskDependency(graph: DependencyGraph): DependencyEdge | null {
  if (graph.edges.length === 0) return null;
  const sorted = [...graph.edges].sort(compareRisk);
  return sorted[0] ?? null;
}

export function assessRemovalImpact(
  systemId: string,
  graph: DependencyGraph,
): { breaks: string[]; riskSummary: string } {
  const lower = systemId.toLowerCase();
  const affected = graph.edges.filter(
    (e) =>
      e.target.toLowerCase().includes(lower) ||
      displayNameFor(e.target).toLowerCase().includes(lower),
  );
  const breaks = affected.map(
    (e) => `${displayNameFor(e.source)} — ${e.reason}`,
  );
  const riskSummary =
    breaks.length > 0
      ? `Removing ${displayNameFor(systemId)} would affect ${breaks.length} dependent relationship(s).`
      : `No registered dependents would break if ${displayNameFor(systemId)} were removed.`;
  return { breaks, riskSummary };
}

export function riskLevelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
