/** Contract-to-Module Traceability Authority V1 — illegal module introduction detection. */
import type { ContractToModuleTraceabilityGraph } from './contract-to-module-traceability-types.js';

export function detectIllegalModuleIntroduction(graph: ContractToModuleTraceabilityGraph) {
  return graph.findings.filter((f) =>
    ['generated_module_not_in_cbga_plan', 'generated_module_not_in_envelope', 'unapproved_module_introduced', 'orphaned_generated_module'].includes(
      f.diagnosticCode,
    ),
  );
}
