/**
 * Mobile Runtime Preview V2 — bounded Android emulator launch controller.
 * Reuses V1.1 resolved SDK/adb/emulator paths. Does not require global PATH.
 */

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  ANDROID_LAUNCH_POLL_INTERVAL_MS,
  DEFAULT_ANDROID_LAUNCH_TIMEOUT_MS,
  DEFAULT_PREFERRED_AVD,
  EMULATOR_SPAWN_OBSERVE_MS,
} from './mobile-runtime-preview-v2-bounds.js';
import type {
  AdbDeviceInfo,
  AndroidDeviceStateCapture,
  AndroidEmulatorLaunchEvidence,
  AndroidEmulatorLaunchOptions,
  AndroidVerificationVerdict,
} from './mobile-runtime-preview-v2-types.js';
import { resolveAndroidToolchain } from '../mobile-runtime-preview-v1/android-sdk-path-resolver.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runExecutable(executable: string, args: string[], timeoutMs = 15_000): { ok: boolean; output: string } {
  try {
    const result = spawnSync(executable, args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    return { ok: result.status === 0, output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: message };
  }
}

function parseAdbDevices(output: string): AdbDeviceInfo[] {
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('*'))
    .map((line) => {
      const [serial, stateRaw = 'unknown'] = line.split(/\s+/);
      const state = stateRaw as AdbDeviceInfo['state'];
      const deviceType: AdbDeviceInfo['deviceType'] = serial?.startsWith('emulator-') ? 'emulator' : 'physical';
      return { serial: serial ?? 'unknown', state, deviceType };
    });
}

function isHostConfigError(output: string): boolean {
  return /HAXM|WHPX|Hyper-V|hardware acceleration|x86 emulator|haxm|hax is not working|Please disable Hypervisor|AEHD|VulkanVirtualQueue|GPU drivers/i.test(
    output,
  );
}

function emptyDeviceState(): AndroidDeviceStateCapture {
  return {
    sysBootCompleted: null,
    devBootcomplete: null,
    apiLevel: null,
    deviceModel: null,
    screenSize: null,
    density: null,
  };
}

function adbShellProp(adbPath: string, serial: string, prop: string): string | null {
  const probe = runExecutable(adbPath, ['-s', serial, 'shell', 'getprop', prop], 10_000);
  if (!probe.ok) return null;
  const value = probe.output.trim();
  return value.length > 0 ? value : null;
}

export class AndroidEmulatorLaunchController {
  private readonly rootDir: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly preferredAvd: string;
  private readonly requestCleanup: boolean;

  private adbPath: string | null = null;
  private emulatorPath: string | null = null;
  private sdkPath: string | null = null;
  private avdList: string[] = [];
  private emulatorChild: ChildProcess | null = null;
  private startedByAiDevEngine = false;
  private selectedAvd: string | null = null;
  private deviceSerial: string | null = null;
  private launchLogs: string[] = [];

  constructor(options: AndroidEmulatorLaunchOptions) {
    this.rootDir = options.rootDir;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_ANDROID_LAUNCH_TIMEOUT_MS;
    this.pollIntervalMs = options.pollIntervalMs ?? ANDROID_LAUNCH_POLL_INTERVAL_MS;
    this.preferredAvd = options.preferredAvd ?? DEFAULT_PREFERRED_AVD;
    this.requestCleanup = Boolean(options.requestCleanup);
  }

  private log(message: string): void {
    this.launchLogs.push(message);
  }

  private resolveToolchain(): boolean {
    const toolchain = resolveAndroidToolchain(this.rootDir);
    this.sdkPath = toolchain.sdkPath;
    this.adbPath = toolchain.adbPath;
    this.emulatorPath = toolchain.emulatorPath;
    this.avdList = [...toolchain.avdList];
    return Boolean(this.sdkPath && this.adbPath);
  }

  detectRunningDevices(): AdbDeviceInfo[] {
    if (!this.adbPath) return [];
    const probe = runExecutable(this.adbPath, ['devices'], 12_000);
    if (!probe.ok) {
      this.log(`adb devices failed: ${probe.output}`);
      return [];
    }
    return parseAdbDevices(probe.output);
  }

  selectAvd(): string | null {
    if (this.avdList.includes(this.preferredAvd)) return this.preferredAvd;
    return this.avdList[0] ?? null;
  }

