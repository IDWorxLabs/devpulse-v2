/**
 * Connected Verification Foundation — core models.
 * Preview Readiness → Verification Readiness bridge only — no verification execution.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ExecutionPackageRuntimeReport } from '../execution-runtime/types.js';
import type { ExecutionVerificationReport } from '../execution-verification/types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { VerificationRealityAssessment } from '../verification-reality/verification-reality-types.js';
import type { World2ChangeSetMaterializerAssessment } from '../world2-change-set-materializer/world2-change-set-materializer-types.js';
import type { World2DryRunExecutionVerificationAssessment } from '../world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-types.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';

export type VerificationState =
  | 'VERIFICATION_READY'
  | 'VERIFICATION_READY_WITH_WARNINGS'
  | 'VERIFICATION_NOT_READY'
  | 'VERIFICATION_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export interface VerificationReadinessEntry {
  readOnly: true;
  entryId: string;
  label: string;
  sourceAuthority: string;
  detail: string;
}

export interface VerificationReadinessArtifactEntry {
  readOnly: true;
  name: string;
  path: string | null;
  category: string;
  sourceAuthority: string;
}

export interface VerificationCandidate {
  readOnly: true;
  candidateId: string;
  workspaceId: string;
  previewReadinessContractId: string;
  verificationType: string;
  verificationPath: string | null;
  modeledOnly: true;
  realVerificationExecutionPerformed: false;
}

export interface VerificationReadinessContract {
  readOnly: true;
  contractId: string;
  workspaceId: string;
  verificationType: string;
  verificationRequirements: VerificationReadinessEntry[];
  verificationArtifacts: VerificationReadinessArtifactEntry[];
  verificationDependencies: VerificationReadinessEntry[];
  verificationSteps: VerificationReadinessEntry[];
  verificationCoverage: VerificationReadinessEntry[];
  rollbackRequirements: VerificationReadinessEntry[];
  proofArtifacts: VerificationReadinessArtifactEntry[];
  realVerificationExecutionPerformed: false;
}

export interface VerificationReadinessQuestionAnswers {
  previewReadinessExists: boolean;
  verificationCandidateExists: boolean;
  verificationPathExists: boolean;
  verificationDependenciesKnown: boolean;
  verificationActivationDescribable: boolean;
  verificationReproducible: boolean;
  verificationTraceable: boolean;
  founderInspectable: boolean;
  verificationReadinessMeasurable: boolean;
  verificationReadinessProven: boolean;
}

export interface ConnectedVerificationInputSnapshot {
  readOnly: true;
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  verificationRealityAssessment: VerificationRealityAssessment;
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment;
  executionEngineAssessment: World2ExecutionEngineAssessment;
  changeSetMaterializerAssessment: World2ChangeSetMaterializerAssessment;
  dryRunVerifierAssessment: World2DryRunExecutionVerificationAssessment;
  executionPackageRuntimeReport: ExecutionPackageRuntimeReport;
  executionVerificationReport: ExecutionVerificationReport;
  missingAuthorities: string[];
}

export interface ConnectedVerificationReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  verificationConnectionId: string;
  generatedAt: string;
  verificationReadinessScore: number;
  verificationState: VerificationState;
  verificationCompleteness: number;
  coverageCompleteness: number;
  proofCompleteness: number;
  missingVerificationComponents: string[];
  verificationPath: string[];
  recommendedNextActions: string[];
  questionAnswers: VerificationReadinessQuestionAnswers;
  verificationCandidate: VerificationCandidate;
  verificationReadinessContract: VerificationReadinessContract;
  inputSnapshot: ConnectedVerificationInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface ConnectedVerificationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'VERIFICATION_READINESS_COMPLETE' | 'VERIFICATION_READINESS_FAILED';
  report: ConnectedVerificationReport;
}

export interface AssessConnectedVerificationInput {
  rootDir?: string;
  connectedLivePreviewAssessment?: ConnectedLivePreviewAssessment;
  verificationRealityAssessment?: VerificationRealityAssessment;
  founderTestLaunchReadinessAssessment?: FounderTestLaunchReadinessAssessment;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
}

export interface ConnectedVerificationHistoryEntry {
  timestamp: string;
  verificationConnectionId: string;
  verificationReadinessScore: number;
  verificationState: VerificationState;
  blockerCount: number;
  warningCount: number;
}

export interface ConnectedVerificationHistorySummary {
  totalAssessments: number;
  readyVerifications: number;
  readyWithWarningsVerifications: number;
  notReadyVerifications: number;
  blockedVerifications: number;
  insufficientEvidenceVerifications: number;
}

export interface ConnectedVerificationArtifacts {
  connectedVerificationAssessment: ConnectedVerificationAssessment;
  connectedVerificationReportMarkdown: string;
}
