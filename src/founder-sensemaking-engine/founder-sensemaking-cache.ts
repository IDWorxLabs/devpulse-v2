/**
 * Founder Sensemaking — bounded assessment cache keyed by workspace generation time.
 */

import type { FounderSensemakingAssessment } from './founder-sensemaking-types.js';

let cachedKey: string | null = null;
let cachedAssessment: FounderSensemakingAssessment | null = null;

export function getCachedFounderSensemaking(key: string): FounderSensemakingAssessment | null {
  if (cachedKey === key && cachedAssessment) return cachedAssessment;
  return null;
}

export function setCachedFounderSensemaking(key: string, assessment: FounderSensemakingAssessment): void {
  cachedKey = key;
  cachedAssessment = assessment;
}

export function resetFounderSensemakingCacheForTests(): void {
  cachedKey = null;
  cachedAssessment = null;
}
