/**
 * Browser Verification Harness bridge — harness remains browser owner.
 */

import { getDevPulseV2BrowserVerificationHarness } from '../browser-verification/browser-verification-harness.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import { getVisibleUiRegistry } from './visible-ui-registry.js';
import type { BrowserUiCheckDefinition, VisibleUiElementRecord } from './types.js';

export function getUiElementsForBrowserVerification(): VisibleUiElementRecord[] {
  return getVisibleUiRegistry().listVisibleUiElements();
}

export function buildUiVisibilityChecks(): BrowserUiCheckDefinition[] {
  return getUiElementsForBrowserVerification().map((element) => ({
    elementId: element.elementId,
    label: element.label,
    expectedSelector: element.expectedSelector,
    mountTarget: element.mountTarget,
    interactive: element.interactive,
    checkType: 'visibility' as const,
  }));
}

export function buildUiClickabilityChecks(): BrowserUiCheckDefinition[] {
  return getUiElementsForBrowserVerification()
    .filter((element) => element.interactive)
    .map((element) => ({
      elementId: element.elementId,
      label: element.label,
      expectedSelector: element.expectedSelector,
      mountTarget: element.mountTarget,
      interactive: true,
      checkType: 'clickability' as const,
    }));
}

export function assertBrowserHarnessOwnershipUnchanged(): boolean {
  const harness = getDevPulseV2BrowserVerificationHarness();
  return (
    harness.constructor.name === 'DevPulseV2BrowserVerificationHarness' &&
    typeof (harness as { registerVisibleUiElement?: unknown }).registerVisibleUiElement ===
      'undefined'
  );
}

export function getBrowserHarnessOwnerForBridge(): string {
  return HARNESS_OWNER_MODULE;
}
