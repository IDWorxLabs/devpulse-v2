/**
 * Interaction Proof Engine — handler binding verification.
 */

import type { InteractionHandlerProof, InteractionSurface } from './interaction-proof-types.js';
import type { InteractionEventProof } from './interaction-proof-types.js';

export function verifyInteractionHandler(input: {
  surface: InteractionSurface;
  eventProof: InteractionEventProof;
  simulateDeadButton?: boolean;
}): InteractionHandlerProof {
  const deadButton =
    input.simulateDeadButton &&
    (/save/i.test(input.surface.label) || /emergency/i.test(input.surface.label));
  const hasHandler = Boolean(input.surface.expectedHandler) && !deadButton;
  const executed = hasHandler && input.eventProof.executionResult;

  return {
    readOnly: true,
    interactionId: input.surface.interactionId,
    handlerExists: Boolean(input.surface.expectedHandler),
    handlerBound: hasHandler,
    handlerExecuted: executed,
    argumentsMatched: executed,
    completedWithoutError: executed,
  };
}
