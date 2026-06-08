/**
 * Cross-System Awareness — relationship types. Awareness only, no execution.
 */

export type RelationshipType =
  | 'DEPENDS_ON'
  | 'USES'
  | 'INFORMS'
  | 'PROTECTS'
  | 'SURFACES'
  | 'REPORTS_TO'
  | 'FEEDS';

export const RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  'DEPENDS_ON',
  'USES',
  'INFORMS',
  'PROTECTS',
  'SURFACES',
  'REPORTS_TO',
  'FEEDS',
] as const;

export interface SystemRelationshipEdge {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  summary: string;
}

export interface CrossSystemSystemRecord {
  systemId: string;
  displayName: string;
  phase: string;
  purpose: string;
  dependencies: string[];
  dependents: string[];
  relationshipSummary: string;
}

export interface CrossSystemAwarenessSnapshot {
  relationshipCount: number;
  dependencyCount: number;
  impactAnalysisAvailable: boolean;
  systemsModeled: number;
  queryType: 'DEPENDENCY' | 'IMPACT' | 'RELATIONSHIP' | 'NONE';
  targetSystemId: string | null;
}

export const CROSS_SYSTEM_AWARENESS_PASS_TOKEN =
  'DEVPULSE_V2_CROSS_SYSTEM_AWARENESS_FOUNDATION_V1_PASS';

export const CROSS_SYSTEM_AWARENESS_OWNER_MODULE = 'devpulse_v2_cross_system_awareness';

export const DUPLICATE_CROSS_SYSTEM_PATTERNS = [
  'cross_system_awareness',
  'system_relationship_engine',
  'dependency_awareness',
  'relationship_graph',
  'system_awareness_engine',
] as const;
