/**
 * Mobile Runtime Preview V1.1 — Android SDK path resolution.
 * Resolves SDK/adb/emulator from env, local.properties, standard paths, and PATH fallback.
 * Does not require global PATH configuration.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { COMMAND_PROBE_TIMEOUT_MS } from './mobile-runtime-preview-bounds.js';
import type { AndroidRuntimeState } from './mobile-runtime-preview-types.js';

export interface AndroidSdkResolution {
  sdkPath: string | null;
  sdkPathSource: string;
  adbPath: string | null;
  emulatorPath: string | null;
  avdList: string[];
}

function runExecutable(executable: string, args: string[]): { ok: boolean; output: string } {
  try {
    const result = spawnSync(executable, args, {
      encoding: 'utf8',
      timeout: COMMAND_PROBE_TIMEOUT_MS,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    return { ok: result.status === 0, output };
  } catch {
    return { ok: false, output: '' };
  }
}

function runPathCommand(command: string, args: string[]): { ok: boolean; output: string } {
  try {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      timeout: COMMAND_PROBE_TIMEOUT_MS,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    return { ok: result.status === 0, output };
  } catch {
    return { ok: false, output: '' };
  }
}

function isValidSdkPath(sdkPath: string): boolean {
  if (!sdkPath || !existsSync(sdkPath)) return false;
  return (
    existsSync(join(sdkPath, 'platform-tools')) ||
    existsSync(join(sdkPath, 'emulator')) ||
    existsSync(join(sdkPath, 'platforms'))
  );
}

function normalizeSdkPath(raw: string): string {
  return raw.replace(/\\/g, '/').replace(/\/+$/, '').replace(/\//g, '\\');
}

function parseLocalPropertiesSdkDir(content: string): string | null {
  const match = content.match(/^\s*sdk\.dir\s*=\s*(.+)\s*$/m);
  if (!match?.[1]) return null;
  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\\/g, '\\');
  if (process.platform === 'win32') {
    value = value.replace(/\\\\/g, '\\');
  }
  return value;
}

function findLocalPropertiesSdkDir(rootDir: string): { path: string; source: string } | null {
  const candidates = [
    join(rootDir, 'local.properties'),
    join(rootDir, 'android', 'local.properties'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const sdkDir = parseLocalPropertiesSdkDir(readFileSync(file, 'utf8'));
      if (sdkDir && isValidSdkPath(sdkDir)) {
        return { path: sdkDir, source: `local.properties (${file})` };
      }
    } catch {
      // skip unreadable file
    }
  }
  return null;
}

function standardSdkPaths(): string[] {
  if (process.platform === 'win32') {
    return [
      join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk'),
      join(process.env.USERPROFILE ?? '', 'AppData', 'Local', 'Android', 'Sdk'),
    ];
  }
  if (process.platform === 'darwin') {
    return [join(process.env.HOME ?? '', 'Library', 'Android', 'sdk')];
  }
  return [join(process.env.HOME ?? '', 'Android', 'Sdk')];
}

function resolveSdkFromPathAdb(): { path: string; source: string } | null {
  const probe = runPathCommand('adb', ['version']);
  if (!probe.ok) return null;
  const installedMatch = probe.output.match(/Installed as:\s*(.+adb(?:\.exe)?)/i);
  if (!installedMatch?.[1]) return null;
  const adbPath = installedMatch[1].trim();
  const platformTools = dirname(adbPath);
  const sdkPath = dirname(platformTools);
  if (isValidSdkPath(sdkPath)) {
    return { path: sdkPath, source: 'PATH adb (Installed as)' };
  }
  return null;
}

export function resolveAndroidSdkPath(rootDir: string): { path: string | null; source: string } {
  const envHome = process.env.ANDROID_HOME?.trim();
  if (envHome && isValidSdkPath(envHome)) {
    return { path: envHome, source: 'ANDROID_HOME' };
  }

  const envRoot = process.env.ANDROID_SDK_ROOT?.trim();
  if (envRoot && isValidSdkPath(envRoot)) {
    return { path: envRoot, source: 'ANDROID_SDK_ROOT' };
  }

  const fromLocal = findLocalPropertiesSdkDir(rootDir);
  if (fromLocal) return fromLocal;

  for (const candidate of standardSdkPaths()) {
    if (candidate && isValidSdkPath(candidate)) {
      return { path: candidate, source: 'standard SDK path' };
    }
  }

  const fromPath = resolveSdkFromPathAdb();
  if (fromPath) return fromPath;

  return { path: null, source: 'none' };
}

export function resolveAdbPath(sdkPath: string | null): string | null {
  if (!sdkPath) {
    const pathProbe = runPathCommand('adb', ['version']);
    if (pathProbe.ok) return 'adb';
    return null;
  }
  const direct = join(sdkPath, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
  if (existsSync(direct)) return direct;
  const pathProbe = runPathCommand('adb', ['version']);
  return pathProbe.ok ? 'adb' : null;
}

export function resolveEmulatorPath(sdkPath: string | null): string | null {
  if (!sdkPath) {
    const pathProbe = runPathCommand('emulator', ['-version']);
    if (pathProbe.ok) return 'emulator';
    return null;
  }
  const direct = join(sdkPath, 'emulator', process.platform === 'win32' ? 'emulator.exe' : 'emulator');
  if (existsSync(direct)) return direct;
  const pathProbe = runPathCommand('emulator', ['-version']);
  return pathProbe.ok ? 'emulator' : null;
}

export function listAndroidAvds(emulatorPath: string | null): string[] {
  if (!emulatorPath) return [];
  const probe = runExecutable(emulatorPath, ['-list-avds']);
  if (!probe.ok || !probe.output) return [];
  return probe.output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function probeAdbVersion(adbPath: string | null): string | null {
  if (!adbPath) return null;
  const probe = runExecutable(adbPath, ['version']);
  if (!probe.ok) return null;
  return probe.output.split('\n')[0] ?? null;
}

export function probeAdbDevices(adbPath: string | null): {
  deviceCount: number;
  emulatorCount: number;
  physicalCount: number;
  attached: boolean;
  detail: string;
} {
  if (!adbPath) {
    return { deviceCount: 0, emulatorCount: 0, physicalCount: 0, attached: false, detail: 'adb path not resolved' };
  }
  const probe = runExecutable(adbPath, ['devices']);
  if (!probe.ok) {
    return { deviceCount: 0, emulatorCount: 0, physicalCount: 0, attached: false, detail: 'adb devices probe failed' };
  }
  const lines = probe.output
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('*'));
  const attachedLines = lines.filter((l) => l.includes('\tdevice'));
  const emulatorCount = attachedLines.filter((l) => l.startsWith('emulator-')).length;
  const physicalCount = attachedLines.length - emulatorCount;
  const deviceCount = attachedLines.length;
  return {
    deviceCount,
    emulatorCount,
    physicalCount,
    attached: deviceCount > 0,
    detail:
      deviceCount > 0
        ? `${deviceCount} device(s) attached (${emulatorCount} emulator, ${physicalCount} physical)`
        : 'No running Android devices/emulators attached via adb',
  };
}

export function classifyAndroidRuntimeState(input: {
  sdkPath: string | null;
  adbPath: string | null;
  emulatorPath: string | null;
  avdList: string[];
  deviceAttached: boolean;
}): AndroidRuntimeState {
  if (!input.sdkPath || !input.adbPath) return 'MISSING_TOOLCHAIN';
  if (input.deviceAttached) return 'DEVICE_RUNNING';
  if (input.avdList.length > 0) return 'LAUNCHABLE';
  if (input.emulatorPath) return 'TOOLCHAIN_DETECTED';
  return 'TOOLCHAIN_DETECTED';
}

export function resolveAndroidToolchain(rootDir: string): AndroidSdkResolution & {
  adbVersion: string | null;
  deviceAttached: boolean;
  deviceDetail: string;
  androidRuntimeState: AndroidRuntimeState;
} {
  const { path: sdkPath, source: sdkPathSource } = resolveAndroidSdkPath(rootDir);
  const adbPath = resolveAdbPath(sdkPath);
  const emulatorPath = resolveEmulatorPath(sdkPath);
  const avdList = listAndroidAvds(emulatorPath);
  const adbVersion = probeAdbVersion(adbPath);
  const devices = probeAdbDevices(adbPath);
  const androidRuntimeState = classifyAndroidRuntimeState({
    sdkPath,
    adbPath,
    emulatorPath,
    avdList,
    deviceAttached: devices.attached,
  });

  return {
    sdkPath,
    sdkPathSource,
    adbPath,
    emulatorPath,
    avdList,
    adbVersion,
    deviceAttached: devices.attached,
    deviceDetail: devices.detail,
    androidRuntimeState,
  };
}

/** AVD_AVAILABLE when AVDs exist but no device is running — informational sub-state for reports. */
export function hasAvdAvailable(resolution: Pick<AndroidSdkResolution, 'avdList'>, deviceAttached: boolean): boolean {
  return resolution.avdList.length > 0 && !deviceAttached;
}

export { normalizeSdkPath };
