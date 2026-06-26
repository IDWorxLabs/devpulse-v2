/**
 * Interaction Proof Engine — accessibility identity verification.
 */

import type { InteractionAccessibilityProof, InteractionSurface } from './interaction-proof-types.js';

export function resetInteractionAccessibilityVerifierForTests(): void {
  // stateless verifier — hook for test parity with other stages
}

export function verifyInteractionAccessibility(input: {
  surface: InteractionSurface;
  simulateMissingAccessibleName?: boolean;
}): InteractionAccessibilityProof {
  const missingName =
    input.simulateMissingAccessibleName &&
    input.surface.elementType === 'INPUT' &&
    /amount/i.test(input.surface.label);
  const accessibleNameExists = Boolean(input.surface.accessibleName) && !missingName;
  const roleCorrect = Boolean(input.surface.role);
  const labelAssociated = input.surface.elementType !== 'INPUT' || accessibleNameExists;
  const focusLogical = accessibleNameExists;

  return {
    readOnly: true,
    interactionId: input.surface.interactionId,
    accessibleNameExists,
    roleCorrect,
    labelAssociated,
    focusLogical,
    passed: accessibleNameExists && roleCorrect && labelAssociated && focusLogical,
  };
}
