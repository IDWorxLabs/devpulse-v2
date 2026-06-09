/**
 * Dependency Intelligence diagnostics — runtime observability.
 */

import { getDependencyGraph } from './dependency-graph-builder.js';
import { findHighestRiskDependency } from './dependency-risk-detector.js';
import type { DependencyIntelligenceDiagnostics } from './dependency-intelligence-types.js';
import { displayNameFor } from './dependency-intelligence-types.js';

let diagnostics: DependencyIntelligenceDiagnostics = {
  dependencyIntelligenceActive: false,
  dependencyCount: 0,
  blockedDependencyCount: 0,
  highestRiskDependency: null,
  lastDependencyQuery: null,
  duplicateDependencyRisk: 'clear',
  dependencyGraphHealth: 'healthy',
};

export function getDependencyIntelligenceDiagnostics(): DependencyIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function updateDependencyIntelligenceDiagnostics(query: string): void {
  const graph = getDependencyGraph();
  const highest = findHighestRiskDependency(graph);
  diagnostics = {
    dependencyIntelligenceActive: true,
    dependencyCount: graph.dependencyCount,
    blockedDependencyCount: graph.blockedCount,
    highestRiskDependency: highest
      ? `${displayNameFor(highest.source)} → ${displayNameFor(highest.target)} (${highest.riskLevel})`
      : null,
    lastDependencyQuery: query,
    duplicateDependencyRisk: graph.duplicateRisks.length > 0 ? 'warning' : 'clear',
    dependencyGraphHealth: graph.graphHealth,
  };
}

export function resetDependencyIntelligenceDiagnostics(): void {
  diagnostics = {
    dependencyIntelligenceActive: false,
    dependencyCount: 0,
    blockedDependencyCount: 0,
    highestRiskDependency: null,
    lastDependencyQuery: null,
    duplicateDependencyRisk: 'clear',
    dependencyGraphHealth: 'healthy',
  };
}

export function dependencyIntelligenceKey(): string {
  const d = diagnostics;
  return [
    String(d.dependencyIntelligenceActive),
    String(d.dependencyCount),
    String(d.blockedDependencyCount),
    d.highestRiskDependency ?? 'none',
    d.duplicateDependencyRisk,
    d.dependencyGraphHealth,
  ].join('|');
}
