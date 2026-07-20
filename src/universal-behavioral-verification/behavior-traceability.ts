/**
 * Universal Behavioral Verification Engine V1 — traceability chains.
 */

import type {
  BehaviorTraceabilityChain,
  BehaviorVerificationResultEntry,
  UniversalBehaviorDescriptor,
} from './universal-behavior-types.js';

export function buildBehaviorTraceabilityChain(
  descriptor: UniversalBehaviorDescriptor,
  result: BehaviorVerificationResultEntry | null,
): BehaviorTraceabilityChain {
  const moduleId = descriptor.moduleIds[0] ?? 'global';
  return {
    behaviorId: descriptor.behaviorId,
    approvedBehaviorPath: descriptor.sourceEnvelopePath,
    descriptorFingerprint: descriptor.fingerprint,
    runtimeArtifactPaths: deriveRuntimeArtifactPaths(descriptor, moduleId),
    executionEvidenceId: result?.evidence.fingerprint ?? 'not-executed',
    engineeringReportPath: 'src/universal-behavioral-verification/behavior-verification-report.json',
  };
}

export function buildBehaviorTraceabilityChains(
  descriptors: readonly UniversalBehaviorDescriptor[],
  results: readonly BehaviorVerificationResultEntry[],
): BehaviorTraceabilityChain[] {
  const resultById = new Map(results.map((r) => [r.behaviorId, r]));
  return descriptors
    .map((d) => buildBehaviorTraceabilityChain(d, resultById.get(d.behaviorId) ?? null))
    .sort((a, b) => a.behaviorId.localeCompare(b.behaviorId));
}

function deriveRuntimeArtifactPaths(descriptor: UniversalBehaviorDescriptor, moduleId: string): string[] {
  const paths: string[] = [];
  switch (descriptor.behaviorCategory) {
    case 'CRUD':
    case 'PERSISTENCE':
    case 'VALIDATION':
      paths.push(`src/features/${moduleId}/${moduleId}.service.ts`, 'src/universal-crud-runtime/memory-provider.ts');
      break;
    case 'ACTION':
      paths.push(`src/features/${moduleId}/${moduleId}.action-handlers.ts`);
      break;
    case 'WORKFLOW':
      paths.push(`src/features/${moduleId}/${moduleId}.workflow-runtime.ts`);
      break;
    case 'RELATIONSHIP':
      paths.push(`src/features/${moduleId}/${moduleId}.relationship-runtime.ts`);
      break;
    case 'RUNTIME_STATE':
      paths.push(`src/features/${moduleId}/${moduleId}.universal-runtime.ts`, 'src/universal-runtime-state/store.ts');
      break;
    case 'BUSINESS_RULE':
      paths.push(`src/features/${moduleId}/${moduleId}.business-rules.ts`, 'src/universal-business-rule-runtime/evaluator.ts');
      break;
    case 'PREFERENCES':
    case 'AUDIT':
    case 'EXPORT':
      paths.push('src/universal-capability-packs/runtime/registry.ts');
      break;
    case 'NAVIGATION':
      paths.push('src/features/registry.ts', 'src/features/routes.ts');
      break;
    default:
      paths.push(`src/features/${moduleId}/`);
  }
  return paths;
}

export function traceabilityIsComplete(chain: BehaviorTraceabilityChain): boolean {
  return (
    chain.approvedBehaviorPath.length > 0 &&
    chain.descriptorFingerprint.length > 0 &&
    chain.runtimeArtifactPaths.length > 0 &&
    chain.executionEvidenceId !== 'not-executed'
  );
}
