/**
 * Blueprint Purity V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { BlueprintPurityEvidence } from './blueprint-purity-types.js';

export function applyBlueprintPurityToManifest(
  manifest: GeneratedAppManifest,
  evidence: BlueprintPurityEvidence,
): GeneratedAppManifest {
  return {
    ...manifest,
    blueprintPurityStatus: evidence.blueprintPurityStatus,
    blueprintPurityCheckedFiles: evidence.blueprintPurityCheckedFiles,
    blueprintPurityViolationCount: evidence.blueprintPurityViolationCount,
    blueprintPurityAllowedDomainSources: evidence.blueprintPurityAllowedDomainSources,
    blueprintPurityFailureReasons: evidence.blueprintPurityFailureReasons,
    shellPurityVerified: evidence.shellPurityVerified,
    domainLanguageBoundaryVerified: evidence.domainLanguageBoundaryVerified,
  };
}
