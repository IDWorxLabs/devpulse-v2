/**
 * Behavior Simulation Engine — authority registry.
 */

import {
  BEHAVIOR_SIMULATION_ENGINE_OWNER_MODULE,
  BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN,
} from './behavior-simulation-types.js';

export function getDevPulseV2BehaviorSimulationEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: BEHAVIOR_SIMULATION_ENGINE_OWNER_MODULE,
    passToken: BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN,
    phase: 5,
    enforcementAuthority: true,
  };
}

export function registerBehaviorSimulationWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: BEHAVIOR_SIMULATION_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerBehaviorSimulationWithIncrementalBuilder(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerBehaviorSimulationWithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
