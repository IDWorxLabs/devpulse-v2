/**
 * Incremental Autonomous Builder — authority registry.
 */

import {
  INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE,
  INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN,
} from './incremental-builder-types.js';

export function getDevPulseV2IncrementalAutonomousBuilder(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  incrementalOnly: true;
} {
  return {
    ownerModule: INCREMENTAL_AUTONOMOUS_BUILDER_OWNER_MODULE,
    passToken: INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN,
    phase: 4,
    incrementalOnly: true,
  };
}

export function registerIncrementalBuilderWithLaunchAuthority(): { passToken: string; readOnly: true } {
  return { passToken: INCREMENTAL_AUTONOMOUS_BUILDER_PASS_TOKEN, readOnly: true };
}

export function registerIncrementalBuilderWithIntentUnderstanding(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerIncrementalBuilderWithPromptFaithfulness(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerIncrementalBuilderWithCapabilityPlanning(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}
