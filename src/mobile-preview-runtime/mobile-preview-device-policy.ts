/**
 * Mobile Preview Runtime Foundation — device policy metadata (no device detection).
 */

import { getStoredMobilePreviewSession, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewCategory, MobilePreviewDevicePolicy } from './mobile-preview-types.js';

let policyCounter = 0;

export function resetMobilePreviewDevicePolicyCounterForTests(): void {
  policyCounter = 0;
}

function nextMobilePreviewDevicePolicyId(): string {
  policyCounter += 1;
  return `mpvdpol-${policyCounter.toString().padStart(4, '0')}`;
}

export function buildDefaultMobilePreviewDevicePolicy(
  mobilePreviewId: string,
  mobilePreviewType: MobilePreviewCategory = 'GENERAL_MOBILE_PREVIEW',
): MobilePreviewDevicePolicy {
  const founderOnly = mobilePreviewType === 'FOUNDER_MOBILE_PREVIEW';
  const largeSystem =
    mobilePreviewType === 'BUILD_MOBILE_PREVIEW' ||
    mobilePreviewType === 'LIVE_PREVIEW_MOBILE_PREVIEW' ||
    mobilePreviewType === 'AUTONOMOUS_MOBILE_PREVIEW';

  return {
    policyId: nextMobilePreviewDevicePolicyId(),
    mobilePreviewId,
    deviceClass: founderOnly ? 'FOUNDER_DEVICE_METADATA' : 'GENERAL_MOBILE_DEVICE_METADATA',
    networkClass: largeSystem ? 'STABLE_BROADBAND_RECOMMENDED' : 'STANDARD_MOBILE_NETWORK_METADATA',
    screenClass: largeSystem ? 'LARGE_SCREEN_RECOMMENDED' : 'STANDARD_MOBILE_SCREEN_METADATA',
    batterySensitivity: largeSystem ? 'HIGH' : founderOnly ? 'MODERATE' : 'LOW',
    mobilePreviewPolicy: founderOnly
      ? 'MOBILE_PREVIEW_BLOCKED_METADATA_ONLY'
      : largeSystem
        ? 'MOBILE_PREVIEW_LIMITED_WITH_DESKTOP_FALLBACK'
        : 'MOBILE_PREVIEW_METADATA_ALLOWED',
    desktopFallbackPolicy: largeSystem
      ? 'DESKTOP_FALLBACK_RECOMMENDED_FOR_LARGE_PREVIEW'
      : founderOnly
        ? 'DESKTOP_FALLBACK_REQUIRED_FOR_FOUNDER_PREVIEW'
        : 'DESKTOP_FALLBACK_OPTIONAL_METADATA',
    allowedDeviceTypes: founderOnly ? [] : ['PHONE_METADATA', 'TABLET_METADATA'],
    blockedDeviceTypes: founderOnly ? ['PHONE_METADATA', 'TABLET_METADATA'] : [],
    requiresDesktopForLargeSystems: largeSystem,
    mobilePreviewAllowed: !founderOnly,
    mobilePreviewBlockedReason: founderOnly ? 'Founder preview requires desktop metadata surface' : null,
    largeSystemDesktopRecommended: largeSystem,
    founderOnlyPreview: founderOnly,
    evaluatedAt: Date.now(),
  };
}

export function getMobilePreviewDevicePolicy(mobilePreviewId: string): MobilePreviewDevicePolicy | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;
  if (session.mobilePreviewDevicePolicy) return session.mobilePreviewDevicePolicy;

  const policy = buildDefaultMobilePreviewDevicePolicy(mobilePreviewId, session.mobilePreviewType);
  storeMobilePreviewSession({
    ...session,
    mobilePreviewDevicePolicy: policy,
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'DEVICE_POLICY',
    summary: `Device policy materialized: ${policy.mobilePreviewPolicy}`,
    scopeUsed: policy.policyId,
  });

  return policy;
}

export function validateMobilePreviewDevicePolicy(policy: MobilePreviewDevicePolicy): string[] {
  const issues: string[] = [];
  if (!policy.deviceClass?.trim()) issues.push('Device policy missing deviceClass');
  if (!policy.networkClass?.trim()) issues.push('Device policy missing networkClass');
  if (!policy.screenClass?.trim()) issues.push('Device policy missing screenClass');
  if (!policy.mobilePreviewPolicy?.trim()) issues.push('Device policy missing mobilePreviewPolicy');
  if (!policy.desktopFallbackPolicy?.trim()) issues.push('Device policy missing desktopFallbackPolicy');
  if (!policy.mobilePreviewAllowed && !policy.mobilePreviewBlockedReason?.trim()) {
    issues.push('Mobile preview blocked without reason');
  }
  if (policy.founderOnlyPreview && policy.mobilePreviewAllowed) {
    issues.push('Founder-only preview cannot allow mobile preview');
  }
  if (policy.requiresDesktopForLargeSystems && !policy.largeSystemDesktopRecommended) {
    issues.push('Large-system desktop requirement missing recommendation flag');
  }
  return issues;
}
