/**
 * Self Documentation — registry.
 */

import type {
  DocumentationCompletenessLevel,
  DocumentationState,
  SelfDocumentationRecord,
} from './self-documentation-types.js';

const byDocumentationId = new Map<string, SelfDocumentationRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byCompletenessLevel = new Map<DocumentationCompletenessLevel, Set<string>>();
const byState = new Map<DocumentationState, Set<string>>();

function indexRecord(record: SelfDocumentationRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.documentationId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byCompletenessLevel.has(record.completenessLevel)) {
    byCompletenessLevel.set(record.completenessLevel, new Set());
  }
  byCompletenessLevel.get(record.completenessLevel)!.add(record.documentationId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.documentationId);
}

export function registerSelfDocumentationRecord(record: SelfDocumentationRecord): SelfDocumentationRecord {
  byDocumentationId.set(record.documentationId, record);
  indexRecord(record);
  return record;
}

export function getSelfDocumentationRecord(documentationId: string): SelfDocumentationRecord | undefined {
  return byDocumentationId.get(documentationId);
}

export function lookupDocumentationByProjectId(projectId: string): SelfDocumentationRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupDocumentationByWorkspaceId(workspaceId: string): SelfDocumentationRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupDocumentationByCompletenessLevel(
  level: DocumentationCompletenessLevel,
): SelfDocumentationRecord[] {
  const ids = byCompletenessLevel.get(level);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupDocumentationByState(state: DocumentationState): SelfDocumentationRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function listSelfDocumentationRecords(): SelfDocumentationRecord[] {
  return [...byDocumentationId.values()];
}

export function getSelfDocumentationRecordCount(): number {
  return byDocumentationId.size;
}

export function resetSelfDocumentationRegistryForTests(): void {
  byDocumentationId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byCompletenessLevel.clear();
  byState.clear();
}
