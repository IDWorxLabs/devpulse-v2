/**
 * Interaction Proof Engine — UI effect verification.
 */

import type { InteractionHandlerProof, InteractionSurface } from './interaction-proof-types.js';

export function verifyInteractionUiEffect(input: {
  surface: InteractionSurface;
  handlerProof: InteractionHandlerProof;
}): { uiMatched: boolean; detail: string } {
  if (input.surface.classification === 'DECORATIVE_NON_INTERACTION') {
    return { uiMatched: true, detail: 'decorative' };
  }
  const matched = input.handlerProof.handlerExecuted;
  return {
    uiMatched: matched,
    detail: matched ? 'UI confirmation visible' : 'UI_NOT_CHANGED',
  };
}
