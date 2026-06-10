/**
 * Founder Guides — system navigation guide analyzer.
 */

import type { FounderGuidesInput, SystemNavigationGuideAnalysis } from './founder-guides-types.js';
import { getCachedNavigationAnalysis, setCachedNavigationAnalysis } from './founder-guides-cache.js';

export interface SystemNavigationGuideSnapshot {
  capabilityCount: number;
  aliasCount: number;
  ownerCount: number;
  authorityChainCount: number;
}

let navigationAnalysisCount = 0;

export function analyzeSystemNavigationGuide(
  input: FounderGuidesInput,
  snapshot: SystemNavigationGuideSnapshot,
): SystemNavigationGuideAnalysis {
  const cacheKey = [
    snapshot.capabilityCount,
    snapshot.aliasCount,
    input.missingCapabilityDiscovery,
    input.missingFindPanelAliases,
    input.missingOwnershipMapping,
    input.missingAuthorityChainNavigation,
    ...(input.undocumentedNavigationAreas ?? []),
  ].join('|');

  const cached = getCachedNavigationAnalysis(cacheKey);
  if (cached) return cached;

  navigationAnalysisCount += 1;
  const navigationWarnings: string[] = [];
  const undocumentedNavigationAreas: string[] = [];
  let penalty = 0;

  if (input.missingCapabilityDiscovery === true) {
    navigationWarnings.push('missing_capability_discovery');
    penalty += 12;
  }
  if (input.missingFindPanelAliases === true) {
    navigationWarnings.push('missing_find_panel_aliases');
    penalty += 10;
  }
  if (input.missingOwnershipMapping === true) {
    navigationWarnings.push('missing_ownership_mapping');
    penalty += 10;
  }
  if (input.missingAuthorityChainNavigation === true) {
    navigationWarnings.push('missing_authority_chain_navigation');
    penalty += 10;
  }

  for (const area of input.undocumentedNavigationAreas ?? []) {
    undocumentedNavigationAreas.push(area);
    penalty += 6;
  }

  const aliasRatio = snapshot.capabilityCount > 0
    ? Math.min(1, snapshot.aliasCount / snapshot.capabilityCount)
    : 0;
  const baseScore = Math.round(
    40
      + Math.min(25, snapshot.capabilityCount / 4)
      + aliasRatio * 20
      + Math.min(15, snapshot.ownerCount / 5)
      + Math.min(10, snapshot.authorityChainCount * 2),
  );
  const navigationCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: SystemNavigationGuideAnalysis = {
    navigationCoverageScore,
    navigationWarnings,
    undocumentedNavigationAreas,
  };

  setCachedNavigationAnalysis(cacheKey, result);
  return result;
}

export function getNavigationAnalysisCount(): number {
  return navigationAnalysisCount;
}

export function resetSystemNavigationGuideAnalyzerForTests(): void {
  navigationAnalysisCount = 0;
}
