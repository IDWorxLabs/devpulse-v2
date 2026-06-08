/**
 * System relationship registry — how DevPulse systems connect. Awareness only.
 */

import type { CrossSystemSystemRecord, SystemRelationshipEdge } from './relationship-types.js';

export const SYSTEM_RELATIONSHIP_EDGES: SystemRelationshipEdge[] = [
  {
    sourceId: 'trust_engine',
    targetId: 'governance_stack',
    type: 'PROTECTS',
    summary: 'Trust Engine aggregates verification and evidence signals to strengthen governance decision confidence — it does not replace governance authority.',
  },
  {
    sourceId: 'world2_foundation',
    targetId: 'governance_stack',
    type: 'DEPENDS_ON',
    summary: 'World 2 planning foundations rely on governance approval gates and verification paths — execution runtime is not yet connected.',
  },
  {
    sourceId: 'world2_foundation',
    targetId: 'command_center_runtime_shell',
    type: 'REPORTS_TO',
    summary: 'World 2 status and planning context are reported through the Command Center shell for founder visibility — not autonomous execution.',
  },
  {
    sourceId: 'mobile_command_foundation',
    targetId: 'governance_stack',
    type: 'DEPENDS_ON',
    summary: 'Mobile Command foundations depend on governance authority patterns — real mobile control is not yet connected.',
  },
  {
    sourceId: 'mobile_command_foundation',
    targetId: 'command_center_runtime_shell',
    type: 'REPORTS_TO',
    summary: 'Mobile Command status surfaces through Command Center navigation placeholders — runtime not connected.',
  },
  {
    sourceId: 'self_evolution_foundation',
    targetId: 'governance_stack',
    type: 'INFORMS',
    summary: 'Self-Evolution observers report capability gaps and drift — observer only, no execution.',
  },
  {
    sourceId: 'self_evolution_foundation',
    targetId: 'experience_layer',
    type: 'INFORMS',
    summary: 'Self-Evolution findings inform experience layer maturity mapping.',
  },
  {
    sourceId: 'experience_layer',
    targetId: 'governance_stack',
    type: 'DEPENDS_ON',
    summary: 'Experience Layer describes governance and foundation journeys — descriptive only.',
  },
  {
    sourceId: 'experience_layer',
    targetId: 'world2_foundation',
    type: 'INFORMS',
    summary: 'Experience Layer maps World 2 foundation capabilities for founder visibility.',
  },
  {
    sourceId: 'experience_layer',
    targetId: 'founder_reality_surface',
    type: 'SURFACES',
    summary: 'Experience Layer content is surfaced on Founder Reality for visibility.',
  },
  {
    sourceId: 'trust_engine',
    targetId: 'founder_reality_surface',
    type: 'SURFACES',
    summary: 'Trust Engine placeholders and aggregation context surface on Founder Reality.',
  },
  {
    sourceId: 'founder_reality_surface',
    targetId: 'experience_layer',
    type: 'USES',
    summary: 'Founder Reality uses Experience Layer maps for founder-facing status.',
  },
  {
    sourceId: 'founder_reality_surface',
    targetId: 'trust_engine',
    type: 'USES',
    summary: 'Founder Reality references Trust Engine aggregation for trust placeholders.',
  },
  {
    sourceId: 'command_center_runtime_shell',
    targetId: 'founder_reality_surface',
    type: 'DEPENDS_ON',
    summary: 'Command Center Runtime Shell hosts Founder Reality as a navigation view.',
  },
  {
    sourceId: 'command_center_brain',
    targetId: 'command_center_runtime_shell',
    type: 'DEPENDS_ON',
    summary: 'Command Center Brain runs inside the Runtime Shell chat surface — intelligence only.',
  },
  {
    sourceId: 'command_center_brain',
    targetId: 'governance_stack',
    type: 'INFORMS',
    summary: 'Brain explains governance boundaries — it does not bypass or execute governance paths.',
  },
  {
    sourceId: 'command_center_brain',
    targetId: 'trust_engine',
    type: 'INFORMS',
    summary: 'Brain explains Trust Engine aggregation — it does not replace trust scoring systems.',
  },
  {
    sourceId: 'command_center_brain',
    targetId: 'world2_foundation',
    type: 'INFORMS',
    summary: 'Brain explains World 2 foundation status honestly — no autonomous building claims.',
  },
  {
    sourceId: 'command_center_brain',
    targetId: 'cross_system_awareness',
    type: 'USES',
    summary: 'Command Center Brain uses Cross-System Awareness to explain how systems relate — not what they execute.',
  },
  {
    sourceId: 'operator_feed',
    targetId: 'command_center_brain',
    type: 'SURFACES',
    summary: 'Operator Feed surfaces Command Center Brain pipeline activity — informational only.',
  },
  {
    sourceId: 'operator_feed',
    targetId: 'command_center_runtime_shell',
    type: 'DEPENDS_ON',
    summary: 'Operator Feed is rendered inside the Runtime Shell — visibility layer only.',
  },
  {
    sourceId: 'notifications',
    targetId: 'command_center_brain',
    type: 'SURFACES',
    summary: 'Notifications surface Brain connection and request lifecycle events.',
  },
  {
    sourceId: 'notifications',
    targetId: 'command_center_runtime_shell',
    type: 'DEPENDS_ON',
    summary: 'Notifications drawer lives in the Runtime Shell header area.',
  },
  {
    sourceId: 'command_center_brain',
    targetId: 'operator_feed',
    type: 'FEEDS',
    summary: 'Brain pipeline stages feed Operator Feed events during chat requests.',
  },
  {
    sourceId: 'cross_system_awareness',
    targetId: 'command_center_brain',
    type: 'INFORMS',
    summary: 'Cross-System Awareness informs Brain relationship responses — no separate intelligence layer.',
  },
];

