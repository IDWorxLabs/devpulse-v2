/**
 * Detect one-prompt build requests from chat/API input.
 */

import { classifyBuildIntentRequest } from '../build-intent-routing/build-intent-route-parity-v1.js';
import { resolveBuildIntentProfile } from '../build-intent-routing/build-intent-detector.js';
import { detectTaskTrackerIdea } from '../code-generation-engine/index.js';

export function isOnePromptBuildRequest(message: string): boolean {
  return classifyBuildIntentRequest(message).isBuildIntent;
}

export function classifyOnePromptBuildRequest(message: string): 'BUILD_FROM_PROMPT' | 'CHAT_ONLY' {
  return isOnePromptBuildRequest(message) ? 'BUILD_FROM_PROMPT' : 'CHAT_ONLY';
}

export { resolveBuildIntentProfile };
export { detectTaskTrackerIdea };
