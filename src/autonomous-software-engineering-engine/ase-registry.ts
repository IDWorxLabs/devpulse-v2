/**
 * ASE — registry.
 */

import {
  AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_OWNER_MODULE,
  AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
} from './ase-types.js';

export function getDevPulseV2AutonomousSoftwareEngineeringEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  simulationOnly: false;
  enforcementEngine: true;
} {
  return {
    ownerModule: AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_OWNER_MODULE,
    passToken: AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
    phase: 14,
    simulationOnly: false,
    enforcementEngine: true,
  };
}

export function registerAseWithOnePromptOrchestrator(): {
  connected: true;
  enforcementAuthority: true;
} {
  return { connected: true, enforcementAuthority: true };
}
