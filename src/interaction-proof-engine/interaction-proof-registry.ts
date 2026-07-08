/**
 * Interaction Proof Engine — authority registry.
 */

import {
  INTERACTION_PROOF_ENGINE_OWNER_MODULE,
  INTERACTION_PROOF_ENGINE_PASS_TOKEN,
} from './interaction-proof-types.js';

export function getDevPulseV2InteractionProofEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: INTERACTION_PROOF_ENGINE_OWNER_MODULE,
    passToken: INTERACTION_PROOF_ENGINE_PASS_TOKEN,
    phase: 8,
    enforcementAuthority: true,
  };
}

export function registerInteractionProofEngineWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: INTERACTION_PROOF_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerInteractionProofEngineWithVirtualDeviceLaboratory(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerInteractionProofEngineWithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
