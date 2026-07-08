/**
 * Virtual User Engine — authority registry.
 */

import {
  VIRTUAL_USER_ENGINE_OWNER_MODULE,
  VIRTUAL_USER_ENGINE_PASS_TOKEN,
} from './virtual-user-types.js';

export function getDevPulseV2VirtualUserEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: VIRTUAL_USER_ENGINE_OWNER_MODULE,
    passToken: VIRTUAL_USER_ENGINE_PASS_TOKEN,
    phase: 6,
    enforcementAuthority: true,
  };
}

export function registerVirtualUserEngineWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: VIRTUAL_USER_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerVirtualUserEngineWithBehaviorSimulation(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerVirtualUserEngineWithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
