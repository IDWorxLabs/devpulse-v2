/**
 * OpenAI Connectivity Proof — foundation types (V1).
 * Read-only connectivity diagnostics — proves real API request/response.
 */

import type { LlmChatResponse, LlmModelConfig } from '../llm-chat-brain/llm-provider-types.js';

export type OpenAiKeyStatus = 'MISSING' | 'INVALID' | 'PRESENT';

export type OpenAiClientStatus = 'NOT_INITIALIZED' | 'INVALID_CONFIG' | 'READY';

export type OpenAiResponseStatus = 'NOT_RECEIVED' | 'EMPTY' | 'INVALID' | 'VALID';

export type OpenAiConnectivityVerdict = 'CONNECTED' | 'PARTIAL' | 'DISCONNECTED';

export type OpenAiErrorClass =
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'UNKNOWN_ERROR';

export type OpenAiConnectivityMode = 'mock' | 'real';

export interface OpenAiKeyStatusResult {
  readOnly: true;
  status: OpenAiKeyStatus;
  keySource: 'OPENAI_API_KEY' | 'LLM_API_KEY' | null;
  maskedPreview: string | null;
  reason: string;
}

export interface OpenAiClientStatusResult {
  readOnly: true;
  status: OpenAiClientStatus;
  provider: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  configurationValid: boolean;
  reason: string;
}

export interface OpenAiRequestResult {
  readOnly: true;
  requestSent: boolean;
  requestDurationMs: number | null;
  modelUsed: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  errorMessage: string | null;
  realRequest: boolean;
}

export interface OpenAiResponseStatusResult {
  readOnly: true;
  status: OpenAiResponseStatus;
  contentLength: number;
  contentPreview: string | null;
  parseable: boolean;
  containsConnectivityMarker: boolean;
  reason: string;
}

export interface OpenAiErrorAnalysis {
  readOnly: true;
  errorClass: OpenAiErrorClass;
  message: string;
  statusCode: number | null;
  retryable: boolean;
  evidence: readonly string[];
}

export interface OpenAiConnectivityAnalysis {
  readOnly: true;
  proofId: string;
  analyzedAt: string;
  mode: OpenAiConnectivityMode;
  keyStatus: OpenAiKeyStatusResult;
  clientStatus: OpenAiClientStatusResult;
  requestResult: OpenAiRequestResult;
  responseStatus: OpenAiResponseStatusResult;
  errorAnalysis: OpenAiErrorAnalysis | null;
  connectivityVerdict: OpenAiConnectivityVerdict;
  realResponseReceived: boolean;
  summary: string;
}

export interface OpenAiConnectivityHistoryEntry {
  proofId: string;
  timestamp: string;
  mode: OpenAiConnectivityMode;
  connectivityVerdict: OpenAiConnectivityVerdict;
  realResponseReceived: boolean;
  requestDurationMs: number | null;
  errorClass: OpenAiErrorClass | null;
}

export interface OpenAiConnectivityProofReport {
  readOnly: true;
  generatedAt: string;
  totalProofs: number;
  latestAnalysis: OpenAiConnectivityAnalysis | null;
  historySummary: {
    totalProofs: number;
    connectedCount: number;
    partialCount: number;
    disconnectedCount: number;
    realModeConnectedCount: number;
  };
}

export interface MockConnectivityTransport {
  readOnly?: true;
  chat: (request: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    maxTokens?: number;
    timeoutMs?: number;
  }) => Promise<LlmChatResponse>;
}

export interface RunOpenAiConnectivityProofInput {
  mode?: OpenAiConnectivityMode;
  env?: NodeJS.ProcessEnv;
  mockTransport?: MockConnectivityTransport | null;
  skipHistoryRecording?: boolean;
  timeoutMs?: number;
}

export interface OpenAiConnectivityProofRun {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'OPENAI_CONNECTIVITY_PROOF_COMPLETE' | 'OPENAI_CONNECTIVITY_PROOF_FAILED';
  analysis: OpenAiConnectivityAnalysis | null;
  failureReason: string | null;
}
