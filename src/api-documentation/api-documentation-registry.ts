/**
 * API Documentation — registry.
 */

import type {
  ApiCoverageLevel,
  ApiDocumentationRecord,
  ApiDocumentationState,
} from './api-documentation-types.js';

const byDocumentationId = new Map<string, ApiDocumentationRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byCoverageLevel = new Map<ApiCoverageLevel, Set<string>>();
const byState = new Map<ApiDocumentationState, Set<string>>();

function indexRecord(record: ApiDocumentationRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.documentationId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byCoverageLevel.has(record.coverageLevel)) {
    byCoverageLevel.set(record.coverageLevel, new Set());
  }
  byCoverageLevel.get(record.coverageLevel)!.add(record.documentationId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.documentationId);
}

export function registerApiDocumentationRecord(
  record: ApiDocumentationRecord,
): ApiDocumentationRecord {
  byDocumentationId.set(record.documentationId, record);
  indexRecord(record);
  return record;
}

export function getApiDocumentationRecord(
  documentationId: string,
): ApiDocumentationRecord | undefined {
  return byDocumentationId.get(documentationId);
}

export function lookupApiDocumentationByProjectId(projectId: string): ApiDocumentationRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupApiDocumentationByWorkspaceId(workspaceId: string): ApiDocumentationRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupApiDocumentationByCoverageLevel(
  level: ApiCoverageLevel,
): ApiDocumentationRecord[] {
  const ids = byCoverageLevel.get(level);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupApiDocumentationByState(
  state: ApiDocumentationState,
): ApiDocumentationRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function listApiDocumentationRecords(): ApiDocumentationRecord[] {
  return [...byDocumentationId.values()];
}

export function getApiDocumentationRecordCount(): number {
  return byDocumentationId.size;
}

export function resetApiDocumentationRegistryForTests(): void {
  byDocumentationId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byCoverageLevel.clear();
  byState.clear();
}
