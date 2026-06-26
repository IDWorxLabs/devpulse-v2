/**
 * Feature Contract Reality V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { FeatureContractRealityEvidence } from './feature-contract-reality-types.js';

export function applyFeatureContractRealityToManifest(
  manifest: GeneratedAppManifest,
  evidence: FeatureContractRealityEvidence,
): GeneratedAppManifest {
  return {
    ...manifest,
    featureContractRealityStatus: evidence.featureContractRealityStatus,
    featureContractRealityScore: evidence.featureContractRealityScore,
    featureRealityRecords: evidence.featureRealityRecords,
    featureRealityFailureReasons: evidence.featureRealityFailureReasons,
    featureContractRealityArtifactPath: evidence.featureContractRealityArtifactPath,
    featureContractRealityPersistentArtifactPath: evidence.featureContractRealityPersistentArtifactPath,
    featureContractRealityRecordedAt: evidence.featureContractRealityRecordedAt,
  };
}
