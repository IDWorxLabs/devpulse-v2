/**
 * DevPulse V2 Phase 16.7 — Unified Verification Lab Runtime types.
 * Provider registration and session lifecycle only — no verification execution.
 */

export const UNIFIED_VERIFICATION_LAB_RUNTIME_PASS_TOKEN = 'UNIFIED_VERIFICATION_LAB_RUNTIME_V1_PASS';
export const UNIFIED_VERIFICATION_LAB_RUNTIME_OWNER_MODULE = 'devpulse_v2_unified_verification_lab_runtime';

export type VerificationProviderType =
  | 'WORLD2_VERIFICATION'
  | 'PREVIEW_VERIFICATION'
  | 'SELF_VISION_VERIFICATION'
  | 'UI_INSPECTION_VERIFICATION'
  | 'INTERACTION_VERIFICATION'
  | 'VISUAL_VERIFICATION'
  | 'RUNTIME_VERIFICATION';

export type VerificationProviderStatus = 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type VerificationSessionState =
  | 'REGISTERED'
  | 'WAITING'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED';

export type VerificationRuntimeState = 'REGISTERED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'BLOCKED';

export const INITIAL_VERIFICATION_PROVIDER_TYPES: readonly VerificationProviderType[] = [
  'WORLD2_VERIFICATION',
  'PREVIEW_VERIFICATION',
  'SELF_VISION_VERIFICATION',
  'UI_INSPECTION_VERIFICATION',
  'INTERACTION_VERIFICATION',
  'VISUAL_VERIFICATION',
  'RUNTIME_VERIFICATION',
] as const;

export const ALL_VERIFICATION_SESSION_STATES: readonly VerificationSessionState[] = [
  'REGISTERED',
  'WAITING',
  'READY',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'BLOCKED',
] as const;

export const FORBIDDEN_UVL_RUNTIME_DUPLICATES = [
  'verification_orchestrator',
  'verification_registry',
  'verification_evidence_engine',
  'verification_reporting_engine',
  'auto_fix_engine',
  'uvl_monolith',
  'runtime_brain',
] as const;

export const UVL_RUNTIME_QUESTION_SIGNALS = [
  'what verification providers exist',
  'what verification sessions exist',
  'what verification runtime exists',
  'what verification capabilities exist',
  'why is verification blocked',
  'uvl runtime',
  'unified verification lab',
  'verification runtime',
  'verification providers',
  'verification sessions',
  'verification lab runtime',
] as const;

export interface VerificationProvider {
  providerId: string;
  providerName: string;
  providerType: VerificationProviderType;
  ownerModule: string;
  supportedVerifications: string[];
  status: VerificationProviderStatus;
  createdAt: number;
  registrationOnly: true;
}

export interface VerificationSession {
  verificationSessionId: string;
  providerId: string;
  verificationType: VerificationProviderType;
  sessionState: VerificationSessionState;
  startedAt: number | null;
  completedAt: number | null;
  warnings: string[];
  blockedReasons: string[];
  lifecycleOnly: true;
}

export interface VerificationRuntimeReport {
  reportId: string;
  runtimeState: VerificationRuntimeState;
  providerCount: number;
  sessionCount: number;
  registeredProviders: VerificationProvider[];
  verificationSessions: VerificationSession[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  runtimeOnly: true;
}

export interface VerificationRuntimeDiagnostics {
  uvlRuntimeActive: boolean;
  providerCount: number;
  sessionCount: number;
  completedSessionCount: number;
  blockedSessionCount: number;
  lastQuery: string | null;
  lastState: VerificationRuntimeState | null;
}

export interface PrepareVerificationRuntimeInput {
  query?: string;
  projectId?: string;
  workspaceId?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface PrepareVerificationRuntimeResult {
  runtimeReport: VerificationRuntimeReport;
  diagnostics: VerificationRuntimeDiagnostics;
  registeredProviders: VerificationProvider[];
  verificationSessions: VerificationSession[];
  responseText: string;
}

export function isUvlRuntimeQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return UVL_RUNTIME_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isUvlRuntimeAdvisoryQuestion(question: string): boolean {
  return isUvlRuntimeQuestion(question);
}

export function isDuplicateUvlRuntimeQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_UVL_RUNTIME_DUPLICATES.some((d) => lower.includes(d));
}
