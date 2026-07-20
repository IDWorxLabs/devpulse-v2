/**
 * Universal Runtime State Engine V1 — capability coverage report.
 */

import type {
  UniversalRuntimeBehaviorVerificationResult,
  UniversalRuntimeMaterializationReport,
  UniversalRuntimeStateDescriptor,
} from './universal-runtime-types.js';
import { UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION } from './universal-runtime-types.js';

export function buildUniversalRuntimeMaterializationReport(input: {
  moduleId: string;
  descriptors: readonly UniversalRuntimeStateDescriptor[];
  verifications: readonly UniversalRuntimeBehaviorVerificationResult[];
}): UniversalRuntimeMaterializationReport {
  const verified = input.verifications.filter((v) => v.classification === 'BEHAVIORALLY_VERIFIED').length;
  const executable = input.descriptors.filter((d) => d.supportClassification !== 'NOT_REQUIRED');

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_RUNTIME_STATE_ENGINE_VERSION,
    moduleId: input.moduleId,
    runtimeScopes: input.descriptors.length,
    queryCoverage: input.descriptors.filter((d) => d.stateKind.includes('collection') || d.stateKind.includes('relationship')).length,
    mutationCoverage: input.descriptors.filter((d) => d.stateKind.includes('action') || d.stateKind.includes('entity')).length,
    cacheCoverage: input.descriptors.filter((d) => d.cachePolicy !== 'NO_CACHE').length,
    behaviorallyVerifiedScopes: verified,
    behavioralCoveragePercent: executable.length > 0 ? Math.round((verified / executable.length) * 100) : 100,
    descriptors: input.descriptors,
    verifications: input.verifications,
  };
}

export function computeUniversalRuntimeCapabilityCoverageScore(
  reports: readonly UniversalRuntimeMaterializationReport[],
): number {
  if (reports.length === 0) return 100;
  const total = reports.reduce((sum, r) => sum + r.runtimeScopes, 0);
  const verified = reports.reduce((sum, r) => sum + r.behaviorallyVerifiedScopes, 0);
  return total > 0 ? Math.round((verified / total) * 100) : 100;
}
