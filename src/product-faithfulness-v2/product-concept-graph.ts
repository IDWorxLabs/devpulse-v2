/**
 * Product Faithfulness V2 — Concept Graph.
 *
 * A generic graph of requested concepts. Nodes represent entities, actions, workflows,
 * navigation, capabilities, and the generated modules they require. Edges are derived purely from
 * structural role (every requested entity needs a workflow, every workflow needs UI, every UI
 * needs an interaction, every entity/workflow/capability needs a generated module) — never from
 * product names. This works identically for every application domain.
 *
 * Example chain this produces for one entity:
 *   Entity -> Workflow -> Required UI (navigation) -> Required interaction (action) -> Required generated module
 */

import type { CanonicalProductContract, ConceptGraph, ConceptGraphEdge, ConceptGraphNode, ConceptGraphNodeKind } from './generation-faithfulness-types.js';

export function buildConceptGraph(contract: CanonicalProductContract): ConceptGraph {
  const nodes: ConceptGraphNode[] = [];
  const edges: ConceptGraphEdge[] = [];
  const seen = new Set<string>();

  const addNode = (kind: ConceptGraphNodeKind, label: string): string => {
    const id = `${kind}:${label.toLowerCase().replace(/\s+/g, '-')}`;
    if (!seen.has(id)) {
      seen.add(id);
      nodes.push({ readOnly: true, id, kind, label });
    }
    return id;
  };
  const addEdge = (from: string, to: string, relation: string): void => {
    edges.push({ readOnly: true, from, to, relation });
  };

  const entityIds = contract.coreEntities.map((label) => addNode('ENTITY', label));
  const workflowIds = contract.primaryWorkflows.map((label) => addNode('WORKFLOW', label));
  const navIds = contract.navigationExpectations.map((label) => addNode('NAVIGATION', label));
  const actionIds = contract.coreActions.map((label) => addNode('ACTION', label));
  const capabilityIds = contract.majorFeatureGroups.map((label) => addNode('CAPABILITY', label));

  // Entity -> Workflow (evidence: both requested within the same canonical contract).
  entityIds.forEach((entityId, i) => {
    workflowIds.forEach((workflowId) => addEdge(entityId, workflowId, 'ENTITY_PARTICIPATES_IN_WORKFLOW'));
    const moduleId = addNode('MODULE', `${contract.coreEntities[i]} module`);
    addEdge(entityId, moduleId, 'REQUIRES_GENERATED_MODULE');
  });

  // Workflow (or entity, when no workflow was requested) -> Required UI.
  const upstreamForNav = workflowIds.length > 0 ? workflowIds : entityIds;
  upstreamForNav.forEach((upstreamId) => navIds.forEach((navId) => addEdge(upstreamId, navId, 'REQUIRES_UI')));

  // Required UI -> Required interaction.
  navIds.forEach((navId) => actionIds.forEach((actionId) => addEdge(navId, actionId, 'REQUIRES_INTERACTION')));

  // Workflow -> Required generated module.
  workflowIds.forEach((workflowId, i) => {
    const moduleId = addNode('MODULE', `${contract.primaryWorkflows[i]} module`);
    addEdge(workflowId, moduleId, 'REQUIRES_GENERATED_MODULE');
  });

  // Capability (major feature group) -> Required generated module.
  capabilityIds.forEach((capabilityId, i) => {
    const moduleId = addNode('MODULE', `${contract.majorFeatureGroups[i]} module`);
    addEdge(capabilityId, moduleId, 'REQUIRES_GENERATED_MODULE');
  });

  return { readOnly: true, nodes, edges };
}
