/**
 * Launch Readiness Authority V2 — registry.
 */

import {
  LAUNCH_READINESS_AUTHORITY_V2_OWNER_MODULE,
  LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN,
} from './launch-readiness-types.js';

export function getDevPulseV2LaunchReadinessAuthorityV2(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  simulationOnly: true;
} {
  return {
    ownerModule: LAUNCH_READINESS_AUTHORITY_V2_OWNER_MODULE,
    passToken: LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN,
    phase: 12,
    simulationOnly: true,
  };
}

export function registerLaunchReadinessAuthorityV2WithFounderTest(): { passToken: string; readOnly: true } {
  return { passToken: LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN, readOnly: true };
}

export function registerLaunchReadinessAuthorityV2WithUvl(): { passToken: string; readOnly: true } {
  return { passToken: LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN, readOnly: true };
}

export function registerLaunchReadinessAuthorityV2WithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerLaunchReadinessAuthorityV2WithContinuousImprovement(): {
  connected: true;
  readOnly: true;
} {
  return { connected: true, readOnly: true };
}
