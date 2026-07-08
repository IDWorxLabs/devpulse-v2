/**
 * Live Preview Gate — registry.
 */

import { LIVE_PREVIEW_GATE_OWNER_MODULE, LIVE_PREVIEW_GATE_V1_PASS_TOKEN } from './live-preview-gate-types.js';

export function getDevPulseV2LivePreviewGate(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: LIVE_PREVIEW_GATE_OWNER_MODULE,
    passToken: LIVE_PREVIEW_GATE_V1_PASS_TOKEN,
    phase: 13,
    enforcementAuthority: true,
  };
}

export function registerLivePreviewGateWithLaunchAuthority(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerLivePreviewGateWithFounderTest(): { passToken: string; readOnly: true } {
  return { passToken: LIVE_PREVIEW_GATE_V1_PASS_TOKEN, readOnly: true };
}

export function registerLivePreviewGateWithUvl(): { passToken: string; readOnly: true } {
  return { passToken: LIVE_PREVIEW_GATE_V1_PASS_TOKEN, readOnly: true };
}

export function registerLivePreviewGateWithOrchestrator(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
