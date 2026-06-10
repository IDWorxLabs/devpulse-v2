/**
 * Autonomous Verification — types and models.
 * Analysis only — no code modification.
 */

import type { AutonomousTestResultStatus } from '../autonomous-testing/autonomous-testing-types.js';
import type { FixReadiness, FixStrategy } from '../autonomous-fixing/autonomous-fixing-types.js';

export const AUTONOMOUS_VERIFICATION_PASS_TOKEN = 'AUTONOMOUS_VERIFICATION_V1_PASS';
export const AUTONOMOUS_VERIFICATION_OWNER_MODULE = 'devpulse_v2_autonomous_verification';
export const MAX_VERIFICATION_HISTORY_SIZE = 64;

export type VerificationDecision =
  | 'VERIFIED'
  | 'NEEDS_FIXING'
  | 'NEEDS_TESTING'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'FOUNDER_REVIEW'
  | 'BLOCKED';

export type VerificationEvidenceType =
  | 'BUILD'
  | 'TEST'
  | 'FIX'
  | 'TRUST'
  | 'WORLD2'
  | 'CLOUD'
  | 'VERIFICATION'
  | 'REGRESSION';

export type VerificationReadiness =
  | 'READY'
  | 'NEEDS_MORE_EVIDENCE'
  | 'HIGH_RISK'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'BLOCKED';

export interface AutonomousVerificationResult {
  id: string;
  decision: VerificationDecision;
  confidence: number;
  trustScore: number;
  riskScore: number;
  evidenceTypes: VerificationEvidenceType[];
  evidenceSummary: string[];
  reasoning: string[];
  generatedAt: number;
}

export interface VerificationInput {
  trustScore: number;
  buildConfidence?: number;
  testingConfidence?: number;
  fixingConfidence?: number;
  verificationConfidence?: number;
  testResultStatus?: AutonomousTestResultStatus;
  fixStrategy?: FixStrategy;
  fixReadiness?: FixReadiness;
  repairCandidates?: string[];
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
  regressionDetected?: boolean;
  testingCoverageSufficient?: boolean;
}

export interface EvidenceAnalysis {
  evidenceTypes: VerificationEvidenceType[];
  evidenceSummary: string[];
  evidenceConfidence: number;
  missingEvidence: string[];
}

export interface VerificationReport {
  reportId: string;
  resultId: string;
  decision: VerificationDecision;
  trustScore: number;
  confidence: number;
  riskScore: number;
  readiness: VerificationReadiness;
  evidenceSummary: string[];
  missingEvidence: string[];
  reasoning: string[];
  generatedAt: number;
}

export interface VerificationHistoryEntry {
  historyId: string;
  resultId: string;
  decision: VerificationDecision;
  readiness: VerificationReadiness;
  recordedAt: number;
}

export interface VerificationRuntimeReport {
  registrySize: number;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const AUTONOMOUS_VERIFICATION_QUESTION_SIGNALS = [
  'autonomous verification',
  'verification decision',
  'trust this result',
  'evidence sufficient',
  'verification confidence',
] as const;

export function isAutonomousVerificationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return AUTONOMOUS_VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
