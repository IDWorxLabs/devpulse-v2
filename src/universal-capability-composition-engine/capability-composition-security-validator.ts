/**
 * Universal Capability Composition Engine V1 — security and data classification validation.
 */

import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import type { CapabilityRequirementDescriptor } from '../universal-capability-pack-framework/universal-capability-pack-types.js';

export interface SecurityValidationResult {
  readonly passed: boolean;
  readonly decisions: readonly { readonly code: string; readonly passed: boolean; readonly detail: string }[];
}

const NETWORKED_CAPABILITY_KEYS = new Set([
  'authentication.session',
  'authorization.rbac',
  'notification.email',
  'realtime.sync',
  'file.storage',
]);

const LOCAL_ONLY_APPROVED = new Set(['preferences.persisted-setting', 'audit.activity-trail', 'export.json', 'export.csv']);

export function validateCompositionSecurity(input: {
  requirements: readonly CapabilityRequirementDescriptor[];
  selectedPackIds: readonly string[];
  approvedLocalOnly?: boolean;
}): SecurityValidationResult {
  const decisions: { code: string; passed: boolean; detail: string }[] = [];

  for (const req of input.requirements) {
    if (NETWORKED_CAPABILITY_KEYS.has(req.capabilityKey) && req.criticality === 'REQUIRED') {
      const blocked = input.approvedLocalOnly === true;
      decisions.push({
        code: 'provider_security_incompatible',
        passed: !blocked,
        detail: `${req.capabilityKey} requires network approval`,
      });
    }
    if (LOCAL_ONLY_APPROVED.has(req.capabilityKey)) {
      decisions.push({
        code: 'local_capability_approved',
        passed: true,
        detail: req.capabilityKey,
      });
    }
  }

  for (const packId of input.selectedPackIds) {
    const pack = getPack(packId);
    if (!pack) continue;
    const needsNetwork = pack.providedCapabilities.some((c) => NETWORKED_CAPABILITY_KEYS.has(c));
    if (needsNetwork && input.approvedLocalOnly) {
      decisions.push({
        code: 'provider_security_incompatible',
        passed: false,
        detail: `${packId} requires network`,
      });
    }
  }

  return {
    passed: decisions.every((d) => d.passed),
    decisions,
  };
}
