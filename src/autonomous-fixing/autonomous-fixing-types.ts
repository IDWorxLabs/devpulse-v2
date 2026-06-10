/**
 * Autonomous Fixing — types and models.
 * Planning only — no code modification.
 */

import type { AutonomousTestResultStatus } from '../autonomous-testing/autonomous-testing-types.js';

export const AUTONOMOUS_FIXING_PASS_TOKEN = 'AUTONOMOUS_FIXING_V1_PASS';
export const AUTONOMOUS_FIXING_OWNER_MODULE = 'devpulse_v2_autonomous_fixing';
export const MAX_FIX_HISTORY_SIZE = 64;

export type FixStrategy =
  | 'RETRY'
  | 'REPAIR'
  | 'REGENERATE'
  | 'ROLLBACK'
  | 'TRUST_RECOVERY'
  | 'ESCALATE'
  | 'FOUNDER_REVIEW';

export type FailureCategory =
  | 'BUILD'
  | 'TYPECHECK'
  | 'TEST'
  | 'VERIFICATION'
  | 'TRUST'
  | 'RUNTIME'
  | 'ROUTING'
  | 'BRAIN'
  | 'WORLD2'
  | 'CLOUD'
  | 'UNKNOWN';

export type FixReadiness =
  | 'READY'
  | 'NEEDS_MORE_CONTEXT'
  | 'HIGH_RISK'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'ESCALATED'
  | 'BLOCKED';

export interface FixPlan {
  id: string;
  failureCategory: FailureCategory;
  strategy: FixStrategy;
  confidence: number;
  riskScore: number;
  readiness: FixReadiness;
  rootCauseCandidates: string[];
  repairCandidates: string[];
  rollbackRequired: boolean;
  reasoning: string[];
  generatedAt: number;
}

export interface FixPlanInput {
  failureSignals: string[];
  subsystemTouched?: string[];
  trustScore: number;
  verificationConfidence?: number;
  testingConfidence?: number;
  testResultStatus?: AutonomousTestResultStatus;
  repeatFailures?: number;
  blastRadius?: 'LOCAL' | 'MODULE' | 'SYSTEM' | 'PLATFORM';
  criticalSubsystem?: boolean;
  verificationDisagreement?: boolean;
  world2Active?: boolean;
  cloudTouched?: boolean;
  transientFailure?: boolean;
  policyConflict?: boolean;
  governanceBoundary?: boolean;
}

export interface RootCauseAnalysis {
  probableCauses: string[];
  confidence: number;
  affectedSystems: string[];
  blastRadius: string;
}

export interface RepairCandidate {
  description: string;
  targetedSubsystems: string[];
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedConfidence: number;
}

export interface RollbackPlan {
  rollbackRequired: boolean;
  scope: 'NONE' | 'LOCALIZED' | 'SUBSYSTEM' | 'RELEASE' | 'WORLD2_WORKSPACE';
  confidence: number;
  risk: number;
  reasoning: string[];
}

export interface FixReport {
  reportId: string;
  planId: string;
  failureCategory: FailureCategory;
  strategy: FixStrategy;
  confidence: number;
  riskScore: number;
  readiness: FixReadiness;
  rootCauses: string[];
  repairCandidates: string[];
  rollbackRequired: boolean;
  rollbackScope: string;
  reasoning: string[];
  generatedAt: number;
}

export interface FixHistoryEntry {
  historyId: string;
  planId: string;
  failureCategory: FailureCategory;
  strategy: FixStrategy;
  readiness: FixReadiness;
  recordedAt: number;
}

export interface FixRuntimeReport {
  registrySize: number;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const AUTONOMOUS_FIXING_QUESTION_SIGNALS = [
  'autonomous fixing',
  'fix plan',
  'root cause',
  'repair strategy',
  'rollback plan',
] as const;

export function isAutonomousFixingQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return AUTONOMOUS_FIXING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
