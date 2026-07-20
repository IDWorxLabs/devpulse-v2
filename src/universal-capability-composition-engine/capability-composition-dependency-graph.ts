/**
 * Universal Capability Composition Engine V1 — composition dependency graph.
 */

import { resolvePackDependencies } from '../universal-capability-pack-framework/capability-pack-dependency-resolver.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import { NATIVE_PROVIDER_IDS } from './native-capability-provider-registry.js';
import type { CompositionDependencyGraph } from './universal-capability-composition-types.js';

export function buildCompositionDependencyGraph(input: {
  selectedPackIds: readonly string[];
  selectedNativeProviderIds: readonly string[];
  requirementIds: readonly string[];
}): CompositionDependencyGraph {
  const nodes: CompositionDependencyGraph['nodes'][number][] = [];
  const edges: CompositionDependencyGraph['edges'][number][] = [];
  const issues: { code: string; detail: string }[] = [];

  for (const reqId of input.requirementIds) {
    nodes.push({ nodeId: reqId, nodeKind: 'REQUIREMENT', label: reqId });
  }

  // Non-CRUD natives always edge to CRUD — ensure CRUD is selected whenever any dependent
  // native is present (e.g. ACTION selected while Safe Payment disabled CRUD on modules).
  const selectedNatives = [...input.selectedNativeProviderIds];
  const hasNonCrudNative = selectedNatives.some((id) => id !== NATIVE_PROVIDER_IDS.CRUD);
  if (hasNonCrudNative && !selectedNatives.includes(NATIVE_PROVIDER_IDS.CRUD)) {
    selectedNatives.push(NATIVE_PROVIDER_IDS.CRUD);
  }

  for (const providerId of selectedNatives) {
    nodes.push({ nodeId: providerId, nodeKind: 'NATIVE_PROVIDER', label: providerId });
    if (providerId !== NATIVE_PROVIDER_IDS.CRUD) {
      edges.push({
        fromId: providerId,
        toId: NATIVE_PROVIDER_IDS.CRUD,
        edgeKind: 'REQUIRES',
      });
    }
  }

  for (const packId of input.selectedPackIds) {
    const pack = getPack(packId);
    nodes.push({ nodeId: packId, nodeKind: 'PACK', label: packId });
    if (selectedNatives.includes(NATIVE_PROVIDER_IDS.CRUD)) {
      edges.push({ fromId: packId, toId: NATIVE_PROVIDER_IDS.CRUD, edgeKind: 'REQUIRES' });
    }
    if (pack?.dependencies) {
      for (const dep of pack.dependencies) {
        if (!getPack(dep)) {
          issues.push({ code: 'missing_dependency', detail: `${packId} requires missing ${dep}` });
        } else {
          edges.push({ fromId: packId, toId: dep, edgeKind: 'REQUIRES' });
        }
      }
    }
  }

  const packDep = resolvePackDependencies([...input.selectedPackIds]);
  if (packDep.issues.some((i) => i.code === 'circular_dependency')) {
    issues.push({ code: 'circular_dependency', detail: 'Circular pack dependency detected' });
  }
  for (const issue of packDep.issues) {
    if (issue.code !== 'circular_dependency') {
      issues.push({ code: issue.code, detail: issue.detail });
    }
  }

  const installationOrder = issues.some((i) => i.code === 'circular_dependency')
    ? []
    : [...selectedNatives, ...packDep.installationOrder].filter(
        (id, idx, arr) => arr.indexOf(id) === idx,
      );

  return { nodes, edges, installationOrder, issues };
}

export function validateDependencyClosure(graph: CompositionDependencyGraph): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.nodeId));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.fromId)) errors.push(`missing_from_node:${edge.fromId}`);
    if (!nodeIds.has(edge.toId)) errors.push(`missing_to_node:${edge.toId}`);
  }
  for (const issue of graph.issues) {
    errors.push(`${issue.code}:${issue.detail}`);
  }
  return errors;
}
