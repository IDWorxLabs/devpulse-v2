/** Contract-to-Module Traceability Authority V1 — graph validation. */
import type { ContractToModuleTraceabilityGraph } from './contract-to-module-traceability-types.js';

export function validateTraceabilityGraph(graph: ContractToModuleTraceabilityGraph): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.traceabilityNodeId));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) errors.push('traceability_chain_incomplete');
  }
  if (graph.findings.some((f) => f.diagnosticCode === 'generated_module_not_in_cbga_plan')) {
    errors.push('unapproved_module_introduced');
  }
  return [...new Set(errors)];
}