function computeDependents(systemId: string, edges: SystemRelationshipEdge[]): string[] {
  const deps = new Set<string>();
  for (const edge of edges) {
    if (edge.targetId === systemId) deps.add(edge.sourceId);
  }
  return [...deps].sort();
}

function computeDependencies(systemId: string, edges: SystemRelationshipEdge[]): string[] {
  const deps = new Set<string>();
  for (const edge of edges) {
    if (edge.sourceId === systemId) deps.add(edge.targetId);
  }
  return [...deps].sort();
}

const BASE_SYSTEMS: Omit<CrossSystemSystemRecord, 'dependencies' | 'dependents'>[] = [
  {
    systemId: 'governance_stack',
    displayName: 'Governance Stack',
    phase: '6.x',
    purpose: 'Execution authority, verification loops, evidence ledger, founder approval gates',
    relationshipSummary: 'Central governance foundation — Trust Engine protects it; World 2 and Mobile Command depend on it.',
  },
  {
    systemId: 'world2_foundation',
    displayName: 'World 2 Foundation',
    phase: '7.x',
    purpose: 'Workspace, simulation, builder, completion verifier — planning foundations only',
    relationshipSummary: 'Depends on Governance; reports status to Command Center; does not autonomously execute builds.',
  },
  {
    systemId: 'mobile_command_foundation',
    displayName: 'Mobile Command Foundation',
    phase: '8.x',
    purpose: 'Mobile command, chat, preview, approval foundations — runtime not connected',
    relationshipSummary: 'Depends on Governance; reports to Command Center shell placeholders.',
  },
  {
    systemId: 'self_evolution_foundation',
    displayName: 'Self-Evolution Foundation',
    phase: '9.x',
    purpose: 'Capability gaps, learning, drift, complexity — observer only',
    relationshipSummary: 'Informs Experience Layer and governance awareness paths.',
  },
  {
    systemId: 'experience_layer',
    displayName: 'Experience Layer',
    phase: '10.1',
    purpose: 'Founder experience map — descriptive only',
    relationshipSummary: 'Surfaces on Founder Reality; informs Brain understanding of journeys.',
  },
  {
    systemId: 'trust_engine',
    displayName: 'Trust Engine Expansion',
    phase: '10.2',
    purpose: 'Trust signal aggregation for founder review',
    relationshipSummary: 'Protects governance decision confidence; surfaces on Founder Reality.',
  },
  {
    systemId: 'founder_reality_surface',
    displayName: 'Founder Reality Surface',
    phase: '10.3',
    purpose: 'Runnable visibility surface for foundation status',
    relationshipSummary: 'Uses Experience Layer and Trust Engine; hosted inside Runtime Shell.',
  },
  {
    systemId: 'command_center_runtime_shell',
    displayName: 'Command Center Runtime Shell',
    phase: '10.3.1',
    purpose: 'Three-zone UI shell hosting chat, feed, and notifications',
    relationshipSummary: 'Hosts Brain, Operator Feed, Notifications, and Founder Reality view.',
  },
  {
    systemId: 'command_center_brain',
    displayName: 'Unified Command Center Brain',
    phase: '11.1',
    purpose: 'Local intelligence orchestration — understands systems, does not execute',
    relationshipSummary: 'Uses Cross-System Awareness; feeds Operator Feed; informs about all registered systems.',
  },
  {
    systemId: 'cross_system_awareness',
    displayName: 'Cross-System Awareness',
    phase: '11.2',
    purpose: 'Relationship and dependency understanding layer for the Brain',
    relationshipSummary: 'Informs Brain how systems connect — relationships only, not capabilities.',
  },
  {
    systemId: 'operator_feed',
    displayName: 'Operator Feed',
    phase: '10.3.1',
    purpose: 'Surfaces Brain pipeline activity — informational only',
    relationshipSummary: 'Surfaces Brain activity; depends on Runtime Shell; does not control execution.',
  },
  {
    systemId: 'notifications',
    displayName: 'Notifications',
    phase: '10.3.1',
    purpose: 'Surfaces Brain and runtime status events in the shell header',
    relationshipSummary: 'Surfaces Brain connection events; depends on Runtime Shell.',
  },
];

