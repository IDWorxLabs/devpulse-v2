/**
 * Phase 26.3.1 — Legacy product naming rules.
 *
 * DevPulse is historical only. AiDevEngine is the current product identity.
 */

import type { LegacyProductIdentity } from './identity-foundation-types.js';

export const AIDEVENGINE_IDENTITY_CORRECTION_PASS_TOKEN = 'AIDEVENGINE_IDENTITY_CORRECTION_PASS';

export const CURRENT_PRODUCT_NAME = 'AiDevEngine';
export const LEGACY_PRODUCT_NAME = 'DevPulse';
export const FOUNDER_IDENTITY = 'Lungelo Richard Zungu';
export const COMPANY_IDENTITY = 'Asgard Dynamics';

export const CANONICAL_LEGACY_PRODUCT_IDENTITY: LegacyProductIdentity = {
  readOnly: true,
  previousName: LEGACY_PRODUCT_NAME,
  currentName: CURRENT_PRODUCT_NAME,
  reason: 'Earlier development identity before rename to AiDevEngine.',
};

/** Allowed DevPulse references — historical context only. */
export const LEGACY_NAME_ALLOWED_CONTEXTS = [
  'historical reports',
  'historical phase summaries',
  'migration references',
  'repository or codebase names (e.g. DevPulse-V2)',
] as const;

/** DevPulse must not be used for current product identity. */
export const LEGACY_NAME_FORBIDDEN_CONTEXTS = [
  'current identity',
  'current product description',
  'current company description',
  'current mission',
  'introducing yourself as part of the DevPulse ecosystem',
] as const;

export function getLegacyProductIdentity(): LegacyProductIdentity {
  return CANONICAL_LEGACY_PRODUCT_IDENTITY;
}

export function serializeLegacyNamingRulesForLlm(): string {
  return [
    `Current product name: ${CURRENT_PRODUCT_NAME}`,
    `Legacy product name: ${LEGACY_PRODUCT_NAME}`,
    `Legacy reason: ${CANONICAL_LEGACY_PRODUCT_IDENTITY.reason}`,
    `Allowed DevPulse usage: ${LEGACY_NAME_ALLOWED_CONTEXTS.join('; ')}`,
    `Not allowed: ${LEGACY_NAME_FORBIDDEN_CONTEXTS.join('; ')}`,
    `When discussing the current product, always prefer ${CURRENT_PRODUCT_NAME}.`,
    `Never introduce yourself as "part of the DevPulse ecosystem" unless discussing history.`,
  ].join('\n');
}

export function isLegacyProductQuestion(message: string): boolean {
  return /\b(what is devpulse|what's devpulse|what was devpulse|devpulse history|legacy name|previous name)\b/i.test(
    message.toLowerCase(),
  );
}

export function isCurrentProductQuestion(message: string): boolean {
  return /\b(what is aidevengine|what's aidevengine|what are you|who are you|what is this product)\b/i.test(
    message.toLowerCase(),
  );
}

/** True when text incorrectly uses DevPulse as the current product identity. */
export function usesDevPulseAsCurrentIdentity(text: string): boolean {
  const lower = text.toLowerCase();
  const historicalMarkers =
    /\b(historical|legacy|earlier|previous name|renamed|before the rename|under the devpulse name|devpulse-v2)\b/i;
  if (historicalMarkers.test(lower)) return false;

  const currentIdentityPatterns = [
    /\bpart of the devpulse ecosystem\b/i,
    /\bthe devpulse platform\b/i,
    /\binside devpulse\b/i,
    /\bi am devpulse\b/i,
    /\bwe are devpulse\b/i,
    /\bproduct name:\s*devpulse\b/i,
    /\bcurrent product:\s*devpulse\b/i,
  ];
  return currentIdentityPatterns.some((p) => p.test(text));
}
