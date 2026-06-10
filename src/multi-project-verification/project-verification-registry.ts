/**
 * Multi Project Verification — project verification registry.
 */

import type { ProjectVerificationRecord, ProjectVerificationStatus } from './multi-project-verification-types.js';
import {
  getCachedByStatus,
  getCachedVerification,
  setCachedByStatus,
  setCachedVerification,
} from './project-verification-cache.js';

const records = new Map<string, ProjectVerificationRecord>();
const byWorkspace = new Map<string, ProjectVerificationRecord[]>();
const byStatus = new Map<ProjectVerificationStatus, ProjectVerificationRecord[]>();

export function registerProjectVerification(record: ProjectVerificationRecord): ProjectVerificationRecord {
  records.set(record.projectId, record);
  setCachedVerification(record);

  const workspaceList = byWorkspace.get(record.workspaceId) ?? [];
  const existingIdx = workspaceList.findIndex((r) => r.projectId === record.projectId);
  if (existingIdx >= 0) {
    workspaceList[existingIdx] = record;
  } else {
    workspaceList.push(record);
  }
  byWorkspace.set(record.workspaceId, workspaceList);

  for (const status of byStatus.keys()) {
    const list = byStatus.get(status) ?? [];
    const filtered = list.filter((r) => r.projectId !== record.projectId);
    byStatus.set(status, filtered);
  }

  const statusList = byStatus.get(record.status) ?? [];
  statusList.push(record);
  byStatus.set(record.status, statusList);

  return record;
}

export function getProjectVerification(projectId: string): ProjectVerificationRecord | undefined {
  const cached = getCachedVerification(projectId);
  if (cached) return cached;
  const record = records.get(projectId);
  if (record) setCachedVerification(record);
  return record;
}

export function listProjectVerifications(): ProjectVerificationRecord[] {
  return [...records.values()];
}

export function getProjectVerificationCount(): number {
  return records.size;
}

export function listProjectVerificationsByWorkspace(workspaceId: string): ProjectVerificationRecord[] {
  return byWorkspace.get(workspaceId) ?? [];
}

export function listProjectVerificationsByStatus(status: ProjectVerificationStatus): ProjectVerificationRecord[] {
  const cached = getCachedByStatus(status);
  if (cached) return cached;
  const result = byStatus.get(status) ?? [];
  setCachedByStatus(status, result);
  return result;
}

export function resetProjectVerificationRegistryForTests(): void {
  records.clear();
  byWorkspace.clear();
  byStatus.clear();
}
