/**
 * Autonomous Founder Launch Authority V1 — types.
 * Evidence-backed senior review team — does not perform low-level testing.
 */

export type FounderLaunchVerdict =
  | 'LAUNCH_READY'
  | 'LAUNCH_READY_WITH_WARNINGS'
  | 'NEEDS_AUTOFIX'
  | 'NOT_LAUNCH_READY'
  | 'NEEDS_HUMAN_REVIEW';

export type FounderReviewerRole =
  | 'senior-engineer'
  | 'qa'
  | 'ux'
  | 'product'
  | 'launch'
  | 'founder';

export type FounderLaunchUserPhase =
  | 'BUILDING'
  | 'TESTING'
  | 'FIXING_ISSUES'
  | 'FINAL_LAUNCH_REVIEW'
  | 'LAUNCH_READY'
  | 'LAUNCH_NOT_READY';

export interface FounderEvidenceSource {
  readOnly: true;
  sourceId: string;
  sourceName: string;
  available: boolean;
  passed: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  findings: string[];
}

export interface FounderEvidenceSnapshot {
  readOnly: true;
  buildReality: FounderEvidenceSource;
  blueprintStructure: FounderEvidenceSource;
  blueprintVisual: FounderEvidenceSource;
  featureReality: FounderEvidenceSource;
  universalFeatureContract: FounderEvidenceSource;
  engineeringReality: FounderEvidenceSource;
  launchReadiness: FounderEvidenceSource;
  promptFaithfulness: FounderEvidenceSource | null;
  capabilityPlanning: FounderEvidenceSource | null;
  incrementalBuild: FounderEvidenceSource | null;
  behaviorSimulation: FounderEvidenceSource | null;
  virtualUserSimulation: FounderEvidenceSource | null;
  virtualDeviceLaboratory: FounderEvidenceSource | null;
  interactionProof: FounderEvidenceSource | null;
  autonomousDebugging: FounderEvidenceSource | null;
  continuousProductImprovement: FounderEvidenceSource | null;
  requirementDiscovery: FounderRequirementDiscoveryEvidence | null;
  verificationHub: FounderVerificationHubEvidence | null;
  productArchitecture: FounderProductArchitectureEvidence | null;
  allPrerequisitesPassed: boolean;
  missingPrerequisites: string[];
}

export interface FounderRequirementDiscoveryEvidence {
  readOnly: true;
  requirementConfidenceScore: number;
  coverageMatrix: readonly { category: string; status: string }[];
  gapSummary: readonly string[];
  poorlyUnderstood: boolean;
  canProceedToPlanning: boolean;
}

export interface FounderVerificationHubEvidence {
  readOnly: true;
  overallCoveragePercent: number;
  verificationConfidenceScore: number;
  gapSummary: readonly string[];
  missingVerificationAreas: readonly string[];
  incompleteVerification: boolean;
  verificationSufficientForLaunch: boolean;
  verificationConfidencePenalty: number;
}

export interface FounderProductArchitectureEvidence {
  readOnly: true;
  productReadinessScore: number;
  architectureScore: number;
  workflowCompletenessScore: number;
  userJourneyScore: number;
  screenCoverageScore: number;
  readinessLabel: string;
  criticalProductGapCount: number;
  gapSummary: readonly string[];
  missingScreens: readonly string[];
  missingWorkflows: readonly string[];
  architecturallyIncomplete: boolean;
  productArchitecturePenalty: number;
  cqiRootCause: string | null;
}

export interface FounderReviewerAssessment {
  readOnly: true;
  role: FounderReviewerRole;
  reviewerName: string;
  score: number;
  findings: string[];
  risks: string[];
  founderConfidence?: number;
}

export interface FounderLaunchScores {
  seniorEngineeringScore: number;
  qaScore: number;
  uxScore: number;
  productScore: number;
  launchScore: number;
  founderScore: number;
  overallFounderScore: number;
}

export interface FounderRemediationIssue {
  readOnly: true;
  issueId: string;
  sourceReviewer: FounderReviewerRole;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  evidenceSource: string;
  recommendedFix: string;
  autofixEligible: boolean;
}

export interface FounderRemediationPlan {
  readOnly: true;
  planId: string;
  generatedAt: string;
  verdict: 'NEEDS_AUTOFIX';
  issues: FounderRemediationIssue[];
  autofixPipelineTarget: 'AutoFix Pipeline';
  maxRetries: number;
  retryAttempt: number;
}

export interface LaunchDecisionExplainability {
  readOnly: true;
  decisionSummary: string;
  topPositiveSignals: readonly string[];
  topRisks: readonly string[];
  reasonForVerdict: string;
}

export interface AutonomousFounderLaunchAssessment {
  readOnly: true;
  advisoryOnly: true;
  passed: boolean;
  verdict: FounderLaunchVerdict;
  passToken: string;
  scores: FounderLaunchScores;
  reviewers: FounderReviewerAssessment[];
  evidence: FounderEvidenceSnapshot;
  remediationPlan: FounderRemediationPlan | null;
  blocksLaunch: boolean;
  blocksLaunchReason: string | null;
  blockingRules: readonly string[];
  userPhase: FounderLaunchUserPhase;
  userLabel: string;
  contractId: string | null;
  productName: string | null;
  generatedAt: string;
  reportMarkdown: string;
  launchDecisionExplainability: LaunchDecisionExplainability;
}

export interface RunAutonomousFounderLaunchAuthorityInput {
  contractId?: string | null;
  productName?: string | null;
  workspaceDir?: string | null;
  previewUrl?: string | null;
  buildReality?: FounderEvidenceSource | null;
  blueprintStructure?: FounderEvidenceSource | null;
  maxAutofixRetries?: number;
  skipAutofix?: boolean;
  projectRootDir?: string | null;
  productPrompt?: string | null;
  profile?: string | null;
  useRegisteredProductArchitecture?: boolean;
  useRegisteredVerificationHub?: boolean;
  onUserPhase?: (phase: FounderLaunchUserPhase, label: string) => void;
}

export interface RunAiDevEngineEvidencePipelineInput {
  projectRootDir: string;
  workspaceDir: string;
  contractId: string;
  productName: string;
  previewUrl: string;
  navLabel: string;
  rawPrompt: string;
  playwrightReady?: boolean;
}
