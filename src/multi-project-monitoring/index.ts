/**
 * Multi Project Monitoring — public exports.
 */

import { resetProjectMonitorRegistryForTests } from './project-monitor-registry.js';
import { resetProjectOperatorFeedManagerForTests } from './project-operator-feed-manager.js';
import { resetProjectEventStreamManagerForTests } from './project-event-stream-manager.js';
import { resetProjectTimelineManagerForTests } from './project-timeline-manager.js';
import { resetProjectProgressTrackerForTests } from './project-progress-tracker.js';
import { resetProjectLivePreviewManagerForTests } from './project-live-preview-manager.js';
import { resetProjectPreviewSessionManagerForTests } from './project-preview-session-manager.js';
import { resetMonitoringAlertManagerForTests } from './monitoring-alert-manager.js';
import { resetMonitoringHistoryForTests } from './monitoring-history.js';
import { resetMonitoringReportCounterForTests } from './monitoring-reporting.js';
import { resetMonitoringCacheForTests } from './monitoring-cache.js';
import { resetMultiProjectMonitoringForTests } from './multi-project-monitoring.js';
import { resetMultiProjectVerificationOrchestrationModuleForTests } from '../multi-project-verification-orchestration/index.js';

export {
  MULTI_PROJECT_MONITORING_PASS_TOKEN,
  MULTI_PROJECT_MONITORING_OWNER_MODULE,
  DEFAULT_MAX_MONITORING_HISTORY_SIZE,
  MONITORING_QUESTION_SIGNALS,
  isMonitoringQuestion,
} from './monitoring-types.js';

export type {
  ProjectMonitorStatus,
  ProjectOperatorFeed,
  ProjectPreviewSession,
  ProjectMonitor,
  ProjectEvent,
  TimelineEvent,
  ProjectProgress,
  ProjectLivePreview,
  MonitoringAlertType,
  MonitoringAlert,
  PortfolioMonitoringSummary,
  MonitoringReport,
  MonitoringHistoryEntry,
  MonitoringRuntimeReport,
} from './monitoring-types.js';

export {
  registerProjectMonitor,
  getProjectMonitor,
  listProjectMonitors,
  listProjectMonitorsByWorkspace,
  listProjectMonitorsByStatus,
  getProjectMonitorCount,
  resetProjectMonitorRegistryForTests,
} from './project-monitor-registry.js';

export {
  createProjectOperatorFeed,
  getProjectOperatorFeed,
  appendProjectOperatorEvent,
  getProjectOperatorFeedEvents,
  listProjectOperatorFeeds,
  getProjectOperatorFeedCount,
  resetProjectOperatorFeedManagerForTests,
} from './project-operator-feed-manager.js';

export {
  createProjectEventStream,
  appendProjectEvent,
  getProjectEventStream,
  getProjectEventStreamCount,
  resetProjectEventStreamManagerForTests,
} from './project-event-stream-manager.js';

export {
  createProjectTimeline,
  appendTimelineEvent,
  getProjectTimeline,
  getProjectTimelineCount,
  resetProjectTimelineManagerForTests,
} from './project-timeline-manager.js';

export {
  updateProjectProgress,
  getProjectProgress,
  listProjectProgress,
  resetProjectProgressTrackerForTests,
} from './project-progress-tracker.js';

export {
  createProjectLivePreview,
  getProjectLivePreview,
  listProjectLivePreviews,
  getProjectLivePreviewCount,
  resetProjectLivePreviewManagerForTests,
} from './project-live-preview-manager.js';

export {
  createPreviewSession,
  closePreviewSession,
  listPreviewSessions,
  listActivePreviewSessions,
  getPreviewSessionCount,
  resetProjectPreviewSessionManagerForTests,
} from './project-preview-session-manager.js';

export { buildPortfolioMonitoringModel } from './portfolio-monitor-manager.js';

export {
  createMonitoringAlert,
  getMonitoringAlerts,
  getMonitoringAlertCount,
  resetMonitoringAlertManagerForTests,
} from './monitoring-alert-manager.js';

export { generateMonitoringReport, resetMonitoringReportCounterForTests } from './monitoring-reporting.js';

export {
  recordMonitoringHistory,
  getMonitoringHistory,
  getMonitoringHistorySize,
  resetMonitoringHistoryForTests,
} from './monitoring-history.js';

export { getMonitoringCacheStats, resetMonitoringCacheForTests } from './monitoring-cache.js';

export {
  getDevPulseV2MultiProjectMonitoring,
  registerMultiProjectMonitoringWithCentralBrain,
  registerMultiProjectMonitoringWithProjectVault,
  registerMultiProjectMonitoringWithTrustEngine,
  registerMultiProjectMonitoringWithWorld2Coordinator,
  registerMultiProjectMonitoringWithUvl,
  registerMultiProjectMonitoringWithMultiProjectFoundation,
  registerMultiProjectMonitoringWithWorkspaceIsolation,
  registerMultiProjectMonitoringWithResourceAllocation,
  registerMultiProjectMonitoringWithParallelBuildOrchestration,
  registerMultiProjectMonitoringWithMultiProjectVerification,
  registerMultiProjectMonitoringWithVerificationOrchestration,
  registerMultiProjectMonitoringWithOperatorFeed,
  registerMultiProjectMonitoringWithLivePreview,
  registerProjectMonitoring,
  registerCoordinatedProjectMonitoring,
  getMultiProjectMonitoringRuntimeReport,
  resetMultiProjectMonitoringForTests,
} from './multi-project-monitoring.js';

export type {
  MultiProjectMonitoringSystemSnapshot,
  RegisterProjectMonitorInput,
} from './multi-project-monitoring.js';

export function resetMultiProjectMonitoringModuleForTests(): void {
  resetProjectMonitorRegistryForTests();
  resetProjectOperatorFeedManagerForTests();
  resetProjectEventStreamManagerForTests();
  resetProjectTimelineManagerForTests();
  resetProjectProgressTrackerForTests();
  resetProjectLivePreviewManagerForTests();
  resetProjectPreviewSessionManagerForTests();
  resetMonitoringAlertManagerForTests();
  resetMonitoringHistoryForTests();
  resetMonitoringReportCounterForTests();
  resetMonitoringCacheForTests();
  resetMultiProjectMonitoringForTests();
  resetMultiProjectVerificationOrchestrationModuleForTests();
}
