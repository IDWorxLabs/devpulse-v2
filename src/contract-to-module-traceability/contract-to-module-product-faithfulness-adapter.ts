/** Contract-to-Module Traceability Authority V1 — Product Faithfulness adapter. */
import type { ContractToModuleTraceabilityGraph } from './contract-to-module-traceability-types.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import { normalizeTraceabilityIdentity } from './contract-to-module-identity.js';

export function buildProductFaithfulnessTraceabilityEvidence(input: {
  contract: CanonicalProductContract;
  graph: ContractToModuleTraceabilityGraph;
}) {
  return {
    identityBasedConcepts: input.contract.allConceptNames.map((c) => {
      const conceptId = normalizeTraceabilityIdentity(c);
      const preservation =
        input.graph.conceptPreservation.find((p) => p.conceptId === conceptId) ??
        input.graph.conceptPreservation.find((p) => normalizeTraceabilityIdentity(p.conceptId) === conceptId);
      return {
        concept: c,
        preserved: Boolean(preservation?.outcome.startsWith('PRESERVED')),
        firstBrokenBoundary: preservation?.firstBrokenBoundary ?? 'UNKNOWN',
      };
    }),
    unexpectedGeneratedModules: input.graph.moduleAncestry.filter((m) => m.outcome === 'UNAPPROVED_MODULE').map((m) => m.moduleId),
    looseTextMatchingDisabled: true,
  };
}
