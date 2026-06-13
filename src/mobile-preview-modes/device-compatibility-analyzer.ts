/**
 * Device Compatibility Analyzer — per-category compatibility scoring (V1).
 */

import { getProfilesByCategory } from './device-profile-library.js';
import type {
  DeviceCategory,
  DeviceCompatibilityResult,
  PreviewEvidenceBundle,
  PreviewLayoutBehavior,
  ResponsiveRiskAnalysis,
} from './mobile-preview-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreProfile(
  behavior: PreviewLayoutBehavior,
  category: DeviceCategory,
  risks: ResponsiveRiskAnalysis,
): { score: number; summary: string } {
  let score = 72;

  const fitScore = { POOR: 35, FAIR: 58, GOOD: 78, EXCELLENT: 92 }[behavior.screenFit];
  score = fitScore;

  const densityPenalty = { LOW: 0, MEDIUM: 4, HIGH: 12, VERY_HIGH: 22 }[behavior.contentDensity];
  score -= densityPenalty;

  const profileRisks = risks.risks.filter(
    (r) => r.profileId === behavior.profileId || r.profileId === 'ALL',
  );
  score -= profileRisks.filter((r) => r.severity === 'CRITICAL').length * 18;
  score -= profileRisks.filter((r) => r.severity === 'HIGH').length * 10;
  score -= profileRisks.filter((r) => r.severity === 'MEDIUM').length * 5;

  if (category === 'DESKTOP' && behavior.likelyLayoutBehavior.includes('Sidebar')) score += 5;
  if ((category === 'ANDROID_PHONE' || category === 'IPHONE') && behavior.navigationBehavior.includes('Bottom')) {
    score += 8;
  }

  score = clamp(score);

  return {
    score,
    summary: `${behavior.screenFit} fit, ${behavior.contentDensity.toLowerCase()} density — ${behavior.likelyLayoutBehavior}`,
  };
}

export function analyzeDeviceCompatibility(input: {
  evidence: PreviewEvidenceBundle;
  layoutBehaviors: readonly PreviewLayoutBehavior[];
  responsiveRiskAnalysis: ResponsiveRiskAnalysis;
}): DeviceCompatibilityResult[] {
  const categories: DeviceCategory[] = ['ANDROID_PHONE', 'IPHONE', 'TABLET', 'DESKTOP'];
  const results: DeviceCompatibilityResult[] = [];

  for (const category of categories) {
    const profiles = getProfilesByCategory(category);
    const profileScores = profiles.map((profile) => {
      const behavior = input.layoutBehaviors.find((b) => b.profileId === profile.profileId)!;
      const scored = scoreProfile(behavior, category, input.responsiveRiskAnalysis);
      return {
        profileId: profile.profileId,
        score: scored.score,
        summary: scored.summary,
      };
    });

    const deviceCompatibilityScore =
      profileScores.length === 0
        ? 0
        : clamp(profileScores.reduce((sum, p) => sum + p.score, 0) / profileScores.length);

    results.push({
      readOnly: true,
      category,
      deviceCompatibilityScore,
      profileScores,
    });
  }

  return results;
}

