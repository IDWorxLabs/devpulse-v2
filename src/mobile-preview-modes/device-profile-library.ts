/**
 * Device Profile Library — supported preview device profiles (V1).
 */

import type { DeviceCategory, DeviceProfile, DeviceProfileId } from './mobile-preview-types.js';

export const DEVICE_PROFILES: readonly DeviceProfile[] = [
  {
    readOnly: true,
    profileId: 'ANDROID_PHONE_SMALL',
    category: 'ANDROID_PHONE',
    label: 'Small Android Phone',
    viewportWidth: 360,
    viewportHeight: 640,
    pixelDensity: 2,
    touchTargetMinDp: 48,
  },
  {
    readOnly: true,
    profileId: 'ANDROID_PHONE_MEDIUM',
    category: 'ANDROID_PHONE',
    label: 'Medium Android Phone',
    viewportWidth: 412,
    viewportHeight: 915,
    pixelDensity: 2.625,
    touchTargetMinDp: 48,
  },
  {
    readOnly: true,
    profileId: 'ANDROID_PHONE_LARGE',
    category: 'ANDROID_PHONE',
    label: 'Large Android Phone',
    viewportWidth: 428,
    viewportHeight: 926,
    pixelDensity: 3,
    touchTargetMinDp: 48,
  },
  {
    readOnly: true,
    profileId: 'IPHONE_SMALL',
    category: 'IPHONE',
    label: 'Small iPhone',
    viewportWidth: 375,
    viewportHeight: 667,
    pixelDensity: 2,
    touchTargetMinDp: 44,
  },
  {
    readOnly: true,
    profileId: 'IPHONE_STANDARD',
    category: 'IPHONE',
    label: 'Standard iPhone',
    viewportWidth: 390,
    viewportHeight: 844,
    pixelDensity: 3,
    touchTargetMinDp: 44,
  },
  {
    readOnly: true,
    profileId: 'IPHONE_PRO_MAX',
    category: 'IPHONE',
    label: 'Pro Max iPhone',
    viewportWidth: 430,
    viewportHeight: 932,
    pixelDensity: 3,
    touchTargetMinDp: 44,
  },
  {
    readOnly: true,
    profileId: 'ANDROID_TABLET',
    category: 'TABLET',
    label: 'Android Tablet',
    viewportWidth: 800,
    viewportHeight: 1280,
    pixelDensity: 2,
    touchTargetMinDp: 48,
  },
  {
    readOnly: true,
    profileId: 'IPAD',
    category: 'TABLET',
    label: 'iPad',
    viewportWidth: 820,
    viewportHeight: 1180,
    pixelDensity: 2,
    touchTargetMinDp: 44,
  },
  {
    readOnly: true,
    profileId: 'DESKTOP_STANDARD',
    category: 'DESKTOP',
    label: 'Standard Desktop',
    viewportWidth: 1280,
    viewportHeight: 720,
    pixelDensity: 1,
    touchTargetMinDp: 32,
  },
  {
    readOnly: true,
    profileId: 'DESKTOP_WIDE',
    category: 'DESKTOP',
    label: 'Wide Desktop',
    viewportWidth: 1920,
    viewportHeight: 1080,
    pixelDensity: 1,
    touchTargetMinDp: 32,
  },
];

export function getDeviceProfile(profileId: DeviceProfileId): DeviceProfile {
  const profile = DEVICE_PROFILES.find((p) => p.profileId === profileId);
  if (!profile) throw new Error(`Unknown device profile: ${profileId}`);
  return profile;
}

export function getProfilesByCategory(category: DeviceCategory): DeviceProfile[] {
  return DEVICE_PROFILES.filter((p) => p.category === category);
}

export function getAllDeviceProfileIds(): DeviceProfileId[] {
  return DEVICE_PROFILES.map((p) => p.profileId);
}

export function isPhoneProfile(profile: DeviceProfile): boolean {
  return profile.category === 'ANDROID_PHONE' || profile.category === 'IPHONE';
}

export function isDesktopProfile(profile: DeviceProfile): boolean {
  return profile.category === 'DESKTOP';
}
