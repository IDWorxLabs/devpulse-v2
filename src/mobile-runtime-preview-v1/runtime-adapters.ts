/**
 * Mobile Runtime Preview V1 — runtime adapters.
 * Reuses mobile-preview-modes device profiles and Playwright (via playwright-adapter pattern).
 * No fake launch success. Phase 1: browser/mobile-web verify; native runtimes report honestly.
 */

import { getDeviceProfile } from '../mobile-preview-modes/device-profile-library.js';
import type { PlaywrightPageAdapter } from '../playwright-adapter/playwright-page-types.js';
import type {
  MobileRuntimeAdapterStatus,
  MobileRuntimeCapabilityMatrix,
  MobileRuntimeKind,
  MobileRuntimeLaunchInput,
  MobileRuntimeLaunchResult,
  MobileRuntimeVerificationResult,
} from './mobile-runtime-preview-types.js';
import type { MobileRuntimeAdapter, MobileRuntimeAdapterRegistry } from './runtime-adapter-types.js';

const ANDROID_INSTALL_STEPS = [
  'Install Android Studio and Android SDK',
  'Set ANDROID_HOME or ANDROID_SDK_ROOT environment variable',
  'Add platform-tools to PATH (adb)',
  'Create an AVD or connect a physical device',
];

const IOS_INSTALL_STEPS = [
  'Use macOS with Xcode installed from the App Store',
  'Run xcode-select --install if needed',
  'Open Xcode once to accept license and install simulator runtimes',
];

const EXPO_INSTALL_STEPS = [
  'npm install expo (or use npx expo)',
  'Ensure app.json or app.config.* exists for Expo projects',
  'For Expo Go: install Expo Go app on device and run npx expo start',
];

let activeBrowser: { close: () => Promise<void> } | null = null;
let activePage: PlaywrightPageAdapter | null = null;

async function launchPlaywrightBrowser(): Promise<{ browser: { close: () => Promise<void> }; page: PlaywrightPageAdapter } | null> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    const page = (await browser.newPage()) as unknown as PlaywrightPageAdapter;
    activeBrowser = browser;
    activePage = page;
    return { browser, page };
  } catch {
    return null;
  }
}

function baseLaunch(
  runtimeId: MobileRuntimeKind,
  detected: boolean,
  unsupportedReason: string | null,
): Pick<MobileRuntimeLaunchResult, 'runtimeId' | 'detected' | 'unsupportedReason'> {
  return { runtimeId, detected, unsupportedReason };
}

function baseVerify(
  runtimeId: MobileRuntimeKind,
  detected: boolean,
  unsupportedReason: string | null,
): Pick<MobileRuntimeVerificationResult, 'runtimeId' | 'detected' | 'unsupportedReason'> {
  return { runtimeId, detected, unsupportedReason };
}

class BrowserRuntimeAdapter implements MobileRuntimeAdapter {
  readonly runtimeId = 'BROWSER' as const;

  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus {
    const available = capabilities.browserRuntimeAvailable && capabilities.playwrightAvailable;
    return {
      runtimeId: this.runtimeId,
      available,
      supported: true,
      launchable: available,
      verificationSupported: available,
      unavailableReason: available ? null : (capabilities.detail.playwright ?? 'Browser runtime unavailable'),
      requiredInstallationSteps: available
        ? []
        : ['npm install playwright --save-dev', 'npx playwright install chromium'],
    };
  }

