/**
 * Connected Verification Execution Proof — verification evidence models.
 * Read-only — no synthetic verification claims; bounded fixture evidence only.
 */

import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';

export type VerificationProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export type VerificationExecutionState =
  | 'NOT_RUN'
  | 'RUN_STARTED'
  | 'RUN_COMPLETED'
  | 'RESULTS_OBSERVED'
  | 'EVIDENCED'
  | 'READY';

export type VerificationRunState = 'NOT_OBSERVED' | 'STARTED' | 'COMPLETED' | 'FAILED';

export type VerificationTargetState = 'NOT_OBSERVED' | 'PARTIAL' | 'LINKED';

export type VerificationResultState = 'NOT_OBSERVED' | 'PASS' | 'FAIL' | 'PARTIAL' | 'UNKNOWN';

export type VerificationEvidenceState = 'NOT_OBSERVED' | 'PARTIAL' | 'EVIDENCED';

export type VerificationReadinessState =
  | 'VERIFICATION_NOT_RUN'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_PARTIAL'
  | 'VERIFICATION_PASSED';

export type VerificationFailureSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface VerificationRunAssessment {
  readOnly: true;
  runState: VerificationRunState;
  runObserved: boolean;
  runId: string | null;
  status: string | null;
  startedAt: string | null;
  completedAt: string | null;
  executor: string | null;
  command: string | null;
  scope: string | null;
  confidence: number;
}

export interface VerificationTargetAssessment {
  readOnly: true;
  targetState: VerificationTargetState;
  targetObserved: boolean;
  targetType: string | null;
  targetLinkedToRuntime: boolean;
  targetLinkedToPreview: boolean;
  targetLinkedToBuild: boolean;
  targetUrl: string | null;
  targetWorkspace: string | null;
  artifactIds: string[];
  confidence: number;
}

export interface VerificationResultAssessment {
  readOnly: true;
  resultState: VerificationResultState;
  resultsObserved: boolean;
  passCount: number;
  failCount: number;
  warningCount: number;
  skippedCount: number;
  status: string | null;
  score: number | null;
  summary: string | null;
  confidence: number;
}

export interface VerificationEvidenceAssessment {
  readOnly: true;
  evidenceState: VerificationEvidenceState;
  evidenceObserved: boolean;
  evidenceTypes: string[];
  evidencePaths: string[];
  evidenceCount: number;
  confidence: number;
}

export interface VerificationFailureEntry {
  readOnly: true;
  failureId: string;
  severity: VerificationFailureSeverity;
  message: string;
  source: string;
  affectedStage: string;
  recommendedFix: string;
}

export interface VerificationFailureAnalysis {
  readOnly: true;
  failures: VerificationFailureEntry[];
  criticalCount: number;
  highCount: number;
}

export interface VerificationReadinessAssessment {
  readOnly: true;
  readinessState: VerificationReadinessState;
  founderSummary: string;
  canProceed: boolean;
  blockingReasons: string[];
  nextActions: string[];
}

export interface VerificationManifestAssessment {
  readOnly: true;
  manifestExists: boolean;
  contractLinked: boolean;
  buildLinked: boolean;
  runtimeLinked: boolean;
  previewLinked: boolean;
  verificationLinked: boolean;
  traceabilityScore: number;
}

export interface VerificationLinkageAnalysis {
  readOnly: true;
  verificationLinkageConnected: boolean;
  firstBrokenVerificationLink: string | null;
  missingLinks: string[];
  traceabilityScore: number;
  contractToWorkspace: boolean;
  workspaceToRuntime: boolean;
  runtimeToPreview: boolean;
  previewToVerificationRun: boolean;
  verificationRunToResults: boolean;
  resultsToEvidence: boolean;
}

export interface VerificationExecutionFounderQuestions {
  readOnly: true;
  canVerificationBeTrusted: boolean;
  wasGeneratedAppVerified: boolean;
  whatPassed: string[];
  whatFailed: string[];
  whatEvidenceExists: string[];
  whatEvidenceMissing: string[];
  whatShouldBeBuiltNext: string[];
}

export interface VerificationExecutionProofReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  verificationProofLevel: VerificationProofLevel;
  verificationState: VerificationExecutionState;
  previewExperienceProven: boolean;
  run: VerificationRunAssessment;
  target: VerificationTargetAssessment;
  results: VerificationResultAssessment;
  evidence: VerificationEvidenceAssessment;
  failures: VerificationFailureAnalysis;
  readiness: VerificationReadinessAssessment;
  manifest: VerificationManifestAssessment;
  linkage: VerificationLinkageAnalysis;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  founderQuestions: VerificationExecutionFounderQuestions;
  cacheKey: string;
}

export interface VerificationExecutionProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'VERIFICATION_EXECUTION_PROOF_COMPLETE' | 'VERIFICATION_EXECUTION_PROOF_FAILED';
  report: VerificationExecutionProofReport;
}

/** Injectable bounded verification evidence for validation fixtures. */
export interface VerificationEvidenceFixture {
  verificationRunId?: string;
  runStatus?: VerificationRunState;
  startedAt?: string;
  completedAt?: string;
  executor?: string;
  command?: string;
  scope?: string;
  contractId?: string;
  workspaceId?: string;
  runtimeSessionId?: string;
  previewSessionId?: string;
  previewUrl?: string;
  artifactIds?: string[];
  targetLinkedToRuntime?: boolean;
  targetLinkedToPreview?: boolean;
  targetLinkedToBuild?: boolean;
  passCount?: number;
  failCount?: number;
  warningCount?: number;
  skippedCount?: number;
  resultStatus?: VerificationResultState;
  score?: number;
  summary?: string;
  evidencePaths?: string[];
  evidenceTypes?: string[];
  testLogs?: string[];
  failures?: Array<{
    failureId: string;
    severity: VerificationFailureSeverity;
    message: string;
    source: string;
    affectedStage: string;
    recommendedFix: string;
  }>;
}

export interface AssessConnectedVerificationExecutionProofInput {
  rootDir?: string;
  previewExperienceProof?: PreviewExperienceProofReport | null;
  verificationEvidenceFixture?: VerificationEvidenceFixture;
}

export interface VerificationExecutionProofHistoryEntry {
  timestamp: string;
  assessmentId: string;
  verificationProofLevel: VerificationProofLevel;
  verificationState: VerificationExecutionState;
  verificationLinkageConnected: boolean;
}

export interface VerificationExecutionProofHistorySummary {
  totalAssessments: number;
  provenVerifications: number;
  partialVerifications: number;
  notProvenVerifications: number;
}

export interface VerificationExecutionProofArtifacts {
  verificationExecutionProofAssessment: VerificationExecutionProofAssessment;
  verificationExecutionProofReportMarkdown: string;
}
