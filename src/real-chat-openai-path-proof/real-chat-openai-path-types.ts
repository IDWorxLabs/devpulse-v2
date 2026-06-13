/**
 * Real Chat OpenAI Path Proof — foundation types (V1).
 */

import type { OpenAiKeyStatusResult } from '../openai-connectivity-proof/openai-connectivity-types.js';
import type { LlmChatBrainResponse } from '../llm-chat-brain/llm-chat-types.js';
import type { LlmProvider } from '../llm-chat-brain/llm-provider-types.js';

export type ChatPathProofMode = 'mock' | 'real';

export type ChatPathVerdict = 'CHAT_OPENAI_CONNECTED' | 'CHAT_OPENAI_PARTIAL' | 'CHAT_OPENAI_DISCONNECTED';

export type ChatPathErrorClass =
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'PROVIDER_ROUTING_ERROR'
  | 'RESPONSE_VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export type ChatPathResponseValidationStatus = 'VALID' | 'INVALID' | 'NOT_RECEIVED';

export interface ChatPathMessage {
  readOnly: true;
  messageId: string;
  content: string;
  founderFacing: boolean;
}

export interface ChatPathProviderResolution {
  readOnly: true;
  providerResolved: string | null;
  providerRoutingValid: boolean;
  openAiProviderSelected: boolean;
  connectivityPrerequisitesMet: boolean;
  model: string | null;
  reason: string;
}

export interface ChatPathRequestResult {
  readOnly: true;
  requestSent: boolean;
  requestDurationMs: number | null;
  realRequest: boolean;
  providerUsed: string | null;
  modelUsed: string | null;
  usedLlm: boolean;
  fallbackUsed: boolean;
  errorMessage: string | null;
  chatResponse: LlmChatBrainResponse | null;
}

export interface ChatPathResponseValidation {
  readOnly: true;
  status: ChatPathResponseValidationStatus;
  nonEmpty: boolean;
  parseable: boolean;
  founderFacing: boolean;
  mentionsAiDevEngine: boolean;
  mentionsSoftwareBuilding: boolean;
  exposesSecrets: boolean;
  placeholderDetected: boolean;
  founderFacingQualityScore: number;
  contentPreview: string | null;
  reason: string;
}

export interface ChatPathErrorAnalysis {
  readOnly: true;
  errorClass: ChatPathErrorClass;
  message: string;
  retryable: boolean;
  evidence: readonly string[];
}

export interface RealChatOpenAiPathProofResult {
  readOnly: true;
  proofId: string;
  analyzedAt: string;
  mode: ChatPathProofMode;
  testMessage: ChatPathMessage;
  keyStatus: OpenAiKeyStatusResult;
  providerResolution: ChatPathProviderResolution;
  requestResult: ChatPathRequestResult;
  responseValidation: ChatPathResponseValidation;
  errorAnalysis: ChatPathErrorAnalysis | null;
  realResponseReceived: boolean;
  finalVerdict: ChatPathVerdict;
  summary: string;
}

export interface ChatPathProofHistoryEntry {
  proofId: string;
  timestamp: string;
  mode: ChatPathProofMode;
  finalVerdict: ChatPathVerdict;
  realResponseReceived: boolean;
  requestDurationMs: number | null;
  founderFacingQualityScore: number;
}

export interface RealChatOpenAiPathProofReport {
  readOnly: true;
  generatedAt: string;
  totalProofs: number;
  latestResult: RealChatOpenAiPathProofResult | null;
  historySummary: {
    totalProofs: number;
    connectedCount: number;
    partialCount: number;
    disconnectedCount: number;
    realModeConnectedCount: number;
  };
}

export interface RunRealChatOpenAiPathProofInput {
  mode?: ChatPathProofMode;
  env?: NodeJS.ProcessEnv;
  rootDir?: string;
  testMessage?: string;
  providerOverride?: LlmProvider | null;
  skipHistoryRecording?: boolean;
  timeoutMs?: number;
}

export interface RealChatOpenAiPathProofRun {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'REAL_CHAT_OPENAI_PATH_PROOF_COMPLETE' | 'REAL_CHAT_OPENAI_PATH_PROOF_FAILED';
  result: RealChatOpenAiPathProofResult | null;
  failureReason: string | null;
}
