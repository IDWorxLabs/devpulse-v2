/**
 * Browser Verification Harness bridge — harness remains owner; Self Vision consumes results.
 */

import { getDevPulseV2BrowserVerificationHarness } from '../browser-verification/browser-verification-harness.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import type { BrowserRealityCheck, BrowserVerificationResult } from '../browser-verification/types.js';
import type { ObservationRecord, ObservationStatus } from './types.js';

function createObservationId(): string {
  return `obs-browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapBrowserCheckToStatus(check: BrowserRealityCheck): ObservationStatus {
  const name = check.name.toLowerCase();
  if (name.includes('click') || name.includes('clickable')) {
    return check.status === 'PASS' ? 'CLICKABLE' : 'NOT_CLICKABLE';
  }
  if (name.includes('visible') || name.includes('visibility')) {
    return check.status === 'PASS' ? 'VISIBLE' : 'HIDDEN';
  }
  if (check.status === 'PASS') return 'VISIBLE';
  if (check.status === 'FAIL') return 'HIDDEN';
  return 'UNKNOWN';
}

function observationFromBrowserCheck(check: BrowserRealityCheck): ObservationRecord {
  return {
    observationId: createObservationId(),
    createdAt: Date.now(),
    elementId: check.checkId,
    selector: check.expected,
    status: mapBrowserCheckToStatus(check),
    sourceSystemId: 'browser_verification_harness',
    warnings: check.status === 'WARN' ? [`Browser check ${check.name}: ${check.actual}`] : [],
    errors: check.status === 'FAIL' ? [`Browser check ${check.name}: ${check.actual}`] : [],
  };
}

export function observeHarnessResults(): ObservationRecord[] {
  const result = getDevPulseV2BrowserVerificationHarness().getLastResult();
  if (!result) {
    return [];
  }
  return result.checks.map(observationFromBrowserCheck);
}

export function getBrowserObservationSummary(): string {
  const result = getDevPulseV2BrowserVerificationHarness().getLastResult();
  if (!result) {
    return 'No browser verification results available for observation.';
  }
  const observations = observeHarnessResults();
  const passCount = observations.filter((o) => o.status === 'VISIBLE' || o.status === 'CLICKABLE').length;
  const failCount = observations.filter((o) => o.status === 'HIDDEN' || o.status === 'NOT_CLICKABLE').length;
  return `Browser harness observation: ${observations.length} check(s), ${passCount} visible/clickable, ${failCount} hidden/not-clickable. Verification status: ${result.status}.`;
}

export function getLastHarnessResultReadOnly(): BrowserVerificationResult | null {
  return getDevPulseV2BrowserVerificationHarness().getLastResult();
}

export function assertBrowserHarnessOwnershipUnchanged(): boolean {
  const harness = getDevPulseV2BrowserVerificationHarness();
  return (
    harness.constructor.name === 'DevPulseV2BrowserVerificationHarness' &&
    typeof harness.getLastResult === 'function' &&
    typeof (harness as { observeUi?: unknown }).observeUi === 'undefined'
  );
}

export function getBrowserHarnessOwnerForBridge(): string {
  return HARNESS_OWNER_MODULE;
}
