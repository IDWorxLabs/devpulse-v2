/**
 * Device validation engine — validates mobile device and session identity inputs.
 * Foundation only. No execution.
 */

import type { DeviceType, MobileSessionInput, Platform, SessionState } from './types.js';

export interface DeviceValidationResult {
  valid: boolean;
  reason: string;
  warnings: string[];
  sessionState: SessionState;
}

export function isKnownDeviceType(deviceType: DeviceType): boolean {
  return ['PHONE', 'TABLET', 'DESKTOP_BROWSER'].includes(deviceType);
}

export function isKnownPlatform(platform: Platform): boolean {
  return ['ANDROID', 'IOS', 'WEB', 'WINDOWS', 'MACOS'].includes(platform);
}

export function validateDevice(input: MobileSessionInput): DeviceValidationResult {
  const warnings: string[] = [];

  if (!input.deviceId?.trim()) {
    return { valid: false, reason: 'deviceId is required', warnings, sessionState: 'SESSION_BLOCKED' };
  }
  if (!input.userId?.trim()) {
    return { valid: false, reason: 'userId is required', warnings, sessionState: 'SESSION_BLOCKED' };
  }
  if (!input.sessionId?.trim()) {
    return { valid: false, reason: 'sessionId is required', warnings, sessionState: 'SESSION_BLOCKED' };
  }

  if (input.deviceType === 'UNKNOWN') {
    warnings.push('Device type UNKNOWN — session may have limited capability support.');
  }
  if (input.platform === 'UNKNOWN') {
    warnings.push('Platform UNKNOWN — verify device identity before granting command intent.');
  }
  if (!isKnownDeviceType(input.deviceType)) {
    warnings.push(`Unrecognized device type: ${input.deviceType}`);
  }
  if (!isKnownPlatform(input.platform)) {
    warnings.push(`Unrecognized platform: ${input.platform}`);
  }

  return {
    valid: true,
    reason: 'Device identity validated',
    warnings,
    sessionState: 'DEVICE_VALIDATED',
  };
}

export function deviceValidationKey(input: MobileSessionInput): string {
  return [input.deviceId, input.userId, input.sessionId, input.deviceType, input.platform].join('|');
}
