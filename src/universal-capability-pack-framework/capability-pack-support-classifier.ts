/**
 * Universal Capability Pack Framework V1 — support classification.
 */

import type { PackSupportStatus } from './universal-capability-pack-types.js';

export function isSelectablePackStatus(status: PackSupportStatus): boolean {
  return status === 'PRODUCTION_READY' || status === 'FUNCTIONAL_REFERENCE';
}

export function countsTowardBehavioralCoverage(status: PackSupportStatus): boolean {
  return isSelectablePackStatus(status);
}