export function buildCrossSystemRegistry(): CrossSystemSystemRecord[] {
  return BASE_SYSTEMS.map((system) => ({
    ...system,
    dependencies: computeDependencies(system.systemId, SYSTEM_RELATIONSHIP_EDGES),
    dependents: computeDependents(system.systemId, SYSTEM_RELATIONSHIP_EDGES),
  }));
}

export function getRelationshipEdges(): SystemRelationshipEdge[] {
  return SYSTEM_RELATIONSHIP_EDGES.map((e) => ({ ...e }));
}

export function getSystemById(systemId: string): CrossSystemSystemRecord | undefined {
  return buildCrossSystemRegistry().find((s) => s.systemId === systemId);
}

export function registryKey(): string {
  const systems = buildCrossSystemRegistry();
  return `${systems.length}:${SYSTEM_RELATIONSHIP_EDGES.length}`;
}

export function resolveSystemIdFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  const aliases: Array<[string, string[]]> = [
    ['governance_stack', ['governance', 'governance stack']],
    ['world2_foundation', ['world 2', 'world2', 'world 2 foundation']],
    ['mobile_command_foundation', ['mobile command', 'mobile']],
    ['self_evolution_foundation', ['self-evolution', 'self evolution']],
    ['experience_layer', ['experience layer']],
    ['trust_engine', ['trust engine', 'trust']],
    ['founder_reality_surface', ['founder reality']],
    ['command_center_runtime_shell', ['runtime shell', 'command center shell', 'command center']],
    ['command_center_brain', ['command center brain', 'brain', 'unified brain']],
    ['operator_feed', ['operator feed', 'feed']],
    ['notifications', ['notification', 'notifications']],
    ['cross_system_awareness', ['cross-system', 'cross system awareness']],
  ];
  for (const [id, patterns] of aliases) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) return id;
    }
  }
  return null;
}

export function founderDisplayName(systemId: string): string {
  const aliases: Record<string, string> = {
    world2_foundation: 'World 2',
    command_center_runtime_shell: 'Command Center',
    command_center_brain: 'Command Center Brain',
    trust_engine: 'Trust Engine',
    governance_stack: 'Governance',
    operator_feed: 'Operator Feed',
    mobile_command_foundation: 'Mobile Command',
    founder_reality_surface: 'Founder Reality',
    experience_layer: 'Experience Layer',
    notifications: 'Notifications',
  };
  return aliases[systemId] ?? getSystemById(systemId)?.displayName ?? systemId;
}

export function resolveDependencyTargetFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  for (const marker of ['depend on', 'depends on', 'rely on', 'relies on']) {
    const idx = lower.indexOf(marker);
    if (idx >= 0) {
      const after = message.slice(idx + marker.length).replace(/\?/g, '').trim();
      const id = resolveSystemIdFromMessage(after);
      if (id) return id;
    }
  }
  return resolveSystemIdFromMessage(message);
}

export function resolveSystemPairFromMessage(message: string): [string, string] | null {
  const lower = message.toLowerCase();
  if (!lower.includes('connect')) return null;
  if (lower.includes('world 2') && lower.includes('command center')) {
    return ['world2_foundation', 'command_center_runtime_shell'];
  }
  if (lower.includes('mobile command') && lower.includes('command center')) {
    return ['mobile_command_foundation', 'command_center_runtime_shell'];
  }
  const ids = buildCrossSystemRegistry()
    .map((s) => s.systemId)
    .filter((id) => {
      const sys = getSystemById(id);
      if (!sys) return false;
      return lower.includes(sys.displayName.toLowerCase()) || lower.includes(id.replace(/_/g, ' '));
    });
  if (ids.length >= 2) return [ids[0]!, ids[1]!];
  const single = resolveSystemIdFromMessage(message);
  if (single && lower.includes('command center')) {
    return [single, 'command_center_runtime_shell'];
  }
  return null;
}
