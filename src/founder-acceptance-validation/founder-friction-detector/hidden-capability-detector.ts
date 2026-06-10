/**
 * Founder Friction Detector — hidden capability detector.
 */

import type { FounderFrictionDetectorInput, DiscoverabilityFrictionDetection } from './founder-friction-types.js';
import { DISCOVERABILITY_FRICTION_PASS, clampScore } from './founder-friction-types.js';
import { boundGaps, createFrictionGap } from './friction-gap-model.js';
import { getCachedDetectorResult, setCachedDetectorResult } from './founder-friction-cache.js';

export interface DiscoverabilityFrictionUpstream {
  discoverabilityScore: number;
  findPanelAliasCount: number;
  capabilityCount: number;
  uvlDiscoverable: boolean;
}

let detectCount = 0;

export function detectDiscoverabilityFriction(
  input: FounderFrictionDetectorInput,
  upstream: DiscoverabilityFrictionUpstream,
): DiscoverabilityFrictionDetection {
  const cacheKey = [input.requestId, upstream.discoverabilityScore, input.hiddenCapabilities].join('|');
  const cached = getCachedDetectorResult(cacheKey);
  if (cached && cached.passToken === DISCOVERABILITY_FRICTION_PASS) return cached as DiscoverabilityFrictionDetection;

  detectCount += 1;
  const gaps = [];
  const detectionCodes: string[] = [];
  const surfaceBonus = upstream.uvlDiscoverable ? 5 : -8;
  const baseScore = Math.round(upstream.discoverabilityScore + surfaceBonus);

  if (input.hiddenCapabilities === true || baseScore < 70) {
    detectionCodes.push('DISCOVERABILITY_FRICTION');
    gaps.push(createFrictionGap({
      title: 'Hidden or inaccessible capabilities block founder',
      description: 'Discoverability failures prevent founder from finding features, workflows, or paths',
      severity: baseScore < 55 ? 'CRITICAL' : 'MAJOR',
      detectionCode: 'DISCOVERABILITY_FRICTION',
      sourceDetector: 'hidden-capability-detector',
      frictionContext: 'DISCOVERABILITY_FRICTION',
    }));
  }
  if (upstream.findPanelAliasCount < 20) {
    gaps.push(createFrictionGap({
      title: 'Limited find panel coverage for capabilities',
      description: 'Few discoverability aliases may hide capabilities from founder',
      severity: 'MINOR',
      detectionCode: 'DISCOVERABILITY_GAPS',
      sourceDetector: 'hidden-capability-detector',
    }));
  }

  const score = clampScore(baseScore - gaps.length * 4);
  const result: DiscoverabilityFrictionDetection = {
    detectorType: 'DISCOVERABILITY_FRICTION',
    score,
    detectionCodes,
    gaps: boundGaps(gaps),
    passToken: DISCOVERABILITY_FRICTION_PASS,
  };
  setCachedDetectorResult(cacheKey, result);
  return result;
}

export function getDiscoverabilityDetectCount(): number {
  return detectCount;
}

export function resetHiddenCapabilityDetectorForTests(): void {
  detectCount = 0;
}
