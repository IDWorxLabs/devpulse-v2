/**
 * Multi Project Verification Orchestration — types and models.
 * Planning only — no execution.
 */

import type { ProjectVerificationStatus } from '../multi-project-verification/multi-project-verification-types.js';

export const MULTI_PROJECT_VERIFICATION_ORCHESTRATION_PASS_TOKEN =
  'MULTI_PROJECT_VERIFICATION_ORCHESTRATION_V1_PASS';
export const MULTI_PROJECT_VERIFICATION_ORCHESTRATION_OWNER_MODULE =
  'devpulse_v2_multi_project_verification_orchestration';
export const DEFAULT_MAX_VERIFICATION_ORCHESTRATION_HISTORY_SIZE = 128;
export const MAX_VERIFICATION_DEPENDENCY_CHAIN_DEPTH = 64;

export type VerificationOrchestrationStatus =
  | 'READY'
  | 'WAITING'
  | 'BLOCKED'
  | 'DEPENDENCY_BLOCKED'
  | 'CAPACITY_BLOCKED';

export interface VerificationGroup {
  groupId: string;
  projectIds: string[];
  status: VerificationOrchestrationStatus;
}

export interface VerificationOrchestrationPlan {
  planId: string;
  groups: VerificationGroup[];
  readyProjects: string[];
  waitingProjects: string[];
  blockedProjects: string[];
  dependencyChains: string[][];
  estimatedVerificationParallelism: number;
  generatedAt: number;
}

export interface VerificationOrchestrationProjectInput {
  projectId: string;
  workspaceId: string;
  verificationStatus?: ProjectVerificationStatus;
  confidence?: number;
  riskScore?: number;
  verificationReady?: boolean;
  dependsOn?: string[];
  resourceAvailable?: boolean;
  isolationOk?: boolean;
  orchestrationReady?: boolean;
  priority?: string;
}

export interface VerificationConflict {
  conflictId: string;
  conflictType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detail: string;
  recommendedAction: string;
  projectIds: string[];
}

export interface VerificationCapacityEvaluation {
  estimatedParallelism: number;
  bottlenecks: string[];
  safeLimit: number;
}

export interface VerificationOrchestrationReport {
  reportId: string;
  planId: string;
  projectCount: number;
  groups: VerificationGroup[];
  dependencyChains: string[][];
  readyProjects: string[];
  waitingProjects: string[];
  blockedProjects: string[];
  conflicts: VerificationConflict[];
  bottlenecks: string[];
  estimatedParallelism: number;
  recommendations: string[];
  generatedAt: number;
}

export interface VerificationOrchestrationHistoryEntry {
  historyId: string;
  planId: string;
  projectCount: number;
  conflictCount: number;
  recordedAt: number;
}

export interface VerificationOrchestrationRuntimeReport {
  projectCount: number;
  planCount: number;
  dependencyCount: number;
  conflictCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const VERIFICATION_ORCHESTRATION_QUESTION_SIGNALS = [
  'verification orchestration',
  'verification groups',
  'portfolio verification schedule',
  'verification dependency',
  'multi project verification orchestration',
] as const;

export function isVerificationOrchestrationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return VERIFICATION_ORCHESTRATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
