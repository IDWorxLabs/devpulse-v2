/**
 * Unified Trust Runtime — types and models.
 */

export const UNIFIED_TRUST_RUNTIME_PASS_TOKEN = 'UNIFIED_TRUST_RUNTIME_V1_PASS';
export const UNIFIED_TRUST_RUNTIME_OWNER_MODULE = 'devpulse_v2_unified_trust_runtime';
export const DEFAULT_MAX_TRUST_RUNTIME_HISTORY_SIZE = 128;

export type TrustSourceId =
  | 'AUTONOMOUS_TESTING'
  | 'AUTONOMOUS_FIXING'
  | 'AUTONOMOUS_VERIFICATION'
  | 'AUTONOMOUS_COMPLETION_ENGINE'
  | 'VERIFICATION_STRATEGY_CORE'
  | 'VERIFICATION_INTELLIGENCE'
  | 'VERIFICATION_INTEGRATION'
  | 'MULTI_PROJECT_VERIFICATION'
  | 'MULTI_PROJECT_MONITORING'
  | 'SELF_EVOLUTION_GOVERNANCE'
  | 'WORLD2'
  | 'TRUST_ENGINE';

export type TrustState =
  | 'UNKNOWN'
  | 'LOW_TRUST'
  | 'MEDIUM_TRUST'
  | 'HIGH_TRUST'
  | 'VERIFIED'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'BLOCKED';

export type TrustSignalStatus = 'ACTIVE' | 'DEGRADED' | 'RECOVERY' | 'BLOCKED' | 'UNKNOWN';

export interface TrustSourceRegistration {
  sourceId: TrustSourceId;
  label: string;
  registeredAt: number;
  active: boolean;
}

export interface RawTrustSignalInput {
  source: TrustSourceId | string;
  confidence?: number;
  risk?: number;
  trustContribution?: number;
  evidenceCount?: number;
  timestamp?: number;
  status?: TrustSignalStatus | string;
}

export interface NormalizedTrustSignal {
  source: TrustSourceId;
  confidence: number;
  risk: number;
  trustContribution: number;
  evidenceCount: number;
  timestamp: number;
  status: TrustSignalStatus;
}

export interface UnifiedTrustAuthority {
  authorityId: string;
  trustState: TrustState;
  overallTrustLevel: number;
  confidence: number;
  risk: number;
  verificationReadiness: number;
  completionReadiness: number;
  governanceReadiness: number;
  signalCount: number;
  participatingSources: TrustSourceId[];
  createdAt: number;
}

export interface TrustRuntimeEvaluation {
  overallTrustLevel: number;
  trustStability: number;
  trustConfidence: number;
  trustVolatility: number;
  trustReadiness: number;
  trustState: TrustState;
}

export interface TrustRuntimeRecord {
  recordId: string;
  authority: UnifiedTrustAuthority;
  evaluation: TrustRuntimeEvaluation;
  createdAt: number;
}

export interface TrustRuntimeHistoryEntry {
  recordId: string;
  trustState: TrustState;
  overallTrustLevel: number;
  signalCount: number;
  recordedAt: number;
}

export interface TrustRuntimeReport {
  trustState: TrustState;
  signalCount: number;
  confidence: number;
  risk: number;
  verificationReadiness: number;
  completionReadiness: number;
  governanceReadiness: number;
  participatingSources: TrustSourceId[];
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  evaluation: TrustRuntimeEvaluation;
}

export interface TrustRuntimeInput {
  requestId: string;
  signals: RawTrustSignalInput[];
}

export interface TrustRuntimeResult {
  record: TrustRuntimeRecord;
  report: TrustRuntimeReport;
}

export interface TrustRuntimeRuntimeReport {
  normalizationCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const TRUST_RUNTIME_QUESTION_SIGNALS = [
  'unified trust runtime',
  'trust authority',
  'trust state',
  'trust readiness',
  'trust runtime',
] as const;

export function isUnifiedTrustRuntimeQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return TRUST_RUNTIME_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
