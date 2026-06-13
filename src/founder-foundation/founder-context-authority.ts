/**
 * Phase 26.3 — Founder foundation authority (read-only product context).
 */

import { CANONICAL_FOUNDER_PROFILE } from './founder-profile.js';
import type { FounderProfile } from './founder-profile.js';

export interface FounderFoundationSnapshot {
  readOnly: true;
  profile: FounderProfile;
  loadedAt: number;
}

export function getFounderProfile(): FounderProfile {
  return CANONICAL_FOUNDER_PROFILE;
}

export function loadFounderFoundation(): FounderFoundationSnapshot {
  return {
    readOnly: true,
    profile: getFounderProfile(),
    loadedAt: Date.now(),
  };
}

export function serializeFounderForLlm(profile: FounderProfile = getFounderProfile()): string {
  return [
    `Founder: ${profile.founderName}`,
    `Organization: ${profile.organization}`,
    `Role: ${profile.role}`,
    `Product relationship: ${profile.productRelationship}`,
    `Product vision: ${profile.productVision}`,
    `Current focus: ${profile.currentFocus.join('; ')}`,
    `Major goals: ${profile.majorGoals.join('; ')}`,
  ].join('\n');
}
