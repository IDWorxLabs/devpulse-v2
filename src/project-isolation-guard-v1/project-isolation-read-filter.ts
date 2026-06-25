/**
 * Project Isolation Guard V1 — project-scoped read filters.
 */

import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import type {
  ProjectIsolationDomain,
  ProjectIsolationScope,
  ProjectIsolationViolation,
  ProjectScopedRecord,
} from './project-isolation-guard-types.js';

export function isGlobalScopedRecord(record: { scope?: string } | null | undefined): boolean {
  return record?.scope === 'GLOBAL';
}

export function filterRecordsByProjectId<T extends ProjectScopedRecord>(
  records: readonly T[],
  projectId: string,
  options?: { includeGlobal?: boolean },
): T[] {
  const includeGlobal = options?.includeGlobal ?? false;
  return records.filter((record) => {
    if (includeGlobal && isGlobalScopedRecord(record as { scope?: string })) return true;
    return record.projectId === projectId;
  });
}

export function detectCrossProjectLeaks<T extends ProjectScopedRecord>(
  viewerProjectId: string,
  records: readonly T[],
  input: {
    domain: ProjectIsolationDomain;
    scope: ProjectIsolationScope;
    getProjectId?: (record: T) => string | null | undefined;
  },
): ProjectIsolationViolation[] {
  const violations: ProjectIsolationViolation[] = [];
  const getProjectId = input.getProjectId ?? ((record: T) => record.projectId);

  for (const record of records) {
    if (isGlobalScopedRecord(record as { scope?: string })) continue;

    const recordProjectId = getProjectId(record) ?? null;
    if (!recordProjectId) {
      violations.push({
        readOnly: true,
        domain: input.domain,
        scope: input.scope,
        viewerProjectId,
        recordProjectId: null,
        detail: 'Record missing projectId',
      });
      continue;
    }
    if (recordProjectId !== viewerProjectId) {
      violations.push({
        readOnly: true,
        domain: input.domain,
        scope: input.scope,
        viewerProjectId,
        recordProjectId,
        detail: `Cross-project ${input.domain} leak: ${recordProjectId} visible to ${viewerProjectId}`,
      });
    }
  }

  return violations;
}

export function assertNoCrossProjectLeaks<T extends ProjectScopedRecord>(
  viewerProjectId: string,
  records: readonly T[],
  input: {
    domain: ProjectIsolationDomain;
    scope: ProjectIsolationScope;
    getProjectId?: (record: T) => string | null | undefined;
  },
): void {
  const violations = detectCrossProjectLeaks(viewerProjectId, records, input);
  if (violations.length > 0) {
    throw new Error(violations.map((v) => v.detail).join('; '));
  }
}

export function workspacePathForProject(projectId: string): string {
  return `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`.replace(/\\/g, '/');
}

export function workspacePathBelongsToProject(workspacePath: string | null | undefined, projectId: string): boolean {
  if (!workspacePath?.trim()) return true;
  const normalized = workspacePath.replace(/\\/g, '/');
  const expectedSegment = `/${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`;
  return normalized.includes(expectedSegment) || normalized.endsWith(`/${projectId}`);
}

export function filterChatMessagesByProject<T extends { projectId?: string | null }>(
  messages: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(messages, projectId);
}

export function filterPlansByProject<T extends { projectId?: string | null }>(
  plans: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(plans, projectId);
}

export function filterMemoryByProject<T extends { projectId?: string | null }>(
  memories: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(memories, projectId);
}

export function filterBuildRunsByProject<T extends { projectId?: string | null }>(
  runs: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(runs, projectId);
}

export function filterWorkspacesByProject<T extends { projectId?: string | null }>(
  workspaces: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(workspaces, projectId);
}

export function filterLivePreviewsByProject<T extends { projectId?: string | null }>(
  previews: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(previews, projectId);
}

export function filterFounderTestReportsByProject<T extends { projectId?: string | null }>(
  reports: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(reports, projectId);
}

export function filterValidationReportsByProject<T extends { projectId?: string | null }>(
  reports: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(reports, projectId);
}

export function filterOperatorEventsByProject<T extends { projectId?: string | null; scope?: string }>(
  events: readonly T[],
  projectId: string,
  options?: { includeGlobal?: boolean },
): T[] {
  return filterRecordsByProjectId(events, projectId, options);
}

export function filterNotificationsByProject<T extends { projectId?: string | null; scope?: string }>(
  notifications: readonly T[],
  projectId: string,
  options?: { includeGlobal?: boolean },
): T[] {
  return filterRecordsByProjectId(notifications, projectId, options);
}

export function filterInsightsByProject<T extends { projectId?: string | null }>(
  insights: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(insights, projectId);
}

export function filterRuntimeStateByProject<T extends { projectId?: string | null }>(
  states: readonly T[],
  projectId: string,
): T[] {
  return filterRecordsByProjectId(states, projectId);
}
