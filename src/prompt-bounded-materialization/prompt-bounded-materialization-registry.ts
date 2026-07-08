/**
 * Prompt-Bounded Materialization — registry.
 */

import {
  PROMPT_BOUNDED_MATERIALIZATION_OWNER_MODULE,
  PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN,
} from './prompt-bounded-materialization-types.js';

export function getDevPulseV2PromptBoundedMaterialization(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: PROMPT_BOUNDED_MATERIALIZATION_OWNER_MODULE,
    passToken: PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN,
    phase: 15,
  };
}

export function getPromptBoundedMaterializationPassToken(): string {
  return PROMPT_BOUNDED_MATERIALIZATION_V1_PASS_TOKEN;
}
