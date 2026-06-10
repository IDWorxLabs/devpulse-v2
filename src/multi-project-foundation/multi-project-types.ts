/**
 * Multi Project Foundation — types and models.
 * Foundation only — no execution.
 */

export const MULTI_PROJECT_FOUNDATION_PASS_TOKEN = 'MULTI_PROJECT_FOUNDATION_V1_PASS';
export const MULTI_PROJECT_FOUNDATION_OWNER_MODULE = 'devpulse_v2_multi_project_foundation';
export const DEFAULT_MAX_PROJECT_HISTORY_SIZE = 64;

export type MultiProjectState =
  | 'CREATED'
  | 'PLANNING'
  | 'BUILDING'
  | 'TESTING'
  | 'FIXING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'FAILED'
  | 'ARCHIVED';

export type ProjectLifecycleStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'COMPLETED' | 'FAILED';

export type IsolationStatus = 'ISOLATED' | 'ISOLATION_VIOLATION';

export type ProjectEventType =
  | 'CREATION'
  | 'STATE_CHANGE'
  | 'PLANNING_ACTION'
  | 'VERIFICATION_ACTION'
  | 'COMPLETION_ACTION';

export interface MultiProjectRecord {
  projectId: string;
  projectName: string;
  projectType: string;
  state: MultiProjectState;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectIdentity {
  projectId: string;
  workspaceId: string;
  projectHandle: string;
}

export interface ProjectContext {
  projectId: string;
  planningContext: Record<string, unknown>;
  strategyContext: Record<string, unknown>;
  verificationContext: Record<string, unknown>;
  completionContext: Record<string, unknown>;
  updatedAt: number;
}

export interface ProjectHistoryEntry {
  historyId: string;
  projectId: string;
  eventType: ProjectEventType;
  detail: string;
  recordedAt: number;
}

export interface ProjectLifecycleSummary {
  projectId: string;
  status: ProjectLifecycleStatus;
  state: MultiProjectState;
  summary: string;
}

export interface ProjectIsolationResult {
  status: IsolationStatus;
  projectId: string;
  targetProjectId?: string;
  violations: string[];
}

export interface ProjectReport {
  reportId: string;
  projectId: string;
  projectName: string;
  projectType: string;
  state: MultiProjectState;
  workspaceId: string;
  lifecycleStatus: ProjectLifecycleStatus;
  contextStatus: string;
  isolationStatus: IsolationStatus;
  historySummary: string[];
  generatedAt: number;
}

export interface RegisterProjectInput {
  projectName: string;
  projectType: string;
}

export interface ProjectRuntimeReport {
  projectCount: number;
  registrySize: number;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const MULTI_PROJECT_QUESTION_SIGNALS = [
  'multi project',
  'multiple projects',
  'project registry',
  'project isolation',
  'project workspace',
] as const;

export function isMultiProjectQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return MULTI_PROJECT_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
