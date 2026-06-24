/**
 * Canonical Ownership V2 Registration — orphan capability detection.
 */

import { REGISTRATION_SCOPE_CAPABILITY_IDS } from './canonical-ownership-v2-bounds.js';
import type { CanonicalOwnershipEntry, OrphanCapabilityRecord } from './canonical-ownership-v2-types.js';
import { CANONICAL_OWNERSHIP_V2_ENTRIES } from './ownership-registry-v2.js';

function missingFields(entry: CanonicalOwnershipEntry): string[] {
  const missing: string[] = [];
  if (!entry.canonicalOwner) missing.push('canonicalOwner');
  if (!entry.validationCommand) missing.push('validationCommand');
  if (!entry.passToken) missing.push('passToken');
  if (!entry.artifactPath) missing.push('artifactPath');
  if (entry.consumes.length === 0 && entry.provides.length === 0) {
    missing.push('consumersOrProviders');
  }
  return missing;
}

export function detectOrphanCapabilities(
  entries: readonly CanonicalOwnershipEntry[] = CANONICAL_OWNERSHIP_V2_ENTRIES,
): readonly OrphanCapabilityRecord[] {
  const byId = new Map(entries.map((e) => [e.capabilityId, e]));
  const orphans: OrphanCapabilityRecord[] = [];

  for (const capabilityId of REGISTRATION_SCOPE_CAPABILITY_IDS) {
    const entry = byId.get(capabilityId);
    if (!entry) {
      orphans.push({
        readOnly: true,
        capabilityId,
        capabilityName: capabilityId,
        missingFields: ['NOT_REGISTERED'],
      });
      continue;
    }
    const fields = missingFields(entry);
    if (fields.length > 0) {
      orphans.push({
        readOnly: true,
        capabilityId: entry.capabilityId,
        capabilityName: entry.capabilityName,
        missingFields: fields,
      });
    }
  }

  return orphans;
}

export function countCriticalOrphans(orphans: readonly OrphanCapabilityRecord[]): number {
  return orphans.filter((o) => o.missingFields.includes('NOT_REGISTERED')).length;
}
