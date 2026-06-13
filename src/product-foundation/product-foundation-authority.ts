/**
 * Phase 26.3 — Product foundation authority (read-only).
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { CANONICAL_PRODUCT_PROFILE } from './product-profile.js';
import type { ProductProfile } from './product-profile.js';

export interface ProductFoundationSnapshot {
  readOnly: true;
  profile: ProductProfile;
  loadedAt: number;
}

export function getProductProfile(): ProductProfile {
  const roadmap = getBrainRoadmapContext();
  return {
    ...CANONICAL_PRODUCT_PROFILE,
    currentPhase: roadmap.currentPhase ?? CANONICAL_PRODUCT_PROFILE.currentPhase,
  };
}

export function loadProductFoundation(): ProductFoundationSnapshot {
  return {
    readOnly: true,
    profile: getProductProfile(),
    loadedAt: Date.now(),
  };
}

export function serializeProductForLlm(profile: ProductProfile = getProductProfile()): string {
  return [
    `Current product: ${profile.productName}`,
    `Description: ${profile.productDescription}`,
    `Primary interface: ${profile.primaryInterface}`,
    `Goal: ${profile.goal}`,
    `Major systems: ${profile.majorSystems.join('; ')}`,
    `Current phase: ${profile.currentPhase}`,
    `Current maturity: ${profile.currentMaturity}`,
    `Legacy product name (historical only): ${profile.legacyProductName}`,
    `Legacy note: ${profile.legacyNote}`,
  ].join('\n');
}
