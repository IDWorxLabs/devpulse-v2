/**
 * Visual QA Engine — visual hierarchy analyzer.
 */

import type { VisualHierarchyAnalysis, VisualQAInput } from './visual-qa-types.js';
import { VISUAL_HIERARCHY_PASS, clampScore } from './visual-qa-types.js';
import { getCachedVisualHierarchy, setCachedVisualHierarchy } from './visual-qa-cache.js';

export interface VisualHierarchySnapshot {
  hasNavigationPanel: boolean;
  hasStatusBar: boolean;
  hasPrimaryWorkspace: boolean;
  hasOperatorFeed: boolean;
}

let hierarchyAnalysisCount = 0;

export function analyzeVisualHierarchy(
  input: VisualQAInput,
  snapshot: VisualHierarchySnapshot,
): VisualHierarchyAnalysis {
  const cacheKey = [
    input.missingPrimaryAction,
    input.missingPrimaryInformation,
    input.missingNavigationClarity,
    input.missingStatusIndicators,
    snapshot.hasNavigationPanel,
    snapshot.hasStatusBar,
  ].join('|');

  const cached = getCachedVisualHierarchy(cacheKey);
  if (cached) return cached;

  hierarchyAnalysisCount += 1;
  const hierarchyWarnings: string[] = [];
  let penalty = 0;

  const primaryActionVisible = input.missingPrimaryAction !== true;
  const primaryInformationVisible = input.missingPrimaryInformation !== true;
  const navigationVisible = input.missingNavigationClarity !== true && snapshot.hasNavigationPanel;
  const statusIndicatorsVisible = input.missingStatusIndicators !== true && snapshot.hasStatusBar;

  if (!primaryActionVisible) { hierarchyWarnings.push('primary_action_not_identifiable'); penalty += 18; }
  if (!primaryInformationVisible) { hierarchyWarnings.push('primary_information_obscured'); penalty += 16; }
  if (!navigationVisible) { hierarchyWarnings.push('navigation_hierarchy_weak'); penalty += 14; }
  if (!statusIndicatorsVisible) { hierarchyWarnings.push('status_indicators_unclear'); penalty += 12; }

  const structureBonus =
    (snapshot.hasPrimaryWorkspace ? 12 : 0)
    + (snapshot.hasOperatorFeed ? 8 : 0)
    + (snapshot.hasNavigationPanel ? 10 : 0)
    + (snapshot.hasStatusBar ? 8 : 0);

  const hierarchyScore = clampScore(88 + structureBonus - penalty);

  const result: VisualHierarchyAnalysis = {
    hierarchyScore,
    primaryActionVisible,
    primaryInformationVisible,
    navigationVisible,
    statusIndicatorsVisible,
    hierarchyWarnings,
    passToken: VISUAL_HIERARCHY_PASS,
  };

  setCachedVisualHierarchy(cacheKey, result);
  return result;
}

export function getHierarchyAnalysisCount(): number {
  return hierarchyAnalysisCount;
}

export function resetVisualHierarchyAnalyzerForTests(): void {
  hierarchyAnalysisCount = 0;
}
