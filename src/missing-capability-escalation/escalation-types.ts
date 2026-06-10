/**
 * Missing Capability Escalation — types and models.
 * Analysis and escalation only — no capability creation.
 */

export const MISSING_CAPABILITY_ESCALATION_PASS_TOKEN = 'MISSING_CAPABILITY_ESCALATION_V1_PASS';
export const MISSING_CAPABILITY_ESCALATION_OWNER_MODULE = 'devpulse_v2_missing_capability_escalation';
export const DEFAULT_MAX_ESCALATION_HISTORY_SIZE = 128;
export const DEFAULT_FAILURE_THRESHOLD = 3;
export const DEFAULT_STALL_THRESHOLD_MS = 30 * 60 * 1000;

export type EscalationTrigger =
  | 'REPEATED_FAILURE'
  | 'REPEATED_STALL'
  | 'REPEATED_BOTTLENECK'
  | 'REPEATED_BLOCKED_STATE'
  | 'MISSING_CAPABILITY_SUSPECTED';

export type EscalationDecision =
  | 'NO_ESCALATION'
  | 'INVESTIGATE'
  | 'CAPABILITY_GAP_DETECTED'
  | 'RESEARCH_REQUIRED'
  | 'FOUNDER_REVIEW';

export interface CapabilityEscalationRecord {
  escalationId: string;
  trigger: EscalationTrigger;
  decision: EscalationDecision;
  confidence: number;
  createdAt: number;
}

export interface FailureEvent {
  failureId: string;
  subsystem: string;
  message: string;
  timestamp: number;
}

export interface FailurePatternResult {
  detected: boolean;
  pattern: string;
  frequency: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StallEvent {
  stallId: string;
  expectedDurationMs: number;
  actualDurationMs: number;
  progressVelocity: number;
  stateUnchanged: boolean;
  timestamp: number;
}

export interface StallPatternResult {
  stallDetected: boolean;
  stallEscalationRequired: boolean;
  stallDurationMs: number;
  progressVelocity: number;
  frequency: number;
}

export interface BottleneckEvent {
  bottleneckId: string;
  bottleneckType: string;
  subsystem: string;
  timestamp: number;
}

export interface BottleneckPatternResult {
  detected: boolean;
  bottleneckType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frequency: number;
  confidence: number;
}

export interface BlockedStateEvent {
  stateId: string;
  state: string;
  durationMs: number;
  timestamp: number;
}

export interface BlockedStatePatternResult {
  detected: boolean;
  blockedFrequency: number;
  blockedDurationMs: number;
  loopDetected: boolean;
}

export type CapabilityGapRootCause =
  | 'MISSING_CAPABILITY'
  | 'EXISTING_CAPABILITY_MALFUNCTION'
  | 'RUNTIME_BOTTLENECK'
  | 'RESOURCE_ISSUE';

export interface CapabilityGapAnalysis {
  rootCause: CapabilityGapRootCause;
  confidence: number;
  candidateDomains: string[];
}

export interface EscalationInput {
  projectId?: string;
  failures?: FailureEvent[];
  stalls?: StallEvent[];
  bottlenecks?: BottleneckEvent[];
  blockedStates?: BlockedStateEvent[];
  missingCapabilitySignals?: string[];
}

export interface EscalationReport {
  reportId: string;
  escalationId: string;
  trigger: EscalationTrigger;
  decision: EscalationDecision;
  confidence: number;
  rootCauseCandidates: CapabilityGapRootCause[];
  recommendedAction: string;
  failurePattern?: FailurePatternResult;
  stallPattern?: StallPatternResult;
  bottleneckPattern?: BottleneckPatternResult;
  blockedPattern?: BlockedStatePatternResult;
  gapAnalysis?: CapabilityGapAnalysis;
  generatedAt: number;
}

export interface EscalationHistoryEntry {
  historyId: string;
  escalationId: string;
  trigger: EscalationTrigger;
  decision: EscalationDecision;
  recordedAt: number;
}

export interface EscalationRuntimeReport {
  failurePatternCount: number;
  stallPatternCount: number;
  bottleneckPatternCount: number;
  blockedPatternCount: number;
  escalationCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const ESCALATION_QUESTION_SIGNALS = [
  'missing capability escalation',
  'capability gap',
  'repeated stall',
  'repeated failure',
  'self evolving devpulse',
] as const;

export function isEscalationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return ESCALATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
