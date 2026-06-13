/**
 * Platform Alignment Analyzer — true vs false platform conflicts (V1).
 */

import { detectProductDomain, normalizePlatform } from './evidence-normalizer.js';
import type { AlignmentEvidenceBundle, PlatformAlignmentResult } from './intake-alignment-types.js';

export function analyzePlatformAlignment(bundle: AlignmentEvidenceBundle): PlatformAlignmentResult {
  const platforms = new Set(
    bundle.platforms.map((p) => normalizePlatform(p)).filter(Boolean) as import('./intake-alignment-types.js').NormalizedPlatform[],
  );

  const promptLower = bundle.typedPrompt.toLowerCase();
  const transportDomain = detectProductDomain(bundle.typedPrompt) === 'TRANSPORTATION' ||
    /ride.?shar|uber|driver|rider|transport/.test(promptLower);

  if (platforms.has('MOBILE') && transportDomain) {
    platforms.delete('WEB');
  }

  if (platforms.size >= 2 && platforms.has('MOBILE') && platforms.has('WEB')) {
    const webOnlyTyped = /\bweb.?only\b|\bweb app\b|\bdesktop users\b|\bbrowser only\b/.test(promptLower);
    const mobileOnlyVoice = bundle.roles.some((r) => /driver|rider/i.test(r)) && !webOnlyTyped;

    if (mobileOnlyVoice && !webOnlyTyped) {
      return {
        readOnly: true,
        platforms: ['MOBILE'],
        truePlatformConflict: false,
        alignmentScore: 88,
        evidence: ['TRANSPORT_MOBILE_COHERENT', 'COMPLEMENTARY_SOURCES'],
      };
    }

    return {
      readOnly: true,
      platforms: [...platforms],
      truePlatformConflict: webOnlyTyped || platforms.size >= 2,
      alignmentScore: webOnlyTyped ? 25 : 55,
      evidence: ['MOBILE_WEB_BOTH_PRESENT', webOnlyTyped ? 'WEB_ONLY_TYPED' : 'MULTI_PLATFORM'],
    };
  }

  const platformList = platforms.size > 1 ? (['MULTI_PLATFORM'] as const) : [...platforms];
  return {
    readOnly: true,
    platforms: platformList.length ? platformList : ['MOBILE'],
    truePlatformConflict: false,
    alignmentScore: platforms.size >= 1 ? 85 : 40,
    evidence: [`PLATFORMS_${platforms.size}`],
  };
}
