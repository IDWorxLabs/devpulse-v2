/**
 * Parallel Build Orchestration — types and models.
 * Planning only — no execution.
 */

export const PARALLEL_BUILD_ORCHESTRATION_PASS_TOKEN = 'PARALLEL_BUILD_ORCHESTRATION_V1_PASS';
export const PARALLEL_BUILD_ORCHESTRATION_OWNER_MODULE = 'devpulse_v2_parallel_build_orchestration';
export const DEFAULT_MAX_ORCHESTRATION_HISTORY_SIZE = 128;
export const MAX_DEPENDENCY_CHAIN_DEPTH = 64;

export type OrchestrationStatus =
  | 'READY'
  | 'WAITING'
  | 'BLOCKED'
  | 'DEPENDENCY_BLOCKED'
  | 'RESOURCE_BLOCKED';

export interface OrchestrationProject {
  projectId: string;
  workspaceId: string;
  priority: string;
  status: OrchestrationStatus;
}

export interface OrchestrationPlan {
  planId: string;
  projects: OrchestrationProject[];
  readyProjects: string[];
  waitingProjects: string[];
  blockedProjects: string[];
  executionGroups: string[][];
  dependencyChains: string[][];
  estimatedParallelism: number;
  generatedAt: number;
}

export interface OrchestrationProjectInput {
  projectId: string;
  workspaceId: string;
  priority?: string;
  dependsOn?: string[];
  projectState?: string;
  resourceAvailable?: boolean;
  isolationOk?: boolean;
}

export interface OrchestrationConflict {
  conflictId: string;
  conflictType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detail: string;
  recommendedAction: string;
  projectIds: string[];
}

export interface OrchestrationCapacityEvaluation {
  estimatedParallelism: number;
  bottlenecks: string[];
  safeLimit: number;
}

export interface OrchestrationReport {
  reportId: string;
  planId: string;
  projectCount: number;
  readyProjects: string[];
  waitingProjects: string[];
  blockedProjects: string[];
  executionGroups: string[][];
  dependencyChains: string[][];
  conflicts: OrchestrationConflict[];
  estimatedParallelism: number;
  recommendations: string[];
  generatedAt: number;
}

export interface OrchestrationHistoryEntry {
  historyId: string;
  planId: string;
  projectCount: number;
  conflictCount: number;
  recordedAt: number;
}

export interface OrchestrationRuntimeReport {
  projectCount: number;
  planCount: number;
  dependencyCount: number;
  conflictCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const ORCHESTRATION_QUESTION_SIGNALS = [
  'parallel build',
  'orchestration plan',
  'execution groups',
  'orchestration schedule',
  'build orchestration',
] as const;

export function isOrchestrationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return ORCHESTRATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
