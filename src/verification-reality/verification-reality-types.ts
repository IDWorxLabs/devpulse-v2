/**
 * Verification Reality — types (Phase 24A.3).
 * Validator count ≠ proof. Pass tokens ≠ proof.
 */

import type {
  BuildOutputLinkLevel,
  EvidenceChainBreakPoint,
  EvidenceChainLevel,
  PreviewLinkLevel,
  RuntimeLinkLevel,
  VerificationInventoryLevel,
} from './verification-reality-analyzer-types.js';

export {
  VERIFICATION_REALITY_PASS_TOKEN,
  VERIFICATION_REALITY_OWNER_MODULE,
} from './verification-reality-bounds.js';

export type { VerificationEvidenceLevel, EvidenceChainBreakPoint } from './verification-reality-analyzer-types.js';

export interface VerificationRealityEvidence {
  id: string;
  level: 'CLAIMED' | 'OBSERVED' | 'PROVEN';
  description: string;
  source: string;
}

export interface VerificationRealityStage {
  stage: 'INVENTORY' | 'RUNTIME' | 'BUILD_OUTPUT' | 'PREVIEW' | 'EVIDENCE_CHAIN';
  status: 'COMPLETE' | 'PARTIAL' | 'BLOCKED' | 'NOT_STARTED';
  detail: string;
}

export interface VerificationRealityBlocker {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactRank: number;
  explanation: string;
  recommendation: string;
}

export interface VerificationRealityMatrixRow {
  area: string;
  claimed: 'CLAIMED' | 'OBSERVED' | 'PROVEN' | 'NONE';
  observed: 'CLAIMED' | 'OBSERVED' | 'PROVEN' | 'NONE';
  proven: 'CLAIMED' | 'OBSERVED' | 'PROVEN' | 'NONE';
}

export interface VerificationRealitySubscores {
  validationInfrastructure: number;
  runtimeLink: number;
  buildOutputLink: number;
  previewLink: number;
  evidenceChain: number;
}

export interface VerificationAnalyzerResults {
  validationInventory: VerificationInventoryLevel;
  runtimeLink: RuntimeLinkLevel;
  buildOutputLink: BuildOutputLinkLevel;
  previewLink: PreviewLinkLevel;
  evidenceChain: EvidenceChainLevel;
  evidenceChainBreakPoint: EvidenceChainBreakPoint;
}

export interface VerificationModulePresenceEvidence {
  hasFounderTestingMode: boolean;
  hasExecutionRealityEngine: boolean;
  hasVerificationResultsVisibility: boolean;
  hasLivePreviewReality: boolean;
  hasAutonomousBuilderReality: boolean;
  hasValidationBudgetPolicy: boolean;
  hasVerificationRealityModule: boolean;
  validatorScriptCount: number;
  architectureReportCount: number;
  founderTestingConsumesPreview: boolean;
  founderTestingConsumesBuild: boolean;
  verificationResultsLinked: boolean;
}

export interface VerificationWorkspaceSignals {
  executionConnected: boolean;
  world2FoundationComplete: boolean;
  validatorCount: number;
  verificationReadiness: 'ready' | 'partial' | 'idle';
  uvlCheckCount: number;
  previewValidationReady: boolean;
  previewRuntimeActive: boolean;
  previewRealityState: string;
  founderTestingConsumesPreview: boolean;
  founderTestingConsumesBuild: boolean;
  verificationResultsLinked: boolean;
  runtimeDiagnosticsActive: boolean;
  verificationSurfacePresent: boolean;
}

export interface AssessVerificationRealityInput {
  workspace: VerificationWorkspaceSignals;
  moduleEvidence: VerificationModulePresenceEvidence;
}

export interface VerificationRealityReport {
  executiveSummary: string;
  verificationRealityMatrix: VerificationRealityMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  verificationBlockers: string[];
  founderConclusion: string;
  verificationStatus: VerificationInventoryLevel;
  evidenceChainBreakPoint: EvidenceChainBreakPoint;
  markdown: string;
}

export interface VerificationRealityAssessment {
  assessmentId: string;
  verificationRealityScore: number;
  verificationStatus: VerificationInventoryLevel;
  portfolioSubscores: VerificationRealitySubscores;
  analyzers: VerificationAnalyzerResults;
  stages: VerificationRealityStage[];
  evidence: VerificationRealityEvidence[];
  blockers: VerificationRealityBlocker[];
  verificationRealityMatrix: VerificationRealityMatrixRow[];
  evidenceFound: string[];
  missingEvidence: string[];
  verificationBlockers: string[];
  founderConclusion: string;
  evidenceChainBreakPoint: EvidenceChainBreakPoint;
  verificationRealitySummary: string;
  assessedAt: number;
  report: VerificationRealityReport;
}
