/**
 * Runtime truth consumer audit — bridge consumption verification (Phase 26.88).
 */

import type {
  AuthorityEvidenceSource,
  AuthoritativeRuntimeTruth,
} from './evidence-propagation-reconciliation-types.js';
import type { RuntimeMaterializationTruthBridgeAssessment } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';

export interface RuntimeTruthConsumerAudit {
  readOnly: true;
  runtimeBridgePresent: boolean;
  runtimeBridgeAuthoritative: boolean;
  consumersExpected: number;
  consumersActual: number;
  nonConsumers: string[];
  allRequiredConsumersPresent: boolean;
}

const REQUIRED_RUNTIME_BRIDGE_CONSUMERS = [
  'FOUNDER_TRUTH_MATRIX',
  'LAUNCH_READINESS_PROOF',
] as const;

export function buildAuthoritativeRuntimeTruth(input: {
  runtimeMaterializationTruthBridge?: RuntimeMaterializationTruthBridgeAssessment | null;
  runId?: string | null;
}): AuthoritativeRuntimeTruth {
  const report = input.runtimeMaterializationTruthBridge?.report ?? null;
  const evidence = report?.evidence;
  const proof = evidence?.proofAnalysis;
  const founderFlow = evidence?.founderFlow;
  const founderFlowProof = evidence?.founderFlowRuntimeProof?.report ?? null;

  const fullChainProven =
    proof?.applicationBoots === true &&
    proof?.routesReachable === true &&
    proof?.uiRenders === true &&
    (founderFlow?.founderFlowProven === true || founderFlowProof?.founderFlowProven === true);

  const finalReportDelivered =
    founderFlow?.finalResultDelivered === true ||
    founderFlowProof?.resultStoreCheck.finalResultDelivered === true;

  let finalApplicationTruth = report?.finalApplicationTruth ?? 'APPLICATION_NOT_PROVEN';
  if (fullChainProven && finalReportDelivered) {
    finalApplicationTruth = 'APPLICATION_PROVEN';
  }

  return {
    readOnly: true,
    filesExistOnDisk: evidence?.snapshot.filesExistOnDisk ?? false,
    dependenciesReady: evidence?.startup.dependenciesReady ?? false,
    applicationBoots: proof?.applicationBoots ?? false,
    routesReachable: proof?.routesReachable ?? false,
    uiRenders: proof?.uiRenders ?? false,
    founderFlowProven: founderFlow?.founderFlowProven ?? founderFlowProof?.founderFlowProven ?? false,
    finalReportDelivered,
    finalApplicationTruth,
    authoritativeWorkspaceId:
      founderFlowProof?.workspaceId ??
      evidence?.startupProofRepair?.report.entrypoint.workspaceId ??
      null,
    authoritativeRunId: input.runId ?? founderFlowProof?.resultStoreCheck.latestRunId ?? null,
    runtimeBridgeConsumed: report != null,
  };
}

export function auditRuntimeTruthConsumers(input: {
  authoritative: AuthoritativeRuntimeTruth;
  sources: readonly AuthorityEvidenceSource[];
}): RuntimeTruthConsumerAudit {
  const nonConsumers = REQUIRED_RUNTIME_BRIDGE_CONSUMERS.filter((authorityId) => {
    const source = input.sources.find((s) => s.authorityId === authorityId);
    return !source?.consumesRuntimeBridge;
  });

  const consumersActual = input.sources.filter((s) => s.consumesRuntimeBridge).length;

  return {
    readOnly: true,
    runtimeBridgePresent: input.authoritative.runtimeBridgeConsumed,
    runtimeBridgeAuthoritative: input.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN',
    consumersExpected: REQUIRED_RUNTIME_BRIDGE_CONSUMERS.length,
    consumersActual,
    nonConsumers: [...nonConsumers],
    allRequiredConsumersPresent: nonConsumers.length === 0 && input.authoritative.runtimeBridgeConsumed,
  };
}
