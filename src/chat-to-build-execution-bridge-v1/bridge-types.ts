/**
 * Chat-to-Build Execution Bridge V1 — types and pass token.
 */

import type { BuildIntentClassification } from '../build-intent-routing/build-intent-route-parity-v1.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { ProjectIdentityContract } from '../project-name-conflict-resolution-v1/index.js';

export const CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS_TOKEN =
  'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS';

export const CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION =
  'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1';

export const CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE =
  'CHAT_TO_BUILD_EXECUTION_BRIDGE_APPLIED';

export const CHAT_TO_BUILD_EXECUTION_BRIDGE_API_PATH =
  '/api/chat-to-build/execute';

export type ChatToBuildEngineeringState =
  | 'CHAT_RECEIVED'
  | 'INTENT_ANALYSIS'
  | 'PROJECT_ALIGNMENT'
  | 'PROJECT_IDENTITY'
  | 'PLANNING'
  | 'ARCHITECTURE'
  | 'FEATURE_GENERATION'
  | 'CODE_GENERATION'
  | 'WORKSPACE_BUILD'
  | 'RUNTIME_START'
  | 'LIVE_PREVIEW'
  | 'VALIDATION'
  | 'FOUNDER_EVIDENCE'
  | 'COMPLETE'
  | 'FAILED'
  | 'AUTOFIX'
  | 'RECOVERY';

export type ChatToBuildBridgeOutcomeKind =
  | 'CHAT_ONLY'
  | 'ALIGNMENT_REQUIRED'
  | 'RESUME_REQUIRED'
  | 'NEW_BUILD_CONFIRMATION_REQUIRED'
  | 'BUILD_COMPLETE'
  | 'BUILD_FAILED';

export interface ChatToBuildBridgeEvent {
  readOnly: true;
  contractVersion: typeof CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION;
  state: ChatToBuildEngineeringState;
  eventId: string;
  timestamp: string;
  title: string;
  detail: string;
  status: 'Active' | 'Completed' | 'Failed' | 'Warning';
  section: string;
  stepIndex: number;
  stepTotal: number;
}

export interface ChatToBuildProgressItem {
  readOnly: true;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'failed';
  stage?: ChatToBuildEngineeringState;
  detail?: string;
}

export interface ChatToBuildEngineeringReport {
  readOnly: true;
  contractVersion: typeof CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION;
  bridgeRunId: string;
  projectName: string;
  projectId: string;
  projectIdentity: string;
  workspacePath: string | null;
  resolutionMode: string | null;
  generatedProfile: GeneratedAppProfile | null;
  featureModules: string[];
  featureContractReality: Record<string, unknown> | null;
  workspaceRealityAudit: Record<string, unknown> | null;
  validationResults: Record<string, unknown> | null;
  qualityScore: number | null;
  livePreviewUrl: string | null;
  productionProof: Record<string, unknown> | null;
  founderEvidence: Record<string, unknown> | null;
  remainingGaps: string[];
  buildStatus: string;
  autofixApplied: boolean;
  autofixAttempts: number;
  finalState: ChatToBuildEngineeringState;
}

export interface ChatToBuildBridgeInput {
  message: string;
  source: 'chat' | 'api';
  activeProjectId?: string | null;
  projectName?: string | null;
  confirmProjectContextAlignment?: boolean;
  confirmProjectResume?: boolean;
  confirmFreshCopy?: boolean;
  rejectDuplicates?: boolean;
  resumeAction?: 'RESUME_BUILD' | 'REPAIR_BUILD' | 'CONTINUE_FROM_PROMPT';
  rootDir: string;
  repoRootDir: string;
  chatExecutionAuditId?: string | null;
  forceBuildIntent?: boolean;
  httpRequestId?: string | null;
  /**
   * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — explicit build intent choice resubmitted by the caller
   * in direct response to a prior AMBIGUOUS_REQUIRES_CONFIRMATION confirmation panel. See
   * src/project-context-isolation-v4/.
   */
  buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
}

/** Project Context Isolation V4 — surfaced on every bridge result for build/failure reporting. */
export interface ChatToBuildContextIsolationPayload {
  readOnly: true;
  decision: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | 'AMBIGUOUS_REQUIRES_CONFIRMATION';
  reasons: string[];
  message: string | null;
  blockedContextSources?: string[];
  allowedContextSources?: string[];
  /** The explicit override the caller supplied, if any, and whether it was honored or rejected. */
  overrideApplied?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
  overrideRejected?: { requested: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT'; reason: string } | null;
}

export interface ChatToBuildBridgeResult {
  readOnly: true;
  kind: ChatToBuildBridgeOutcomeKind;
  classification: BuildIntentClassification;
  bridgeEvents: ChatToBuildBridgeEvent[];
  progressItems: ChatToBuildProgressItem[];
  conflictResolutionTrace?: string;
  projectIdentity?: ProjectIdentityContract | null;
  buildResult?: OnePromptLivePreviewBuildResult;
  brainPayload?: Record<string, unknown>;
  alignmentPayload?: Record<string, unknown>;
  resumePayload?: Record<string, unknown>;
  engineeringReport?: ChatToBuildEngineeringReport | null;
  contextIsolation?: ChatToBuildContextIsolationPayload;
  newBuildConfirmationPayload?: Record<string, unknown>;
}
