/**
 * Multi Project Monitoring — portfolio monitoring model.
 */

import type { PortfolioMonitoringSummary } from './monitoring-types.js';
import { listProjectMonitors } from './project-monitor-registry.js';
import { listProjectProgress } from './project-progress-tracker.js';
import { getMonitoringAlerts } from './monitoring-alert-manager.js';

export function buildPortfolioMonitoringModel(): PortfolioMonitoringSummary {
  const monitors = listProjectMonitors();
  const progressList = listProjectProgress();
  const alerts = getMonitoringAlerts();

  const totalProjects = monitors.length;
  const activeProjects = monitors.filter((m) => m.status === 'ACTIVE').length;
  const completedProjects = monitors.filter((m) => m.status === 'COMPLETED').length;
  const failedProjects = monitors.filter((m) => m.status === 'FAILED').length;
  const pausedProjects = monitors.filter((m) => m.status === 'PAUSED').length;

  const averageProgress = progressList.length === 0
    ? 0
    : Math.round(progressList.reduce((sum, p) => sum + p.overall, 0) / progressList.length);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    failedProjects,
    pausedProjects,
    averageProgress,
    alertCount: alerts.length,
  };
}
