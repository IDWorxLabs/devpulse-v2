/**
 * Universal Capability Composition Engine V1 — contribution allowlist builder.
 */

import { getNativeProviderById } from './native-capability-provider-registry.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import type { ContributionAllowlistEntry, ContributionType } from './universal-capability-composition-types.js';

export function buildContributionAllowlist(input: {
  selectedNativeProviderIds: readonly string[];
  selectedPackIds: readonly string[];
  moduleIds: readonly string[];
}): ContributionAllowlistEntry[] {
  const entries: ContributionAllowlistEntry[] = [];

  for (const providerId of input.selectedNativeProviderIds) {
    const native = getNativeProviderById(providerId);
    if (!native) continue;
    for (const contributionType of native.contributionTypes) {
      entries.push({
        providerId,
        contributionType,
        contributionId: `${providerId}:${contributionType}`,
        phase: native.compositionPhase,
      });
    }
    for (const moduleId of input.moduleIds) {
      entries.push({
        providerId,
        contributionType: 'module_artifact',
        contributionId: `${providerId}:module:${moduleId}`,
        phase: native.compositionPhase,
      });
    }
  }

  for (const packId of input.selectedPackIds) {
    const pack = getPack(packId);
    if (!pack) continue;
    const types: ContributionType[] = ['source_file', 'shared_runtime', 'configuration'];
    for (const t of types) {
      entries.push({
        providerId: packId,
        contributionType: t,
        contributionId: `${packId}:${t}`,
        phase: 'PACK_EXTENSION',
      });
    }
  }

  return entries.sort((a, b) => a.contributionId.localeCompare(b.contributionId));
}
