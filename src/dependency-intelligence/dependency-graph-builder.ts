/**
 * Dependency graph builder — reads ownership registry and intelligence stack relationships.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getRelationshipEdges } from '../command-center-brain/cross-system-awareness/system-relationship-registry.js';
import type { DependencyEdge, DependencyGraph } from './dependency-intelligence-types.js';

let depCounter = 0;

function nextDepId(): string {
  depCounter += 1;
  return `dep-${depCounter.toString().padStart(4, '0')}`;
}

function edge(
  entityKind: DependencyEdge['entityKind'],
  source: string,
  target: string,
  dependencyType: DependencyEdge['dependencyType'],
  opts: Partial<Pick<DependencyEdge, 'confidence' | 'riskLevel' | 'required' | 'blocked' | 'reason'>> = {},
): DependencyEdge {
  return {
    dependencyId: nextDepId(),
    entityKind,
    source,
    target,
    dependencyType,
    confidence: opts.confidence ?? 'HIGH',
    riskLevel: opts.riskLevel ?? 'medium',
    required: opts.required ?? true,
    blocked: opts.blocked ?? false,
    reason: opts.reason ?? `${source} depends on ${target}`,
    readOnly: true,
  } as DependencyEdge;
}

const INTELLIGENCE_STACK_EDGES: Array<Omit<DependencyEdge, 'dependencyId' | 'readOnly'>> = [
  {
    entityKind: 'system',
    source: 'project_vault_intelligence',
    target: 'project_vault',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'low',
    required: true,
    blocked: false,
    reason: 'Project Vault Intelligence reads Project Vault records read-only — vault is storage owner.',
  },
  {
    entityKind: 'system',
    source: 'unified_decision_layer',
    target: 'project_understanding_engine',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'high',
    required: true,
    blocked: false,
    reason: 'Unified Decision Layer requires Project Understanding facts for advisory recommendations.',
  },
  {
    entityKind: 'system',
    source: 'unified_decision_layer',
    target: 'timeline_intelligence',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'high',
    required: true,
    blocked: false,
    reason: 'Unified Decision Layer uses Timeline Intelligence for phase sequence and blocker context.',
  },
  {
    entityKind: 'system',
    source: 'project_understanding_engine',
    target: 'shared_memory_layer',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'high',
    required: true,
    blocked: false,
    reason: 'Project Understanding recalls Shared Memory for project comprehension context.',
  },
  {
    entityKind: 'system',
    source: 'project_understanding_engine',
    target: 'project_vault_intelligence',
    dependencyType: 'FEEDS',
    confidence: 'HIGH',
    riskLevel: 'medium',
    required: false,
    blocked: false,
    reason: 'Project Vault Intelligence supplements Project Understanding with read-only vault facts.',
  },
  {
    entityKind: 'system',
    source: 'general_question_understanding',
    target: 'project_understanding_engine',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'high',
    required: true,
    blocked: false,
    reason: 'General Question Understanding routes project questions through Project Understanding.',
  },
  {
    entityKind: 'system',
    source: 'command_center_brain',
    target: 'general_question_understanding',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'high',
    required: true,
    blocked: false,
    reason: 'Command Center Brain orchestrates intelligence through General Question Understanding router.',
  },
  {
    entityKind: 'system',
    source: 'command_center_brain',
    target: 'unified_decision_layer',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'medium',
    required: false,
    blocked: false,
    reason: 'Command Center Brain routes decision questions to Unified Decision Layer.',
  },
  {
    entityKind: 'system',
    source: 'command_center_brain',
    target: 'timeline_intelligence',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'medium',
    required: false,
    blocked: false,
    reason: 'Command Center Brain routes timeline questions to Timeline Intelligence.',
  },
  {
    entityKind: 'system',
    source: 'dependency_intelligence',
    target: 'command_center_brain',
    dependencyType: 'INFORMS',
    confidence: 'HIGH',
    riskLevel: 'low',
    required: false,
    blocked: false,
    reason: 'Dependency Intelligence supports Command Center Brain with relationship awareness.',
  },
  {
    entityKind: 'system',
    source: 'dependency_intelligence',
    target: 'unified_decision_layer',
    dependencyType: 'INFORMS',
    confidence: 'HIGH',
    riskLevel: 'low',
    required: false,
    blocked: false,
    reason: 'Dependency Intelligence enriches Unified Decision Layer with blocker and path context.',
  },
  {
    entityKind: 'system',
    source: 'dependency_intelligence',
    target: 'project_understanding_engine',
    dependencyType: 'INFORMS',
    confidence: 'HIGH',
    riskLevel: 'low',
    required: false,
    blocked: false,
    reason: 'Dependency facts supplement Project Understanding fact collection.',
  },
  {
    entityKind: 'capability',
    source: 'EXECUTION_REASONING',
    target: 'dependency_intelligence',
    dependencyType: 'REQUIRED_FOR',
    confidence: 'HIGH',
    riskLevel: 'critical',
    required: true,
    blocked: true,
    reason: 'Execution Runtime capability requires Dependency Intelligence before safe advisory paths.',
  },
  {
    entityKind: 'system',
    source: 'execution_runtime',
    target: 'dependency_intelligence',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'critical',
    required: true,
    blocked: true,
    reason: 'Execution Runtime must not start until Dependency Intelligence foundation is validated.',
  },
  {
    entityKind: 'system',
    source: 'execution_runtime',
    target: 'unified_decision_layer',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'critical',
    required: true,
    blocked: true,
    reason: 'Execution Runtime requires Unified Decision Layer advisory gates.',
  },
  {
    entityKind: 'system',
    source: 'execution_runtime',
    target: 'execution_verification',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'high',
    required: true,
    blocked: true,
    reason: 'Execution Runtime depends on verification loops before any apply path.',
  },
  {
    entityKind: 'system',
    source: 'world2_execution',
    target: 'execution_runtime',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'critical',
    required: true,
    blocked: true,
    reason: 'World 2 Execution depends on Execution Runtime — not yet connected.',
  },
  {
    entityKind: 'phase',
    source: 'phase_12.2',
    target: 'phase_12.1',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'low',
    required: true,
    blocked: false,
    reason: 'Phase 12.2 Dependency Intelligence builds on Phase 12.1 Project Vault Intelligence.',
  },
  {
    entityKind: 'phase',
    source: 'phase_11.6',
    target: 'phase_11.4',
    dependencyType: 'DEPENDS_ON',
    confidence: 'HIGH',
    riskLevel: 'medium',
    required: true,
    blocked: false,
    reason: 'Unified Decision Layer (11.6) depends on Project Understanding (11.4).',
  },
];

function edgesFromOwnershipRegistry(): DependencyEdge[] {
  const owners = listDevPulseV2Owners();
  const edges: DependencyEdge[] = [];
  for (const owner of owners) {
    if (owner.domain === 'command_center_brain') continue;
    edges.push(
      edge('module', owner.domain, 'command_center_brain', 'INFORMS', {
        confidence: 'MEDIUM',
        riskLevel: 'low',
        required: false,
        reason: `${owner.domain} is registered in ownership registry and informs Command Center orchestration.`,
      }),
    );
  }
  return edges;
}

function edgesFromCrossSystem(): DependencyEdge[] {
  const crossEdges = getRelationshipEdges();
  return crossEdges
    .filter((e) => e.type === 'DEPENDS_ON')
    .map((e) =>
      edge('system', e.sourceId, e.targetId, 'DEPENDS_ON', {
        confidence: 'MEDIUM',
        riskLevel: 'medium',
        required: true,
        reason: e.summary,
      }),
    );
}

function detectIsolatedSystems(allEdges: DependencyEdge[]): string[] {
  const connected = new Set<string>();
  for (const e of allEdges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  const allSystems = new Set<string>();
  for (const e of allEdges) {
    if (e.entityKind === 'system') {
      allSystems.add(e.source);
      allSystems.add(e.target);
    }
  }
  const isolated: string[] = [];
  for (const sys of allSystems) {
    const hasUpstream = allEdges.some((e) => e.source === sys);
    const hasDownstream = allEdges.some((e) => e.target === sys);
    if (!hasUpstream && !hasDownstream) isolated.push(sys);
  }
  return isolated.sort();
}

function detectDuplicateRisks(allEdges: DependencyEdge[]): string[] {
  const seen = new Map<string, number>();
  const risks: string[] = [];
  for (const e of allEdges) {
    const key = `${e.source}|${e.target}|${e.dependencyType}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) {
      risks.push(`Duplicate edge: ${e.source} → ${e.target} (${e.dependencyType})`);
    }
  }
  const forbiddenPairs = [
    ['dependency_intelligence', 'cross_system_awareness'],
  ];
  for (const [a, b] of forbiddenPairs) {
    const dupBrain = allEdges.filter(
      (e) =>
        (e.source.includes('dependency_brain') || e.target.includes('dependency_brain')) &&
        (e.source === a || e.target === b),
    );
    if (dupBrain.length > 0) {
      risks.push(`Forbidden duplicate brain pattern near ${a}/${b}`);
    }
  }
  return risks;
}

let cachedGraph: DependencyGraph | null = null;

export function buildDependencyGraph(): DependencyGraph {
  const seeded = INTELLIGENCE_STACK_EDGES.map((e) => ({
    ...e,
    dependencyId: nextDepId(),
    readOnly: true as const,
  })) as DependencyEdge[];

  const registryEdges = edgesFromOwnershipRegistry();
  const crossEdges = edgesFromCrossSystem();
  const allEdges = [...seeded, ...registryEdges, ...crossEdges];

  const systems = [...new Set(allEdges.flatMap((e) => [e.source, e.target]))].sort();
  const blockedCount = allEdges.filter((e) => e.blocked).length;
  const isolatedSystems = detectIsolatedSystems(allEdges);
  const duplicateRisks = detectDuplicateRisks(allEdges);

  let graphHealth: DependencyGraph['graphHealth'] = 'healthy';
  if (duplicateRisks.length > 0 || blockedCount > 5) graphHealth = 'warning';
  if (duplicateRisks.length > 3) graphHealth = 'degraded';

  cachedGraph = {
    edges: allEdges,
    systems,
    dependencyCount: allEdges.length,
    blockedCount,
    isolatedSystems,
    duplicateRisks,
    graphHealth,
    builtAt: Date.now(),
  };
  return cachedGraph;
}

export function getDependencyGraph(): DependencyGraph {
  return cachedGraph ?? buildDependencyGraph();
}

export function getUpstreamDependencies(systemId: string, graph?: DependencyGraph): DependencyEdge[] {
  const g = graph ?? getDependencyGraph();
  const lower = systemId.toLowerCase();
  return g.edges.filter(
    (e) =>
      e.source.toLowerCase().includes(lower) ||
      e.source.replace(/_/g, ' ').toLowerCase().includes(lower),
  );
}

export function getDownstreamDependents(systemId: string, graph?: DependencyGraph): DependencyEdge[] {
  const g = graph ?? getDependencyGraph();
  const lower = systemId.toLowerCase();
  return g.edges.filter(
    (e) =>
      e.target.toLowerCase().includes(lower) ||
      e.target.replace(/_/g, ' ').toLowerCase().includes(lower),
  );
}

export function resetDependencyGraphForTests(): DependencyGraph {
  depCounter = 0;
  cachedGraph = null;
  return buildDependencyGraph();
}
