/**
 * Verification Integration — types and models.
 * Integration only — no validator execution.
 */

import type { VerificationStrategy } from '../verification-strategy-core/verification-strategy-types.js';
import type { VerificationPlanType } from '../verification-intelligence/verification-plan-types.js';

export const VERIFICATION_INTEGRATION_PASS_TOKEN = 'VERIFICATION_INTEGRATION_V1_PASS';
export const VERIFICATION_INTEGRATION_OWNER_MODULE = 'devpulse_v2_verification_integration';

export const MAX_VERIFICATION_HISTORY_SIZE = 64;

export type VerificationReadinessState =
  | 'READY'
  | 'NEEDS_REVIEW'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'RISK_ESCALATED'
  | 'BLOCKED';

export interface VerificationIntegrationRecord {
  planId: string;
  strategyType: string;
  planType: string;
  confidence: number;
  riskScore: number;
  estimatedCost: number;
  estimatedDurationMs: number;
  executionOrder: string[];
  createdAt: number;
}

export interface VerificationIntegrationSnapshot {
  snapshotId: string;
  records: VerificationIntegrationRecord[];
  generatedAt: number;
}

export interface VerificationPlanReport {
  reportId: string;
  strategy: VerificationStrategy;
  planType: VerificationPlanType;
  confidence: number;
  riskScore: number;
  estimatedDurationMs: number;
  estimatedCost: number;
  requiredValidators: string[];
  optionalValidators: string[];
  executionOrder: string[];
  reasoning: string[];
  generatedAt: number;
}

export interface VerificationVisibilityModel {
  latestPlanId: string | null;
  activeStrategy: VerificationStrategy | null;
  planType: VerificationPlanType | null;
  confidence: number;
  riskScore: number;
  readinessState: VerificationReadinessState;
  registrySize: number;
  generatedAt: number;
}

export interface VerificationReadinessModel {
  planId: string;
  state: VerificationReadinessState;
  confidence: number;
  riskScore: number;
  strategy: VerificationStrategy;
  planType: VerificationPlanType;
  reasons: string[];
  evaluatedAt: number;
}

export interface VerificationHistoryEntry {
  historyId: string;
  planId: string;
  strategy: VerificationStrategy;
  planType: VerificationPlanType;
  readinessState: VerificationReadinessState;
  visibilityState: VerificationReadinessState;
  recordedAt: number;
}

export interface VerificationIntegrationRuntimeReport {
  registrySize: number;
  historySize: number;
  snapshotCount: number;
  readinessEvaluations: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const VERIFICATION_INTEGRATION_QUESTION_SIGNALS = [
  'verification integration',
  'verification readiness',
  'verification visibility',
  'verification snapshot',
  'verification planning state',
] as const;

export function isVerificationIntegrationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return VERIFICATION_INTEGRATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
