/**
 * User Guides — registry.
 */

import type {
  UserGuideCompletenessLevel,
  UserGuideRecord,
  UserGuideState,
} from './user-guides-types.js';

const byGuideId = new Map<string, UserGuideRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byCompletenessLevel = new Map<UserGuideCompletenessLevel, Set<string>>();
const byState = new Map<UserGuideState, Set<string>>();

function indexRecord(record: UserGuideRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.guideId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byCompletenessLevel.has(record.completenessLevel)) {
    byCompletenessLevel.set(record.completenessLevel, new Set());
  }
  byCompletenessLevel.get(record.completenessLevel)!.add(record.guideId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.guideId);
}

export function registerUserGuideRecord(record: UserGuideRecord): UserGuideRecord {
  byGuideId.set(record.guideId, record);
  indexRecord(record);
  return record;
}

export function getUserGuideRecord(guideId: string): UserGuideRecord | undefined {
  return byGuideId.get(guideId);
}

export function lookupUserGuideByProjectId(projectId: string): UserGuideRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function lookupUserGuideByWorkspaceId(workspaceId: string): UserGuideRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function lookupUserGuideByCompletenessLevel(
  level: UserGuideCompletenessLevel,
): UserGuideRecord[] {
  const ids = byCompletenessLevel.get(level);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function lookupUserGuideByState(state: UserGuideState): UserGuideRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function listUserGuideRecords(): UserGuideRecord[] {
  return [...byGuideId.values()];
}

export function getUserGuideRecordCount(): number {
  return byGuideId.size;
}

export function resetUserGuidesRegistryForTests(): void {
  byGuideId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byCompletenessLevel.clear();
  byState.clear();
}
