/**
 * Device suitability engine — classifies mobile-safe vs desktop-required preview access.
 * Classification only. No rendering or execution.
 */

import type { GateRecord, PreviewSessionInput, PreviewTarget } from './types.js';
import { DESKTOP_REQUIRED_TARGETS, MOBILE_SUITABLE_TARGETS } from './types.js';

export interface DeviceSuitabilityResult {
  mobileSafe: boolean;
  desktopRequired: boolean;
  gates: GateRecord[];
  warnings: string[];
}

export function evaluateDeviceSuitability(input: PreviewSessionInput): DeviceSuitabilityResult {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const target = input.previewTarget;

  if (target === 'UNKNOWN') {
    gates.push({
      gateId: 'dev-suit-0001',
      gateType: 'DEVICE_SUITABILITY',
      status: 'CLOSED',
      description: 'UNKNOWN preview target — not mobile suitable',
    });
    return { mobileSafe: false, desktopRequired: true, gates, warnings };
  }

  if ((DESKTOP_REQUIRED_TARGETS as readonly string[]).includes(target)) {
    gates.push({
      gateId: 'dev-suit-0002',
      gateType: 'DEVICE_SUITABILITY',
      status: 'REQUIRED',
      description: 'Desktop preview required for DESKTOP_APP target',
    });
    warnings.push('Large desktop app preview requires desktop — mobile shows notice only.');
    return { mobileSafe: false, desktopRequired: true, gates, warnings };
  }

  if (target === 'WEB_APP') {
    const complexWeb = input.requestedPreviewCapabilities.includes('VIEW_RESPONSIVE_SUMMARY');
    if (complexWeb && input.deviceType === 'PHONE') {
      gates.push({
        gateId: 'dev-suit-0003',
        gateType: 'DEVICE_SUITABILITY',
        status: 'REQUIRED',
        description: 'Large web app inspection requires desktop',
      });
      warnings.push('Complex multi-window web app preview — desktop recommended.');
      return { mobileSafe: false, desktopRequired: true, gates, warnings };
    }
  }

  if (target === 'SYSTEM_TOPOLOGY' && input.requestedPreviewCapabilities.includes('VIEW_STATIC_SNAPSHOT')) {
    gates.push({
      gateId: 'dev-suit-0004',
      gateType: 'DEVICE_SUITABILITY',
      status: 'REQUIRED',
      description: 'Full topology inspection requires desktop',
    });
    warnings.push('Full backend topology inspection — desktop required.');
    return { mobileSafe: false, desktopRequired: true, gates, warnings };
  }

  if ((MOBILE_SUITABLE_TARGETS as readonly string[]).includes(target)) {
    gates.push({
      gateId: 'dev-suit-0005',
      gateType: 'DEVICE_SUITABILITY',
      status: 'OPEN',
      description: `Mobile suitable for ${target}`,
    });
    return { mobileSafe: true, desktopRequired: false, gates, warnings };
  }

  gates.push({
    gateId: 'dev-suit-0006',
    gateType: 'DEVICE_SUITABILITY',
    status: 'REQUIRED',
    description: `Default desktop notice for ${target}`,
  });
  return { mobileSafe: false, desktopRequired: true, gates, warnings };
}

export function deviceSuitabilityKey(mobileSafe: boolean, desktopRequired: boolean): string {
  return `${mobileSafe}|${desktopRequired}`;
}

export function isMobileSuitableTarget(target: PreviewTarget): boolean {
  return (MOBILE_SUITABLE_TARGETS as readonly string[]).includes(target);
}
