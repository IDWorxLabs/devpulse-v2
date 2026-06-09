/**
 * Cloud Verification Foundation — query layer.
 */

import { listStoredCloudVerifications, listStoredCloudVerificationSessions } from './cloud-verification-store.js';
import type { CloudVerification, CloudVerificationCategory } from './cloud-verification-types.js';

export interface CloudVerificationQuery {
  projectId?: string;
  runtimeId?: string;
  workspaceId?: string;
  persistentBuildId?: string;
  ownerModule?: string;
  verificationType?: CloudVerificationCategory;
  verificationState?: CloudVerification['verificationState'];
}

export function queryCloudVerifications(query: CloudVerificationQuery = {}): CloudVerification[] {
  return listStoredCloudVerifications().filter((v) => {
    if (query.projectId && v.verificationOwner.projectId !== query.projectId) return false;
    if (query.runtimeId && v.verificationOwner.runtimeId !== query.runtimeId) return false;
    if (query.workspaceId && v.verificationOwner.workspaceId !== query.workspaceId) return false;
    if (query.persistentBuildId && v.verificationOwner.persistentBuildId !== query.persistentBuildId) return false;
    if (query.ownerModule && v.verificationOwner.ownerModule !== query.ownerModule) return false;
    if (query.verificationType && v.verificationType !== query.verificationType) return false;
    if (query.verificationState && v.verificationState !== query.verificationState) return false;
    return true;
  });
}

export function listCloudVerifications(): CloudVerification[] {
  return listStoredCloudVerifications();
}

export function listCloudVerificationsByProject(projectId: string): CloudVerification[] {
  return queryCloudVerifications({ projectId });
}

export function listCloudVerificationsByRuntime(runtimeId: string): CloudVerification[] {
  return queryCloudVerifications({ runtimeId });
}

export function listCloudVerificationsByWorkspace(workspaceId: string): CloudVerification[] {
  return queryCloudVerifications({ workspaceId });
}

export function listCloudVerificationsByPersistentBuild(persistentBuildId: string): CloudVerification[] {
  return queryCloudVerifications({ persistentBuildId });
}

export function listCloudVerificationsByOwner(ownerModule: string): CloudVerification[] {
  return queryCloudVerifications({ ownerModule });
}

export function listCloudVerificationsByType(verificationType: CloudVerificationCategory): CloudVerification[] {
  return queryCloudVerifications({ verificationType });
}

export function countVerificationsByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of listStoredCloudVerifications()) {
    counts[v.verificationState] = (counts[v.verificationState] ?? 0) + 1;
  }
  return counts;
}

export function countVerificationSessions(): number {
  return listStoredCloudVerificationSessions().length;
}
