/**
 * Mobile Navigation Analyzer — navigation usability review (V1).
 */

import type { MobileNavigationReview, PreviewEvidenceBundle } from './mobile-preview-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasComponent(components: readonly string[], token: string): boolean {
  return components.some((c) => c.includes(token));
}

export function analyzeMobileNavigation(evidence: PreviewEvidenceBundle): MobileNavigationReview {
  const bottomNavigationPresent = hasComponent(evidence.components, 'BOTTOM_NAVIGATION');
  const sideNavigationPresent =
    hasComponent(evidence.components, 'SIDEBAR') || hasComponent(evidence.components, 'NAVIGATION');
  const tabStructureDetected =
    bottomNavigationPresent ||
    (sideNavigationPresent && evidence.flows.length >= 2) ||
    evidence.layoutRegions.some((r) => r.includes('NAVIGATION'));

  let menuComplexity: MobileNavigationReview['menuComplexity'] = 'LOW';
  if (evidence.screenCount >= 5 || evidence.workflowCount >= 4) menuComplexity = 'HIGH';
  else if (evidence.screenCount >= 3 || evidence.workflowCount >= 2) menuComplexity = 'MEDIUM';

  let discoverability: MobileNavigationReview['discoverability'] = 'FAIR';
  if (bottomNavigationPresent && menuComplexity !== 'HIGH') discoverability = 'GOOD';
  if (!bottomNavigationPresent && !sideNavigationPresent && evidence.screenCount >= 3) discoverability = 'POOR';
  if (sideNavigationPresent && evidence.sourcePlatform === 'MOBILE') discoverability = 'FAIR';

  const findings: string[] = [];
  if (bottomNavigationPresent) findings.push('BOTTOM_NAVIGATION_DETECTED');
  if (sideNavigationPresent) findings.push('SIDE_OR_TOP_NAVIGATION_DETECTED');
  if (tabStructureDetected) findings.push('TAB_STRUCTURE_LIKELY');
  if (menuComplexity === 'HIGH') findings.push('HIGH_MENU_COMPLEXITY');
  if (discoverability === 'POOR') findings.push('NAVIGATION_DISCOVERABILITY_POOR');

  let score = 50;
  if (bottomNavigationPresent) score += 18;
  if (tabStructureDetected) score += 10;
  if (discoverability === 'GOOD') score += 12;
  if (discoverability === 'POOR') score -= 15;
  if (menuComplexity === 'HIGH') score -= 12;
  if (menuComplexity === 'LOW') score += 8;
  if (evidence.flows.some((f) => f.includes('ONBOARDING'))) score += 5;

  return {
    readOnly: true,
    bottomNavigationPresent,
    sideNavigationPresent,
    tabStructureDetected,
    menuComplexity,
    discoverability,
    navigationUsabilityScore: clamp(score),
    findings,
    evidence: evidence.sources,
  };
}
