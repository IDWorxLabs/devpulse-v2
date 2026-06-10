/**
 * User Guides — onboarding guide analyzer.
 */

import type { OnboardingGuideAnalysis, UserGuidesInput } from './user-guides-types.js';
import { getCachedOnboardingAnalysis, setCachedOnboardingAnalysis } from './user-guides-cache.js';

export interface OnboardingGuideSnapshot {
  hasChatSystem: boolean;
  hasNotificationSystem: boolean;
  hasVerificationSystem: boolean;
  hasMobileSystem: boolean;
}

const BASE_ONBOARDING_AREAS = [
  'first_launch',
  'creating_a_project',
  'understanding_chat',
  'understanding_navigation',
  'understanding_notifications',
  'understanding_verification',
  'understanding_reports',
  'understanding_mobile_usage',
] as const;

let onboardingAnalysisCount = 0;

export function analyzeOnboardingGuide(
  input: UserGuidesInput,
  snapshot: OnboardingGuideSnapshot,
): OnboardingGuideAnalysis {
  const cacheKey = [
    snapshot.hasChatSystem,
    snapshot.hasNotificationSystem,
    input.missingFirstLaunchGuidance,
    input.missingProjectCreationGuidance,
    ...(input.undocumentedOnboardingAreas ?? []),
  ].join('|');

  const cached = getCachedOnboardingAnalysis(cacheKey);
  if (cached) return cached;

  onboardingAnalysisCount += 1;
  const onboardingWarnings: string[] = [];
  const undocumentedOnboardingAreas: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingFirstLaunchGuidance, 'missing_first_launch_guidance', 'first_launch'],
    [input.missingProjectCreationGuidance, 'missing_project_creation_guidance', 'creating_a_project'],
    [input.missingChatGuidance, 'missing_chat_guidance', 'understanding_chat'],
    [input.missingNavigationGuidance, 'missing_navigation_guidance', 'understanding_navigation'],
    [input.missingNotificationGuidance, 'missing_notification_guidance', 'understanding_notifications'],
    [input.missingVerificationGuidance, 'missing_verification_guidance', 'understanding_verification'],
    [input.missingReportGuidance, 'missing_report_guidance', 'understanding_reports'],
    [input.missingMobileUsageGuidance, 'missing_mobile_usage_guidance', 'understanding_mobile_usage'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      onboardingWarnings.push(warning);
      undocumentedOnboardingAreas.push(area);
      penalty += 8;
    }
  }

  for (const area of input.undocumentedOnboardingAreas ?? []) {
    if (!undocumentedOnboardingAreas.includes(area)) {
      undocumentedOnboardingAreas.push(area);
      penalty += 5;
    }
  }

  const systemBonus =
    (snapshot.hasChatSystem ? 5 : 0)
    + (snapshot.hasNotificationSystem ? 5 : 0)
    + (snapshot.hasVerificationSystem ? 5 : 0)
    + (snapshot.hasMobileSystem ? 5 : 0);
  const documented = BASE_ONBOARDING_AREAS.length - undocumentedOnboardingAreas.filter(
    (a) => BASE_ONBOARDING_AREAS.includes(a as typeof BASE_ONBOARDING_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_ONBOARDING_AREAS.length) * 85 + systemBonus);
  const onboardingCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: OnboardingGuideAnalysis = {
    onboardingCoverageScore,
    undocumentedOnboardingAreas,
    onboardingWarnings,
  };

  setCachedOnboardingAnalysis(cacheKey, result);
  return result;
}

export function getOnboardingAnalysisCount(): number {
  return onboardingAnalysisCount;
}

export function resetOnboardingGuideAnalyzerForTests(): void {
  onboardingAnalysisCount = 0;
}

export function listBaseOnboardingAreas(): readonly string[] {
  return BASE_ONBOARDING_AREAS;
}
