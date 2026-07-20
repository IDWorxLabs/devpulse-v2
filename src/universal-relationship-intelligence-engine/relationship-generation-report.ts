/**
 * Universal Relationship Intelligence Engine V1 — capability coverage report.
 */

import type {
  UniversalRelationshipBehaviorVerificationResult,
  UniversalRelationshipDescriptor,
  UniversalRelationshipMaterializationReport,
} from './universal-relationship-types.js';
import { UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION } from './universal-relationship-types.js';

export function buildUniversalRelationshipMaterializationReport(input: {
  moduleId: string;
  descriptors: readonly UniversalRelationshipDescriptor[];
  verifications: readonly UniversalRelationshipBehaviorVerificationResult[];
}): UniversalRelationshipMaterializationReport {
  const executable = input.descriptors.filter(
    (d) =>
      d.supportClassification !== 'NOT_EXECUTABLE_INFORMATIONAL' &&
      d.supportClassification !== 'INVALID_RELATIONSHIP_CONTRACT',
  );
  const verified = input.verifications.filter((v) => v.classification === 'BEHAVIORALLY_VERIFIED').length;
  const totalOperations = input.descriptors.reduce((sum, d) => sum + d.mutationOperations.length, 0);
  const verifiedOperations = input.verifications.reduce((sum, v, i) => {
    const d = input.descriptors[i];
    return sum + (v.passed && d ? d.mutationOperations.length : 0);
  }, 0);

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION,
    moduleId: input.moduleId,
    totalApprovedRelationships: input.descriptors.length,
    fullyMaterializedRelationships: input.descriptors.filter((d) =>
      [
        'FULLY_SUPPORTED',
        'ONE_TO_ONE_SUPPORTED',
        'ONE_TO_MANY_SUPPORTED',
        'MANY_TO_ONE_SUPPORTED',
        'MANY_TO_MANY_SUPPORTED',
        'PARENT_CHILD_SUPPORTED',
        'SELF_REFERENTIAL_SUPPORTED',
      ].includes(d.supportClassification),
    ).length,
    partiallyMaterializedRelationships: input.verifications.filter((v) => v.classification === 'PARTIALLY_VERIFIED')
      .length,
    blockedRelationships: input.descriptors.filter((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY')
      .length,
    invalidRelationships: input.descriptors.filter((d) => d.supportClassification === 'INVALID_RELATIONSHIP_CONTRACT')
      .length,
    behaviorallyVerifiedRelationships: verified,
    behavioralCoveragePercent: executable.length > 0 ? Math.round((verified / executable.length) * 100) : 100,
    verifiedOperations,
    totalOperations,
    descriptors: input.descriptors,
    verifications: input.verifications,
  };
}

export function computeUniversalRelationshipCapabilityCoverageScore(
  reports: readonly UniversalRelationshipMaterializationReport[],
): number {
  if (reports.length === 0) return 100;
  const executable = reports.reduce(
    (sum, r) => sum + r.totalApprovedRelationships - r.invalidRelationships - r.blockedRelationships,
    0,
  );
  const verified = reports.reduce((sum, r) => sum + r.behaviorallyVerifiedRelationships, 0);
  return executable > 0 ? Math.round((verified / executable) * 100) : 100;
}

export function renderUniversalRelationshipMaterializationReportMarkdown(
  report: UniversalRelationshipMaterializationReport,
): string {
  return `# Universal Relationship Materialization Report

- Module: ${report.moduleId}
- Total approved relationships: ${report.totalApprovedRelationships}
- Fully materialized: ${report.fullyMaterializedRelationships}
- Behaviorally verified: ${report.behaviorallyVerifiedRelationships}
- Behavioral coverage: ${report.behavioralCoveragePercent}%
- Verified operations: ${report.verifiedOperations}/${report.totalOperations}
`;
}
