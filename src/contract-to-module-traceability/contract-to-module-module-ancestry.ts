/** Contract-to-Module Traceability Authority V1 — module ancestry. */
import type { ContractToModuleTraceabilityGraph, ModuleAncestryOutcome } from './contract-to-module-traceability-types.js';

export function validateGeneratedModuleAncestry(graph: ContractToModuleTraceabilityGraph): {
  moduleId: string;
  outcome: ModuleAncestryOutcome;
}[] {
  return graph.moduleAncestry.map((m) => ({ moduleId: m.moduleId, outcome: m.outcome }));
}

export function detectUnapprovedGeneratedAncestors(graph: ContractToModuleTraceabilityGraph): string[] {
  return graph.moduleAncestry.filter((m) => m.outcome === 'UNAPPROVED_MODULE').map((m) => m.moduleId);
}
