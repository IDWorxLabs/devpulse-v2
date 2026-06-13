/**
 * Chat Path Request Runner — executes real chat brain path (V1).
 */

import { generateLlmBackedChatResponseAsync } from '../llm-chat-brain/llm-chat-orchestrator.js';
import type { LlmProvider } from '../llm-chat-brain/llm-provider-types.js';
import type {
  ChatPathMessage,
  ChatPathProofMode,
  ChatPathProviderResolution,
  ChatPathRequestResult,
} from './real-chat-openai-path-types.js';

export async function runChatPathRequest(input: {
  mode: ChatPathProofMode;
  testMessage: ChatPathMessage;
  providerResolution: ChatPathProviderResolution;
  rootDir?: string;
  providerOverride?: LlmProvider | null;
}): Promise<ChatPathRequestResult> {
  const startedAt = Date.now();
  const realRequest = input.mode === 'real';

  if (!input.providerResolution.providerRoutingValid && realRequest) {
    return {
      readOnly: true,
      requestSent: false,
      requestDurationMs: Date.now() - startedAt,
      realRequest,
      providerUsed: input.providerResolution.providerResolved,
      modelUsed: input.providerResolution.model,
      usedLlm: false,
      fallbackUsed: false,
      errorMessage: input.providerResolution.reason,
      chatResponse: null,
    };
  }

  try {
    const chatResponse = await generateLlmBackedChatResponseAsync({
      message: input.testMessage.content,
      rootDir: input.rootDir,
      timestamp: Date.now(),
      providerOverride: input.mode === 'mock' ? input.providerOverride ?? undefined : undefined,
    });

    return {
      readOnly: true,
      requestSent: true,
      requestDurationMs: Date.now() - startedAt,
      realRequest,
      providerUsed: chatResponse.metadata.provider,
      modelUsed: chatResponse.metadata.model,
      usedLlm: chatResponse.metadata.usedLlm,
      fallbackUsed: chatResponse.metadata.fallbackUsed,
      errorMessage: null,
      chatResponse,
    };
  } catch (error) {
    return {
      readOnly: true,
      requestSent: true,
      requestDurationMs: Date.now() - startedAt,
      realRequest,
      providerUsed: input.providerResolution.providerResolved,
      modelUsed: input.providerResolution.model,
      usedLlm: false,
      fallbackUsed: true,
      errorMessage: error instanceof Error ? error.message : 'Chat path request failed',
      chatResponse: null,
    };
  }
}

export function createMockChatProviderForProof(
  createMock: typeof import('../llm-chat-brain/llm-provider.js').createMockLlmProvider,
  responseContent: string,
): LlmProvider {
  return createMock([responseContent]);
}

export function createFailingMockChatProvider(
  createMock: typeof import('../llm-chat-brain/llm-provider.js').createMockLlmProvider,
): LlmProvider {
  const provider = createMock(['placeholder']);
  return {
    ...provider,
    async chat() {
      const error = new Error('LLM HTTP 401') as Error & {
        code: string;
        statusCode: number;
        retryable: boolean;
      };
      error.code = 'HTTP_ERROR';
      error.statusCode = 401;
      error.retryable = false;
      throw error;
    },
  };
}

export function createInvalidResponseMockProvider(
  createMock: typeof import('../llm-chat-brain/llm-provider.js').createMockLlmProvider,
): LlmProvider {
  return createMock(['Tell me your idea and I can help you create projects today!']);
}
