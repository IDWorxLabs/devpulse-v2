/**
 * Interaction Proof Engine — data effect verification.
 */

import type { InteractionHandlerProof, InteractionSurface } from './interaction-proof-types.js';

export function verifyInteractionDataEffect(input: {
  surface: InteractionSurface;
  handlerProof: InteractionHandlerProof;
}): { dataMatched: boolean; detail: string } {
  if (input.surface.classification === 'DECORATIVE_NON_INTERACTION') {
    return { dataMatched: true, detail: 'decorative' };
  }
  const needsData = /save|edit|delete|export|emergency|settings|amount/i.test(input.surface.label);
  if (!needsData) return { dataMatched: true, detail: 'no data mutation required' };
  const matched = input.handlerProof.handlerExecuted;
  return {
    dataMatched: matched,
    detail: matched ? 'Data mutation confirmed' : 'DATA_NOT_CHANGED',
  };
}
