/**
 * Project Isolation Guard V1 — types.
 */

export const PROJECT_ISOLATION_GUARD_PASS_TOKEN = 'PROJECT_ISOLATION_GUARD_V1_PASS' as const;

export type ProjectIsolationVerdict = 'ISOLATED' | 'LEAK_RISK' | 'VIOLATION';

export type ProjectIsolationDomain =
  | 'CHAT'
  | 'PLAN'
  | 'MEMORY'
  | 'BUILD_RUN'
  | 'WORKSPACE'
  | 'LIVE_PREVIEW'
  | 'FOUNDER_TEST'
  | 'VALIDATION'
  | 'OPERATOR_FEED'
  | 'NOTIFICATION'
  | 'INSIGHT'
  | 'RUNTIME'
  | 'ARTIFACT';

export type ProjectIsolationScope = 'READ' | 'WRITE' | 'BUILD' | 'PREVIEW';

export interface ProjectIdentityRecord {
  readOnly: true;
  projectId: string;
  projectName: string;
  createdAt: string | null;
  projectDomain: string;
  projectProfile: string | null;
  workspacePath: string | null;
}

export interface ProjectIsolationViolation {
  readOnly: true;
  domain: ProjectIsolationDomain;
  scope: ProjectIsolationScope;
  viewerProjectId: string | null;
  recordProjectId: string | null;
  detail: string;
}

export interface ProjectIsolationCheckResult {
  readOnly: true;
  verdict: ProjectIsolationVerdict;
  viewerProjectId: string | null;
  violations: ProjectIsolationViolation[];
  checkedDomains: ProjectIsolationDomain[];
}

export interface ProjectScopedRecord {
  projectId?: string | null;
}

export interface OperatorFeedEventIsolation {
  projectId: string | null;
  eventType: string;
  timestamp: number;
  details: string;
  scope?: 'PROJECT' | 'GLOBAL';
}

export interface ProjectNotificationRecord {
  projectId: string | null;
  scope: 'PROJECT' | 'GLOBAL';
  text: string;
  timestamp: string;
}
