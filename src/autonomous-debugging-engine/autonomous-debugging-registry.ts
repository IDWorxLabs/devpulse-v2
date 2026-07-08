/**
 * Autonomous Debugging Engine — authority registry.
 */

import {
  AUTONOMOUS_DEBUGGING_ENGINE_OWNER_MODULE,
  AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN,
} from './autonomous-debugging-types.js';

export function getDevPulseV2AutonomousDebuggingEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: AUTONOMOUS_DEBUGGING_ENGINE_OWNER_MODULE,
    passToken: AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN,
    phase: 9,
    enforcementAuthority: true,
  };
}

export function registerAutonomousDebuggingEngineWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: AUTONOMOUS_DEBUGGING_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerAutonomousDebuggingEngineWithInteractionProofEngine(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerAutonomousDebuggingEngineWithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
