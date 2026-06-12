/**
 * Founder Test Execution Chain Integration — core models.
 * Connects Founder Test to the connected execution proof chain (25.20–25.24).
 * Read-only orchestration only — no execution.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import type { EndToEndExecutionProofAssessment } from '../end-to-end-execution-proof-chain/end-to-end-execution-proof-types.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';

export type ExecutionChainState =
  | 'EXECUTION_CHAIN_CONNECTED'
  | 'EXECUTION_CHAIN_PARTIALLY_CONNECTED'
  | 'EXECUTION_CHAIN_DISCONNECTED'
  | 'EXECUTION_CHAIN_BLOCKED'
  | 'INSUFFICIENT_EVIDENCE';

export type ExecutionStage = 'BUILD' | 'RUNTIME' | 'PREVIEW' | 'VERIFICATION' | 'END_TO_END';

export interface ExecutionChainBlocker {
  readOnly: true;
  stage: ExecutionStage;
  sourceAuthority: string;
  explanation: string;
  recommendedAction: string;
}

export interface ExecutionChainWarning {
  readOnly: true;
  stage: ExecutionStage;
  sourceAuthority: string;
  explanation: string;
}

export interface ExecutionChainQuestionAnswers {
  buildOutputProven: boolean;
  runtimeReadinessProven: boolean;
  previewReadinessProven: boolean;
  verificationReadinessProven: boolean;
  endToEndProofPresent: boolean;
  weakestStageIdentified: boolean;
  launchBlockingStageIdentified: boolean;
  founderCanInspectChainHealth: boolean;
  connectedExecutionMeasurable: boolean;
  connectedExecutionProven: boolean;
}

export interface FounderTestExecutionChainInputSnapshot {
  readOnly: true;
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment;
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  connectedVerificationAssessment: ConnectedVerificationAssessment;
  endToEndExecutionProofAssessment: EndToEndExecutionProofAssessment;
  executionProofAssessment: ExecutionProofAssessment | null;
  founderAcceptanceAssessment: FounderAcceptanceAssessment;
  launchCouncilAssessment: LaunchCouncilAssessment;
  missingAuthorities: string[];
}

export interface FounderExecutionChainReport {
  readOnly: true;
  advisoryOnly: true;
  coreQuestion: string;
  integrationId: string;
  generatedAt: string;
  executionChainState: ExecutionChainState;
  executionChainScore: number;
  executionChainCompleteness: number;
  executionChainConnected: boolean;
  connectedExecutionProven: boolean;
  buildStatus: string;
  runtimeStatus: string;
  previewStatus: string;
  verificationStatus: string;
  endToEndStatus: string;
  weakestExecutionStage: ExecutionStage;
  strongestExecutionStage: ExecutionStage;
  launchBlockingStage: ExecutionStage | null;
  launchImpact: string;
  executionChainBlockers: ExecutionChainBlocker[];
  executionChainWarnings: ExecutionChainWarning[];
  recommendedNextActions: string[];
  questionAnswers: ExecutionChainQuestionAnswers;
  inputSnapshot: FounderTestExecutionChainInputSnapshot;
  blockingReasons: string[];
  warningReasons: string[];
  cacheKey: string;
}

export interface FounderExecutionChainAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'EXECUTION_CHAIN_INTEGRATION_COMPLETE' | 'EXECUTION_CHAIN_INTEGRATION_FAILED';
  report: FounderExecutionChainReport;
}

export interface AssessFounderTestExecutionChainInput {
  rootDir?: string;
  endToEndExecutionProofAssessment?: EndToEndExecutionProofAssessment;
  executionProofAssessment?: ExecutionProofAssessment | null;
  founderTestAssessment?: import('../founder-test-integration/founder-test-integration-types.js').FounderTestAssessment;
}

export interface FounderTestExecutionChainHistoryEntry {
  timestamp: string;
  integrationId: string;
  executionChainScore: number;
  executionChainState: ExecutionChainState;
  executionChainConnected: boolean;
  blockerCount: number;
  warningCount: number;
}

export interface FounderTestExecutionChainHistorySummary {
  totalAssessments: number;
  connectedChains: number;
  partiallyConnectedChains: number;
  disconnectedChains: number;
  blockedChains: number;
  insufficientEvidenceChains: number;
}

export interface FounderTestExecutionChainArtifacts {
  founderExecutionChainAssessment: FounderExecutionChainAssessment;
  founderExecutionChainReportMarkdown: string;
}
