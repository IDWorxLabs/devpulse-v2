/** Contract-to-Module Traceability Authority V1 — B11 adapter. */
import type { ContractToModuleTraceabilityReport } from './contract-to-module-traceability-types.js';

export function toB11TraceabilityBlockers(report: ContractToModuleTraceabilityReport) {
  return report.graph.findings
    .filter((f) => f.severity === 'BLOCKER')
    .map((f) => ({
      code: f.diagnosticCode,
      dimension: 'TRACEABILITY_READINESS',
      severity: f.severity,
      detail: f.observedState,
      requirementIds: f.requirementIds,
      moduleIds: f.moduleIds,
      fingerprint: f.fingerprint,
    }));
}
