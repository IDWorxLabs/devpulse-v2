/**
 * OpenAI Response Validator — response receipt and parse validation (V1).
 */

import type { LlmChatResponse } from '../llm-chat-brain/llm-provider-types.js';
import type { OpenAiResponseStatusResult } from './openai-connectivity-types.js';

export function validateOpenAiResponse(response: LlmChatResponse | null): OpenAiResponseStatusResult {
  if (!response) {
    return {
      readOnly: true,
      status: 'NOT_RECEIVED',
      contentLength: 0,
      contentPreview: null,
      parseable: false,
      containsConnectivityMarker: false,
      reason: 'No response object received from OpenAI request.',
    };
  }

  const content = response.content?.trim() ?? '';

  if (content.length === 0) {
    return {
      readOnly: true,
      status: 'EMPTY',
      contentLength: 0,
      contentPreview: null,
      parseable: false,
      containsConnectivityMarker: false,
      reason: 'Response received but content is empty.',
    };
  }

  const containsConnectivityMarker = /CONNECTIVITY_OK/i.test(content);
  const parseable = typeof content === 'string' && content.length > 0;

  if (!parseable) {
    return {
      readOnly: true,
      status: 'INVALID',
      contentLength: content.length,
      contentPreview: content.slice(0, 80),
      parseable: false,
      containsConnectivityMarker,
      reason: 'Response content is not parseable.',
    };
  }

  return {
    readOnly: true,
    status: 'VALID',
    contentLength: content.length,
    contentPreview: content.slice(0, 80),
    parseable: true,
    containsConnectivityMarker,
    reason: containsConnectivityMarker
      ? 'Valid response received containing CONNECTIVITY_OK marker.'
      : 'Valid non-empty response received (connectivity marker not required for parse validity).',
  };
}