export function generateDeviceRecommendations(input: {
  evidence: PreviewEvidenceBundle;
  responsiveRiskAnalysis: ResponsiveRiskAnalysis;
  navigationReview: { navigationUsabilityScore: number; menuComplexity: string; discoverability: string };
  deviceCompatibility: readonly DeviceCompatibilityResult[];
}): import('./mobile-preview-types.js').DeviceRecommendation[] {
  const recommendations: import('./mobile-preview-types.js').DeviceRecommendation[] = [];
  let counter = 0;

  const push = (
    title: string,
    rationale: string,
    targetCategories: DeviceCategory[],
    expectedImpact: string,
    confidence: number,
    evidence: string[],
  ) => {
    counter += 1;
    recommendations.push({
      readOnly: true,
      recommendationId: `device-rec-${counter}`,
      title,
      rationale,
      targetCategories,
      expectedImpact,
      confidence: clamp(confidence),
      evidence,
    });
  };

  for (const risk of input.responsiveRiskAnalysis.risks) {
    if (risk.riskType === 'DASHBOARD_DENSITY_ISSUE') {
      push(
        'Reduce dashboard density',
        risk.description,
        ['ANDROID_PHONE', 'IPHONE'],
        'Improves readability and scroll performance on narrow viewports.',
        78,
        [...risk.evidence],
      );
    }
    if (risk.riskType === 'NAVIGATION_CROWDING') {
      push(
        'Simplify navigation',
        risk.description,
        ['ANDROID_PHONE', 'IPHONE', 'TABLET'],
        'Reduces navigation crowding and improves discoverability.',
        80,
        [...risk.evidence],
      );
    }
    if (risk.riskType === 'OVERFLOW_RISK') {
      push(
        'Redesign mobile layout',
        risk.description,
        ['ANDROID_PHONE', 'IPHONE'],
        'Prevents horizontal overflow and content clipping.',
        76,
        [...risk.evidence],
      );
    }
    if (risk.riskType === 'TOUCH_TARGET_ISSUE') {
      push(
        'Increase touch target size',
        risk.description,
        ['ANDROID_PHONE', 'IPHONE'],
        'Meets minimum touch target guidance for mobile preview modes.',
        82,
        [...risk.evidence],
      );
    }
    if (risk.riskType === 'MODAL_SIZE_ISSUE') {
      push(
        'Adjust modal sizing for mobile',
        risk.description,
        ['ANDROID_PHONE', 'IPHONE'],
        'Keeps modal actions reachable without viewport overflow.',
        74,
        [...risk.evidence],
      );
    }
  }

  if (input.navigationReview.menuComplexity === 'HIGH') {
    push(
      'Split workflow across focused screens',
      'High menu complexity detected across multiple flows.',
      ['ANDROID_PHONE', 'IPHONE', 'TABLET'],
      'Reduces cognitive load and navigation depth.',
      75,
      ['HIGH_MENU_COMPLEXITY'],
    );
  }

  const phoneCompat = input.deviceCompatibility.filter((d) => d.category === 'ANDROID_PHONE' || d.category === 'IPHONE');
  if (phoneCompat.some((d) => d.deviceCompatibilityScore < 60)) {
    push(
      'Prioritize mobile-first layout adjustments',
      'Phone compatibility scores are below preview readiness threshold.',
      ['ANDROID_PHONE', 'IPHONE'],
      'Raises cross-device preview confidence before runtime preview systems consume this layer.',
      77,
      ['LOW_PHONE_COMPATIBILITY'],
    );
  }

  if (recommendations.length === 0) {
    push(
      'Validate preview modes against additional screen references',
      'No major responsive risks detected from current evidence.',
      ['ANDROID_PHONE', 'IPHONE', 'TABLET', 'DESKTOP'],
      'Confirms baseline preview readiness across device profiles.',
      65,
      ['NO_MAJOR_RISKS'],
    );
  }

  const seen = new Set<string>();
  return recommendations.filter((r) => {
    const key = r.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

export function computePreviewReadiness(input: {
  deviceCompatibility: readonly DeviceCompatibilityResult[];
  navigationReview: { navigationUsabilityScore: number };
  responsiveRiskAnalysis: ResponsiveRiskAnalysis;
  evidence: PreviewEvidenceBundle;
}): {
  previewReadinessScore: number;
  previewReadinessCategory: import('./mobile-preview-types.js').PreviewReadinessCategory;
  mobilePreviewReadiness: import('./mobile-preview-types.js').MobilePreviewReadiness;
  confidenceScore: number;
} {
  const avgCompat =
    input.deviceCompatibility.reduce((sum, d) => sum + d.deviceCompatibilityScore, 0) /
    Math.max(1, input.deviceCompatibility.length);

  let score = avgCompat * 0.55 + input.navigationReview.navigationUsabilityScore * 0.25;
  score -= input.responsiveRiskAnalysis.risks.filter((r) => r.severity === 'CRITICAL').length * 12;
  score -= input.responsiveRiskAnalysis.risks.filter((r) => r.severity === 'HIGH').length * 6;
  if (input.evidence.sources.length >= 2) score += 5;

  const previewReadinessScore = clamp(score);

  let previewReadinessCategory: import('./mobile-preview-types.js').PreviewReadinessCategory = 'NOT_READY';
  if (previewReadinessScore >= 90) previewReadinessCategory = 'READY_FOR_PREVIEW';
  else if (previewReadinessScore >= 70) previewReadinessCategory = 'READY_WITH_ADJUSTMENTS';
  else if (previewReadinessScore >= 40) previewReadinessCategory = 'HIGH_RISK';

  const mobilePreviewReadiness = previewReadinessCategory;

  let confidenceScore = 50 + input.evidence.sources.length * 10;
  if (input.evidence.components.length >= 3) confidenceScore += 10;
  confidenceScore = clamp(confidenceScore);

  return { previewReadinessScore, previewReadinessCategory, mobilePreviewReadiness, confidenceScore };
}
