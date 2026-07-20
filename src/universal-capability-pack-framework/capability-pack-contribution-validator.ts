/**
 * Universal Capability Pack Framework V1 — contribution validation.
 */

import { validatePack } from './capability-pack-registry.js';
import { detectContributionCollisions, type PackContribution } from './capability-pack-collision-detector.js';
import type { CapabilityPackDescriptor } from './universal-capability-pack-types.js';

export function validatePackContributions(
  pack: CapabilityPackDescriptor,
  contributions: readonly PackContribution[],
): { valid: boolean; issues: string[] } {
  const issues: string[] = validatePack(pack).map((i) => i.detail);
  const packContributions = contributions.filter((c) => c.packId === pack.packId);
  if (pack.generatedArtifacts.length > 0 && packContributions.every((c) => !c.relativePath)) {
    issues.push('Pack declares generated artifacts but contributed none');
  }
  const collisions = detectContributionCollisions(contributions);
  for (const collision of collisions) {
    if (collision.packIds.includes(pack.packId)) issues.push(collision.detail);
  }
  return { valid: issues.length === 0, issues };
}
