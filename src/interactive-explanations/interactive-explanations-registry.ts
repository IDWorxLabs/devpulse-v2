/**
 * Interactive Explanations — registry.
 */

import type {
  ExplanationCoverageLevel,
  ExplanationState,
  InteractiveExplanationRecord,
} from './interactive-explanations-types.js';

const byExplanationId = new Map<string, InteractiveExplanationRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byCoverageLevel = new Map<ExplanationCoverageLevel, Set<string>>();
const byState = new Map<ExplanationState, Set<string>>();

function indexRecord(record: InteractiveExplanationRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.explanationId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byCoverageLevel.has(record.coverageLevel)) {
    byCoverageLevel.set(record.coverageLevel, new Set());
  }
  byCoverageLevel.get(record.coverageLevel)!.add(record.explanationId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.explanationId);
}

export function registerInteractiveExplanationRecord(
  record: InteractiveExplanationRecord,
): InteractiveExplanationRecord {
  byExplanationId.set(record.explanationId, record);
  indexRecord(record);
  return record;
}

export function getInteractiveExplanationRecord(
  explanationId: string,
): InteractiveExplanationRecord | undefined {
  return byExplanationId.get(explanationId);
}

export function lookupInteractiveExplanationByProjectId(
  projectId: string,
): InteractiveExplanationRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byExplanationId.get(id)!).filter(Boolean);
}

export function lookupInteractiveExplanationByWorkspaceId(
  workspaceId: string,
): InteractiveExplanationRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byExplanationId.get(id)!).filter(Boolean);
}

export function lookupInteractiveExplanationByCoverageLevel(
  level: ExplanationCoverageLevel,
): InteractiveExplanationRecord[] {
  const ids = byCoverageLevel.get(level);
  if (!ids) return [];
  return [...ids].map((id) => byExplanationId.get(id)!).filter(Boolean);
}

export function lookupInteractiveExplanationByState(
  state: ExplanationState,
): InteractiveExplanationRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byExplanationId.get(id)!).filter(Boolean);
}

export function listInteractiveExplanationRecords(): InteractiveExplanationRecord[] {
  return [...byExplanationId.values()];
}

export function getInteractiveExplanationRecordCount(): number {
  return byExplanationId.size;
}

export function resetInteractiveExplanationsRegistryForTests(): void {
  byExplanationId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byCoverageLevel.clear();
  byState.clear();
}
