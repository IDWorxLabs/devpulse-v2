/**
 * Mobile Runtime Preview V2 — Android runtime adapter (bounded emulator launch).
 * Extends V1 Android detection with real launch + adb verification.
 */

import type {
  MobileRuntimeAdapterStatus,
  MobileRuntimeCapabilityMatrix,
  MobileRuntimeLaunchInput,
  MobileRuntimeLaunchResult,
  MobileRuntimeVerificationResult,
} from '../mobile-runtime-preview-v1/mobile-runtime-preview-types.js';
import type { MobileRuntimeAdapter } from '../mobile-runtime-preview-v1/runtime-adapter-types.js';
import { AndroidEmulatorLaunchController } from './android-emulator-launch-controller.js';
import type { AndroidEmulatorLaunchEvidence } from './mobile-runtime-preview-v2-types.js';

const ANDROID_INSTALL_STEPS = [
  'Install Android Studio and Android SDK',
  'Set ANDROID_HOME or ANDROID_SDK_ROOT (optional — default paths supported)',
  'Ensure platform-tools/adb and emulator exist under SDK',
  'Create an AVD or connect a physical device',
];

export interface AndroidRuntimeV2Context {
  evidence: AndroidEmulatorLaunchEvidence | null;
  requestCleanup: boolean;
  timeoutMs: number;
}

let lastEvidence: AndroidEmulatorLaunchEvidence | null = null;
let lastController: AndroidEmulatorLaunchController | null = null;

export function resetAndroidRuntimeV2ForTests(): void {
  lastEvidence = null;
  lastController = null;
}

export function getLastAndroidLaunchEvidence(): AndroidEmulatorLaunchEvidence | null {
  return lastEvidence;
}

export class AndroidRuntimeAdapterV2 implements MobileRuntimeAdapter {
  readonly runtimeId = 'ANDROID' as const;

  constructor(private readonly context: AndroidRuntimeV2Context) {}

  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus {
    const { androidToolchain } = capabilities;
    const available = capabilities.adbPresent && capabilities.androidSdkPresent;
    const launchable =
      available && (capabilities.androidEmulatorAvailable || capabilities.androidDeviceAttached);
    const evidence = this.context.evidence ?? lastEvidence;
    const verificationSupported =
      Boolean(evidence?.verificationVerdict === 'VERIFIED') ||
      (available && capabilities.androidDeviceAttached);

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
      androidRuntimeState:
        evidence?.verificationVerdict === 'VERIFIED'
          ? 'DEVICE_RUNNING'
          : launchable
            ? 'LAUNCHABLE'
            : androidToolchain.androidRuntimeState,
    };
  }

  async launch(input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult> {
    const status = this.getStatus(capabilities);
    if (!status.launchable) {
      return {
        runtimeId: this.runtimeId,
        detected: status.available,
        launchAttempted: false,
        launchSuccessful: false,
        unsupportedReason: status.unavailableReason,
        detail: status.unavailableReason ?? 'Android runtime not launchable',
        launchedAt: null,
      };
    }

    const controller = new AndroidEmulatorLaunchController({
      rootDir: input.rootDir,
      timeoutMs: this.context.timeoutMs,
      requestCleanup: this.context.requestCleanup,
    });
    lastController = controller;
    const evidence = await controller.executeBoundedLaunch();
    lastEvidence = evidence;
    this.context.evidence = evidence;

    const launchSuccessful = evidence.launchSuccessful && Boolean(evidence.deviceSerial);
    return {
      runtimeId: this.runtimeId,
      detected: Boolean(evidence.adbPath),
      launchAttempted: evidence.launchAttempted,
      launchSuccessful,
      unsupportedReason: launchSuccessful ? null : evidence.blockerDetail,
      detail: evidence.blockerDetail,
      launchedAt: launchSuccessful ? Date.now() : null,
    };
  }

  async verify(_input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult> {
    const evidence = this.context.evidence ?? lastEvidence;
    if (!evidence) {
      return {
        runtimeId: this.runtimeId,
        detected: capabilities.adbPresent,
        verificationAttempted: false,
        verificationSuccessful: false,
        unsupportedReason: 'Android launch evidence missing',
        detail: 'Run launch before verify',
        verifiedAt: null,
      };
    }

    const verified = evidence.verificationVerdict === 'VERIFIED';
    return {
      runtimeId: this.runtimeId,
      detected: Boolean(evidence.adbPath),
      verificationAttempted: evidence.launchAttempted || evidence.emulatorAlreadyRunning,
      verificationSuccessful: verified,
      unsupportedReason: verified ? null : evidence.blockerDetail,
      detail: `${evidence.verificationVerdict}: ${evidence.blockerDetail}`,
      verifiedAt: verified ? Date.now() : null,
    };
  }

  async shutdown(): Promise<void> {
    if (this.context.requestCleanup && lastController) {
      await lastController.shutdownIfStartedByAiDevEngine();
    }
  }
}

export async function runBoundedAndroidLaunch(input: {
  rootDir: string;
  timeoutMs: number;
  requestCleanup: boolean;
}): Promise<AndroidEmulatorLaunchEvidence> {
  const controller = new AndroidEmulatorLaunchController({
    rootDir: input.rootDir,
    timeoutMs: input.timeoutMs,
    requestCleanup: input.requestCleanup,
  });
  lastController = controller;
  const evidence = await controller.executeBoundedLaunch();
  lastEvidence = evidence;
  if (input.requestCleanup) {
    await controller.shutdownIfStartedByAiDevEngine();
  }
  return evidence;
}