  async launchAvd(avdName: string): Promise<{ ok: boolean; reason: AndroidVerificationVerdict; detail: string }> {
    if (!this.emulatorPath || !existsSync(this.emulatorPath)) {
      return { ok: false, reason: 'TOOLCHAIN_MISSING', detail: 'emulator executable not resolved' };
    }

    this.selectedAvd = avdName;
    this.log(`Launching AVD: ${avdName}`);

    return new Promise((resolve) => {
      let observed = '';
      const child = spawn(
        this.emulatorPath!,
        ['-avd', avdName, '-no-boot-anim', '-no-snapshot-save'],
        {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        },
      );
      this.emulatorChild = child;
      this.startedByAiDevEngine = true;

      child.stderr?.on('data', (chunk: Buffer) => {
        observed += chunk.toString();
      });
      child.stdout?.on('data', (chunk: Buffer) => {
        observed += chunk.toString();
      });

      child.on('error', (err) => {
        this.log(`emulator spawn error: ${err.message}`);
        resolve({ ok: false, reason: 'UNKNOWN_FAILURE', detail: err.message });
      });

      setTimeout(() => {
        if (isHostConfigError(observed)) {
          this.log(`host config error: ${observed.slice(0, 500)}`);
          resolve({
            ok: false,
            reason: 'UNSUPPORTED_HOST_CONFIG',
            detail: observed.slice(0, 800),
          });
          return;
        }
        if (child.exitCode !== null && child.exitCode !== 0) {
          this.log(`emulator exited early (${child.exitCode}): ${observed.slice(0, 500)}`);
          resolve({
            ok: false,
            reason: isHostConfigError(observed) ? 'UNSUPPORTED_HOST_CONFIG' : 'UNKNOWN_FAILURE',
            detail: observed.slice(0, 800) || `emulator exited with code ${child.exitCode}`,
          });
          return;
        }
        child.unref();
        this.log('emulator process spawned and detached');
        resolve({ ok: true, reason: 'AVAILABLE_NOT_BOOTED', detail: 'emulator spawn accepted' });
      }, EMULATOR_SPAWN_OBSERVE_MS);
    });
  }

  async waitForDevice(deadlineMs: number): Promise<
    | { outcome: 'ready'; device: AdbDeviceInfo }
    | { outcome: 'unauthorized'; device: AdbDeviceInfo }
    | { outcome: 'offline'; device: AdbDeviceInfo }
    | { outcome: 'timeout' }
  > {
    if (!this.adbPath) return { outcome: 'timeout' };
    const deadline = Date.now() + deadlineMs;
    let lastOffline: AdbDeviceInfo | null = null;

    while (Date.now() < deadline) {
      const devices = this.detectRunningDevices();
      const unauthorized = devices.find((d) => d.state === 'unauthorized');
      if (unauthorized) {
        this.deviceSerial = unauthorized.serial;
        this.log(`device unauthorized: ${unauthorized.serial}`);
        return { outcome: 'unauthorized', device: unauthorized };
      }
      const offline = devices.find((d) => d.state === 'offline');
      if (offline) {
        lastOffline = offline;
        this.log(`device offline (booting): ${offline.serial}`);
      }
      const ready = devices.find((d) => d.state === 'device');
      if (ready) {
        this.deviceSerial = ready.serial;
        this.log(`device attached: ${ready.serial} (${ready.deviceType})`);
        return { outcome: 'ready', device: ready };
      }
      await sleep(this.pollIntervalMs);
    }

    if (lastOffline) {
      this.deviceSerial = lastOffline.serial;
      return { outcome: 'offline', device: lastOffline };
    }
    return { outcome: 'timeout' };
  }

  async waitForBootComplete(serial: string, deadlineMs: number): Promise<boolean> {
    if (!this.adbPath) return false;
    const deadline = Date.now() + deadlineMs;

    while (Date.now() < deadline) {
      const sysBoot = adbShellProp(this.adbPath, serial, 'sys.boot_completed');
      if (sysBoot === '1') {
        this.log(`boot complete for ${serial} (sys.boot_completed=1)`);
        return true;
      }
      await sleep(this.pollIntervalMs);
    }
    return false;
  }

  async captureDeviceState(serial: string): Promise<AndroidDeviceStateCapture> {
    if (!this.adbPath) return emptyDeviceState();
    const wmSize = runExecutable(this.adbPath, ['-s', serial, 'shell', 'wm', 'size'], 10_000);
    const wmDensity = runExecutable(this.adbPath, ['-s', serial, 'shell', 'wm', 'density'], 10_000);
    return {
      sysBootCompleted: adbShellProp(this.adbPath, serial, 'sys.boot_completed'),
      devBootcomplete: adbShellProp(this.adbPath, serial, 'dev.bootcomplete'),
      apiLevel: adbShellProp(this.adbPath, serial, 'ro.build.version.sdk'),
      deviceModel: adbShellProp(this.adbPath, serial, 'ro.product.model'),
      screenSize: wmSize.ok ? wmSize.output.replace(/\s+/g, ' ').trim() : null,
      density: wmDensity.ok ? wmDensity.output.replace(/\s+/g, ' ').trim() : null,
    };
  }

