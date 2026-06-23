/**
 * Detect one-prompt build requests from chat/API input.
 */

import { detectTaskTrackerIdea } from '../code-generation-engine/index.js';

export function isOnePromptBuildRequest(message: string): boolean {
  const normalized = message.trim();
  if (normalized.length < 20) return false;
  return detectTaskTrackerIdea(normalized);
}

export function classifyOnePromptBuildRequest(message: string): 'BUILD_FROM_PROMPT' | 'CHAT_ONLY' {
  return isOnePromptBuildRequest(message) ? 'BUILD_FROM_PROMPT' : 'CHAT_ONLY';
}
