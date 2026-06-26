/**
 * Virtual Device Laboratory — authority registry.
 */

import {
  VIRTUAL_DEVICE_LABORATORY_OWNER_MODULE,
  VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN,
} from './virtual-device-types.js';

export function getDevPulseV2VirtualDeviceLaboratory(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  simulationOnly: true;
} {
  return {
    ownerModule: VIRTUAL_DEVICE_LABORATORY_OWNER_MODULE,
    passToken: VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN,
    phase: 7,
    simulationOnly: true,
  };
}

export function registerVirtualDeviceLaboratoryWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: VIRTUAL_DEVICE_LABORATORY_PASS_TOKEN, readOnly: true };
}

export function registerVirtualDeviceLaboratoryWithVirtualUserEngine(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerVirtualDeviceLaboratoryWithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
