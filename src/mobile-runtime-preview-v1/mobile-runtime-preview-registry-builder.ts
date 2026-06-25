/**
 * Mobile Runtime Preview V1 — live preview integration registry builder (read-only planning).
 */

import {
  MOBILE_RUNTIME_PREVIEW_V1_OWNER_MODULE,
  REUSED_MOBILE_PREVIEW_MODULES,
} from './mobile-runtime-preview-bounds.js';
import type {
  MobileRuntimeAdapterStatus,
  MobileRuntimeKind,
  MobileRuntimePreviewRegistry,
  MobileRuntimePreviewRegistryEntry,
} from './mobile-runtime-preview-types.js';

function toEntry(status: MobileRuntimeAdapterStatus): MobileRuntimePreviewRegistryEntry {
  return {
    runtimeId: status.runtimeId,
    available: status.available,
    launchable: status.launchable,
    verificationSupported: status.verificationSupported,
    unavailableReason: status.unavailableReason,
    requiredInstallationSteps: status.requiredInstallationSteps,
  };
}

export function buildMobileRuntimePreviewRegistry(
  adapterStatuses: MobileRuntimeAdapterStatus[],
): MobileRuntimePreviewRegistry {
  const entries = adapterStatuses.map(toEntry);
  const availableRuntimes = entries.filter((e) => e.available).map((e) => e.runtimeId);
  const unavailableRuntimes = entries.filter((e) => !e.available).map((e) => e.runtimeId);

  const byId = (id: MobileRuntimeKind) => toEntry(adapterStatuses.find((s) => s.runtimeId === id)!);

  return {
    generatedAt: Date.now(),
    ownerModule: MOBILE_RUNTIME_PREVIEW_V1_OWNER_MODULE,
    availableRuntimes,
    unavailableRuntimes,
    entries,
    reusedModules: REUSED_MOBILE_PREVIEW_MODULES,
    livePreviewTree: {
      browserRuntime: byId('BROWSER'),
      mobileWebRuntime: byId('MOBILE_WEB'),
      androidRuntime: byId('ANDROID'),
      iosRuntime: byId('IOS'),
      expoRuntime: byId('EXPO'),
    },
  };
}
