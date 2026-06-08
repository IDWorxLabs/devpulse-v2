/**
 * Cross-System Awareness engine — relationship, dependency, and impact intelligence.
 */

import {
  analyzeDependenciesFromMessage,
  formatDependencyResponse,
  type DependencyAnalysisResult,
} from './dependency-analyzer.js';
import {
  analyzeImpactFromMessage,
  formatImpactResponse,
  type ImpactAnalysisResult,
} from './impact-analyzer.js';
import type { CrossSystemAwarenessSnapshot } from './relationship-types.js';
import {
  buildCrossSystemRegistry,
  founderDisplayName,
  getRelationshipEdges,
  getSystemById,
  registryKey,
  resolveSystemIdFromMessage,
  resolveSystemPairFromMessage,
} from './system-relationship-registry.js';

export type CrossSystemAnalyzerUsed = 'relationship_engine' | 'dependency_analyzer' | 'impact_analyzer';

export interface CrossSystemAwarenessResult {
  snapshot: CrossSystemAwarenessSnapshot;
  responseText: string;
  edgesExamined: number;
  analyzerUsed: CrossSystemAnalyzerUsed;
  responseSource: CrossSystemAnalyzerUsed;
  dependencyAnalysis?: DependencyAnalysisResult;
  impactAnalysis?: ImpactAnalysisResult;
}

export function crossSystemAwarenessKey(): string {
  return registryKey();
}

export function buildCrossSystemSnapshot(
  queryType: CrossSystemAwarenessSnapshot['queryType'],
  targetSystemId: string | null,
): CrossSystemAwarenessSnapshot {
  const edges = getRelationshipEdges();
  return {
    relationshipCount: edges.length,
    dependencyCount: buildCrossSystemRegistry().reduce((n, s) => n + s.dependencies.length, 0),
    impactAnalysisAvailable: true,
    systemsModeled: buildCrossSystemRegistry().length,
    queryType,
    targetSystemId,
  };
}

function formatRelationshipBetween(sourceId: string, targetId: string): string {
  const direct = getRelationshipEdges().filter(
    (e) =>
      (e.sourceId === sourceId && e.targetId === targetId) ||
      (e.sourceId === targetId && e.targetId === sourceId),
  );

  const primary = direct.find((e) => e.sourceId === sourceId && e.targetId === targetId) ?? direct[0];

  if (!primary) {
    return [
      `Relationship Type: NONE_REGISTERED`,
      `Source System: ${founderDisplayName(sourceId)}`,
      `Target System: ${founderDisplayName(targetId)}`,
      '',
      'Explanation:',
      'No direct registered edge between these systems in the relationship registry.',
      `${founderDisplayName(sourceId)} dependencies: ${getSystemById(sourceId)?.dependencies.join(', ') || 'none'}.`,
      '',
      'Relationship awareness only — no execution occurred.',
    ].join('\n');
  }

  const lines = [
    `Relationship Type: ${primary.type}`,
    `Source System: ${founderDisplayName(primary.sourceId)}`,
    `Target System: ${founderDisplayName(primary.targetId)}`,
    '',
    'Explanation:',
    primary.summary,
  ];

  if (sourceId === 'world2_foundation' && targetId === 'command_center_runtime_shell') {
    lines.push(
      'Command Center is the founder-facing control surface. World 2 reports planning status there — it does not autonomously build applications.',
    );
  }

  lines.push('', 'Relationship awareness only — no execution or file modification occurred.');
  return lines.join('\n');
}

export function processCrossSystemAwareness(
  message: string,
  category: 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP',
): CrossSystemAwarenessResult {
  const edges = getRelationshipEdges();

  if (category === 'DEPENDENCY') {
    const analysis = analyzeDependenciesFromMessage(message);
    const targetId = analysis?.targetSystemId ?? resolveSystemIdFromMessage(message);
    if (!analysis || !targetId) {
      return {
        snapshot: buildCrossSystemSnapshot('DEPENDENCY', null),
        responseText: [
          'Could not identify a system for dependency analysis.',
          'Try: "What depends on Governance?" or "What systems depend on Trust Engine?"',
        ].join('\n'),
        edgesExamined: edges.length,
        analyzerUsed: 'dependency_analyzer',
        responseSource: 'dependency_analyzer',
      };
    }
    return {
      snapshot: buildCrossSystemSnapshot('DEPENDENCY', targetId),
      responseText: formatDependencyResponse(analysis),
      edgesExamined: analysis.dependencyEdges.length,
      analyzerUsed: 'dependency_analyzer',
      responseSource: 'dependency_analyzer',
      dependencyAnalysis: analysis,
    };
  }

  if (category === 'IMPACT') {
    const analysis = analyzeImpactFromMessage(message);
    const targetId = analysis?.targetSystemId ?? resolveSystemIdFromMessage(message);
    if (!analysis || !targetId) {
      return {
        snapshot: buildCrossSystemSnapshot('IMPACT', null),
        responseText: [
          'Could not identify a system for impact analysis.',
          'Try: "What breaks if Operator Feed disappears?"',
        ].join('\n'),
        edgesExamined: edges.length,
        analyzerUsed: 'impact_analyzer',
        responseSource: 'impact_analyzer',
      };
    }
    return {
      snapshot: buildCrossSystemSnapshot('IMPACT', targetId),
      responseText: formatImpactResponse(analysis),
      edgesExamined: edges.length,
      analyzerUsed: 'impact_analyzer',
      responseSource: 'impact_analyzer',
      impactAnalysis: analysis,
    };
  }

  const pair = resolveSystemPairFromMessage(message);
  if (pair) {
    return {
      snapshot: buildCrossSystemSnapshot('RELATIONSHIP', pair[0] ?? null),
      responseText: formatRelationshipBetween(pair[0]!, pair[1]!),
      edgesExamined: edges.length,
      analyzerUsed: 'relationship_engine',
      responseSource: 'relationship_engine',
    };
  }

  const targetId = resolveSystemIdFromMessage(message);
  if (targetId) {
    const related = getRelationshipEdges().filter(
      (e) => e.sourceId === targetId || e.targetId === targetId,
    );
    const primary = related[0];
    if (primary) {
      return {
        snapshot: buildCrossSystemSnapshot('RELATIONSHIP', targetId),
        responseText: formatRelationshipBetween(primary.sourceId, primary.targetId),
        edgesExamined: related.length,
        analyzerUsed: 'relationship_engine',
        responseSource: 'relationship_engine',
      };
    }
  }

  return {
    snapshot: buildCrossSystemSnapshot('RELATIONSHIP', null),
    responseText: [
      'Could not identify systems for relationship analysis.',
      'Try: "How does World 2 connect to Command Center?"',
    ].join('\n'),
    edgesExamined: 0,
    analyzerUsed: 'relationship_engine',
    responseSource: 'relationship_engine',
  };
}

export function isCrossSystemCategory(category: string): category is 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP' {
  return category === 'DEPENDENCY' || category === 'IMPACT' || category === 'RELATIONSHIP';
}

export class DevPulseV2CrossSystemAwareness {
  static readonly ownerModule = 'devpulse_v2_cross_system_awareness';
  static readonly ownerDomain = 'cross_system_awareness' as const;

  static analyzeRelationships(message: string, category: 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP') {
    return processCrossSystemAwareness(message, category);
  }
}

let crossSystemSingleton: DevPulseV2CrossSystemAwareness | null = null;

export function getDevPulseV2CrossSystemAwareness(): DevPulseV2CrossSystemAwareness {
  if (!crossSystemSingleton) crossSystemSingleton = new DevPulseV2CrossSystemAwareness();
  return crossSystemSingleton;
}
