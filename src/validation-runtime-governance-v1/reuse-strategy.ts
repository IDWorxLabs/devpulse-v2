/**
 * Validation Runtime Governance V1 — reuse strategy definition.
 */

import type { ReuseStrategy } from './validation-runtime-governance-v1-types.js';
import { REUSABLE_ARTIFACT_TYPES } from './artifact-reuse-registry.js';

export function buildReuseStrategy(): ReuseStrategy {
  return {
    previewServerReuse: {
      enabled: true,
      sharedPool: true,
      attachToExistingRuntime: true,
      newServerRequiresJustification: true,
      estimatedSavingsMinutes: 59,
    },
    buildOutputCache: {
      enabled: true,
      cacheKeys: ['dist/', 'build hash', 'workspace fingerprint'],
      rebuildWhenInputsChanged: true,
      estimatedSavingsMinutes: 16,
    },
    playwrightSessionReuse: {
      enabled: true,
      sharedBrowserPool: true,
      reuseContextWhereSafe: true,
      estimatedSavingsMinutes: 18,
    },
    artifactReuse: {
      enabled: true,
      reusableArtifactTypes: [...REUSABLE_ARTIFACT_TYPES],
      avoidReprovingUnchangedEvidence: true,
    },
  };
}
