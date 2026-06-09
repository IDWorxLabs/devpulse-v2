/**
 * Mobile Preview Runtime Foundation — desktop recommendation metadata (no execution).
 */

import {
  getStoredMobilePreviewSession,
  storeMobilePreviewSession,
  nextMobilePreviewDesktopRecommendationId,
  storeMobilePreviewDesktopRecommendation,
  listStoredMobilePreviewDesktopRecommendations,
  listStoredMobilePreviewDesktopRecommendationsForSession,
  resetMobilePreviewDesktopRecommendationCounterForTests,
} from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type {
  MobilePreviewDesktopRecommendation,
  MobilePreviewDesktopRecommendationLevel,
} from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export interface MobilePreviewDesktopRecommendationEvaluation {
  level: MobilePreviewDesktopRecommendationLevel;
  reason: string | null;
}

export function resetMobilePreviewDesktopCounterForTests(): void {
  resetMobilePreviewDesktopRecommendationCounterForTests();
}

export function evaluateDesktopRecommendation(
  mobilePreviewId: string,
): MobilePreviewDesktopRecommendationEvaluation {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) {
    return { level: 'MOBILE_BLOCKED', reason: 'Mobile preview session not found' };
  }

  const eligibility = session.mobilePreviewEligibility;
  const safety = session.mobilePreviewSafety;
  const devicePolicy = session.mobilePreviewDevicePolicy;

  if (session.mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW') {
    return {
      level: 'MOBILE_BLOCKED',
      reason: 'Founder preview requires desktop governance surface',
    };
  }

  if (eligibility && !eligibility.mobilePreviewAllowed) {
    return {
      level: 'MOBILE_BLOCKED',
      reason: eligibility.mobilePreviewBlockedReason ?? eligibility.eligibilityReason,
    };
  }

  if (safety && !safety.safeToPreviewOnMobile) {
    if (safety.requiresFounderApproval) {
      return {
        level: 'MOBILE_BLOCKED',
        reason: safety.reason,
      };
    }
    return {
      level: 'DESKTOP_REQUIRED',
      reason: safety.reason,
    };
  }

  if (eligibility?.requiresDesktop || safety?.desktopRequired || devicePolicy?.requiresDesktopForLargeSystems) {
    return {
      level: 'DESKTOP_REQUIRED',
      reason:
        eligibility?.eligibilityReason ??
        safety?.reason ??
        'Large preview scope requires desktop metadata surface',
    };
  }

  if (
    eligibility?.desktopRecommended ||
    devicePolicy?.largeSystemDesktopRecommended ||
    safety?.largeSystemRisk
  ) {
    return {
      level: 'DESKTOP_RECOMMENDED',
      reason:
        eligibility?.eligibilityReason ??
        devicePolicy?.desktopFallbackPolicy ??
        'Desktop recommended for improved preview metadata visibility',
    };
  }

  return { level: 'DESKTOP_NOT_REQUIRED', reason: null };
}

export function registerDesktopRecommendation(input: {
  mobilePreviewId: string;
  level?: MobilePreviewDesktopRecommendationLevel;
  reason?: string;
  sourceModule?: string;
}): MobilePreviewDesktopRecommendation | null {
  const session = getStoredMobilePreviewSession(input.mobilePreviewId);
  if (!session) return null;

  const evaluation = input.level
    ? {
        level: input.level,
        reason:
          input.reason ??
          (input.level === 'DESKTOP_NOT_REQUIRED'
            ? null
            : 'Desktop recommendation registered manually'),
      }
    : evaluateDesktopRecommendation(input.mobilePreviewId);

  if (
    (evaluation.level === 'DESKTOP_RECOMMENDED' ||
      evaluation.level === 'DESKTOP_REQUIRED' ||
      evaluation.level === 'MOBILE_BLOCKED') &&
    !evaluation.reason?.trim()
  ) {
    return null;
  }

  const recommendation: MobilePreviewDesktopRecommendation = {
    recommendationId: nextMobilePreviewDesktopRecommendationId(),
    mobilePreviewId: input.mobilePreviewId,
    level: evaluation.level,
    reason: evaluation.reason ?? 'Desktop not required for this preview scope',
    recommendedAt: Date.now(),
    sourceModule: input.sourceModule ?? MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
  };

  storeMobilePreviewDesktopRecommendation(recommendation);
  storeMobilePreviewSession({
    ...session,
    mobilePreviewDesktopRecommendations: [
      ...session.mobilePreviewDesktopRecommendations,
      recommendation,
    ],
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId: input.mobilePreviewId,
    category: 'DESKTOP_RECOMMENDATION',
    summary: `Desktop recommendation: ${recommendation.level} — ${recommendation.reason}`,
    scopeUsed: recommendation.recommendationId,
  });

  return recommendation;
}

export function listDesktopRecommendations(mobilePreviewId?: string): MobilePreviewDesktopRecommendation[] {
  if (mobilePreviewId) return listStoredMobilePreviewDesktopRecommendationsForSession(mobilePreviewId);
  return listStoredMobilePreviewDesktopRecommendations();
}
