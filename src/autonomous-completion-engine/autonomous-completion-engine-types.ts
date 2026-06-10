/**
 * Autonomous Completion Engine — types and models.
 * Decision authority only — no code modification.
 */

import type { AutonomousTestResultStatus } from '../autonomous-testing/autonomous-testing-types.js';
import type { FixReadiness, FixStrategy } from '../autonomous-fixing/autonomous-fixing-types.js';
import type { VerificationDecision } from '../autonomous-verification/autonomous-verification-types.js';

export const AUTONOMOUS_COMPLETION_ENGINE_PASS_TOKEN = 'AUTONOMOUS_COMPLETION_ENGINE_V1_PASS';
export const AUTONOMOUS_COMPLETION_ENGINE_OWNER_MODULE = 'devpulse_v2_autonomous_completion_engine';
export const MAX_COMPLETION_HISTORY_SIZE = 64;
export const COMPLETION_LOOP_THRESHOLD = 3;

export type CompletionDecision =
  | 'COMPLETE'
  | 'CONTINUE_TESTING'
  | 'CONTINUE_FIXING'
  | 'CONTINUE_VERIFICATION'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'ESCALATE'
  | 'FOUNDER_REVIEW'
  | 'BLOCKED';

export type CompletionReadiness =
  | 'READY'
  | 'NEEDS_MORE_EVIDENCE'
  | 'HIGH_RISK'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'BLOCKED';

export interface CompletionResult {
  id: string;
  decision: CompletionDecision;
  readiness: CompletionReadiness;
  confidence: number;
  trustScore: number;
  riskScore: number;
  completionScore: number;
  evidenceSummary: string[];
  reasoning: string[];
  generatedAt: number;
}

export interface CompletionInput {
  trustScore: number;
  buildConfidence?: number;
  testingConfidence?: number;
  fixingConfidence?: number;
  verificationConfidence?: number;
  testResultStatus?: AutonomousTestResultStatus;
  fixStrategy?: FixStrategy;
  fixReadiness?: FixReadiness;
  verificationDecision?: VerificationDecision;
  repairCandidates?: string[];
  unresolvedFailures?: boolean;
  evidenceSignals?: string[];
  subsystemTouched?: string[];
  blastRadius?: 'LOCAL' | 'MODULE' | 'SYSTEM' | 'PLATFORM';
  criticalSubsystem?: boolean;
  verificationDisagreement?: boolean;
  repeatFailures?: number;
  world2Active?: boolean;
  cloudTouched?: boolean;
  policyConflict?: boolean;
  governanceBoundary?: boolean;
  missingDependencies?: boolean;
  testingCoverageSufficient?: boolean;
  verificationEvidenceSufficient?: boolean;
  trustRecoveryActive?: boolean;
  testingCycles?: number;
  fixingCycles?: number;
  verificationCycles?: number;
  completionEvaluations?: number;
}

export interface CompletionEvidenceAnalysis {
  evidenceSummary: string[];
  missingEvidence: string[];
  evidenceQualityScore: number;
}

export interface CompletionState {
  stateId: string;
  decision: CompletionDecision;
  readiness: CompletionReadiness;
  confidence: number;
  trustScore: number;
  riskScore: number;
  completionScore: number;
  unresolvedBlockers: string[];
  nextRecommendedAction: string;
  generatedAt: number;
}

export type LoopGuardStatus = 'OK' | 'LOOP_DETECTED';

export interface CompletionLoopGuardResult {
  status: LoopGuardStatus;
  testingCycles: number;
  fixingCycles: number;
  verificationCycles: number;
  completionEvaluations: number;
  reasoning: string[];
}

export interface CompletionReport {
  reportId: string;
  resultId: string;
  decision: CompletionDecision;
  readiness: CompletionReadiness;
  confidence: number;
  trustScore: number;
  riskScore: number;
  completionScore: number;
  evidenceSummary: string[];
  unresolvedBlockers: string[];
  nextRecommendedAction: string;
  loopGuardStatus: LoopGuardStatus;
  reasoning: string[];
  generatedAt: number;
}

export interface CompletionHistoryEntry {
  historyId: string;
  resultId: string;
  decision: CompletionDecision;
  readiness: CompletionReadiness;
  recordedAt: number;
}

export interface CompletionRuntimeReport {
  registrySize: number;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
  loopGuardDetections: number;
}

export const AUTONOMOUS_COMPLETION_QUESTION_SIGNALS = [
  'autonomous completion',
  'task complete',
  'genuinely complete',
  'completion decision',
  'completion readiness',
] as const;

export function isAutonomousCompletionQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return AUTONOMOUS_COMPLETION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
