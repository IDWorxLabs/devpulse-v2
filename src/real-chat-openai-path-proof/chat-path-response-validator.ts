/**
 * Chat Path Response Validator — founder-facing response validation (V1).
 */

import { GENERIC_ONBOARDING_SIGNATURE } from '../chat-cognitive-architecture/chat-cognitive-registry.js';
import { PLACEHOLDER_RESPONSE_MARKERS } from './real-chat-openai-path-registry.js';
import type {
  ChatPathProofMode,
  ChatPathRequestResult,
  ChatPathResponseValidation,
} from './real-chat-openai-path-types.js';

const SECRET_PATTERN = /sk-[a-zA-Z0-9]{10,}/;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function validateChatPathResponse(input: {
  requestResult: ChatPathRequestResult;
  mode: ChatPathProofMode;
}): ChatPathResponseValidation {
  const response = input.requestResult.chatResponse;

  if (!response || !input.requestResult.requestSent) {
    return {
      readOnly: true,
      status: 'NOT_RECEIVED',
      nonEmpty: false,
      parseable: false,
      founderFacing: false,
      mentionsAiDevEngine: false,
      mentionsSoftwareBuilding: false,
      exposesSecrets: false,
      placeholderDetected: false,
      founderFacingQualityScore: 0,
      contentPreview: null,
      reason: 'No chat response received from the path.',
    };
  }

  const content = response.finalAnswer.trim();
  const nonEmpty = content.length > 0;
  const parseable = typeof content === 'string' && content.length > 0;
  const exposesSecrets = SECRET_PATTERN.test(content);
  const placeholderDetected =
    PLACEHOLDER_RESPONSE_MARKERS.some((marker) => content.includes(marker)) ||
    content.includes(GENERIC_ONBOARDING_SIGNATURE);

  const lower = content.toLowerCase();
  const mentionsAiDevEngine = lower.includes('aidevengine') || lower.includes('ai dev engine');
  const mentionsSoftwareBuilding =
    mentionsAiDevEngine ||
    /\b(software|app|application|product|build|building|development|planning|launch)\b/i.test(content);

  const founderFacing =
    nonEmpty &&
    !exposesSecrets &&
    !placeholderDetected &&
    !response.metadata.fallbackUsed &&
    (input.mode === 'mock' ? true : response.metadata.usedLlm);

  let score = 0;
  if (nonEmpty) score += 20;
  if (parseable) score += 10;
  if (mentionsAiDevEngine) score += 25;
  if (mentionsSoftwareBuilding) score += 15;
  if (!exposesSecrets) score += 15;
  if (!placeholderDetected) score += 10;
  if (response.metadata.usedLlm && !response.metadata.fallbackUsed) score += 15;
  if (response.judgement?.passed) score += 10;
  if (exposesSecrets) score -= 50;
  if (placeholderDetected) score -= 30;
  if (response.metadata.fallbackUsed) score -= 25;

  const founderFacingQualityScore = clamp(score);

  const validForReal =
    input.mode === 'real'
      ? response.metadata.usedLlm &&
        !response.metadata.fallbackUsed &&
        nonEmpty &&
        !exposesSecrets &&
        !placeholderDetected &&
        mentionsSoftwareBuilding
      : nonEmpty && !exposesSecrets && !placeholderDetected && mentionsSoftwareBuilding;

  const status = validForReal ? 'VALID' : nonEmpty ? 'INVALID' : 'NOT_RECEIVED';

  const reason =
    status === 'VALID'
      ? 'Founder-facing response validated for real chat path proof.'
      : !nonEmpty
        ? 'Response is empty.'
        : exposesSecrets
          ? 'Response appears to expose secrets.'
          : placeholderDetected
            ? 'Response contains placeholder or generic onboarding text.'
            : input.mode === 'real' && response.metadata.fallbackUsed
              ? 'Real mode received fallback response instead of live LLM answer.'
              : input.mode === 'real' && !response.metadata.usedLlm
                ? 'Real mode did not use the LLM provider.'
                : !mentionsSoftwareBuilding
                  ? 'Response does not mention AiDevEngine or software building.'
                  : 'Response failed founder-facing validation.';

  return {
    readOnly: true,
    status,
    nonEmpty,
    parseable,
    founderFacing,
    mentionsAiDevEngine,
    mentionsSoftwareBuilding,
    exposesSecrets,
    placeholderDetected,
    founderFacingQualityScore,
    contentPreview: content.slice(0, 120),
    reason,
  };
}
