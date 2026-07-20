/** Contract-to-Module Traceability Authority V1 — silent concept loss detection. */
import type { ContractToModuleTraceabilityGraph } from './contract-to-module-traceability-types.js';

export function detectSilentConceptLoss(graph: ContractToModuleTraceabilityGraph) {
  return graph.findings.filter((f) =>
    ['contract_concept_missing_from_feature_contract', 'feature_missing_from_cbga_module_plan', 'approved_concept_silently_dropped', 'approved_module_not_generated'].includes(
      f.diagnosticCode,
    ),
  );
}

export function detectMissingApprovedDescendants(graph: ContractToModuleTraceabilityGraph) {
  return graph.conceptPreservation.filter((c) => !c.outcome.startsWith('PRESERVED') && c.outcome !== 'EXPLICITLY_EXCLUDED');
}
