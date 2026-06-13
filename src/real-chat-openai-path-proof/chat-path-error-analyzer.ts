/**
 * Chat Path Error Analyzer — chat path error classification (V1).
 */

import { classifyOpenAiErrorMessage } from '../openai-connectivity-proof/openai-error-analyzer.js';
import type { ChatPathErrorAnalysis, ChatPathErrorClass } from './real-chat-openai-path-types.js';
import type {
  ChatPathProviderResolution,
  ChatPathRequestResult,
  ChatPathResponseValidation,
} from './real-chat-openai-path-types.js';

function mapToChatPathErrorClass(base: string, context: string): ChatPathErrorClass {
  if (context === 'routing') return 'PROVIDER_ROUTING_ERROR';
  if (context === 'validation') return 'RESPONSE_VALIDATION_ERROR';
  switch (base) {
    case 'AUTH_ERROR':
      return 'AUTH_ERROR';
    case 'NETWORK_ERROR':
      return 'NETWORK_ERROR';
    case 'TIMEOUT_ERROR':
      return 'TIMEOUT_ERROR';
    case 'RATE_LIMIT_ERROR':
      return 'RATE_LIMIT_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
}

export function analyzeChatPathError(input: {
  providerResolution: ChatPathProviderResolution;
  requestResult: ChatPathRequestResult;
  responseValidation: ChatPathResponseValidation;
}): ChatPathErrorAnalysis | null {
  if (
    !input.providerResolution.providerRoutingValid &&
    input.providerResolution.reason.includes('requires OpenAI')
  ) {
    return {
      readOnly: true,
      errorClass: 'PROVIDER_ROUTING_ERROR',
      message: input.providerResolution.reason,
      retryable: false,
      evidence: ['PROVIDER_ROUTING_INVALID'],
    };
  }

  if (!input.providerResolution.connectivityPrerequisitesMet && input.requestResult.realRequest) {
    return {
      readOnly: true,
      errorClass: 'AUTH_ERROR',
      message: input.providerResolution.reason,
      retryable: false,
      evidence: ['CONNECTIVITY_PREREQUISITES_FAILED'],
    };
  }

  if (input.requestResult.errorMessage) {
    const base = classifyOpenAiErrorMessage(input.requestResult.errorMessage);
    return {
      readOnly: true,
      errorClass: mapToChatPathErrorClass(base, 'request'),
      message: input.requestResult.errorMessage,
      retryable: base === 'NETWORK_ERROR' || base === 'TIMEOUT_ERROR' || base === 'RATE_LIMIT_ERROR',
      evidence: [input.requestResult.errorMessage],
    };
  }

  if (input.responseValidation.status === 'INVALID') {
    return {
      readOnly: true,
      errorClass: 'RESPONSE_VALIDATION_ERROR',
      message: input.responseValidation.reason,
      retryable: true,
      evidence: [
        input.responseValidation.reason,
        `fallbackUsed=${input.requestResult.fallbackUsed}`,
        `usedLlm=${input.requestResult.usedLlm}`,
      ],
    };
  }

  if (input.responseValidation.status === 'NOT_RECEIVED') {
    return {
      readOnly: true,
      errorClass: 'UNKNOWN_ERROR',
      message: input.responseValidation.reason,
      retryable: true,
      evidence: ['NO_RESPONSE'],
    };
  }

  return null;
}
