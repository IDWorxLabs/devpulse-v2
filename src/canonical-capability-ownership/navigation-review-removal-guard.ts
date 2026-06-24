/**
 * Navigation Review removal guard — prevents standalone Navigation Review authority creation.
 */

export const NAVIGATION_REVIEW_REMOVED = true;

export const NAVIGATION_REVIEW_AUTHORITATIVE_OWNERS = [
  'Universal App Blueprint Visual Validation',
  'UI Reviewer Authority',
] as const;

export const FORBIDDEN_NAVIGATION_REVIEW_PATHS = [
  'src/navigation-review',
  'src/navigation-review-authority',
] as const;

export function assertNavigationReviewNotStandalone(attemptedPath: string): {
  allowed: false;
  reason: string;
  authoritativeOwners: readonly string[];
} {
  const normalized = attemptedPath.replace(/\\/g, '/').toLowerCase();
  if (
    FORBIDDEN_NAVIGATION_REVIEW_PATHS.some((forbidden) => normalized.includes(forbidden)) ||
    normalized.includes('navigation-review-authority')
  ) {
    return {
      allowed: false,
      reason:
        'Navigation Review (Dedicated) is REMOVED. Navigation ownership remains in Blueprint Visual + Founder UX Review.',
      authoritativeOwners: NAVIGATION_REVIEW_AUTHORITATIVE_OWNERS,
    };
  }
  return {
    allowed: false,
    reason: 'Use assertNavigationReviewNotStandalone only for forbidden paths.',
    authoritativeOwners: NAVIGATION_REVIEW_AUTHORITATIVE_OWNERS,
  };
}

export function isNavigationReviewCapabilityRemoved(): boolean {
  return NAVIGATION_REVIEW_REMOVED;
}
