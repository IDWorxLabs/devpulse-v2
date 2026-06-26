/**
 * Capability Planning Engine Era 3 — capability dependency graph.
 */

import { listCapabilityUniverse } from './capability-planning-registry.js';
import type {
  CapabilityDependencyGraphResult,
  CapabilityDependencyNode,
  CapabilityGap,
  CapabilityGenerationPlanEra3,
} from './capability-planning-types.js';

let graphCounter = 0;

export function resetCapabilityDependencyGraphForTests(): void {
  graphCounter = 0;
}

export function buildCapabilityDependencyGraph(input: {
  gaps: readonly CapabilityGap[];
  generationPlans: readonly CapabilityGenerationPlanEra3[];
}): CapabilityDependencyGraphResult {
  graphCounter += 1;
  const universe = listCapabilityUniverse();
  const universeIds = new Set(universe.map((c) => c.capabilityId));
  const nodes: CapabilityDependencyNode[] = [];
  const referenced = new Set<string>();

  for (const gap of input.gaps) {
    if (gap.matchedCapabilityId) referenced.add(gap.matchedCapabilityId);
  }
  for (const plan of input.generationPlans) {
    for (const dep of plan.dependencies) referenced.add(dep);
  }

  for (const capId of referenced) {
    const record = universe.find((c) => c.capabilityId === capId);
    if (!record) continue;
    const children = record.dependencies.filter((d) => referenced.has(d) || universeIds.has(d));
    nodes.push({
      readOnly: true,
      nodeId: capId,
      capabilityId: capId,
      label: record.name,
      children,
      parentId: null,
    });
    for (const childId of children) {
      const childIndex = nodes.findIndex((n) => n.nodeId === childId);
      if (childIndex >= 0) {
        nodes[childIndex] = { ...nodes[childIndex], parentId: capId };
      }
    }
  }

  const missingDependencies = [...referenced].filter((id) => !universeIds.has(id) && !id.startsWith('gen-plan-'));
  const duplicateCapabilities = universe
    .map((c) => c.name.toLowerCase())
    .filter((name, index, arr) => arr.indexOf(name) !== index);

  return {
    readOnly: true,
    graphId: `cap-dep-graph-${graphCounter}`,
    rootNodeIds: nodes.filter((n) => !n.parentId).map((n) => n.nodeId),
    nodes,
    missingDependencies,
    circularDependencies: [],
    deprecatedDependencies: universe.filter((c) => c.status === 'DEPRECATED').map((c) => c.capabilityId),
    unsafeDependencies: universe.filter((c) => c.riskLevel === 'HIGH' && c.status !== 'VALIDATED').map((c) => c.capabilityId),
    unvalidatedDependencies: universe
      .filter((c) => c.status === 'GENERATED_PENDING_VALIDATION' || c.status === 'AVAILABLE_WITH_LIMITATIONS')
      .map((c) => c.capabilityId),
    duplicateCapabilities: [...new Set(duplicateCapabilities)],
  };
}
