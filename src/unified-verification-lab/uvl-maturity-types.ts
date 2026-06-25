/**
 * UVL Maturity & Verification Hub V1 — types.
 */

export type VerificationCoverageCategory =
  | 'Structure'
  | 'Visual'
  | 'Feature'
  | 'Engineering'
  | 'Requirement'
  | 'Launch';

export type VerificationTimelineStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type VerificationGapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface VerificationCoverageRow {
  readOnly: true;
  category: VerificationCoverageCategory;
  coveragePercent: number;
  confidencePercent: number;
  status: 'Complete' | 'Partial' | 'Missing';
  missingAreas: readonly string[];
}

export interface VerificationTimelineEntry {
  readOnly: true;
  stepId: string;
  label: string;
  status: VerificationTimelineStatus;
  ran: boolean;
  passed: boolean;
  pending: boolean;
  detail: string;
}

export interface VerificationGap {
  readOnly: true;
  gapId: string;
  category: VerificationCoverageCategory | 'General';
  summary: string;
  severity: VerificationGapSeverity;
  critical: boolean;
}

export interface VerificationGapReport {
  readOnly: true;
  gaps: readonly VerificationGap[];
  gapSummary: readonly string[];
  criticalGapCount: number;
  missingVerificationAreas: readonly string[];
}

export interface UvlMaturityHistoryEntry {
  readOnly: true;
  runId: string;
  profile: string;
  productName: string;
  overallCoveragePercent: number;
  verificationConfidenceScore: number;
  result: 'SUFFICIENT' | 'INSUFFICIENT' | 'PARTIAL';
  timestamp: string;
}

export interface UvlMaturityAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Unified Verification Lab';
  profile: string;
  productName: string;
  productPrompt: string;
  overallCoveragePercent: number;
  verificationConfidenceScore: number;
  categoryCoverage: readonly VerificationCoverageRow[];
  missingVerificationAreas: readonly string[];
  verificationGapReport: VerificationGapReport;
  timeline: readonly VerificationTimelineEntry[];
  verificationSufficientForLaunch: boolean;
  incompleteVerification: boolean;
  verificationConfidencePenalty: number;
  generatedAt: string;
}

export interface AssessUvlMaturityInput {
  profile?: string;
  productPrompt?: string;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
  /** Optional build-proof materialization handoff from AIDEVENGINE_BUILD_PROOF_V1_2. */
  buildProofHandoff?: import('../aidevengine-build-proof-v1-2/launch-evidence-handoff-types.js').BuildProofMaterializationHandoff | null;
}
