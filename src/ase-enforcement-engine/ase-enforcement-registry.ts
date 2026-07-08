/**
 * ASE Enforcement Engine — registry.
 */

import {
  ASE_ENFORCEMENT_ENGINE_OWNER_MODULE,
  ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN,
} from './ase-enforcement-engine-types.js';

export function getDevPulseV2AseEnforcementEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: ASE_ENFORCEMENT_ENGINE_OWNER_MODULE,
    passToken: ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN,
    phase: 15,
    enforcementAuthority: true,
  };
}

export function registerAseEnforcementWithOnePromptOrchestrator(): {
  connected: true;
  enforcementAuthority: true;
} {
  return { connected: true, enforcementAuthority: true };
}
