/**
 * UX Heuristic Evaluator — feature discoverability analyzer.
 */

import type { FeatureDiscoverabilityAnalysis, UXHeuristicInput } from './ux-heuristic-types.js';
import { FEATURE_DISCOVERABILITY_PASS, clampScore } from './ux-heuristic-types.js';
import { getCachedFeatureDiscoverability, setCachedFeatureDiscoverability } from './ux-heuristic-cache.js';

export const BASE_DISCOVERABLE_FEATURES = [
  'Chat',
  'Operator Feed',
  'UVL',
  'World 2',
  'Project Vault',
  'Notifications',
  'Founder Reality',
] as const;

export interface FeatureDiscoverabilitySnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  notificationPresent: boolean;
  founderRealityPresent: boolean;
  world2NavPresent: boolean;
  projectVaultNavPresent: boolean;
}

let discoverabilityAnalysisCount = 0;

export function analyzeFeatureDiscoverability(
  input: UXHeuristicInput,
  snapshot: FeatureDiscoverabilitySnapshot,
): FeatureDiscoverabilityAnalysis {
  const cacheKey = [
    input.featureHidden,
    input.featureDiscoverabilityRisk,
    input.unlabeledCapability,
    ...(input.hiddenFeatures ?? []),
    snapshot.chatPresent,
  ].join('|');

  const cached = getCachedFeatureDiscoverability(cacheKey);
  if (cached) return cached;

  discoverabilityAnalysisCount += 1;
  const discoverabilityProblems: string[] = [];
  const hiddenFeatures: string[] = [];
  let penalty = 0;

  const featureHidden = input.featureHidden === true;
  const featureDiscoverabilityRisk = input.featureDiscoverabilityRisk === true;
  const unlabeledCapability = input.unlabeledCapability === true;

  if (featureHidden) { discoverabilityProblems.push('FEATURE_HIDDEN'); penalty += 18; }
  if (featureDiscoverabilityRisk) { discoverabilityProblems.push('FEATURE_DISCOVERABILITY_RISK'); penalty += 16; }
  if (unlabeledCapability) { discoverabilityProblems.push('UNLABELED_CAPABILITY'); penalty += 14; }

  const surfaceMap: Array<[boolean, string]> = [
    [snapshot.chatPresent, 'Chat'],
    [snapshot.operatorFeedPresent, 'Operator Feed'],
    [snapshot.notificationPresent, 'Notifications'],
    [snapshot.founderRealityPresent, 'Founder Reality'],
    [snapshot.world2NavPresent, 'World 2'],
    [snapshot.projectVaultNavPresent, 'Project Vault'],
  ];

  for (const [present, name] of surfaceMap) {
    if (!present) hiddenFeatures.push(name);
  }

  for (const feature of input.hiddenFeatures ?? []) {
    if (!hiddenFeatures.includes(feature)) hiddenFeatures.push(feature);
    penalty += 5;
  }

  const visibleCount = surfaceMap.filter(([p]) => p).length;
  const featureDiscoverabilityScore = clampScore(
    Math.round((visibleCount / surfaceMap.length) * 78 + 12 - penalty),
  );

  const result: FeatureDiscoverabilityAnalysis = {
    featureDiscoverabilityScore,
    featureHidden,
    featureDiscoverabilityRisk,
    unlabeledCapability,
    hiddenFeatures,
    discoverabilityProblems,
    passToken: FEATURE_DISCOVERABILITY_PASS,
  };

  setCachedFeatureDiscoverability(cacheKey, result);
  return result;
}

export function getDiscoverabilityAnalysisCount(): number {
  return discoverabilityAnalysisCount;
}

export function resetFeatureDiscoverabilityAnalyzerForTests(): void {
  discoverabilityAnalysisCount = 0;
}

export function listBaseDiscoverableFeatures(): readonly string[] {
  return BASE_DISCOVERABLE_FEATURES;
}
