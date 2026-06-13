/**
 * Phase 26 — LLM provider types for real chat brain integration.
 */

export type LlmProviderName = 'openai' | 'mock' | 'none';

export type LlmChatRole = 'system' | 'user' | 'assistant';

export interface LlmChatMessage {
  readOnly?: true;
  role: LlmChatRole;
  content: string;
}

export interface LlmModelConfig {
  readOnly?: true;
  provider: LlmProviderName;
  model: string;
  apiKey: string | null;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
  baseUrl: string;
}

export interface LlmChatRequest {
  readOnly?: true;
  messages: LlmChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface LlmChatResponse {
  readOnly: true;
  content: string;
  provider: LlmProviderName;
  model: string;
  finishReason: string | null;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
}

export type LlmProviderStatus =
  | { readOnly: true; connected: true; provider: LlmProviderName; model: string }
  | {
      readOnly: true;
      connected: false;
      provider: LlmProviderName;
      model: string | null;
      reason: string;
    };

export interface LlmProviderError extends Error {
  code: 'MISSING_API_KEY' | 'TIMEOUT' | 'HTTP_ERROR' | 'INVALID_RESPONSE' | 'UNSUPPORTED_PROVIDER';
  provider: LlmProviderName;
  statusCode?: number;
  retryable: boolean;
}

export interface LlmProvider {
  readonly name: LlmProviderName;
  readonly model: string;
  getStatus(): LlmProviderStatus;
  chat(request: LlmChatRequest): Promise<LlmChatResponse>;
}
