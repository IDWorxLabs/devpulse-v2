/**
 * OpenAI Error Analyzer — connectivity error classification (V1).
 */

import type { LlmProviderError } from '../llm-chat-brain/llm-provider-types.js';
import type { OpenAiErrorAnalysis, OpenAiErrorClass } from './openai-connectivity-types.js';

function isLlmProviderError(error: unknown): error is LlmProviderError {
  return error instanceof Error && 'code' in error && typeof (error as LlmProviderError).code === 'string';
}

function extractStatusCodeFromMessage(message: string): number | null {
  const match = message.match(/HTTP\s+(\d{3})/i);
  if (!match) return null;
  const code = Number.parseInt(match[1], 10);
  return Number.isFinite(code) ? code : null;
}

export function classifyOpenAiErrorMessage(message: string, statusCode?: number | null): OpenAiErrorClass {
  const resolvedStatus = statusCode ?? extractStatusCodeFromMessage(message);
  const lower = message.toLowerCase();

  if (resolvedStatus === 401 || resolvedStatus === 403 || lower.includes('unauthorized') || lower.includes('invalid api key')) {
    return 'AUTH_ERROR';
  }
  if (resolvedStatus === 429 || lower.includes('rate limit')) {
    return 'RATE_LIMIT_ERROR';
  }
  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('abort')) {
    return 'TIMEOUT_ERROR';
  }
  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('network') ||
    lower.includes('fetch failed') ||
    lower.includes('socket')
  ) {
    return 'NETWORK_ERROR';
  }
  if (statusCode === 401 || statusCode === 403) return 'AUTH_ERROR';

  return 'UNKNOWN_ERROR';
}

export function analyzeOpenAiError(input: {
  error: unknown;
  fallbackMessage?: string | null;
}): OpenAiErrorAnalysis {
  const error = input.error;
  const message =
    error instanceof Error
      ? error.message
      : input.fallbackMessage ?? 'Unknown connectivity error';

  if (isLlmProviderError(error)) {
    let errorClass: OpenAiErrorClass = 'UNKNOWN_ERROR';

    switch (error.code) {
      case 'MISSING_API_KEY':
        errorClass = 'AUTH_ERROR';
        break;
      case 'TIMEOUT':
        errorClass = 'TIMEOUT_ERROR';
        break;
      case 'HTTP_ERROR':
        errorClass = classifyOpenAiErrorMessage(message, error.statusCode ?? null);
        break;
      case 'INVALID_RESPONSE':
        errorClass = 'UNKNOWN_ERROR';
        break;
      default:
        errorClass = classifyOpenAiErrorMessage(message, error.statusCode ?? null);
    }

    return {
      readOnly: true,
      errorClass,
      message,
      statusCode: error.statusCode ?? null,
      retryable: error.retryable,
      evidence: [error.code, message],
    };
  }

  const errorClass = classifyOpenAiErrorMessage(message, extractStatusCodeFromMessage(message));

  return {
    readOnly: true,
    errorClass,
    message,
    statusCode: extractStatusCodeFromMessage(message),
    retryable: errorClass === 'NETWORK_ERROR' || errorClass === 'TIMEOUT_ERROR' || errorClass === 'RATE_LIMIT_ERROR',
    evidence: [message],
  };
}
