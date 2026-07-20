/**
 * Universal Action Materialization Engine V1 — confirmation UI generation.
 */

import type { UniversalActionDescriptor } from './universal-action-types.js';
import { escActionString } from './universal-action-types.js';

export function generateConfirmationPanelJsx(descriptors: readonly UniversalActionDescriptor[]): string {
  const confirmActions = descriptors.filter((d) => d.confirmationPolicy.required);
  if (confirmActions.length === 0) return '';

  return `
      {actions.pendingConfirmActionId ? (
        <div className="universal-action-confirm" data-confirmation-panel="true">
          <p>Confirm action?</p>
          <button type="button" data-interaction-control="true" onClick={() => actions.confirmPendingAction()}>
            Confirm
          </button>
          <button type="button" data-interaction-control="true" onClick={() => actions.cancelPendingAction()}>
            Cancel
          </button>
        </div>
      ) : null}`;
}

export function requiresConfirmation(descriptor: UniversalActionDescriptor): boolean {
  return descriptor.confirmationPolicy.required;
}

export function confirmationMessage(descriptor: UniversalActionDescriptor): string {
  return escActionString(descriptor.confirmationPolicy.message);
}
