/**
 * Canonical Ownership V2 Registration — ownership collision detection.
 */

import type { CanonicalOwnershipEntry, OwnershipCollisionRecord } from './canonical-ownership-v2-types.js';
import { CANONICAL_OWNERSHIP_V2_ENTRIES } from './ownership-registry-v2.js';

export function detectOwnershipCollisions(
  entries: readonly CanonicalOwnershipEntry[] = CANONICAL_OWNERSHIP_V2_ENTRIES,
): readonly OwnershipCollisionRecord[] {
  const collisions: OwnershipCollisionRecord[] = [];
  const byName = new Map<string, CanonicalOwnershipEntry[]>();

  for (const entry of entries) {
    const key = entry.capabilityName.toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(entry);
    byName.set(key, list);
  }

  for (const [name, group] of byName) {
    const owners = new Set(group.map((e) => e.canonicalOwner));
    if (owners.size > 1) {
      collisions.push({
        readOnly: true,
        capabilityId: group.map((e) => e.capabilityId).join(','),
        capabilityName: group[0]?.capabilityName ?? name,
        owners: [...owners],
        collisionType: 'MULTIPLE_OWNERS',
        detail: `Multiple canonical owners for ${group[0]?.capabilityName}`,
      });
    }
  }

  const passTokenOwners = new Map<string, string[]>();
  for (const entry of entries) {
    const owners = passTokenOwners.get(entry.passToken) ?? [];
    owners.push(entry.capabilityId);
    passTokenOwners.set(entry.passToken, owners);
  }
  for (const [token, ids] of passTokenOwners) {
    if (ids.length > 1) {
      collisions.push({
        readOnly: true,
        capabilityId: ids.join(','),
        capabilityName: ids.join(' + '),
        owners: ids,
        collisionType: 'PASS_TOKEN_REUSE',
        detail: `Pass token reused: ${token}`,
      });
    }
  }

  const modulePaths = new Map<string, string[]>();
  for (const entry of entries) {
    const paths = modulePaths.get(entry.modulePath) ?? [];
    paths.push(entry.capabilityId);
    modulePaths.set(entry.modulePath, paths);
  }
  for (const [modulePath, ids] of modulePaths) {
    if (ids.length > 1) {
      const owners = [...new Set(ids.map((id) => entries.find((e) => e.capabilityId === id)?.canonicalOwner).filter(Boolean))];
      if (owners.length > 1) {
        collisions.push({
          readOnly: true,
          capabilityId: ids.join(','),
          capabilityName: modulePath,
          owners: owners as string[],
          collisionType: 'COMPETING_MODULE',
          detail: `Same module path under competing owners: ${modulePath}`,
        });
      }
    }
  }

  return collisions;
}
