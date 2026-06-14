/**
 * Operational Truth Context — unified synchronized truth for all operational answers (Phase 26.84).
 */

import { CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE } from '../founder-test-integration/connected-execution-chain-truth.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { getLatestFounderTestAssessment } from '../founder-test-integration/founder-test-integration-history.js';
import { getLatestProductReadinessHistoryEntry } from '../founder-test-product-readiness/product-readiness-history.js';
import { detectChatOperationalContradictions } from './chat-operational-contradiction-detector.js';
import type {
  ChatOperationalContradiction,
  OperationalEvidenceSnapshot,
  OperationalTruthContext,
} from './chat-operational-self-knowledge-types.js';

export const OPERATIONAL_TRUTH_CONTEXT_VERSION = 'operational-truth-context-v1';

type SnapshotForTruthContext = Omit<OperationalEvidenceSnapshot, 'operationalTruthContext'>;

export function buildOperationalTruthContext(
  snapshot: SnapshotForTruthContext,
): OperationalTruthContext {
  const founderTest = getLatestFounderTestAssessment();
  const productReadiness = getLatestProductReadinessHistoryEntry();

  const stageInventory = buildStageInventoryFromChainTruth(snapshot.executionChainTruth);
  const contradictions = detectChatOperationalContradictions({
    context: {
      executionChainTruth: snapshot.executionChainTruth,
      stageInventory,
      executionTruthSource: snapshot.executionTruthSource,
      capabilityTruth: snapshot.capabilityTruth,
    },
  });

  return {
    readOnly: true,
    version: OPERATIONAL_TRUTH_CONTEXT_VERSION,
    executionChainTruth: snapshot.executionChainTruth,
    repositoryTypecheckReality: {
      readOnly: true,
      state: snapshot.typecheckState,
      clean: snapshot.typecheckClean,
      source: 'repository-typecheck-reality',
    },
    founderTestReality: {
      readOnly: true,
      available: founderTest != null,
      verdict: founderTest?.verdict ?? null,
      score: founderTest?.score.overall ?? null,
      source: 'founder-test-integration',
    },
    productReadinessReality: {
      readOnly: true,
      available: productReadiness != null,
      verdict: productReadiness?.verdict ?? null,
      launchBlocked: productReadiness?.launchBlocked ?? null,
      source: 'founder-test-product-readiness',
    },
    chatIntelligenceReality: {
      readOnly: true,
      available: true,
      note:
        snapshot.chatIntelligenceNote ??
        'Chat operational answers synchronized via chat-operational-self-knowledge and chat-intelligence-reality validators',
      source: 'chat-operational-self-knowledge',
    },
    executionTruthSource: snapshot.executionTruthSource,
    executionTruthGeneratedAt: snapshot.executionTruthGeneratedAt,
    firstBrokenStage: snapshot.firstBrokenStage,
    chainConnected: snapshot.executionChainConnected,
    generatedAt: snapshot.generatedAt,
    stageInventory,
    contradictionCount: contradictions.length,
    contradictions,
  };
}

export function buildStageInventoryFromChainTruth(
  truth: ConnectedExecutionChainTruth,
): OperationalTruthContext['stageInventory'] {
  const stages: Array<{
    stageId: string;
    label: string;
    proven: boolean;
    status: string;
  }> = [
    { stageId: 'REQUIREMENTS', label: 'Requirements', proven: truth.requirementsProven },
    { stageId: 'PLAN', label: 'Plan', proven: truth.planProven },
    { stageId: 'BUILD', label: 'Build', proven: truth.buildProven },
    { stageId: 'RUNTIME', label: 'Runtime', proven: truth.runtimeProven },
    { stageId: 'PREVIEW', label: 'Preview', proven: truth.previewProven },
    { stageId: 'VERIFY', label: 'Verification', proven: truth.verificationProven },
    { stageId: 'LAUNCH', label: 'Launch', proven: truth.launchProven },
  ];

  return stages.map((stage) => ({
    readOnly: true as const,
    stageId: stage.stageId,
    label: stage.label,
    proven: stage.proven,
    status: stageStatusLabel(stage.proven),
    source: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
  }));
}

export function stageStatusLabel(proven: boolean): string {
  return proven ? 'Proven' : 'Not proven';
}
