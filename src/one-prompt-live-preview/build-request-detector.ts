/**
 * Detect one-prompt build requests from chat/API input.
 */

import { isBuildIntentRequest, resolveBuildIntentProfile } from '../build-intent-routing/build-intent-detector.js';
import { detectTaskTrackerIdea } from '../code-generation-engine/index.js';

export function isOnePromptBuildRequest(message: string): boolean {
  return isBuildIntentRequest(message);
}

export function classifyOnePromptBuildRequest(message: string): 'BUILD_FROM_PROMPT' | 'CHAT_ONLY' {
  return isOnePromptBuildRequest(message) ? 'BUILD_FROM_PROMPT' : 'CHAT_ONLY';
}

export { resolveBuildIntentProfile };
export { detectTaskTrackerIdea };
