/**
 * Preview Layout Analyzer — per-device layout behavior prediction (V1).
 */

import { isDesktopProfile, isPhoneProfile } from './device-profile-library.js';
import type { DeviceProfile } from './mobile-preview-types.js';
import type { PreviewEvidenceBundle, PreviewLayoutBehavior } from './mobile-preview-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasComponent(components: readonly string[], token: string): boolean {
  return components.some((c) => c.includes(token));
}

function hasLayout(regions: readonly string[], region: string): boolean {
  return regions.some((r) => r.toUpperCase() === region || r.includes(region));
}

export function analyzePreviewLayoutForProfile(
  profile: DeviceProfile,
  evidence: PreviewEvidenceBundle,
): PreviewLayoutBehavior {
  const evidenceNotes: string[] = [`PROFILE_${profile.profileId}`];
  const widthRatio = profile.viewportWidth / evidence.sourceWidth;
  const heightRatio = profile.viewportHeight / evidence.sourceHeight;
  const scaleFactor = Math.min(widthRatio, heightRatio);

  let screenFit: PreviewLayoutBehavior['screenFit'] = 'GOOD';
  if (scaleFactor < 0.75) screenFit = 'POOR';
  else if (scaleFactor < 0.9) screenFit = 'FAIR';
  else if (scaleFactor >= 1.05) screenFit = 'EXCELLENT';

  const hasSidebar = hasLayout(evidence.layoutRegions, 'SIDEBAR') || hasComponent(evidence.components, 'SIDEBAR');
  const hasBottomNav =
    hasComponent(evidence.components, 'BOTTOM_NAVIGATION') || hasLayout(evidence.layoutRegions, 'NAVIGATION');
  const hasCards = hasLayout(evidence.layoutRegions, 'CARDS') || hasComponent(evidence.components, 'CARD');
  const hasForms = hasLayout(evidence.layoutRegions, 'FORMS') || hasComponent(evidence.components, 'FORM');
  const isDashboard = evidence.flows.some((f) => f.includes('DASHBOARD')) || hasCards;

  let likelyLayoutBehavior = 'Single-column stacked layout';
  let navigationBehavior = 'Top header navigation';
  let contentDensity: PreviewLayoutBehavior['contentDensity'] = 'MEDIUM';

  if (isDesktopProfile(profile)) {
    if (hasSidebar) {
      likelyLayoutBehavior = 'Sidebar + main content split layout';
      navigationBehavior = 'Persistent side navigation with header';
    } else {
      likelyLayoutBehavior = 'Wide content canvas with header/footer bands';
      navigationBehavior = 'Horizontal top navigation';
    }
    contentDensity = evidence.screenCount >= 4 ? 'HIGH' : 'MEDIUM';
  } else if (profile.category === 'TABLET') {
    likelyLayoutBehavior = hasSidebar ? 'Two-pane tablet layout' : 'Adaptive two-column layout';
    navigationBehavior = hasBottomNav ? 'Bottom navigation with optional side rail' : 'Top tab navigation';
    contentDensity = hasCards ? 'MEDIUM' : 'LOW';
  } else if (isPhoneProfile(profile)) {
    likelyLayoutBehavior = hasSidebar
      ? 'Collapsed sidebar into drawer/hamburger pattern required'
      : 'Single-column mobile stack';
    navigationBehavior = hasBottomNav
      ? 'Bottom tab navigation'
      : hasForms
        ? 'Minimal header with back/action controls'
        : 'Compact top navigation';
    contentDensity = isDashboard && hasCards ? 'HIGH' : evidence.screenCount >= 3 ? 'MEDIUM' : 'LOW';
  }

  if (profile.viewportWidth < 380 && hasSidebar) {
    screenFit = 'POOR';
    evidenceNotes.push('SIDEBAR_ON_NARROW_VIEWPORT');
  }

  if (isDashboard && isPhoneProfile(profile) && evidence.workflowCount >= 3) {
    contentDensity = 'VERY_HIGH';
    evidenceNotes.push('DENSE_DASHBOARD_ON_PHONE');
  }

  let confidence = 55;
  confidence += evidence.sources.length * 8;
  if (evidence.components.length > 0) confidence += 10;
  if (evidence.sourceWidth > 0) confidence += 5;

  return {
    readOnly: true,
    profileId: profile.profileId,
    likelyLayoutBehavior,
    navigationBehavior,
    screenFit,
    contentDensity,
    confidence: clamp(confidence),
    evidence: evidenceNotes,
  };
}

export function analyzePreviewLayouts(
  profiles: readonly DeviceProfile[],
  evidence: PreviewEvidenceBundle,
): PreviewLayoutBehavior[] {
  return profiles.map((profile) => analyzePreviewLayoutForProfile(profile, evidence));
}
