/**
 * Visible UI Guard bridge — guard remains owner; Self Vision consumes read-only.
 */

import { getDevPulseV2VisibleUiGuardAuthority } from '../visible-ui-guard/visible-ui-guard-authority.js';
import { GUARD_OWNER_MODULE } from '../visible-ui-guard/types.js';
import type { VisibleUiElementRecord } from '../visible-ui-guard/types.js';
import { observeElement, observeRegisteredUi } from './self-vision-engine.js';
import type { ObservationRecord, ObservationSession } from './types.js';

export function observeRegisteredElements(htmlOrDomSnapshot: string): ObservationSession {
  return observeRegisteredUi(htmlOrDomSnapshot);
}

export function observeRequiredElements(htmlOrDomSnapshot: string): ObservationRecord[] {
  const guard = getDevPulseV2VisibleUiGuardAuthority();
  const required = guard.listVisibleUiElements().filter((e) => e.requiredForPhase);
  return required.map((record) => observeElement(record, htmlOrDomSnapshot));
}

export function getVisibleUiGuardOwnerForBridge(): string {
  return GUARD_OWNER_MODULE;
}

export function assertVisibleUiGuardOwnershipUnchanged(): boolean {
  const guard = getDevPulseV2VisibleUiGuardAuthority();
  return (
    guard.constructor.name === 'DevPulseV2VisibleUiGuardAuthority' &&
    typeof guard.listVisibleUiElements === 'function' &&
    typeof (guard as { observeUi?: unknown }).observeUi === 'undefined'
  );
}

export function listRegisteredElementsReadOnly(): VisibleUiElementRecord[] {
  return getDevPulseV2VisibleUiGuardAuthority().listVisibleUiElements();
}
