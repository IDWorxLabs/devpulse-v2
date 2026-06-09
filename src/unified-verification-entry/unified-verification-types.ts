/**
 * DevPulse V2 Phase 16.12 — Unified Verification Entry Point types.
 * Single verification authority surface — no provider execution, trust decisions, or auto-fix.
 */

export const UNIFIED_VERIFICATION_ENTRY_POINT_PASS_TOKEN = 'UNIFIED_VERIFICATION_ENTRY_POINT_V1_PASS';
export const UNIFIED_VERIFICATION_ENTRY_OWNER_MODULE = 'devpulse_v2_unified_verification_entry';

export const INITIAL_VERIFICATION_REQUEST_TYPES = [
  'MANUAL_VERIFICATION',
  'BACKGROUND_VERIFICATION',
  'UVL_VERIFICATION',
  'WORLD2_VERIFICATION',
  'COMPLETION_VERIFICATION',
  'FOUNDER_VERIFICATION',
  'PROJECT_VERIFICATION',
  'WORKSPACE_VERIFICATION',
  'AUTONOMOUS_BUILDER_VERIFICATION',
  'TRUST_ENGINE_VERIFICATION',
] as const;

export const INITIAL_VERIFICATION_SCOPES = [
  'SYSTEM',
  'PROJECT',
  'WORKSPACE',
  'MODULE',
  'SESSION',
  'WORLD2',
  'COMPLETION',
  'UVL',
  'FOUNDER',
] as const;

export type VerificationRequestType = (typeof INITIAL_VERIFICATION_REQUEST_TYPES)[number] | string;

export type VerificationScopeType = (typeof INITIAL_VERIFICATION_SCOPES)[number] | string;

export type VerificationStateType =
  | 'REQUESTED'
  | 'PREPARING'
  | 'READY'
  | 'REPORT_AVAILABLE'
  | 'EVIDENCE_AVAILABLE'
  | 'COMPLETED'
  | 'FAILED';

export type VerificationVisibility = 'PRIVATE' | 'PROJECT' | 'WORKSPACE' | 'PUBLIC';

export type VerificationAuthorityState = 'REGISTERED' | 'READY' | 'BLOCKED' | 'INVALID';

export const FORBIDDEN_UNIFIED_VERIFICATION_DUPLICATES = [
  'auto_fix_engine',
  'trust_engine_decision',
  'uvl_monolith',
  'runtime_brain',
  'verification_monolith',
] as const;

export const UNIFIED_VERIFICATION_QUESTION_SIGNALS = [
  'request verification',
  'verification entry',
  'unified verification',
  'verification request',
  'verification session',
  'verification state',
  'verification history',
  'verification response',
  'what should be verified',
  'who requested verification',
  'verification scope',
  'verification authority',
  'verification complete',
  'verification blocked',
  'why is verification blocked',
] as const;

export interface VerificationOwnership {
  ownerModule: string;
  ownerDomain: string;
  requestedBy: string;
  projectId: string;
  workspaceId: string;
}

export interface VerificationScope {
  scopeId: string;
  scopeType: VerificationScopeType;
  targetIds: string[];
  moduleIds: string[];
  description: string;
}

export interface VerificationContext {
  registryTargetCount: number;
  orchestrationId: string;
  evidenceCount: number;
  reportCount: number;
  historyEntryCount: number;
  orchestrationState: string;
  evidenceAuthorityId: string;
  reportingAuthorityId: string;
  targets: string[];
  blockedTargets: string[];
}

export interface VerificationSession {
  sessionId: string;
  requestId: string;
  sessionType: VerificationRequestType;
  ownerModule: string;
  state: VerificationStateType;
  createdAt: number;
  metadata: Record<string, string | number | boolean>;
  visibility: VerificationVisibility;
  authorityOnly: true;
}

export interface VerificationRequest {
  requestId: string;
  requestType: VerificationRequestType;
  query: string;
  scope: VerificationScope;
  ownership: VerificationOwnership;
  state: VerificationStateType;
  sessionId: string;
  createdAt: number;
  metadata: Record<string, string | number | boolean>;
  authorityOnly: true;
}

