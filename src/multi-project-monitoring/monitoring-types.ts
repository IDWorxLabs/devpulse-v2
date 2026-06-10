/**
 * Multi Project Monitoring — types and models.
 * Monitoring and visibility only — no execution.
 */

export const MULTI_PROJECT_MONITORING_PASS_TOKEN = 'MULTI_PROJECT_MONITORING_V1_PASS';
export const MULTI_PROJECT_MONITORING_OWNER_MODULE = 'devpulse_v2_multi_project_monitoring';
export const DEFAULT_MAX_MONITORING_HISTORY_SIZE = 128;

export type ProjectMonitorStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED';

export interface ProjectOperatorFeed {
  projectId: string;
  feedId: string;
  eventCount: number;
  isolated: boolean;
}

export interface ProjectPreviewSession {
  projectId: string;
  previewSessionId: string;
  workspaceId: string;
  active: boolean;
}

export interface ProjectMonitor {
  projectId: string;
  workspaceId: string;
  status: ProjectMonitorStatus;
  feedId: string;
  streamId: string;
  timelineId: string;
  previewId?: string;
  registeredAt: number;
}

export interface ProjectEvent {
  eventId: string;
  projectId: string;
  eventType: 'BUILD' | 'TESTING' | 'FIXING' | 'VERIFICATION' | 'COMPLETION' | 'PROGRESS';
  summary: string;
  timestamp: number;
}

export interface TimelineEvent {
  eventId: string;
  projectId: string;
  category: string;
  summary: string;
  timestamp: number;
}

export interface ProjectProgress {
  projectId: string;
  planning: number;
  build: number;
  testing: number;
  fixing: number;
  verification: number;
  completion: number;
  overall: number;
  updatedAt: number;
}

export interface ProjectLivePreview {
  projectId: string;
  previewId: string;
  workspaceId: string;
  active: boolean;
}

export type MonitoringAlertType =
  | 'FAILED_PROJECT'
  | 'HIGH_RISK_PROJECT'
  | 'BLOCKED_PROJECT'
  | 'ISOLATION_VIOLATION'
  | 'RESOURCE_CONTENTION'
  | 'VERIFICATION_BOTTLENECK';

export interface MonitoringAlert {
  alertId: string;
  projectId: string;
  alertType: MonitoringAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detail: string;
  createdAt: number;
}

export interface PortfolioMonitoringSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  failedProjects: number;
  pausedProjects: number;
  averageProgress: number;
  alertCount: number;
}

export interface MonitoringReport {
  reportId: string;
  projectCount: number;
  feeds: ProjectOperatorFeed[];
  timelines: number;
  previewSessions: ProjectPreviewSession[];
  progress: ProjectProgress[];
  alerts: MonitoringAlert[];
  portfolio: PortfolioMonitoringSummary;
  recommendations: string[];
  generatedAt: number;
}

export interface MonitoringHistoryEntry {
  historyId: string;
  projectCount: number;
  alertCount: number;
  portfolioActive: number;
  recordedAt: number;
}

export interface MonitoringRuntimeReport {
  projectCount: number;
  feedCount: number;
  timelineCount: number;
  previewCount: number;
  alertCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const MONITORING_QUESTION_SIGNALS = [
  'multi project monitoring',
  'portfolio monitoring',
  'project operator feed',
  'live preview tabs',
  'project progress tracking',
] as const;

export function isMonitoringQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return MONITORING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
