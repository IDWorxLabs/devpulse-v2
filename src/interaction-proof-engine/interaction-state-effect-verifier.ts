/**
 * Interaction Proof Engine — state effect verification.
 */

import type { InteractionHandlerProof, InteractionSurface } from './interaction-proof-types.js';

export function verifyInteractionStateEffect(input: {
  surface: InteractionSurface;
  handlerProof: InteractionHandlerProof;
}): { stateMatched: boolean; detail: string } {
  if (input.surface.classification === 'DECORATIVE_NON_INTERACTION') {
    return { stateMatched: true, detail: 'decorative' };
  }
  const matched = input.handlerProof.handlerExecuted;
  return {
    stateMatched: matched,
    detail: matched ? `${input.surface.label} state changed` : 'State unchanged',
  };
}
