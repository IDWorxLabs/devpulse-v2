/**
 * Connected Execution Chain Truth — single execution-proof truth source (Phase 26.78).
 * All founder-test participating authorities must consume this instead of legacy snapshots.
 */

import type { ExecutionChainBrokenStage, ExecutionChainStageContext } from './connected-execution-chain-stage-resolver.js';

export const CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE = 'connected-execution-chain-stage-resolver';

export interface ConnectedExecutionChainTruth {
  readOnly: true;
  requirementsProven: boolean;
  planProven: boolean;
  buildProven: boolean;
  runtimeProven: boolean;
  previewProven: boolean;
  verificationProven: boolean;
  launchProven: boolean;
  chainConnected: boolean;
  firstBrokenStage: ExecutionChainBrokenStage | null;
  generatedAt: string;
  sourceAuthority: typeof CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE;
}

export function resolveConnectedExecutionChainTruth(
  chainContext: ExecutionChainStageContext,
): ConnectedExecutionChainTruth {
  const launchEvidence = chainContext.launchReadinessProof?.evidence;
  const downstreamProven =
    chainContext.buildMaterializationProven &&
    chainContext.runtimeProven &&
    chainContext.previewProven &&
    chainContext.verificationProven;

  const requirementsProven =
    launchEvidence?.requirementsProven === true || downstreamProven;
  const planProven = launchEvidence?.planProven === true || downstreamProven;

  return {
    readOnly: true,
    requirementsProven,
    planProven,
    buildProven: chainContext.buildMaterializationProven,
    runtimeProven: chainContext.runtimeProven,
    previewProven: chainContext.previewProven,
    verificationProven: chainContext.verificationProven,
    launchProven: chainContext.launchProven,
    chainConnected: chainContext.firstBrokenStage === null,
    firstBrokenStage: chainContext.firstBrokenStage,
    generatedAt: chainContext.resolvedAt,
    sourceAuthority: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
  };
}

export function stageProvenFromTruth(
  truth: ConnectedExecutionChainTruth,
  stage: ExecutionChainBrokenStage | 'REQUIREMENTS' | 'PLAN',
): boolean {
  switch (stage) {
    case 'REQUIREMENTS':
      return truth.requirementsProven;
    case 'PLAN':
      return truth.planProven;
    case 'BUILD':
      return truth.buildProven;
    case 'RUNTIME':
      return truth.runtimeProven;
    case 'PREVIEW':
      return truth.previewProven;
    case 'VERIFY':
      return truth.verificationProven;
    case 'LAUNCH':
      return truth.launchProven;
    default:
      return false;
  }
}
