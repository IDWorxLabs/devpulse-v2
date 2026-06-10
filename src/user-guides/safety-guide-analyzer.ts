/**
 * User Guides — safety guide analyzer.
 */

import type { SafetyGuideAnalysis, UserGuidesInput } from './user-guides-types.js';
import { getCachedSafetyAnalysis, setCachedSafetyAnalysis } from './user-guides-cache.js';

export interface SafetyGuideSnapshot {
  hasTrustSystem: boolean;
  hasPrivacyHardening: boolean;
  hasSecurityHardening: boolean;
  hasMobileControl: boolean;
}

const BASE_SAFETY_AREAS = [
  'safe_usage',
  'verification_awareness',
  'trust_awareness',
  'notification_awareness',
  'privacy_awareness',
  'security_awareness',
  'mobile_control_awareness',
  'cloud_awareness',
] as const;

let safetyAnalysisCount = 0;

export function analyzeSafetyGuide(
  input: UserGuidesInput,
  snapshot: SafetyGuideSnapshot,
): SafetyGuideAnalysis {
  const cacheKey = [
    snapshot.hasTrustSystem,
    snapshot.hasPrivacyHardening,
    input.missingSafeUsageGuidance,
    input.missingTrustAwarenessGuidance,
    ...(input.undocumentedSafetyAreas ?? []),
  ].join('|');

  const cached = getCachedSafetyAnalysis(cacheKey);
  if (cached) return cached;

  safetyAnalysisCount += 1;
  const safetyWarnings: string[] = [];
  const undocumentedSafetyAreas: string[] = [];
  let penalty = 0;

  if (input.missingSafeUsageGuidance === true) {
    safetyWarnings.push('missing_safe_usage_guidance');
    undocumentedSafetyAreas.push('safe_usage');
    penalty += 10;
  }
  if (input.missingTrustAwarenessGuidance === true) {
    safetyWarnings.push('missing_trust_awareness_guidance');
    undocumentedSafetyAreas.push('trust_awareness');
    penalty += 9;
  }
  if (input.missingPrivacyAwarenessGuidance === true) {
    safetyWarnings.push('missing_privacy_awareness_guidance');
    undocumentedSafetyAreas.push('privacy_awareness');
    penalty += 9;
  }
  if (input.missingSecurityAwarenessGuidance === true) {
    safetyWarnings.push('missing_security_awareness_guidance');
    undocumentedSafetyAreas.push('security_awareness');
    penalty += 9;
  }
  if (input.missingMobileControlAwareness === true) {
    safetyWarnings.push('missing_mobile_control_awareness');
    undocumentedSafetyAreas.push('mobile_control_awareness');
    penalty += 8;
  }

  for (const area of input.undocumentedSafetyAreas ?? []) {
    if (!undocumentedSafetyAreas.includes(area)) {
      undocumentedSafetyAreas.push(area);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.hasTrustSystem ? 8 : 0)
    + (snapshot.hasPrivacyHardening ? 6 : 0)
    + (snapshot.hasSecurityHardening ? 6 : 0)
    + (snapshot.hasMobileControl ? 5 : 0);
  const documented = BASE_SAFETY_AREAS.length - undocumentedSafetyAreas.filter(
    (a) => BASE_SAFETY_AREAS.includes(a as typeof BASE_SAFETY_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_SAFETY_AREAS.length) * 80 + systemBonus);
  const safetyCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: SafetyGuideAnalysis = {
    safetyCoverageScore,
    undocumentedSafetyAreas,
    safetyWarnings,
  };

  setCachedSafetyAnalysis(cacheKey, result);
  return result;
}

export function getSafetyAnalysisCount(): number {
  return safetyAnalysisCount;
}

export function resetSafetyGuideAnalyzerForTests(): void {
  safetyAnalysisCount = 0;
}

export function listBaseSafetyAreas(): readonly string[] {
  return BASE_SAFETY_AREAS;
}
