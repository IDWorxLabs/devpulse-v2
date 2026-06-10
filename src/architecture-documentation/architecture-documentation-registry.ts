/**
 * Architecture Documentation — registry.
 */

import type {
  ArchitectureCoverageLevel,
  ArchitectureDocumentationRecord,
  ArchitectureDocumentationState,
} from './architecture-documentation-types.js';

const byDocumentationId = new Map<string, ArchitectureDocumentationRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byCoverageLevel = new Map<ArchitectureCoverageLevel, Set<string>>();
const byState = new Map<ArchitectureDocumentationState, Set<string>>();

function indexRecord(record: ArchitectureDocumentationRecord): void {
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

export function registerArchitectureDocumentationRecord(
  record: ArchitectureDocumentationRecord,
): ArchitectureDocumentationRecord {
  byDocumentationId.set(record.documentationId, record);
  indexRecord(record);
  return record;
}

export function getArchitectureDocumentationRecord(
  documentationId: string,
): ArchitectureDocumentationRecord | undefined {
  return byDocumentationId.get(documentationId);
}

export function lookupArchitectureDocumentationByProjectId(
  projectId: string,
): ArchitectureDocumentationRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupArchitectureDocumentationByWorkspaceId(
  workspaceId: string,
): ArchitectureDocumentationRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupArchitectureDocumentationByCoverageLevel(
  level: ArchitectureCoverageLevel,
): ArchitectureDocumentationRecord[] {
  const ids = byCoverageLevel.get(level);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function lookupArchitectureDocumentationByState(
  state: ArchitectureDocumentationState,
): ArchitectureDocumentationRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byDocumentationId.get(id)!).filter(Boolean);
}

export function listArchitectureDocumentationRecords(): ArchitectureDocumentationRecord[] {
  return [...byDocumentationId.values()];
}

export function getArchitectureDocumentationRecordCount(): number {
  return byDocumentationId.size;
}

export function resetArchitectureDocumentationRegistryForTests(): void {
  byDocumentationId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byCoverageLevel.clear();
  byState.clear();
}