export interface VerificationHistoryEntry {
  entryId: string;
  requestId: string;
  sessionId: string;
  event: 'REQUESTED' | 'ROUTED' | 'SCOPE_BUILT' | 'CONTEXT_BUILT' | 'SESSION_CREATED' | 'STATE_UPDATED' | 'RESPONSE_GENERATED' | 'COMPLETED';
  consumer?: string;
  scopeType?: VerificationScopeType;
  timestamp: number;
}

export interface VerificationChain {
  chainId: string;
  requestId: string;
  sessionId: string;
  orchestrationId: string;
  evidenceAuthorityId: string;
  reportingAuthorityId: string;
  evidenceIds: string[];
  reportIds: string[];
}

export interface VerificationDiagnostics {
  issueCount: number;
  warnings: string[];
  issues: Array<{ code: string; message: string; severity: string }>;
}

export interface VerificationResponse {
  request: VerificationRequest;
  scope: VerificationScope;
  context: VerificationContext;
  session: VerificationSession;
  state: VerificationStateType;
  evidenceReferences: string[];
  reportReferences: string[];
  historyReferences: string[];
  diagnostics: VerificationDiagnostics;
  ownership: VerificationOwnership;
  metadata: Record<string, string | number | boolean>;
  chain: VerificationChain;
  responseText: string;
  authorityOnly: true;
}

export interface VerificationAuthorityResult {
  authorityId: string;
  authorityState: VerificationAuthorityState;
  response: VerificationResponse;
  validationValid: boolean;
  blockedReasons: string[];
}

export interface RequestVerificationInput {
  query?: string;
  requestType?: VerificationRequestType;
  scopeType?: VerificationScopeType;
  projectId?: string;
  workspaceId?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  requestedBy?: string;
  suppressRuntimeBootstrap?: boolean;
}

export interface UnifiedVerificationEntryDiagnostics {
  entryAuthorityActive: boolean;
  authorityId: string | null;
  requestCount: number;
  sessionCount: number;
  historyEntryCount: number;
  lastQuery: string | null;
  lastState: VerificationAuthorityState | null;
}

export function isUnifiedVerificationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return UNIFIED_VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isUnifiedVerificationAdvisoryQuestion(question: string): boolean {
  return isUnifiedVerificationQuestion(question);
}

export function isDuplicateUnifiedVerificationQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_UNIFIED_VERIFICATION_DUPLICATES.some((d) => lower.includes(d));
}

export function inferRequestType(query: string): VerificationRequestType {
  const lower = query.toLowerCase();
  if (lower.includes('world2') || lower.includes('world 2')) return 'WORLD2_VERIFICATION';
  if (lower.includes('completion')) return 'COMPLETION_VERIFICATION';
  if (lower.includes('founder')) return 'FOUNDER_VERIFICATION';
  if (lower.includes('uvl') || lower.includes('unified verification lab')) return 'UVL_VERIFICATION';
  if (lower.includes('trust')) return 'TRUST_ENGINE_VERIFICATION';
  if (lower.includes('autonomous') || lower.includes('builder')) return 'AUTONOMOUS_BUILDER_VERIFICATION';
  if (lower.includes('workspace')) return 'WORKSPACE_VERIFICATION';
  if (lower.includes('background')) return 'BACKGROUND_VERIFICATION';
  if (lower.includes('project')) return 'PROJECT_VERIFICATION';
  return 'MANUAL_VERIFICATION';
}

export function inferScopeType(query: string, requestType: VerificationRequestType): VerificationScopeType {
  const lower = query.toLowerCase();
  if (requestType === 'WORLD2_VERIFICATION' || lower.includes('world2')) return 'WORLD2';
  if (requestType === 'COMPLETION_VERIFICATION') return 'COMPLETION';
  if (requestType === 'FOUNDER_VERIFICATION') return 'FOUNDER';
  if (requestType === 'UVL_VERIFICATION') return 'UVL';
  if (lower.includes('session')) return 'SESSION';
  if (lower.includes('module')) return 'MODULE';
  if (lower.includes('workspace')) return 'WORKSPACE';
  if (lower.includes('project')) return 'PROJECT';
  if (lower.includes('system')) return 'SYSTEM';
  return 'PROJECT';
}
