/**
 * Multi Project Monitoring — project monitor registry.
 */

import type { ProjectMonitor, ProjectMonitorStatus } from './monitoring-types.js';

const monitors = new Map<string, ProjectMonitor>();
const byWorkspace = new Map<string, ProjectMonitor[]>();
const byStatus = new Map<ProjectMonitorStatus, ProjectMonitor[]>();

export function registerProjectMonitor(monitor: ProjectMonitor): ProjectMonitor {
  monitors.set(monitor.projectId, monitor);

  const workspaceList = byWorkspace.get(monitor.workspaceId) ?? [];
  const existingIdx = workspaceList.findIndex((m) => m.projectId === monitor.projectId);
  if (existingIdx >= 0) {
    workspaceList[existingIdx] = monitor;
  } else {
    workspaceList.push(monitor);
  }
  byWorkspace.set(monitor.workspaceId, workspaceList);

  for (const status of byStatus.keys()) {
    const list = byStatus.get(status) ?? [];
    byStatus.set(status, list.filter((m) => m.projectId !== monitor.projectId));
  }
  const statusList = byStatus.get(monitor.status) ?? [];
  statusList.push(monitor);
  byStatus.set(monitor.status, statusList);

  return monitor;
}

export function getProjectMonitor(projectId: string): ProjectMonitor | undefined {
  return monitors.get(projectId);
}

export function listProjectMonitors(): ProjectMonitor[] {
  return [...monitors.values()];
}

export function getProjectMonitorCount(): number {
  return monitors.size;
}

export function listProjectMonitorsByWorkspace(workspaceId: string): ProjectMonitor[] {
  return byWorkspace.get(workspaceId) ?? [];
}

export function listProjectMonitorsByStatus(status: ProjectMonitorStatus): ProjectMonitor[] {
  return byStatus.get(status) ?? [];
}

export function resetProjectMonitorRegistryForTests(): void {
  monitors.clear();
  byWorkspace.clear();
  byStatus.clear();
}
