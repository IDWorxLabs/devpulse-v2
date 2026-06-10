/**
 * User Guides — feature discovery guide analyzer.
 */

import type { FeatureDiscoveryGuideAnalysis, UserGuidesInput } from './user-guides-types.js';
import { getCachedFeatureAnalysis, setCachedFeatureAnalysis } from './user-guides-cache.js';

export interface FeatureDiscoveryGuideSnapshot {
  capabilityCount: number;
  aliasCount: number;
  hasMobileFeatures: boolean;
  hasCloudFeatures: boolean;
}

let featureAnalysisCount = 0;

export function analyzeFeatureDiscoveryGuide(
  input: UserGuidesInput,
  snapshot: FeatureDiscoveryGuideSnapshot,
): FeatureDiscoveryGuideAnalysis {
  const cacheKey = [
    snapshot.capabilityCount,
    snapshot.aliasCount,
    input.missingCapabilityDiscoveryGuidance,
    input.missingFindPanelGuidance,
    input.missingMobileFeatureGuidance,
    input.missingCloudFeatureGuidance,
    ...(input.undocumentedFeatures ?? []),
  ].join('|');

  const cached = getCachedFeatureAnalysis(cacheKey);
  if (cached) return cached;

  featureAnalysisCount += 1;
  const featureWarnings: string[] = [];
  const undocumentedFeatures: string[] = [];
  let penalty = 0;

  if (input.missingCapabilityDiscoveryGuidance === true) {
    featureWarnings.push('missing_capability_discovery_guidance');
    penalty += 12;
  }
  if (input.missingFindPanelGuidance === true) {
    featureWarnings.push('missing_find_panel_guidance');
    penalty += 10;
  }
  if (input.missingMobileFeatureGuidance === true) {
    featureWarnings.push('missing_mobile_feature_guidance');
    undocumentedFeatures.push('mobile_features');
    penalty += 8;
  }
  if (input.missingCloudFeatureGuidance === true) {
    featureWarnings.push('missing_cloud_feature_guidance');
    undocumentedFeatures.push('cloud_features');
    penalty += 8;
  }

  for (const feature of input.undocumentedFeatures ?? []) {
    undocumentedFeatures.push(feature);
    penalty += 5;
  }

  const aliasRatio = snapshot.capabilityCount > 0
    ? Math.min(1, snapshot.aliasCount / snapshot.capabilityCount)
    : 0;
  const baseScore = Math.round(
    35
      + Math.min(30, snapshot.capabilityCount / 4)
      + aliasRatio * 20
      + (snapshot.hasMobileFeatures ? 8 : 0)
      + (snapshot.hasCloudFeatures ? 7 : 0),
  );
  const featureCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: FeatureDiscoveryGuideAnalysis = {
    featureCoverageScore,
    undocumentedFeatures,
    featureWarnings,
  };

  setCachedFeatureAnalysis(cacheKey, result);
  return result;
}

export function getFeatureAnalysisCount(): number {
  return featureAnalysisCount;
}

export function resetFeatureDiscoveryGuideAnalyzerForTests(): void {
  featureAnalysisCount = 0;
}
