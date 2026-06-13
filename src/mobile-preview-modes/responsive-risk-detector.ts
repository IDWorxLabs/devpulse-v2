/**
 * Responsive Risk Detector — overflow, navigation, touch, modal, density risks (V1).
 */

import { isDesktopProfile, isPhoneProfile } from './device-profile-library.js';
import type {
  DeviceProfile,
  PreviewEvidenceBundle,
  PreviewLayoutBehavior,
  ResponsiveRiskAnalysis,
  ResponsiveRiskItem,
  ResponsiveRiskSeverity,
} from './mobile-preview-types.js';

function hasComponent(components: readonly string[], token: string): boolean {
  return components.some((c) => c.includes(token));
}

function hasLayout(regions: readonly string[], region: string): boolean {
  return regions.some((r) => r.toUpperCase().includes(region));
}

function pushRisk(
  risks: ResponsiveRiskItem[],
  riskType: ResponsiveRiskItem['riskType'],
  severity: ResponsiveRiskSeverity,
  profileId: ResponsiveRiskItem['profileId'],
  description: string,
  evidence: string[],
): void {
  risks.push({
    readOnly: true,
    riskType,
    severity,
    profileId,
    description,
    evidence,
  });
}

export function detectResponsiveRisks(input: {
  evidence: PreviewEvidenceBundle;
  profiles: readonly DeviceProfile[];
  layoutBehaviors: readonly PreviewLayoutBehavior[];
}): ResponsiveRiskAnalysis {
  const risks: ResponsiveRiskItem[] = [];
  const { evidence } = input;

  const hasSidebar = hasLayout(evidence.layoutRegions, 'SIDEBAR') || hasComponent(evidence.components, 'SIDEBAR');
  const hasBottomNav = hasComponent(evidence.components, 'BOTTOM_NAVIGATION');
  const hasModal = hasComponent(evidence.components, 'MODAL');
  const hasCards = hasLayout(evidence.layoutRegions, 'CARDS') || hasComponent(evidence.components, 'CARD');
  const hasButtonGroup = hasComponent(evidence.components, 'BUTTON_GROUP');
  const isDashboard = evidence.flows.some((f) => f.includes('DASHBOARD'));

  for (const behavior of input.layoutBehaviors) {
    const profile = input.profiles.find((p) => p.profileId === behavior.profileId)!;

    if (behavior.screenFit === 'POOR') {
      pushRisk(
        risks,
        'OVERFLOW_RISK',
        'HIGH',
        profile.profileId,
        `Content likely overflows on ${profile.label} (${profile.viewportWidth}x${profile.viewportHeight}).`,
        ['SCREEN_FIT_POOR', ...behavior.evidence],
      );
    }

    if (behavior.contentDensity === 'VERY_HIGH' && isPhoneProfile(profile)) {
      pushRisk(
        risks,
        'DASHBOARD_DENSITY_ISSUE',
        'HIGH',
        profile.profileId,
        `Dashboard density is too high for ${profile.label}.`,
        ['DASHBOARD_DENSITY', ...behavior.evidence],
      );
    }

    if (hasSidebar && isPhoneProfile(profile)) {
      pushRisk(
        risks,
        'NAVIGATION_CROWDING',
        'CRITICAL',
        profile.profileId,
        `Sidebar layout will crowd navigation on ${profile.label}.`,
        ['SIDEBAR_ON_PHONE'],
      );
    }

    if (!hasBottomNav && isPhoneProfile(profile) && evidence.screenCount >= 3) {
      pushRisk(
        risks,
        'NAVIGATION_CROWDING',
        'MEDIUM',
        profile.profileId,
        `Multi-screen mobile experience lacks bottom navigation on ${profile.label}.`,
        ['MISSING_BOTTOM_NAV'],
      );
    }

    if (hasButtonGroup && isPhoneProfile(profile) && profile.viewportWidth < 390) {
      pushRisk(
        risks,
        'TOUCH_TARGET_ISSUE',
        'HIGH',
        profile.profileId,
        `Button groups may produce undersized touch targets on ${profile.label}.`,
        ['BUTTON_GROUP_NARROW'],
      );
    }

    if (hasModal && isPhoneProfile(profile)) {
      pushRisk(
        risks,
        'MODAL_SIZE_ISSUE',
        'MEDIUM',
        profile.profileId,
        `Modal overlays may exceed safe viewport height on ${profile.label}.`,
        ['MODAL_ON_PHONE'],
      );
    }
  }

  if (isDashboard && hasCards && evidence.screenCount >= 4) {
    pushRisk(
      risks,
      'DASHBOARD_DENSITY_ISSUE',
      'MEDIUM',
      'ALL',
      'Multiple dashboard cards across many screens increase responsive maintenance risk.',
      ['MULTI_SCREEN_DASHBOARD'],
    );
  }

  if (hasSidebar && !isDesktopProfile(input.profiles[0]) && evidence.platformTargets.some((p) => /IOS|ANDROID|MOBILE/i.test(p))) {
    pushRisk(
      risks,
      'OVERFLOW_RISK',
      'HIGH',
      'ALL',
      'Desktop-oriented sidebar may not translate to mobile platform targets.',
      ['PLATFORM_TARGET_MOBILE_WITH_SIDEBAR'],
    );
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const overallRiskLevel =
    risks.length === 0
      ? 'LOW'
      : risks.some((r) => r.severity === 'CRITICAL')
        ? 'CRITICAL'
        : risks.filter((r) => r.severity === 'HIGH').length >= 2
          ? 'HIGH'
          : risks.some((r) => r.severity === 'HIGH')
            ? 'HIGH'
            : 'MEDIUM';

  return {
    readOnly: true,
    risks: risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    overallRiskLevel,
    riskCount: risks.length,
  };
}
