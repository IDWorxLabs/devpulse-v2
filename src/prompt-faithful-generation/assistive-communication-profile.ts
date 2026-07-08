/**
 * General assistive communication / accessibility app profile detection.
 * Semantic patterns only — not tied to a single app name.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export const ASSISTIVE_COMMUNICATION_APP_V1 = 'ASSISTIVE_COMMUNICATION_APP_V1' as const satisfies GeneratedAppProfile;

export const ASSISTIVE_COMMUNICATION_STANDARD_MODULES = [
  'onboarding-calibration',
  'eye-tracking-board',
  'blink-input-engine',
  'gaze-keyboard',
  'text-to-speech',
  'quick-phrases',
  'caregiver-dashboard',
  'communication-history',
  'accessibility-settings',
  'emergency-speech',
] as const;

const ASSISTIVE_SIGNAL_PATTERNS: RegExp[] = [
  /\bassistive\s+communication\b/i,
  /\blocked[\s-]?in\s+syndrome\b/i,
  /\bsevere\s+motor\s+impairment\b/i,
  /\bgaze\s+(?:selection|keyboard|input)\b/i,
  /\bblink\s+input\b/i,
  /\beye[\s-]?(?:tracking|movement)\b/i,
  /\btext[\s-]?to[\s-]?speech\b/i,
  /\bcaregiver[\s-]?(?:assisted\s+)?calibration\b/i,
  /\baccessibility[\s-]?first\b/i,
  /\bcommunication\s+board\b/i,
  /\bemergency[\s-]?speech\b/i,
  /\bassistive\s+(?:mobile|app)\b/i,
];

export function promptDescribesAssistiveCommunication(rawPrompt: string): boolean {
  const text = rawPrompt.trim();
  if (!text) return false;
  let signalCount = 0;
  for (const pattern of ASSISTIVE_SIGNAL_PATTERNS) {
    if (pattern.test(text)) signalCount += 1;
  }
  if (signalCount >= 2) return true;
  if (/\bassistive\s+communication\b/i.test(text) && signalCount >= 1) return true;
  if (/\baccessibility\b/i.test(text) && /\b(?:gaze|blink|speech|calibration)\b/i.test(text)) {
    return true;
  }
  return false;
}

export function resolveAssistiveCommunicationProfile(
  rawPrompt: string,
): typeof ASSISTIVE_COMMUNICATION_APP_V1 | null {
  return promptDescribesAssistiveCommunication(rawPrompt) ? ASSISTIVE_COMMUNICATION_APP_V1 : null;
}
