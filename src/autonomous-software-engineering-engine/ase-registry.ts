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
  simulationOnly: true;
} {
  return {
    ownerModule: AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_OWNER_MODULE,
    passToken: AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
    phase: 14,
    simulationOnly: true,
  };
}

export function registerAseWithOnePromptOrchestrator(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
