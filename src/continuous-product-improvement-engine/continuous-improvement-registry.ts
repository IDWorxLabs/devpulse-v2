/**
 * Continuous Product Improvement Engine — authority registry.
 */

import {
  CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_OWNER_MODULE,
  CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN,
} from './continuous-improvement-types.js';

export function getDevPulseV2ContinuousProductImprovementEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_OWNER_MODULE,
    passToken: CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN,
    phase: 11,
    enforcementAuthority: true,
  };
}

export function registerContinuousImprovementWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: CONTINUOUS_PRODUCT_IMPROVEMENT_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerContinuousImprovementWithAutonomousDebugging(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerContinuousImprovementWithLivePreviewGate(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
