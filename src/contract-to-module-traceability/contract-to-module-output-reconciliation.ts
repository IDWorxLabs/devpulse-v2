/** Contract-to-Module Traceability Authority V1 — post-generation reconciliation. */
import type { ContractToModuleTraceabilityGraph } from './contract-to-module-traceability-types.js';

export function reconcileApprovedAndGeneratedModules(graph: ContractToModuleTraceabilityGraph) {
  const expected = graph.nodes.filter((n) => n.nodeType === 'APPROVED_MODULE').length;
  const generatedApproved = graph.moduleAncestry.filter((m) => m.outcome === 'DIRECTLY_APPROVED').length;
  const missing = graph.moduleAncestry.filter((m) => graph.nodes.some((n) => n.nodeType === 'APPROVED_MODULE' && n.canonicalIdentity === m.moduleId) && m.outcome !== 'DIRECTLY_APPROVED' && m.outcome !== 'APPROVED_INFRASTRUCTURE_MODULE').length;
  const unapproved = graph.moduleAncestry.filter((m) => m.outcome === 'UNAPPROVED_MODULE').length;
  const completeness = expected === 0 ? 1 : Math.max(0, generatedApproved / expected);
  return { expected, generatedApproved, missing, unapproved, completeness };
}