  async verifyDeviceReady(serial: string): Promise<boolean> {
    const state = await this.captureDeviceState(serial);
    return state.sysBootCompleted === '1' && Boolean(state.apiLevel);
  }

  async shutdownIfStartedByAiDevEngine(): Promise<void> {
    if (!this.requestCleanup || !this.startedByAiDevEngine || !this.adbPath || !this.deviceSerial) {
      this.log(
        this.requestCleanup
          ? 'cleanup skipped — emulator not started by AiDevEngine or no serial'
          : 'cleanup not requested',
      );
      return;
    }
    this.log(`shutdown requested for AiDevEngine-started emulator ${this.deviceSerial}`);
    runExecutable(this.adbPath, ['-s', this.deviceSerial, 'emu', 'kill'], 15_000);
  }

  async executeBoundedLaunch(): Promise<AndroidEmulatorLaunchEvidence> {
    const startedAt = Date.now();
    this.launchLogs = [];

    if (!this.resolveToolchain()) {
      return this.buildEvidence({
        launchAttempted: false,
        launchSuccessful: false,
        verificationVerdict: 'TOOLCHAIN_MISSING',
        blockerDetail: 'Android SDK or adb not resolved',
        bootCompleted: false,
        deviceState: emptyDeviceState(),
        elapsedMs: Date.now() - startedAt,
      });
    }

    const runningBefore = this.detectRunningDevices();
    const emulatorAlreadyRunning = runningBefore.some((d) => d.state === 'device' && d.deviceType === 'emulator');
    const physicalRunning = runningBefore.find((d) => d.state === 'device' && d.deviceType === 'physical');

    if (physicalRunning) {
      this.deviceSerial = physicalRunning.serial;
      this.startedByAiDevEngine = false;
      const bootOk = await this.waitForBootComplete(physicalRunning.serial, this.timeoutMs);
      const state = await this.captureDeviceState(physicalRunning.serial);
      const verified = bootOk && (await this.verifyDeviceReady(physicalRunning.serial));
      return this.buildEvidence({
        emulatorAlreadyRunning: true,
        launchAttempted: false,
        launchSuccessful: true,
        deviceSerial: physicalRunning.serial,
        deviceType: 'physical',
        bootCompleted: bootOk,
        deviceState: state,
        verificationVerdict: verified ? 'VERIFIED' : bootOk ? 'UNKNOWN_FAILURE' : 'AVAILABLE_NOT_BOOTED',
        blockerDetail: verified ? 'Physical device verified' : 'Physical device not fully booted',
        elapsedMs: Date.now() - startedAt,
      });
    }

    if (emulatorAlreadyRunning) {
      const emu = runningBefore.find((d) => d.state === 'device' && d.deviceType === 'emulator')!;
      this.deviceSerial = emu.serial;
      this.startedByAiDevEngine = false;
      this.log(`reusing running emulator ${emu.serial}`);
      const remaining = this.timeoutMs - (Date.now() - startedAt);
      const bootOk = await this.waitForBootComplete(emu.serial, Math.max(remaining, this.pollIntervalMs));
      const state = await this.captureDeviceState(emu.serial);
      const verified = bootOk && (await this.verifyDeviceReady(emu.serial));
      return this.buildEvidence({
        emulatorAlreadyRunning: true,
        launchAttempted: false,
        launchSuccessful: true,
        deviceSerial: emu.serial,
        deviceType: 'emulator',
        bootCompleted: bootOk,
        deviceState: state,
        verificationVerdict: verified ? 'VERIFIED' : bootOk ? 'UNKNOWN_FAILURE' : 'AVAILABLE_NOT_BOOTED',
        blockerDetail: verified ? 'Reused running emulator — verified' : 'Reused emulator — boot incomplete',
        elapsedMs: Date.now() - startedAt,
      });
    }

    const selectedAvd = this.selectAvd();
    if (!selectedAvd) {
      return this.buildEvidence({
        launchAttempted: false,
        launchSuccessful: false,
        verificationVerdict: 'NO_AVD_AVAILABLE',
        blockerDetail: 'No AVD available to launch',
        bootCompleted: false,
        deviceState: emptyDeviceState(),
        elapsedMs: Date.now() - startedAt,
      });
    }

    const launchResult = await this.launchAvd(selectedAvd);
    if (!launchResult.ok) {
      return this.buildEvidence({
        selectedAvd,
        launchAttempted: true,
        launchSuccessful: false,
        verificationVerdict: launchResult.reason,
        blockerDetail: launchResult.detail,
        bootCompleted: false,
        deviceState: emptyDeviceState(),
        elapsedMs: Date.now() - startedAt,
      });
    }

    const remainingAfterSpawn = this.timeoutMs - (Date.now() - startedAt);
    const waitResult = await this.waitForDevice(remainingAfterSpawn);
    if (waitResult.outcome === 'timeout') {
      return this.buildEvidence({
        selectedAvd,
        launchAttempted: true,
        launchSuccessful: false,
        verificationVerdict: 'LAUNCH_TIMED_OUT',
        blockerDetail: `No device appeared within ${this.timeoutMs}ms`,
        bootCompleted: false,
        deviceState: emptyDeviceState(),
        elapsedMs: Date.now() - startedAt,
      });
    }

    if (waitResult.outcome === 'unauthorized') {
      const device = waitResult.device;
      return this.buildEvidence({
        selectedAvd,
        launchAttempted: true,
        launchSuccessful: false,
        deviceSerial: device.serial,
        deviceType: device.deviceType,
        verificationVerdict: 'DEVICE_UNAUTHORIZED',
        blockerDetail: `Device ${device.serial} unauthorized — accept RSA prompt on host`,
        bootCompleted: false,
        deviceState: emptyDeviceState(),
        elapsedMs: Date.now() - startedAt,
      });
    }

    if (waitResult.outcome === 'offline') {
      const device = waitResult.device;
      return this.buildEvidence({
        selectedAvd,
        launchAttempted: true,
        launchSuccessful: false,
        deviceSerial: device.serial,
        deviceType: device.deviceType,
        verificationVerdict: 'DEVICE_OFFLINE',
        blockerDetail: `Device ${device.serial} remained offline through boot timeout`,
        bootCompleted: false,
        deviceState: emptyDeviceState(),
        elapsedMs: Date.now() - startedAt,
      });
    }

    const device = waitResult.device;
    const remainingForBoot = this.timeoutMs - (Date.now() - startedAt);
    const bootOk = await this.waitForBootComplete(device.serial, Math.max(remainingForBoot, this.pollIntervalMs));
    const state = await this.captureDeviceState(device.serial);
    const verified = bootOk && (await this.verifyDeviceReady(device.serial));

    if (!bootOk && Date.now() - startedAt >= this.timeoutMs) {
      return this.buildEvidence({
        selectedAvd,
        launchAttempted: true,
        launchSuccessful: true,
        deviceSerial: device.serial,
        deviceType: device.deviceType,
        bootCompleted: false,
        deviceState: state,
        verificationVerdict: 'LAUNCH_TIMED_OUT',
        blockerDetail: `Device ${device.serial} attached but boot did not complete within timeout`,
        elapsedMs: Date.now() - startedAt,
      });
    }

    return this.buildEvidence({
      selectedAvd,
      launchAttempted: true,
      launchSuccessful: true,
      deviceSerial: device.serial,
      deviceType: device.deviceType,
      bootCompleted: bootOk,
      deviceState: state,
      verificationVerdict: verified ? 'VERIFIED' : 'AVAILABLE_NOT_BOOTED',
      blockerDetail: verified
        ? `Emulator ${device.serial} booted and verified (API ${state.apiLevel ?? 'unknown'})`
        : `Emulator ${device.serial} attached but not fully verified`,
      elapsedMs: Date.now() - startedAt,
    });
  }

  private buildEvidence(
    partial: Partial<AndroidEmulatorLaunchEvidence> & {
      verificationVerdict: AndroidVerificationVerdict;
      blockerDetail: string;
      elapsedMs: number;
    },
  ): AndroidEmulatorLaunchEvidence {
    return {
      recordedAt: Date.now(),
      sdkPath: this.sdkPath,
      adbPath: this.adbPath,
      emulatorPath: this.emulatorPath,
      avdList: this.avdList,
      selectedAvd: partial.selectedAvd ?? this.selectedAvd,
      emulatorAlreadyRunning: partial.emulatorAlreadyRunning ?? false,
      startedByAiDevEngine: this.startedByAiDevEngine,
      launchAttempted: partial.launchAttempted ?? false,
      launchSuccessful: partial.launchSuccessful ?? false,
      deviceSerial: partial.deviceSerial ?? this.deviceSerial,
      deviceType: partial.deviceType ?? null,
      bootCompleted: partial.bootCompleted ?? false,
      deviceState: partial.deviceState ?? emptyDeviceState(),
      verificationVerdict: partial.verificationVerdict,
      blockerDetail: partial.blockerDetail,
      launchLogs: [...this.launchLogs],
      elapsedMs: partial.elapsedMs,
    };
  }
}
