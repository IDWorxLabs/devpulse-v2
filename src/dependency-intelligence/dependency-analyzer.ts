/**
 * Dependency analyzer — answers dependency-oriented questions from the graph.
 */

import {
  getDependencyGraph,
  getDownstreamDependents,
  getUpstreamDependencies,
} from './dependency-graph-builder.js';
import {
  findBlockedCapabilities,
  findBlockedDependencies,
  findMissingDependencies,
} from './dependency-blocker-detector.js';
import { findHighestRiskDependency, assessRemovalImpact } from './dependency-risk-detector.js';
import { extractPathQueries, findDependencyPath } from './dependency-path-finder.js';
import type { DependencyAnalysis } from './dependency-intelligence-types.js';
import { displayNameFor } from './dependency-intelligence-types.js';

function extractTargetSystem(question: string): string | null {
  const lower = question.toLowerCase();
  const patterns = [
    /depends on\s+(.+?)(?:\?|$)/,
    /what does\s+(.+?)\s+depend/,
    /what breaks if\s+(.+?)\s+(?:disappear|removed|goes away)/,
    /blocking\s+(.+?)(?:\?|$)/,
    /built before\s+(.+?)(?:\?|$)/,
    /build before\s+(.+?)(?:\?|$)/,
  ];
  for (const p of patterns) {
    const m = lower.match(p);
    if (m?.[1]) return m[1].trim();
  }
  if (lower.includes('project understanding')) return 'project_understanding_engine';
  if (lower.includes('unified decision')) return 'unified_decision_layer';
  if (lower.includes('shared memory')) return 'shared_memory_layer';
  if (lower.includes('project vault intelligence')) return 'project_vault_intelligence';
  if (lower.includes('project vault')) return 'project_vault';
  if (lower.includes('execution runtime')) return 'execution_runtime';
  return null;
}

export function analyzeDependencies(query: string): DependencyAnalysis {
  const graph = getDependencyGraph();
  const target = extractTargetSystem(query);
  const lower = query.toLowerCase();

  let upstream = target ? getUpstreamDependencies(target, graph) : [];
  let downstream = target ? getDownstreamDependents(target, graph) : [];

  if (lower.includes('what depends on') && target) {
    downstream = getDownstreamDependents(target, graph);
    upstream = [];
  }

  if (lower.includes('what does') && lower.includes('depend on') && target) {
    upstream = getUpstreamDependencies(target, graph);
    downstream = [];
  }

  if (lower.includes('what breaks if') && target) {
    const impact = assessRemovalImpact(target, graph);
    downstream = graph.edges.filter((e) =>
      impact.breaks.some((b) => b.includes(displayNameFor(e.source))),
    );
  }

  const pathQueries = extractPathQueries(query);
  const paths = pathQueries
    ? [findDependencyPath(pathQueries.source, pathQueries.target)]
    : [];

  if (lower.includes('project vault') && lower.includes('unified decision') && paths.length === 0) {
    paths.push(findDependencyPath('project_vault', 'unified_decision_layer'));
  }

  return {
    query,
    targetSystem: target,
    upstream,
    downstream,
    blockedDependencies: findBlockedDependencies(graph),
    missingDependencies: findMissingDependencies(graph),
    highestRisk: findHighestRiskDependency(graph),
    isolatedSystems: graph.isolatedSystems,
    duplicateRisks: graph.duplicateRisks,
    paths,
  };
}

export function dependencyFactsFromAnalysis(analysis: DependencyAnalysis): Array<{
  title: string;
  statement: string;
  tags: string[];
}> {
  const facts: Array<{ title: string; statement: string; tags: string[] }> = [];

  for (const edge of analysis.upstream.slice(0, 8)) {
    facts.push({
      title: `Dependency: ${displayNameFor(edge.source)}`,
      statement: `${displayNameFor(edge.source)} ${edge.dependencyType} ${displayNameFor(edge.target)} — ${edge.reason}`,
      tags: ['dependency', edge.source, edge.target, 'upstream'],
    });
  }

  for (const edge of analysis.downstream.slice(0, 8)) {
    facts.push({
      title: `Dependent: ${displayNameFor(edge.source)}`,
      statement: `${displayNameFor(edge.source)} depends on ${displayNameFor(edge.target)} — ${edge.reason}`,
      tags: ['dependency', edge.source, edge.target, 'downstream'],
    });
  }

  for (const blocker of analysis.missingDependencies.slice(0, 5)) {
    facts.push({
      title: 'Missing dependency',
      statement: blocker,
      tags: ['dependency', 'blocked', 'missing'],
    });
  }

  if (analysis.highestRisk) {
    facts.push({
      title: 'Highest-risk dependency',
      statement: `${displayNameFor(analysis.highestRisk.source)} → ${displayNameFor(analysis.highestRisk.target)} (${analysis.highestRisk.riskLevel}) — ${analysis.highestRisk.reason}`,
      tags: ['dependency', 'risk', 'highest'],
    });
  }

  return facts;
}
