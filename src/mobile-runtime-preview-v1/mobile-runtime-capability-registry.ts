/**
 * Mobile Runtime Preview V1 — runtime capability detection registry.
 * V1.1: Android SDK/adb/emulator resolved from SDK path — not PATH-only.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { hasAvdAvailable, resolveAndroidToolchain } from './android-sdk-path-resolver.js';
import { COMMAND_PROBE_TIMEOUT_MS } from './mobile-runtime-preview-bounds.js';
import type { AndroidRuntimeState, MobileRuntimeCapabilityMatrix } from './mobile-runtime-preview-types.js';

function runProbe(command: string, args: string[]): { ok: boolean; output: string } {
  try {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      timeout: COMMAND_PROBE_TIMEOUT_MS,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    return { ok: result.status === 0, output };
  } catch {
    return { ok: false, output: '' };
  }
}

function readRootPackageJson(rootDir: string): Record<string, unknown> | null {
  const pkgPath = join(rootDir, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function hasDependency(pkg: Record<string, unknown> | null, name: string): boolean {
  if (!pkg) return false;
  const deps = { ...(pkg.dependencies as Record<string, string> | undefined), ...(pkg.devDependencies as Record<string, string> | undefined) };
  return Boolean(deps[name]);
}

function detectExpoCli(rootDir: string, detail: Record<string, string>): boolean {
  const localBin = join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'expo.cmd' : 'expo');
  if (existsSync(localBin)) {
    detail.expoCli = 'Local expo CLI in node_modules/.bin';
    return true;
  }
  const npx = runProbe('npx', ['expo', '--version']);
  if (npx.ok) {
    detail.expoCli = `npx expo --version: ${npx.output.split('\n')[0]}`;
    return true;
  }
  const expo = runProbe('expo', ['--version']);
  if (expo.ok) {
    detail.expoCli = expo.output.split('\n')[0] ?? 'expo CLI available';
    return true;
  }
  detail.expoCli = 'Expo CLI not found (npx expo --version failed)';
  return false;
}

function detectExpoProject(rootDir: string, detail: Record<string, string>): boolean {
  const pkg = readRootPackageJson(rootDir);
  const hasExpoDep = hasDependency(pkg, 'expo');
  const hasAppJson = existsSync(join(rootDir, 'app.json')) || existsSync(join(rootDir, 'app.config.js')) || existsSync(join(rootDir, 'app.config.ts'));
  if (hasExpoDep || hasAppJson) {
    detail.expoProject = hasExpoDep ? 'expo dependency in package.json' : 'Expo app config file present';
    return true;
  }
  detail.expoProject = 'No expo dependency or app.json/app.config.* in root';
  return false;
}

function detectReactNativeProject(rootDir: string, detail: Record<string, string>): boolean {
  const pkg = readRootPackageJson(rootDir);
  const hasRn = hasDependency(pkg, 'react-native');
  if (hasRn) {
    detail.reactNative = 'react-native dependency in package.json';
    return true;
  }
  detail.reactNative = 'No react-native dependency in root package.json';
  return false;
}

function detectXcode(detail: Record<string, string>): boolean {
  if (process.platform !== 'darwin') {
    detail.xcode = 'Xcode requires macOS';
    return false;
  }
  const probe = runProbe('xcodebuild', ['-version']);
  if (probe.ok) {
    detail.xcode = probe.output.split('\n').slice(0, 2).join(' ');
    return true;
  }
  detail.xcode = 'xcodebuild not available';
  return false;
}

function detectIosSimulator(detail: Record<string, string>): boolean {
  if (process.platform !== 'darwin') {
    detail.iosSimulator = 'iOS Simulator requires macOS';
    return false;
  }
  const probe = runProbe('xcrun', ['simctl', 'list', 'devices', 'available']);
  if (!probe.ok) {
    detail.iosSimulator = 'xcrun simctl probe failed';
    return false;
  }
  const deviceCount = (probe.output.match(/\(\w+-\w+-\w+-\w+-\w+\)/g) ?? []).length;
  if (deviceCount > 0) {
    detail.iosSimulator = `${deviceCount} iOS simulator device(s) available`;
    return true;
  }
  detail.iosSimulator = 'No iOS simulators available';
  return false;
}

async function detectPlaywright(detail: Record<string, string>): Promise<boolean> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    await browser.close();
    detail.playwright = 'Playwright Chromium launch succeeded';
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    detail.playwright = message.includes('playwright') ? 'Playwright package unavailable' : `Playwright launch failed: ${message.slice(0, 120)}`;
    return false;
  }
}

function reportAvdSubState(state: AndroidRuntimeState, avdAvailable: boolean): AndroidRuntimeState {
  if (state === 'LAUNCHABLE' && avdAvailable) return 'AVD_AVAILABLE';
  return state;
}

export async function detectMobileRuntimeCapabilities(rootDir: string): Promise<MobileRuntimeCapabilityMatrix> {
  const detail: Record<string, string> = {};
  const os = process.platform;

  const android = resolveAndroidToolchain(rootDir);
  const avdSubState = hasAvdAvailable(android, android.deviceAttached);
  const reportedState = reportAvdSubState(android.androidRuntimeState, avdSubState);

  const androidSdkPresent = Boolean(android.sdkPath);
  const adbPresent = Boolean(android.adbPath && android.adbVersion);
  const androidEmulatorAvailable = android.avdList.length > 0;
  const androidDeviceAttached = android.deviceAttached;

  if (android.sdkPath) detail.androidSdk = `${android.sdkPath} (${android.sdkPathSource})`;
  else detail.androidSdk = 'Android SDK not found';
  if (android.adbPath) detail.adb = android.adbVersion ? `${android.adbPath} — ${android.adbVersion}` : android.adbPath;
  else detail.adb = 'adb not resolved';
  if (android.emulatorPath) {
    detail.androidEmulator = androidEmulatorAvailable
      ? `${android.emulatorPath} — ${android.avdList.length} AVD(s): ${android.avdList.join(', ')}`
      : `${android.emulatorPath} — no AVDs listed`;
  } else {
    detail.androidEmulator = 'emulator not resolved';
  }
  detail.androidDevice = android.deviceDetail;
  detail.androidRuntimeState = reportedState;

  const expoCliPresent = detectExpoCli(rootDir, detail);
  const expoProjectDetected = detectExpoProject(rootDir, detail);
  const reactNativeProjectDetected = detectReactNativeProject(rootDir, detail);
  const xcodePresent = detectXcode(detail);
  const iosSimulatorAvailable = detectIosSimulator(detail);
  const playwrightAvailable = await detectPlaywright(detail);

  return {
    androidSdkPresent,
    adbPresent,
    androidEmulatorAvailable,
    androidDeviceAttached,
    androidToolchain: {
      sdkPath: android.sdkPath,
      sdkPathSource: android.sdkPathSource,
      adbPath: android.adbPath,
      emulatorPath: android.emulatorPath,
      avdList: android.avdList,
      adbVersion: android.adbVersion,
      androidRuntimeState: reportedState,
    },
    expoCliPresent,
    expoProjectDetected,
    reactNativeProjectDetected,
    xcodePresent,
    iosSimulatorAvailable,
    browserRuntimeAvailable: playwrightAvailable,
    playwrightAvailable,
    operatingSystem: os,
    osCompatibleWithAndroidDev: os === 'win32' || os === 'darwin' || os === 'linux',
    osCompatibleWithIosDev: os === 'darwin',
    osCompatibleWithExpoDev: true,
    detectedAt: Date.now(),
    detail,
  };
}

export function buildCapabilityMatrixSummary(matrix: MobileRuntimeCapabilityMatrix): string {
  const flags = [
    matrix.androidSdkPresent ? 'Android SDK' : null,
    matrix.adbPresent ? 'adb' : null,
    matrix.androidEmulatorAvailable ? 'Android AVD' : null,
    matrix.androidDeviceAttached ? 'Android device running' : null,
    matrix.androidToolchain.androidRuntimeState !== 'MISSING_TOOLCHAIN'
      ? `Android state: ${matrix.androidToolchain.androidRuntimeState}`
      : null,
    matrix.expoCliPresent ? 'Expo CLI' : null,
    matrix.expoProjectDetected ? 'Expo project' : null,
    matrix.reactNativeProjectDetected ? 'React Native' : null,
    matrix.xcodePresent ? 'Xcode' : null,
    matrix.iosSimulatorAvailable ? 'iOS Simulator' : null,
    matrix.browserRuntimeAvailable ? 'Browser runtime' : null,
  ].filter(Boolean);
  return flags.length > 0 ? flags.join(', ') : 'No mobile runtime tools detected';
}
