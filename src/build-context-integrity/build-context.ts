/** Canonical immutable BuildContext construction. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { fingerprintBuildContextValue, shortBuildContextFingerprint } from './build-context-fingerprint.js';
import type { BuildContext } from './build-context-types.js';

export function createProductionBuildContext(input: {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly projectId?: string | null;
  readonly workspaceId?: string | null;
  readonly compositionFingerprint?: string | null;
  readonly materializationFingerprint?: string | null;
  readonly runtimeFingerprint?: string | null;
  readonly previewFingerprint?: string | null;
  readonly traceabilityFingerprint?: string | null;
  readonly engineeringFingerprint?: string | null;
  readonly createdAt?: string | null;
}): BuildContext {
  const buildId = input.envelope.buildId ?? input.envelope.traceability.buildId ?? input.envelope.buildFingerprint;
  const projectId = input.projectId ?? input.envelope.traceability.contractId;
  const workspaceId = input.workspaceId ?? `${projectId}:${buildId}`;
  const seed = {
    buildId,
    workspaceId,
    projectId,
    contract: input.envelope.traceability.contractId,
    envelope: input.envelope.buildFingerprint,
  };
  const buildContextId = `build-context-${shortBuildContextFingerprint(seed)}`;
  const base = {
    buildContextId,
    buildId,
    workspaceId,
    projectId,
    canonicalProductContractFingerprint: input.envelope.traceability.contractId,
    approvedEnvelopeFingerprint: input.envelope.buildFingerprint,
    cbgaFingerprint: input.envelope.pipelineFingerprint,
    compositionFingerprint: input.compositionFingerprint ?? input.envelope.approvedModulePlan.source,
    materializationFingerprint: input.materializationFingerprint ?? input.envelope.approvedModulePlan.moduleIds.join('|'),
    runtimeFingerprint: input.runtimeFingerprint ?? input.envelope.approvedProductionRuntimeFingerprint ?? input.envelope.buildFingerprint,
    previewFingerprint: input.previewFingerprint ?? input.envelope.buildFingerprint,
    traceabilityFingerprint: input.traceabilityFingerprint ?? input.envelope.approvedProvenancePlan.source,
    engineeringFingerprint: input.engineeringFingerprint ?? input.envelope.approvedRepairRealityPlan.source,
    createdAt: input.createdAt ?? input.envelope.generatedAt,
    immutable: true as const,
  };
  return {
    ...base,
    fingerprint: fingerprintBuildContextValue(base),
  };
}

declare module '../contract-bound-generation-authority-v4/approved-production-build-envelope.js' {
  interface ApprovedProductionBuildEnvelope {
    readonly approvedProductionRuntimeFingerprint?: string;
  }
}
