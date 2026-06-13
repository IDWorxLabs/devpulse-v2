/**
 * Phase 26.3.1 — Identity foundation authority (read-only).
 */

import { CANONICAL_IDENTITY_PROFILE } from './identity-foundation-registry.js';
import { serializeLegacyNamingRulesForLlm } from './legacy-product-identity.js';
import type { IdentityFoundationSnapshot, IdentityProfile } from './identity-foundation-types.js';

export function getIdentityProfile(): IdentityProfile {
  return CANONICAL_IDENTITY_PROFILE;
}

export function loadIdentityFoundation(): IdentityFoundationSnapshot {
  return {
    readOnly: true,
    profile: getIdentityProfile(),
    loadedAt: Date.now(),
  };
}

export function serializeIdentityForLlm(profile: IdentityProfile = getIdentityProfile()): string {
  return [
    `Name: ${profile.name}`,
    `Description: ${profile.description}`,
    `Role: ${profile.role}`,
    `Created by: ${profile.createdBy}`,
    `Company: ${profile.company}`,
    `Product family: ${profile.productFamily}`,
    `Mission: ${profile.mission}`,
    `Purpose: ${profile.purpose}`,
    `Current maturity: ${profile.currentMaturity}`,
    `Previous name (legacy only): ${profile.legacyIdentity.previousName}`,
    `Legacy reason: ${profile.legacyIdentity.reason}`,
    `Known strengths: ${profile.knownStrengths.join('; ')}`,
    `Known limitations: ${profile.knownLimitations.join('; ')}`,
    '',
    'Legacy naming rules:',
    serializeLegacyNamingRulesForLlm(),
  ].join('\n');
}
