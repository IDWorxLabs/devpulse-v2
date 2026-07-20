/** Contract-to-Module Traceability Authority V1 — boundary validation. */
import type { ContractToModuleTraceabilityGraph, TransformationBoundary } from './contract-to-module-traceability-types.js';

export function validateTransformationBoundary(
  graph: ContractToModuleTraceabilityGraph,
  boundary: TransformationBoundary,
): { valid: boolean; findings: readonly string[] } {
  const related = graph.findings.filter((f) => f.firstBrokenBoundary === boundary).map((f) => f.diagnosticCode);
  return { valid: related.length === 0, findings: related };
}
