/**
 * Mobile Runtime Preview V1 — types.
 */

import type { MOBILE_RUNTIME_KINDS } from './mobile-runtime-preview-bounds.js';

export type MobileRuntimeKind = (typeof MOBILE_RUNTIME_KINDS)[number];

/** Android runtime state — V1.1 SDK path detection repair. */
export type AndroidRuntimeState =
  | 'MISSING_TOOLCHAIN'
  | 'TOOLCHAIN_DETECTED'
  | 'AVD_AVAILABLE'
  | 'DEVICE_RUNNING'
  | 'LAUNCHABLE'
  | 'LAUNCH_DEFERRED_PHASE_1';

export interface AndroidToolchainResolution {
  sdkPath: string | null;
  sdkPathSource: string;
  adbPath: string | null;
  emulatorPath: string | null;
  avdList: readonly string[];
  adbVersion: string | null;
  androidRuntimeState: AndroidRuntimeState;
}

export interface MobileRuntimeCapabilityMatrix {
  androidSdkPresent: boolean;
  adbPresent: boolean;
  androidEmulatorAvailable: boolean;
  androidDeviceAttached: boolean;
  androidToolchain: AndroidToolchainResolution;
  expoCliPresent: boolean;
  expoProjectDetected: boolean;
  reactNativeProjectDetected: boolean;
  xcodePresent: boolean;
  iosSimulatorAvailable: boolean;
  browserRuntimeAvailable: boolean;
  playwrightAvailable: boolean;
  operatingSystem: NodeJS.Platform;
  osCompatibleWithAndroidDev: boolean;
  osCompatibleWithIosDev: boolean;
  osCompatibleWithExpoDev: boolean;
  detectedAt: number;
  detail: Record<string, string>;
}

export interface MobileRuntimeAdapterStatus {
  runtimeId: MobileRuntimeKind;
  available: boolean;
  supported: boolean;
  launchable: boolean;
  verificationSupported: boolean;
  unavailableReason: string | null;
  requiredInstallationSteps: string[];
  androidRuntimeState?: AndroidRuntimeState;
}

export interface MobileRuntimeLaunchInput {
  rootDir: string;
  workspaceDir?: string;
  previewUrl?: string;
}

export interface MobileRuntimeLaunchResult {
  runtimeId: MobileRuntimeKind;
  detected: boolean;
  launchAttempted: boolean;
  launchSuccessful: boolean;
  unsupportedReason: string | null;
  detail: string;
  launchedAt: number | null;
}

export interface MobileRuntimeVerificationResult {
  runtimeId: MobileRuntimeKind;
  detected: boolean;
  verificationAttempted: boolean;
  verificationSuccessful: boolean;
  unsupportedReason: string | null;
  detail: string;
  verifiedAt: number | null;
}

export interface MobileRuntimeVerificationRecord {
  runtimeId: MobileRuntimeKind;
  detected: boolean;
  launchAttempted: boolean;
  launchSuccessful: boolean;
  verificationAttempted: boolean;
  verificationSuccessful: boolean;
  unsupportedReason: string | null;
  androidRuntimeState?: AndroidRuntimeState;
}

export interface MobileRuntimePreviewRegistryEntry {
  runtimeId: MobileRuntimeKind;
  available: boolean;
  launchable: boolean;
  verificationSupported: boolean;
  unavailableReason: string | null;
  requiredInstallationSteps: string[];
}

export interface MobileRuntimePreviewRegistry {
  generatedAt: number;
  ownerModule: string;
  availableRuntimes: MobileRuntimeKind[];
  unavailableRuntimes: MobileRuntimeKind[];
  entries: MobileRuntimePreviewRegistryEntry[];
  reusedModules: readonly string[];
  livePreviewTree: {
    browserRuntime: MobileRuntimePreviewRegistryEntry;
    mobileWebRuntime: MobileRuntimePreviewRegistryEntry;
    androidRuntime: MobileRuntimePreviewRegistryEntry;
    iosRuntime: MobileRuntimePreviewRegistryEntry;
    expoRuntime: MobileRuntimePreviewRegistryEntry;
  };
}

export interface MobileRuntimeRealityBridgeResult {
  workspaceSignals: {
    deviceFramePreviewActive: boolean;
    touchSimulationEvidence: boolean;
    mobilePreviewLaunchEvidence: boolean;
    androidRuntimeLaunchEvidence: boolean;
    iosRuntimeLaunchEvidence: boolean;
    expoRuntimeLaunchEvidence: boolean;
    mobileRuntimeVerificationEvidence: boolean;
  };
  realityAssessmentScore: number;
  realityAssessmentId: string;
}

export interface MobileRuntimePreviewAssessment {
  assessmentId: string;
  capabilityMatrix: MobileRuntimeCapabilityMatrix;
  adapterStatuses: MobileRuntimeAdapterStatus[];
  verificationRecords: MobileRuntimeVerificationRecord[];
  registry: MobileRuntimePreviewRegistry;
  realityBridge: MobileRuntimeRealityBridgeResult;
  summary: string;
  assessedAt: number;
}

export interface AssessMobileRuntimePreviewInput {
  rootDir: string;
  workspaceDir?: string;
  previewUrl?: string;
}
