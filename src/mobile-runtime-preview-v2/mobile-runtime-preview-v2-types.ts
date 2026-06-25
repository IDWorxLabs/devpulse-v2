/**
 * Mobile Runtime Preview V2 — types.
 */

import type { DOCUMENTED_ANDROID_VERDICTS } from './mobile-runtime-preview-v2-bounds.js';
import type {
  MobileRuntimeCapabilityMatrix,
  MobileRuntimePreviewAssessment,
  MobileRuntimeRealityBridgeResult,
  MobileRuntimeVerificationRecord,
} from '../mobile-runtime-preview-v1/mobile-runtime-preview-types.js';

export type AndroidVerificationVerdict = (typeof DOCUMENTED_ANDROID_VERDICTS)[number];

export interface AdbDeviceInfo {
  serial: string;
  state: 'device' | 'offline' | 'unauthorized' | 'unknown';
  deviceType: 'emulator' | 'physical';
}

export interface AndroidDeviceStateCapture {
  sysBootCompleted: string | null;
  devBootcomplete: string | null;
  apiLevel: string | null;
  deviceModel: string | null;
  screenSize: string | null;
  density: string | null;
}

export interface AndroidEmulatorLaunchEvidence {
  recordedAt: number;
  sdkPath: string | null;
  adbPath: string | null;
  emulatorPath: string | null;
  avdList: readonly string[];
  selectedAvd: string | null;
  emulatorAlreadyRunning: boolean;
  startedByAiDevEngine: boolean;
  launchAttempted: boolean;
  launchSuccessful: boolean;
  deviceSerial: string | null;
  deviceType: 'emulator' | 'physical' | null;
  bootCompleted: boolean;
  deviceState: AndroidDeviceStateCapture;
  verificationVerdict: AndroidVerificationVerdict;
  blockerDetail: string;
  launchLogs: string[];
  elapsedMs: number;
}

export interface AndroidEmulatorLaunchOptions {
  rootDir: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  preferredAvd?: string;
  requestCleanup?: boolean;
}

export interface MobileRuntimePreviewV2Assessment {
  assessmentId: string;
  v1Baseline: MobileRuntimePreviewAssessment;
  capabilityMatrix: MobileRuntimeCapabilityMatrix;
  verificationRecords: MobileRuntimeVerificationRecord[];
  androidLaunchEvidence: AndroidEmulatorLaunchEvidence;
  realityBridge: MobileRuntimeRealityBridgeResult;
  summary: string;
  assessedAt: number;
}

export interface AssessMobileRuntimePreviewV2Input {
  rootDir: string;
  workspaceDir?: string;
  previewUrl?: string;
  androidLaunchTimeoutMs?: number;
  requestAndroidCleanup?: boolean;
}
