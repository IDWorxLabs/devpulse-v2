/**
 * Multi Project Monitoring — reporting.
 */

import type { MonitoringReport } from './monitoring-types.js';
import { listProjectOperatorFeeds } from './project-operator-feed-manager.js';
import { getProjectTimelineCount } from './project-timeline-manager.js';
import { listActivePreviewSessions } from './project-preview-session-manager.js';
import { listProjectProgress } from './project-progress-tracker.js';
import { getMonitoringAlerts } from './monitoring-alert-manager.js';
import { buildPortfolioMonitoringModel } from './portfolio-monitor-manager.js';
import { getProjectMonitorCount } from './project-monitor-registry.js';

let reportCounter = 0;

export function generateMonitoringReport(): MonitoringReport {
  reportCounter += 1;

  const portfolio = buildPortfolioMonitoringModel();
  const alerts = getMonitoringAlerts();

  const recommendations: string[] = [];
  if (portfolio.failedProjects > 0) {
    recommendations.push(`Review ${portfolio.failedProjects} failed project(s)`);
  }
  if (portfolio.alertCount > 0) {
    recommendations.push(`Address ${portfolio.alertCount} monitoring alert(s)`);
  }
  if (portfolio.averageProgress < 50) {
    recommendations.push('Portfolio average progress below 50% — prioritize active projects');
  }
  if (recommendations.length === 0) {
    recommendations.push('Portfolio monitoring health is stable');
  }

  return {
    reportId: `monitoring-report-${reportCounter}`,
    projectCount: getProjectMonitorCount(),
    feeds: listProjectOperatorFeeds(),
    timelines: getProjectTimelineCount(),
    previewSessions: listActivePreviewSessions(),
    progress: listProjectProgress(),
    alerts,
    portfolio,
    recommendations: [...new Set(recommendations)],
    generatedAt: Date.now(),
  };
}

export function resetMonitoringReportCounterForTests(): void {
  reportCounter = 0;
}
