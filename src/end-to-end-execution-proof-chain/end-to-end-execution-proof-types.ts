/**
 * End-to-End Execution Proof Chain — core models.
 * Build → Runtime → Preview → Verification connected proof only — no execution.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';

export type EndToEndProofState =
  | 'END_TO_END_PROVEN'
  | 'END_TO_END_PARTIALLY_PROVEN'
  | 'END_TO_END_NOT_PROVEN'
  | 'END_TO_END_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface StageProofSummary {
  readOnly: true;
  stage: 'BUILD' | 'RUNTIME' | 'PREVIEW' | 'VERIFICATION';
  state: string;
  score: number;
  proven: boolean;
  connectionId: string;
  sourceAuthority: string;
}

export interface ChainGapEntry {
  readOnly: true;
  gapId: string;
  fromStage: string;
  toStage: string;
  detail: string;
}

export interface ProofArtifactEntry {
  readOnly: true;
  name: string;
  category: string;
  sourceAuthority: string;
  stage: string;
}

export interface ConfidenceFactorEntry {
  readOnly: true;
  factorId: string;
  label: string;
  weight: number;
  detail: string;
  sourceAuthority: string;
}

export interface EndToEndExecutionProofBundle {
  readOnly: true;
  buildProof: StageProofSummary;
  runtimeProof: StageProofSummary;
  previewProof: StageProofSummary;
  verificationProof: StageProofSummary;
  chainCompleteness: number;
  chainGaps: ChainGapEntry[];
  blockingStages: string[];
  warningStages: string[];
  proofArtifacts: ProofArtifactEntry[];
  confidenceFactors: ConfidenceFactorEntry[];
  realExecutionPerformed: false;
}

export interface EndToEndProofQuestionAnswers {
  buildOutputProven: boolean;
  runtimeReadinessProven: boolean;
  previewReadinessProven: boolean;
  verificationReadinessProven: boolean;
  allStagesConnected: boolean;
  allStagesTraceable: boolean;
  allStagesReproducible: boolean;
  founderInspectable: boolean;
  executionConfidenceMeasurable: boolean;
  connectedExecutionProven: boolean;
}

export interface EndToEndExecutionProofInputSnapshot {
  readOnly: true;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  connectedVerificationAssessment: ConnectedVerificationAssessment;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment;
  founderAcceptanceAssessment: FounderAcceptanceAssessment;
  launchCouncilAssessment: LaunchCouncilAssessment;
  missingAuthorities: string[];
}

export interface EndToEndExecutionProofReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  proofChainId: string;
  generatedAt: string;
  connectedExecutionScore: number;
  proofState: EndToEndProofState;
  chainCompletenessPercent: number;
  executionConfidence: number;
  missingChainLinks: string[];
  blockingStages: string[];
  warningStages: string[];
  recommendedNextActions: string[];
  questionAnswers: EndToEndProofQuestionAnswers;
  proofBundle: EndToEndExecutionProofBundle;
  inputSnapshot: EndToEndExecutionProofInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface EndToEndExecutionProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'END_TO_END_PROOF_COMPLETE' | 'END_TO_END_PROOF_FAILED';
  report: EndToEndExecutionProofReport;
}

export interface AssessEndToEndExecutionProofInput {
  rootDir?: string;
  connectedVerificationAssessment?: ConnectedVerificationAssessment;
  executionProofAssessment?: ExecutionProofAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
}

export interface EndToEndExecutionProofHistoryEntry {
  timestamp: string;
  proofChainId: string;
  connectedExecutionScore: number;
  proofState: EndToEndProofState;
  blockerCount: number;
  warningCount: number;
}

export interface EndToEndExecutionProofHistorySummary {
  totalAssessments: number;
  provenChains: number;
  partiallyProvenChains: number;
  notProvenChains: number;
  blockedChains: number;
  insufficientEvidenceChains: number;
}

export interface EndToEndExecutionProofArtifacts {
  endToEndExecutionProofAssessment: EndToEndExecutionProofAssessment;
  endToEndExecutionProofReportMarkdown: string;
}
