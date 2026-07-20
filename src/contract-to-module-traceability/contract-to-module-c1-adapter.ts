/** Contract-to-Module Traceability Authority V1 — C1 adapter. */
import type { TraceabilityFinding } from './contract-to-module-traceability-types.js';

export function toC1TraceabilityFindings(findings: readonly TraceabilityFinding[]) {
  return findings.map((f) => ({
    diagnosticCode: f.diagnosticCode,
    sourceAuthority: 'CONTRACT_TO_MODULE_TRACEABILITY',
    severity: f.severity,
    moduleIds: f.moduleIds,
    conceptIds: f.conceptIds,
    artifactPaths: f.artifactPaths,
    repairEligibility: f.repairEligibility,
    regenerationStage: f.regenerationStage,
    firstBrokenBoundary: f.firstBrokenBoundary,
    fingerprint: f.fingerprint,
  }));
}

export function isC1RepairableTraceabilityFinding(finding: TraceabilityFinding): boolean {
  return ['ROUTE_REGISTRATION_MISSING', 'NAVIGATION_REGISTRATION_MISSING', 'RUNTIME_REGISTRATION_MISSING'].some((code) =>
    finding.diagnosticCode.includes(code.toLowerCase().replace(/_/g, '_')),
  ) || finding.repairEligibility.includes('WIRING');
}
