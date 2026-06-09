/**
 * Cloud Runtime Foundation — query layer.
 */

import { listStoredRuntimes, listStoredSessions } from './cloud-runtime-store.js';
import type { CloudRuntime, CloudRuntimeCategory } from './cloud-runtime-types.js';

export interface CloudRuntimeQuery {
  projectId?: string;
  workspaceId?: string;
  ownerModule?: string;
  runtimeType?: CloudRuntimeCategory;
  runtimeState?: CloudRuntime['runtimeState'];
  resumable?: boolean;
}

export function queryRuntimes(query: CloudRuntimeQuery = {}): CloudRuntime[] {
  return listStoredRuntimes().filter((runtime) => {
    if (query.projectId && runtime.runtimeOwner.projectId !== query.projectId) return false;
    if (query.workspaceId && runtime.runtimeOwner.workspaceId !== query.workspaceId) return false;
    if (query.ownerModule && runtime.runtimeOwner.ownerModule !== query.ownerModule) return false;
    if (query.runtimeType && runtime.runtimeType !== query.runtimeType) return false;
    if (query.runtimeState && runtime.runtimeState !== query.runtimeState) return false;
    if (query.resumable !== undefined && runtime.runtimeMetadata.resumable !== query.resumable) return false;
    return true;
  });
}

export function listRuntimes(): CloudRuntime[] {
  return listStoredRuntimes();
}

export function listRuntimesByProject(projectId: string): CloudRuntime[] {
  return queryRuntimes({ projectId });
}

export function listRuntimesByWorkspace(workspaceId: string): CloudRuntime[] {
  return queryRuntimes({ workspaceId });
}

export function listRuntimesByOwner(ownerModule: string): CloudRuntime[] {
  return queryRuntimes({ ownerModule });
}

export function listRuntimesByType(runtimeType: CloudRuntimeCategory): CloudRuntime[] {
  return queryRuntimes({ runtimeType });
}

export function countRuntimesByState(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const runtime of listStoredRuntimes()) {
    counts[runtime.runtimeState] = (counts[runtime.runtimeState] ?? 0) + 1;
  }
  return counts;
}

export function countSessions(): number {
  return listStoredSessions().length;
}
