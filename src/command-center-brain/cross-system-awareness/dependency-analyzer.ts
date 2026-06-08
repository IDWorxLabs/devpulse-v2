/**
 * Dependency analyzer — what depends on a system. Data-driven, no execution.
 */

import type { CrossSystemSystemRecord, SystemRelationshipEdge } from './relationship-types.js';
import {
  buildCrossSystemRegistry,
  founderDisplayName,
  getRelationshipEdges,
  getSystemById,
  resolveDependencyTargetFromMessage,
  resolveSystemIdFromMessage,
} from './system-relationship-registry.js';

export interface DependencyAnalysisResult {
  targetSystemId: string;
  targetDisplayName: string;
  directDependents: CrossSystemSystemRecord[];
  dependencyEdges: SystemRelationshipEdge[];
  dependencyCount: number;
  summaryLines: string[];
}

export function analyzeDependencies(systemId: string): DependencyAnalysisResult | null {
  const target = getSystemById(systemId);
  if (!target) return null;

  const edges = getRelationshipEdges().filter((e) => e.targetId === systemId);
  const registry = buildCrossSystemRegistry();
  const directDependents = registry.filter((s) => s.dependencies.includes(systemId));

  const summaryLines = directDependents.map((dep) => {
    const edge = edges.find((e) => e.sourceId === dep.systemId);
    const rel = edge ? `${edge.type}: ${edge.summary}` : `${dep.displayName} lists ${target.displayName} in its dependency map.`;
    return founderDisplayName(dep.systemId);
  });

  return {
    targetSystemId: systemId,
    targetDisplayName: founderDisplayName(systemId),
    directDependents,
    dependencyEdges: edges,
    dependencyCount: directDependents.length,
    summaryLines,
  };
}

export function analyzeDependenciesFromMessage(message: string): DependencyAnalysisResult | null {
  const systemId = resolveDependencyTargetFromMessage(message) ?? resolveSystemIdFromMessage(message);
  if (!systemId) return null;
  return analyzeDependencies(systemId);
}

export function formatDependencyResponse(result: DependencyAnalysisResult): string {
  const dependentLines =
    result.summaryLines.length > 0
      ? result.summaryLines.map((name) => `• ${name}`)
      : ['• No registered direct dependents'];

  return [
    `System: ${result.targetDisplayName}`,
    '',
    'Dependents:',
    ...dependentLines,
    '',
    `Dependency Count: ${result.dependencyCount}`,
    '',
    'Explanation:',
    `These systems list ${result.targetDisplayName} in the registered relationship map as a direct dependency or relationship target.`,
    result.dependencyEdges.length > 0
      ? `Relationship evidence: ${result.dependencyEdges.length} registered edge(s) point to ${result.targetDisplayName}.`
      : 'Dependents are derived from the system dependency registry.',
    '',
    'This is relationship awareness only — no execution, file changes, or runtime mutation occurred.',
  ].join('\n');
}

export function countTotalDependencies(): number {
  return buildCrossSystemRegistry().reduce((sum, s) => sum + s.dependencies.length, 0);
}
