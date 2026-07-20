/**
 * Universal Action Materialization Engine V1 — feedback generation.
 */

import type { UniversalActionDescriptor } from './universal-action-types.js';
import { escActionString } from './universal-action-types.js';

export function generateFeedbackPanelJsx(): string {
  return `
      {actions.pending ? <p className="universal-action-status" data-loading="true">Action pending…</p> : null}
      {actions.error ? <p className="universal-action-status universal-action-error" data-error="true">{actions.error}</p> : null}
      {actions.success ? <p className="universal-action-status universal-action-success" data-success="true">{actions.success}</p> : null}
      {actions.blockedMessage ? <p className="universal-action-blocked" data-blocked="true">{actions.blockedMessage}</p> : null}
      {crud.error ? <p className="universal-action-status universal-action-error" data-error="true">{crud.error}</p> : null}
      {crud.success ? <p className="universal-action-status universal-action-success" data-success="true">{crud.success}</p> : null}`;
}

export function feedbackPolicyFor(descriptor: UniversalActionDescriptor) {
  return descriptor.feedbackPolicy;
}

export function successMessageFor(descriptor: UniversalActionDescriptor): string {
  return escActionString(descriptor.feedbackPolicy.successMessage);
}
