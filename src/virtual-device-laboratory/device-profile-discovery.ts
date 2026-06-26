/**
 * Virtual Device Laboratory — device profile discovery.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import type { DeviceProfile } from './virtual-device-types.js';

export function resetDeviceProfileDiscoveryForTests(): void {
  // Deterministic device IDs — no mutable counter state.
}

function deviceIdFor(profile: {
  deviceType: string;
  orientation: string;
  themeMode: string;
  accessibilityScaling: number;
  performanceTier: string;
}): string {
  return `device-${profile.deviceType}-${profile.orientation}-${profile.themeMode}-${profile.accessibilityScaling}-${profile.performanceTier}`;
}

const BASE_PROFILES: Omit<DeviceProfile, 'readOnly' | 'deviceId' | 'themeMode' | 'accessibilityScaling' | 'performanceTier'>[] = [
  {
    deviceType: 'PHONE',
    viewportWidth: 390,
    viewportHeight: 844,
    orientation: 'PORTRAIT',
    inputMode: 'TOUCH',
    pixelRatio: 3,
    networkProfile: 'STANDARD_4G',
    expectedLayoutConstraints: ['Single column', 'Bottom navigation', 'No horizontal overflow'],
    requiredWorkflows: ['Primary navigation', 'Critical actions reachable'],
    requiredVirtualUserIds: [],
    riskLevel: 'HIGH',
  },
  {
    deviceType: 'PHONE',
    viewportWidth: 844,
    viewportHeight: 390,
    orientation: 'LANDSCAPE',
    inputMode: 'TOUCH',
    pixelRatio: 3,
    networkProfile: 'STANDARD_4G',
    expectedLayoutConstraints: ['Landscape layout', 'Primary actions visible'],
    requiredWorkflows: ['Orientation-safe navigation'],
    requiredVirtualUserIds: [],
    riskLevel: 'MEDIUM',
  },
  {
    deviceType: 'TABLET',
    viewportWidth: 834,
    viewportHeight: 1194,
    orientation: 'PORTRAIT',
    inputMode: 'TOUCH',
    pixelRatio: 2,
    networkProfile: 'WIFI',
    expectedLayoutConstraints: ['Adaptive grid', 'Readable forms'],
    requiredWorkflows: ['Tablet navigation', 'Form usability'],
    requiredVirtualUserIds: [],
    riskLevel: 'MEDIUM',
  },
  {
    deviceType: 'TABLET',
    viewportWidth: 1194,
    viewportHeight: 834,
    orientation: 'LANDSCAPE',
    inputMode: 'TOUCH',
    pixelRatio: 2,
    networkProfile: 'WIFI',
    expectedLayoutConstraints: ['Split layout', 'Route access preserved'],
    requiredWorkflows: ['Landscape navigation'],
    requiredVirtualUserIds: [],
    riskLevel: 'MEDIUM',
  },
  {
    deviceType: 'DESKTOP',
    viewportWidth: 1440,
    viewportHeight: 900,
    orientation: 'LANDSCAPE',
    inputMode: 'MOUSE_KEYBOARD',
    pixelRatio: 1,
    networkProfile: 'BROADBAND',
    expectedLayoutConstraints: ['Sidebar navigation', 'Wide content area'],
    requiredWorkflows: ['Desktop navigation', 'Reports and export'],
    requiredVirtualUserIds: [],
    riskLevel: 'LOW',
  },
];

export function discoverDeviceProfiles(input: {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  virtualUserSimulation?: VirtualUserPipelineResult;
}): DeviceProfile[] {
  const isLisa =
    promptMentionsLisaOrAccessibility(input.rawPrompt) ||
    input.productIntelligenceModel?.product.productType === 'ASSISTIVE_COMMUNICATION' ||
    input.productIntelligenceModel?.platform.primaryTarget === 'PHONE_FIRST';
  const isExpense =
    /expense|finance|tracker/i.test(input.rawPrompt) ||
    input.productIntelligenceModel?.product.productType === 'EXPENSE_TRACKER';

  const virtualUserIds = input.virtualUserSimulation?.profiles.map((p) => p.userId) ?? [];
  const profiles: DeviceProfile[] = [];

  const addProfile = (
    base: (typeof BASE_PROFILES)[number],
    opts: { themeMode: DeviceProfile['themeMode']; accessibilityScaling: number; performanceTier: DeviceProfile['performanceTier'] },
  ): void => {
    profiles.push({
      readOnly: true,
      deviceId: deviceIdFor({ ...base, themeMode: opts.themeMode, accessibilityScaling: opts.accessibilityScaling, performanceTier: opts.performanceTier }),
      ...base,
      themeMode: opts.themeMode,
      accessibilityScaling: opts.accessibilityScaling,
      performanceTier: opts.performanceTier,
      requiredVirtualUserIds: virtualUserIds.slice(0, 2),
    });
  };

  if (isLisa) {
    const phonePortrait = BASE_PROFILES[0]!;
    addProfile(phonePortrait, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(phonePortrait, { themeMode: 'DARK', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(phonePortrait, { themeMode: 'LIGHT', accessibilityScaling: 1.5, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[1]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[2]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(phonePortrait, { themeMode: 'LIGHT', accessibilityScaling: 1.5, performanceTier: 'LOW_END' });
  } else if (isExpense) {
    addProfile(BASE_PROFILES[0]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[0]!, { themeMode: 'DARK', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[2]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[4]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'HIGH_END' });
    addProfile(BASE_PROFILES[4]!, { themeMode: 'DARK', accessibilityScaling: 1, performanceTier: 'HIGH_END' });
    addProfile(BASE_PROFILES[0]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'LOW_END' });
  } else {
    addProfile(BASE_PROFILES[0]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[4]!, { themeMode: 'LIGHT', accessibilityScaling: 1, performanceTier: 'STANDARD' });
    addProfile(BASE_PROFILES[0]!, { themeMode: 'DARK', accessibilityScaling: 1, performanceTier: 'STANDARD' });
  }

  return profiles;
}
