/**
 * Universal Runtime State Engine V1 — runtime state descriptor builder.
 */

import type {
  RuntimeDescriptorBuildContext,
  UniversalRuntimeStateDescriptor,
} from './universal-runtime-types.js';
import { stableRuntimeScopeId } from './universal-runtime-types.js';
import { classifyRuntimeSupport } from './runtime-support-classifier.js';

export function buildRuntimeStateDescriptors(
  context: RuntimeDescriptorBuildContext,
): UniversalRuntimeStateDescriptor[] {
  const { input, envelope } = context;
  const scopeId = stableRuntimeScopeId(input.moduleId, input.moduleId);
  const descriptors: UniversalRuntimeStateDescriptor[] = [];

  if (input.crudBacked) {
    descriptors.push(
      buildDescriptor({
        scopeId,
        moduleId: input.moduleId,
        entityId: input.moduleId,
        stateKind: 'entity-collection',
        sourcePath: 'universal-crud-generation-engine.runtime-state',
        cachePolicy: 'MUTATION_INVALIDATION',
        workflowBindings: input.workflowBacked ? [`${input.moduleId}.workflow`] : [],
        relationshipBindings: input.relationshipBacked ? [`${input.moduleId}.relationships`] : [],
        classification: classifyRuntimeSupport({ kind: 'entity-collection', blocked: false }),
      }),
    );
    descriptors.push(
      buildDescriptor({
        scopeId,
        moduleId: input.moduleId,
        entityId: input.moduleId,
        stateKind: 'form-state',
        sourcePath: 'universal-crud-generation-engine.form-state',
        cachePolicy: 'NO_CACHE',
        workflowBindings: [],
        relationshipBindings: [],
        classification: classifyRuntimeSupport({ kind: 'form-state', blocked: false }),
      }),
    );
  }

  if (input.actionBacked) {
    descriptors.push(
      buildDescriptor({
        scopeId,
        moduleId: input.moduleId,
        entityId: input.moduleId,
        stateKind: 'action-execution',
        sourcePath: 'universal-action-materialization-engine.action-state',
        cachePolicy: 'NO_CACHE',
        workflowBindings: [],
        relationshipBindings: [],
        classification: classifyRuntimeSupport({ kind: 'action-execution', blocked: false }),
      }),
    );
  }

  if (input.workflowBacked) {
    descriptors.push(
      buildDescriptor({
        scopeId,
        moduleId: input.moduleId,
        entityId: input.moduleId,
        stateKind: 'workflow-instance',
        sourcePath: 'universal-workflow-generation-engine.workflow-instance',
        cachePolicy: 'PERSISTED_CACHE',
        workflowBindings: [`${input.moduleId}.workflow`],
        relationshipBindings: [],
        classification: classifyRuntimeSupport({ kind: 'workflow-instance', blocked: false }),
      }),
    );
  }

  if (input.relationshipBacked) {
    descriptors.push(
      buildDescriptor({
        scopeId,
        moduleId: input.moduleId,
        entityId: input.moduleId,
        stateKind: 'relationship-query',
        sourcePath: 'universal-relationship-intelligence-engine.relationship-state',
        cachePolicy: 'MUTATION_INVALIDATION',
        workflowBindings: [],
        relationshipBindings: [`${input.moduleId}.relationships`],
        classification: classifyRuntimeSupport({ kind: 'relationship-query', blocked: false }),
      }),
    );
  }

  if (descriptors.length === 0 && envelope.canonicalProductContract.coreEntities.length > 0) {
    descriptors.push(
      buildDescriptor({
        scopeId,
        moduleId: input.moduleId,
        entityId: input.moduleId,
        stateKind: 'navigation-context',
        sourcePath: 'universal-runtime-state-engine.navigation-baseline',
        cachePolicy: 'SESSION_CACHE',
        workflowBindings: [],
        relationshipBindings: [],
        classification: classifyRuntimeSupport({ kind: 'navigation-context', blocked: false }),
      }),
    );
  }

  return descriptors;
}

function buildDescriptor(input: {
  scopeId: string;
  moduleId: string;
  entityId: string;
  stateKind: string;
  sourcePath: string;
  cachePolicy: UniversalRuntimeStateDescriptor['cachePolicy'];
  workflowBindings: string[];
  relationshipBindings: string[];
  classification: UniversalRuntimeStateDescriptor['supportClassification'];
}): UniversalRuntimeStateDescriptor {
  return {
    runtimeScopeId: input.scopeId,
    moduleId: input.moduleId,
    entityId: input.entityId,
    stateKey: `${input.scopeId}::${input.stateKind}`,
    stateKind: input.stateKind,
    sourceEnvelopePaths: [input.sourcePath],
    cachePolicy: input.cachePolicy,
    invalidationPolicy: 'dependency-aware',
    optimisticPolicy: 'reversible-only',
    rollbackPolicy: 'snapshot-restore',
    retryPolicy: 'retryable-operations-only',
    workflowBindings: input.workflowBindings,
    relationshipBindings: input.relationshipBindings,
    supportClassification: input.classification,
    provenance: [input.sourcePath],
  };
}