  async launch(input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult> {
    const status = this.getStatus(capabilities);
    if (!status.launchable) {
      return {
        ...baseLaunch(this.runtimeId, status.available, status.unavailableReason),
        launchAttempted: false,
        launchSuccessful: false,
        detail: status.unavailableReason ?? 'Browser runtime not launchable',
        launchedAt: null,
      };
    }

    const session = await launchPlaywrightBrowser();
    if (!session) {
      return {
        ...baseLaunch(this.runtimeId, true, 'Playwright Chromium launch failed'),
        launchAttempted: true,
        launchSuccessful: false,
        detail: 'Playwright Chromium launch failed',
        launchedAt: null,
      };
    }

    const url = input.previewUrl ?? 'about:blank';
    try {
      await session.page.goto(url, { waitUntil: 'domcontentloaded' });
      return {
        ...baseLaunch(this.runtimeId, true, null),
        launchAttempted: true,
        launchSuccessful: true,
        detail: `Browser runtime launched; navigated to ${url}`,
        launchedAt: Date.now(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ...baseLaunch(this.runtimeId, true, message),
        launchAttempted: true,
        launchSuccessful: false,
        detail: `Browser navigation failed: ${message}`,
        launchedAt: null,
      };
    }
  }

  async verify(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult> {
    const status = this.getStatus(capabilities);
    if (!status.verificationSupported) {
      return {
        ...baseVerify(this.runtimeId, status.available, status.unavailableReason),
        verificationAttempted: false,
        verificationSuccessful: false,
        detail: status.unavailableReason ?? 'Browser verification unsupported',
        verifiedAt: null,
      };
    }

    const session = activePage ? { page: activePage } : await launchPlaywrightBrowser();
    if (!session) {
      return {
        ...baseVerify(this.runtimeId, true, 'Playwright unavailable for verification'),
        verificationAttempted: true,
        verificationSuccessful: false,
        detail: 'Playwright unavailable for verification',
        verifiedAt: null,
      };
    }

    try {
      const title = (await session.page.evaluate?.(() => document.title)) ?? '';
      return {
        ...baseVerify(this.runtimeId, true, null),
        verificationAttempted: true,
        verificationSuccessful: true,
        detail: `Browser verification succeeded (document accessible, title="${String(title).slice(0, 40)}")`,
        verifiedAt: Date.now(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ...baseVerify(this.runtimeId, true, message),
        verificationAttempted: true,
        verificationSuccessful: false,
        detail: `Browser verification failed: ${message}`,
        verifiedAt: null,
      };
    }
  }

  async shutdown(): Promise<void> {
    if (activeBrowser) {
      await activeBrowser.close();
      activeBrowser = null;
      activePage = null;
    }
  }
}

class MobileWebRuntimeAdapter implements MobileRuntimeAdapter {
  readonly runtimeId = 'MOBILE_WEB' as const;

  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus {
    const available = capabilities.browserRuntimeAvailable && capabilities.playwrightAvailable;
    return {
      runtimeId: this.runtimeId,
      available,
      supported: true,
      launchable: available,
      verificationSupported: available,
      unavailableReason: available ? null : 'Mobile web runtime requires Playwright browser runtime',
      requiredInstallationSteps: available
        ? []
        : ['npm install playwright --save-dev', 'npx playwright install chromium'],
    };
  }

  async launch(input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult> {
    const status = this.getStatus(capabilities);
    if (!status.launchable) {
      return {
        ...baseLaunch(this.runtimeId, status.available, status.unavailableReason),
        launchAttempted: false,
        launchSuccessful: false,
        detail: status.unavailableReason ?? 'Mobile web runtime not launchable',
        launchedAt: null,
      };
    }

    const profile = getDeviceProfile('IPHONE_STANDARD');
    const session = await launchPlaywrightBrowser();
    if (!session) {
      return {
        ...baseLaunch(this.runtimeId, true, 'Playwright launch failed'),
        launchAttempted: true,
        launchSuccessful: false,
        detail: 'Playwright launch failed for mobile web runtime',
        launchedAt: null,
      };
    }

    try {
      await session.page.setViewportSize?.({ width: profile.viewportWidth, height: profile.viewportHeight });
      const url = input.previewUrl ?? 'about:blank';
      await session.page.goto(url, { waitUntil: 'domcontentloaded' });
      return {
        ...baseLaunch(this.runtimeId, true, null),
        launchAttempted: true,
        launchSuccessful: true,
        detail: `Mobile web runtime launched with ${profile.label} viewport (${profile.viewportWidth}x${profile.viewportHeight})`,
        launchedAt: Date.now(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ...baseLaunch(this.runtimeId, true, message),
        launchAttempted: true,
        launchSuccessful: false,
        detail: `Mobile web launch failed: ${message}`,
        launchedAt: null,
      };
    }
  }

  async verify(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult> {
    const status = this.getStatus(capabilities);
    if (!status.verificationSupported) {
      return {
        ...baseVerify(this.runtimeId, status.available, status.unavailableReason),
        verificationAttempted: false,
        verificationSuccessful: false,
        detail: status.unavailableReason ?? 'Mobile web verification unsupported',
        verifiedAt: null,
      };
    }

    const profile = getDeviceProfile('ANDROID_PHONE_MEDIUM');
    const session = activePage ? { page: activePage } : await launchPlaywrightBrowser();
    if (!session) {
      return {
        ...baseVerify(this.runtimeId, true, 'Playwright unavailable'),
        verificationAttempted: true,
        verificationSuccessful: false,
        detail: 'Playwright unavailable for mobile web verification',
        verifiedAt: null,
      };
    }

    try {
      await session.page.setViewportSize?.({ width: profile.viewportWidth, height: profile.viewportHeight });
      const viewportOk = await session.page.evaluate?.(() => ({
        w: window.innerWidth,
        h: window.innerHeight,
      }));
      const w =
        typeof viewportOk === 'object' && viewportOk !== null && 'w' in viewportOk
          ? Number((viewportOk as { w: number }).w)
          : 0;
      const verified = w > 0 && w <= profile.viewportWidth + 20;
      return {
        ...baseVerify(this.runtimeId, true, verified ? null : 'Viewport size mismatch'),
        verificationAttempted: true,
        verificationSuccessful: verified,
        detail: verified
          ? `Mobile web verification succeeded (${profile.label}, innerWidth=${w})`
          : `Mobile web viewport verification failed (expected ~${profile.viewportWidth}, got ${w})`,
        verifiedAt: verified ? Date.now() : null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ...baseVerify(this.runtimeId, true, message),
        verificationAttempted: true,
        verificationSuccessful: false,
        detail: `Mobile web verification failed: ${message}`,
        verifiedAt: null,
      };
    }
  }

  async shutdown(): Promise<void> {
    if (activeBrowser) {
      await activeBrowser.close();
      activeBrowser = null;
      activePage = null;
    }
  }
}

class AndroidRuntimeAdapter implements MobileRuntimeAdapter {
  readonly runtimeId = 'ANDROID' as const;

  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus {
    const { androidToolchain } = capabilities;
    const available = capabilities.adbPresent && capabilities.androidSdkPresent;
    const launchable =
      available && (capabilities.androidEmulatorAvailable || capabilities.androidDeviceAttached);
    const verificationSupported = available && capabilities.androidDeviceAttached;

    const reason = !capabilities.osCompatibleWithAndroidDev
      ? 'OS not compatible with Android development'
      : !capabilities.androidSdkPresent
        ? 'Android SDK not detected'
        : !capabilities.adbPresent
          ? 'adb not resolved from SDK or PATH'
          : !launchable
            ? 'No Android emulator AVD or attached device available'
            : null;

    return {
      runtimeId: this.runtimeId,
      available,
      supported: capabilities.osCompatibleWithAndroidDev && available,
      launchable,
      verificationSupported,
      unavailableReason: reason,
      requiredInstallationSteps: launchable ? [] : ANDROID_INSTALL_STEPS,
      androidRuntimeState: androidToolchain.androidRuntimeState,
    };
  }

  async launch(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult> {
    const status = this.getStatus(capabilities);
    const { adbPath, emulatorPath, avdList, sdkPath } = capabilities.androidToolchain;

    if (!status.launchable) {
      return {
        ...baseLaunch(this.runtimeId, status.available, status.unavailableReason),
        launchAttempted: false,
        launchSuccessful: false,
        detail: status.unavailableReason ?? 'Android runtime not launchable in this environment',
        launchedAt: null,
      };
    }

    const toolchainDetail = [
      sdkPath ? `sdk=${sdkPath}` : null,
      adbPath ? `adb=${adbPath}` : null,
      emulatorPath ? `emulator=${emulatorPath}` : null,
      avdList.length > 0 ? `avds=${avdList.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('; ');

    return {
      ...baseLaunch(this.runtimeId, true, 'LAUNCH_DEFERRED_PHASE_1'),
      launchAttempted: true,
      launchSuccessful: false,
      detail: `Phase 1: Android app runtime launch deferred (${toolchainDetail})`,
      launchedAt: null,
    };
  }

  async verify(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult> {
    const status = this.getStatus(capabilities);
    const { adbPath, avdList } = capabilities.androidToolchain;

    if (!status.launchable) {
      return {
        ...baseVerify(this.runtimeId, status.available, status.unavailableReason),
        verificationAttempted: false,
        verificationSuccessful: false,
        detail: status.unavailableReason ?? 'Android runtime verification unsupported',
        verifiedAt: null,
      };
    }

    if (!status.verificationSupported) {
      return {
        ...baseVerify(this.runtimeId, true, 'No running emulator/device — native verification deferred'),
        verificationAttempted: true,
        verificationSuccessful: false,
        detail: `Toolchain detected (adb=${adbPath ?? 'unknown'}); AVDs=[${avdList.join(', ')}]; no booted device for native verification`,
        verifiedAt: null,
      };
    }

    return {
      ...baseVerify(this.runtimeId, true, 'Phase 1: Android native runtime verification not implemented'),
      verificationAttempted: true,
      verificationSuccessful: false,
      detail: 'Device running but Phase 1 native verification deferred to future phase',
      verifiedAt: null,
    };
  }

  async shutdown(): Promise<void> {
    /* Phase 1 does not start emulator processes */
  }
}

class IOSRuntimeAdapter implements MobileRuntimeAdapter {
  readonly runtimeId = 'IOS' as const;

  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus {
    const available = capabilities.xcodePresent && capabilities.osCompatibleWithIosDev;
    const launchable = available && capabilities.iosSimulatorAvailable;
    const reason = !capabilities.osCompatibleWithIosDev
      ? 'iOS development requires macOS'
      : !capabilities.xcodePresent
        ? 'Xcode not detected'
        : !capabilities.iosSimulatorAvailable
          ? 'No iOS Simulator runtimes available'
          : null;

    return {
      runtimeId: this.runtimeId,
      available,
      supported: capabilities.osCompatibleWithIosDev,
      launchable,
      verificationSupported: launchable,
      unavailableReason: reason,
      requiredInstallationSteps: launchable ? [] : IOS_INSTALL_STEPS,
    };
  }

  async launch(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult> {
    const status = this.getStatus(capabilities);
    if (!status.launchable) {
      return {
        ...baseLaunch(this.runtimeId, status.available, status.unavailableReason),
        launchAttempted: false,
        launchSuccessful: false,
        detail: status.unavailableReason ?? 'iOS runtime not launchable in this environment',
        launchedAt: null,
      };
    }

    return {
      ...baseLaunch(this.runtimeId, true, 'Phase 1: iOS Simulator app launch not implemented; simulator availability detected only'),
      launchAttempted: true,
      launchSuccessful: false,
      detail: 'iOS Simulator available; native app launch deferred to future phase',
      launchedAt: null,
    };
  }

  async verify(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult> {
    const status = this.getStatus(capabilities);
    if (!status.verificationSupported) {
      return {
        ...baseVerify(this.runtimeId, status.available, status.unavailableReason),
        verificationAttempted: false,
        verificationSuccessful: false,
        detail: status.unavailableReason ?? 'iOS runtime verification unsupported',
        verifiedAt: null,
      };
    }

    return {
      ...baseVerify(this.runtimeId, true, 'Phase 1: iOS native runtime verification not implemented'),
      verificationAttempted: true,
      verificationSuccessful: false,
      detail: 'iOS Simulator detected but native runtime verification deferred to future phase',
      verifiedAt: null,
    };
  }

  async shutdown(): Promise<void> {
    /* Phase 1 does not boot simulators */
  }
}

class ExpoRuntimeAdapter implements MobileRuntimeAdapter {
  readonly runtimeId = 'EXPO' as const;

  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus {
    const available = capabilities.expoCliPresent;
    const launchable = available && capabilities.expoProjectDetected;
    const reason = !capabilities.expoCliPresent
      ? 'Expo CLI not detected'
      : !capabilities.expoProjectDetected
        ? 'No Expo project detected in workspace root'
        : null;

    return {
      runtimeId: this.runtimeId,
      available,
      supported: capabilities.osCompatibleWithExpoDev,
      launchable,
      verificationSupported: launchable,
      unavailableReason: reason,
      requiredInstallationSteps: launchable ? [] : EXPO_INSTALL_STEPS,
    };
  }

  async launch(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult> {
    const status = this.getStatus(capabilities);
    if (!status.launchable) {
      return {
        ...baseLaunch(this.runtimeId, status.available, status.unavailableReason),
        launchAttempted: false,
        launchSuccessful: false,
        detail: status.unavailableReason ?? 'Expo runtime not launchable in this environment',
        launchedAt: null,
      };
    }

    return {
      ...baseLaunch(this.runtimeId, true, 'Phase 1: Expo Go / Metro runtime launch not implemented'),
      launchAttempted: true,
      launchSuccessful: false,
      detail: 'Expo CLI and project detected; Expo Go runtime launch deferred to future phase',
      launchedAt: null,
    };
  }

  async verify(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult> {
    const status = this.getStatus(capabilities);
    if (!status.verificationSupported) {
      return {
        ...baseVerify(this.runtimeId, status.available, status.unavailableReason),
        verificationAttempted: false,
        verificationSuccessful: false,
        detail: status.unavailableReason ?? 'Expo runtime verification unsupported',
        verifiedAt: null,
      };
    }

    return {
      ...baseVerify(this.runtimeId, true, 'Phase 1: Expo runtime verification not implemented'),
      verificationAttempted: true,
      verificationSuccessful: false,
      detail: 'Expo project detected but Expo Go runtime verification deferred to future phase',
      verifiedAt: null,
    };
  }

  async shutdown(): Promise<void> {
    /* Phase 1 does not start Metro/Expo processes */
  }
}

const ADAPTERS: MobileRuntimeAdapter[] = [
  new BrowserRuntimeAdapter(),
  new MobileWebRuntimeAdapter(),
  new AndroidRuntimeAdapter(),
  new IOSRuntimeAdapter(),
  new ExpoRuntimeAdapter(),
];

export function createMobileRuntimeAdapterRegistry(): MobileRuntimeAdapterRegistry {
  return {
    adapters: ADAPTERS,
    getAdapter(runtimeId: MobileRuntimeKind) {
      return ADAPTERS.find((a) => a.runtimeId === runtimeId);
    },
    getAllStatuses(capabilities: MobileRuntimeCapabilityMatrix) {
      return ADAPTERS.map((a) => a.getStatus(capabilities));
    },
  };
}

export async function shutdownAllRuntimeAdapters(): Promise<void> {
  await Promise.all(ADAPTERS.map((a) => a.shutdown()));
}
