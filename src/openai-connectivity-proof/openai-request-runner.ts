/**
 * OpenAI Request Runner — minimal real connectivity request (V1).
 */

import { createLlmProvider } from '../llm-chat-brain/llm-provider.js';
import type { LlmChatResponse } from '../llm-chat-brain/llm-provider-types.js';
import {
  CONNECTIVITY_TEST_MAX_TOKENS,
  CONNECTIVITY_TEST_PROMPT,
  CONNECTIVITY_TEST_TIMEOUT_MS,
} from './openai-connectivity-registry.js';
import { buildConnectivityModelConfig } from './openai-client-validator.js';
import type {
  MockConnectivityTransport,
  OpenAiClientStatusResult,
  OpenAiRequestResult,
} from './openai-connectivity-types.js';

export async function runOpenAiConnectivityRequest(input: {
  env?: NodeJS.ProcessEnv;
  clientStatus: OpenAiClientStatusResult;
  mode: 'mock' | 'real';
  mockTransport?: MockConnectivityTransport | null;
  timeoutMs?: number;
}): Promise<{ requestResult: OpenAiRequestResult; response: LlmChatResponse | null }> {
  const startedAt = Date.now();
  const timeoutMs = input.timeoutMs ?? CONNECTIVITY_TEST_TIMEOUT_MS;
  const realRequest = input.mode === 'real';

  if (input.clientStatus.status !== 'READY') {
    return {
      requestResult: {
        readOnly: true,
        requestSent: false,
        requestDurationMs: Date.now() - startedAt,
        modelUsed: input.clientStatus.model,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        errorMessage: input.clientStatus.reason,
        realRequest,
      },
      response: null,
    };
  }

  const config = buildConnectivityModelConfig(input.env);
  const messages = [{ role: 'user' as const, content: CONNECTIVITY_TEST_PROMPT }];

  try {
    let response: LlmChatResponse;

    if (input.mode === 'mock' && input.mockTransport) {
      response = await input.mockTransport.chat({
        messages,
        model: config.model,
        maxTokens: CONNECTIVITY_TEST_MAX_TOKENS,
        timeoutMs,
      });
    } else {
      const provider = createLlmProvider(config);
      response = await provider.chat({
        messages,
        model: config.model,
        maxTokens: CONNECTIVITY_TEST_MAX_TOKENS,
        temperature: 0,
        timeoutMs,
      });
    }

    return {
      requestResult: {
        readOnly: true,
        requestSent: true,
        requestDurationMs: Date.now() - startedAt,
        modelUsed: response.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        errorMessage: null,
        realRequest,
      },
      response,
    };
  } catch (error) {
    return {
      requestResult: {
        readOnly: true,
        requestSent: true,
        requestDurationMs: Date.now() - startedAt,
        modelUsed: config.model,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown request error',
        realRequest,
      },
      response: null,
    };
  }
}

export function createMockConnectivityTransport(input: {
  responseContent?: string;
  error?: Error & { statusCode?: number; code?: string };
  delayMs?: number;
}): MockConnectivityTransport {
  return {
    async chat(request) {
      if (input.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, input.delayMs));
      }

      if (input.error) {
        throw input.error;
      }

      return {
        readOnly: true,
        content: input.responseContent ?? 'CONNECTIVITY_OK',
        provider: 'mock',
        model: request.model ?? 'mock-model',
        finishReason: 'stop',
        usage: { promptTokens: 8, completionTokens: 3, totalTokens: 11 },
      };
    },
  };
}

export function createTimeoutMockTransport(timeoutMs: number): MockConnectivityTransport {
  return {
    async chat() {
      const error = new Error(`LLM request timed out after ${timeoutMs}ms`) as Error & {
        code: string;
        provider: string;
        retryable: boolean;
      };
      error.name = 'LlmProviderError';
      error.code = 'TIMEOUT';
      error.provider = 'openai';
      error.retryable = true;
      throw error;
    },
  };
}

export function createAuthErrorMockTransport(): MockConnectivityTransport {
  return {
    async chat() {
      const error = new Error('LLM HTTP 401') as Error & {
        code: string;
        provider: string;
        statusCode: number;
        retryable: boolean;
      };
      error.name = 'LlmProviderError';
      error.code = 'HTTP_ERROR';
      error.provider = 'openai';
      error.statusCode = 401;
      error.retryable = false;
      throw error;
    },
  };
}

export function createRateLimitMockTransport(): MockConnectivityTransport {
  return {
    async chat() {
      const error = new Error('LLM HTTP 429') as Error & {
        code: string;
        provider: string;
        statusCode: number;
        retryable: boolean;
      };
      error.name = 'LlmProviderError';
      error.code = 'HTTP_ERROR';
      error.provider = 'openai';
      error.statusCode = 429;
      error.retryable = true;
      throw error;
    },
  };
}

export function createNetworkErrorMockTransport(): MockConnectivityTransport {
  return {
    async chat() {
      const error = new Error('fetch failed: ECONNREFUSED') as Error & {
        code: string;
        provider: string;
        retryable: boolean;
      };
      error.name = 'LlmProviderError';
      error.code = 'HTTP_ERROR';
      error.provider = 'openai';
      error.retryable = true;
      throw error;
    },
  };
}
