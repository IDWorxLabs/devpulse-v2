/**
 * Verification dependency registry — upstream/downstream and prerequisites.
 */

import type { VerificationDependencyRecord } from './types.js';
import {
  listVerificationTargets,
  getVerificationTarget,
} from './verification-target-registry.js';

let depCounter = 0;
const dependencies = new Map<string, VerificationDependencyRecord>();

const DEPENDENCY_GRAPH: Record<string, { upstream: string[]; downstream: string[]; prerequisites: string[] }> = {
  WORLD2_TARGET: { upstream: [], downstream: ['RUNTIME_TARGET'], prerequisites: ['WORKSPACE_EXISTS'] },
  PREVIEW_TARGET: { upstream: [], downstream: ['SELF_VISION_TARGET'], prerequisites: ['PREVIEW_SESSION'] },
  SELF_VISION_TARGET: { upstream: ['PREVIEW_TARGET'], downstream: ['UI_INSPECTION_TARGET'], prerequisites: ['OBSERVATION_SESSION'] },
  UI_INSPECTION_TARGET: { upstream: ['SELF_VISION_TARGET'], downstream: ['INTERACTION_TARGET'], prerequisites: ['INSPECTION_REPORT'] },
  INTERACTION_TARGET: { upstream: ['UI_INSPECTION_TARGET'], downstream: ['VISUAL_VERIFICATION_TARGET'], prerequisites: ['INTERACTION_REPORT'] },
  VISUAL_VERIFICATION_TARGET: { upstream: ['INTERACTION_TARGET', 'UI_INSPECTION_TARGET'], downstream: [], prerequisites: ['VERIFICATION_EVIDENCE'] },
  RUNTIME_TARGET: { upstream: ['WORLD2_TARGET'], downstream: ['TRUST_TARGET'], prerequisites: ['RUNTIME_CONTEXT'] },
  COMMAND_CENTER_TARGET: { upstream: ['RUNTIME_TARGET'], downstream: ['OPERATOR_FEED_TARGET'], prerequisites: ['ROUTING_PLAN'] },
  PROJECT_VAULT_TARGET: { upstream: [], downstream: ['COMMAND_CENTER_TARGET'], prerequisites: ['VAULT_PROFILE'] },
  OPERATOR_FEED_TARGET: { upstream: ['COMMAND_CENTER_TARGET'], downstream: [], prerequisites: ['FEED_CONTEXT'] },
  TRUST_TARGET: { upstream: ['RUNTIME_TARGET'], downstream: [], prerequisites: ['TRUST_POLICY'] },
};

export function resetVerificationDependencyRegistryForTests(): void {
  depCounter = 0;
  dependencies.clear();
}

function nextDepId(): string {
  depCounter += 1;
  return `vdep-${depCounter.toString().padStart(4, '0')}`;
}

export interface RegisterDependencyResult {
  ok: boolean;
  record: VerificationDependencyRecord | null;
  invalid: boolean;
  error: string | null;
}

export function registerVerificationDependency(
  record: VerificationDependencyRecord,
): RegisterDependencyResult {
  const target = getVerificationTarget(record.targetId);
  if (!target) {
    return { ok: false, record: null, invalid: true, error: 'Invalid dependency — target not found' };
  }
  if (dependencies.has(record.dependencyId)) {
    return { ok: false, record: null, invalid: false, error: 'Duplicate dependency rejected' };
  }
  dependencies.set(record.dependencyId, record);
  return { ok: true, record, invalid: false, error: null };
}

export function buildDependencyRecord(targetId: string, category: string): VerificationDependencyRecord {
  const graph = DEPENDENCY_GRAPH[category] ?? {
    upstream: [],
    downstream: [],
    prerequisites: [],
  };
  return {
    dependencyId: nextDepId(),
    targetId,
    upstreamDependencies: [...graph.upstream],
    downstreamDependencies: [...graph.downstream],
    verificationBlockers: graph.prerequisites.length === 0 ? [] : ['MISSING_PREREQUISITE'],
    verificationPrerequisites: [...graph.prerequisites],
    registryOnly: true,
  };
}

export function registerInitialDependencies(): RegisterDependencyResult[] {
  const results: RegisterDependencyResult[] = [];
  for (const target of listVerificationTargets()) {
    results.push(
      registerVerificationDependency(
        buildDependencyRecord(target.verificationTargetId, target.verificationCategory),
      ),
    );
  }
  return results;
}

export function getVerificationDependency(dependencyId: string): VerificationDependencyRecord | null {
  return dependencies.get(dependencyId) ?? null;
}

export function listVerificationDependencies(): VerificationDependencyRecord[] {
  return [...dependencies.values()];
}
