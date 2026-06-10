/**
 * Multi Project Monitoring — bounded history.
 */

import type { MonitoringHistoryEntry } from './monitoring-types.js';
import { DEFAULT_MAX_MONITORING_HISTORY_SIZE } from './monitoring-types.js';
import type { MonitoringReport } from './monitoring-types.js';

const history: MonitoringHistoryEntry[] = [];
let historyCounter = 0;

export function recordMonitoringHistory(report: MonitoringReport): MonitoringHistoryEntry {
  historyCounter += 1;

  const entry: MonitoringHistoryEntry = {
    historyId: `monitoring-history-${historyCounter}`,
    projectCount: report.projectCount,
    alertCount: report.alerts.length,
    portfolioActive: report.portfolio.activeProjects,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > DEFAULT_MAX_MONITORING_HISTORY_SIZE) {
    history.length = DEFAULT_MAX_MONITORING_HISTORY_SIZE;
  }

  return entry;
}

export function getMonitoringHistory(limit = 20): MonitoringHistoryEntry[] {
  return history.slice(0, limit);
}

export function getMonitoringHistorySize(): number {
  return history.length;
}

export function resetMonitoringHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
