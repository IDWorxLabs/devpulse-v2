/**
 * Execution Proof Evolution — core models.
 * Code change ≠ proof. Capability created ≠ proof. Validator pass alone ≠ proof.
 */

export type ExecutionProofEvidenceSource =
  | 'VALIDATOR_RESULT'
  | 'FOUNDER_SIMULATION_RESULT'
  | 'LIVE_PREVIEW_RESULT'
  | 'UI_REALITY_RESULT'
  | 'MOBILE_RUNTIME_RESULT'
  | 'LAUNCH_COUNCIL_RESULT'
  | 'RUNTIME_OBSERVATION'
  | 'BEFORE_AFTER_METRIC'
  | 'MANUAL_FOUNDER_NOTE'
  | 'MISSING_EVIDENCE';

export type ExecutionProofVerdict =
  | 'PROVEN_FIXED'
  | 'PARTIALLY_PROVEN'
  | 'NOT_PROVEN'
  | 'REGRESSION_DETECTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'LOOP_RISK';

export type ExecutionProofConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ExecutionProofFixDisposition = 'KEEP' | 'RETRY' | 'REVERT' | 'ESCALATE';

export interface ExecutionProofProblem {
  problemId: string;
  problemType: string;
  originalFailingSignal: string;
  description: string;
}

export interface ExecutionProofEvidence {
  evidenceId: string;
  source: ExecutionProofEvidenceSource;
  summary: string;
  supportsImprovement: boolean;
  supportsRegression: boolean;
  capturedAt: string;
}

export interface ExecutionProofBeforeAfterSnapshot {
  beforeState: string;
  afterState: string;
  metricBefore: number | null;
  metricAfter: number | null;
  originalFailureStillPresent: boolean;
  regressionObserved: boolean;
}

export interface ExecutionProofAttempt {
  attemptId: string;
  problemId: string;
  claimedFixType: string;
  claimedFixDescription: string;
  snapshot: ExecutionProofBeforeAfterSnapshot;
  evidence: ExecutionProofEvidence[];
  originalFailureRetested: boolean;
  causalLinkToFix: boolean;
}

export interface ExecutionProofScoreBreakdown {
  originalFailureRetested: number;
  beforeAfterEvidence: number;
  independentConfirmation: number;
  noRegression: number;
  causalLink: number;
  reusableMemory: number;
}

export interface ExecutionProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  problem: ExecutionProofProblem;
  attempt: ExecutionProofAttempt;
  executionProofScore: number;
  verdict: ExecutionProofVerdict;
  confidence: ExecutionProofConfidence;
  originalFailureImproved: boolean;
  regressionDetected: boolean;
  proofStrongEnough: boolean;
  fixDisposition: ExecutionProofFixDisposition;
  scoreBreakdown: ExecutionProofScoreBreakdown;
  /** Answers authority questions for founder review. */
  authorityAnswers: {
    originalProblem: string;
    claimedFix: string;
    beforeAfterSummary: string;
    originalFailureGone: boolean;
    causallyTiedToFix: boolean;
    regressionAppeared: boolean;
    proofStrongEnough: boolean;
    recommendedAction: ExecutionProofFixDisposition;
  };
  recommendations: string[];
  cacheKey: string;
}

export interface ExecutionProofEvolutionMemory {
  memoryId: string;
  problemType: string;
  successfulFixType: string | null;
  evidenceThatProved: string[];
  confidence: ExecutionProofConfidence;
  reusableGuidance: string;
  escalationGuidance: string[];
  storedAt: string;
}

export interface ExecutionProofHistorySummary {
  totalProofAttempts: number;
  provenFixes: number;
  partialFixes: number;
  regressions: number;
  loopRisks: number;
  insufficientEvidenceCount: number;
}

export interface ExecutionProofReport {
  generatedAt: string;
  phaseName: string;
  purpose: string;
  assessments: ExecutionProofAssessment[];
  verdictDistribution: Record<ExecutionProofVerdict, number>;
  averageProofScore: number;
  historySummary: ExecutionProofHistorySummary;
  evolutionMemory: ExecutionProofEvolutionMemory[];
  passToken: string;
}

export interface AssessExecutionProofEvolutionInput {
  problem: ExecutionProofProblem;
  attempt: ExecutionProofAttempt;
  /** Count of prior unproven attempts for the same problem (excluding current). */
  priorUnprovenAttemptsForProblem?: number;
}
