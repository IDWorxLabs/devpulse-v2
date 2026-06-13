/**
 * Phase 25.37 — Block generic onboarding for non-project intents.
 */

import { GENERIC_ONBOARDING_SIGNATURE, INTENTS_REQUIRING_DIRECT_ANSWER } from './chat-cognitive-registry.js';
import type { ChatCognitiveIntent } from './chat-cognitive-types.js';

const ALLOWED_GENERIC_INTENTS: ChatCognitiveIntent[] = [
  'NEW_PROJECT_REQUEST',
  'GENERAL_CONVERSATION',
];

export function containsGenericOnboarding(text: string): boolean {
  return text.includes(GENERIC_ONBOARDING_SIGNATURE);
}

export function isGenericOnboardingAllowed(intent: ChatCognitiveIntent): boolean {
  return ALLOWED_GENERIC_INTENTS.includes(intent);
}

export function isGenericOnboardingBlocked(intent: ChatCognitiveIntent, text: string): boolean {
  if (!containsGenericOnboarding(text)) return false;
  if (isGenericOnboardingAllowed(intent)) return false;
  return (INTENTS_REQUIRING_DIRECT_ANSWER as readonly string[]).includes(intent) || intent === 'UNKNOWN';
}

export function stripGenericOnboarding(text: string): string {
  if (!containsGenericOnboarding(text)) return text;
  const lines = text.split('\n').filter((line) => !line.includes(GENERIC_ONBOARDING_SIGNATURE));
  return lines.join('\n').trim();
}
