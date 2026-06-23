/**
 * Phase 26.70 — Claim evidence collector for consistency audit (V1).
 */

import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { assessChatIntelligenceReality } from '../chat-intelligence-reality/index.js';
import { buildCapabilityTruthRegistry } from '../chat-operational-self-knowledge/index.js';
import { assessFounderExecutionProof } from '../founder-execution-proof/index.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import { resolveConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { resolveExecutionChainStageContext } from '../founder-test-integration/connected-execution-chain-stage-resolver.js';
import { detectExecutionProofContradictions } from '../founder-test-integration/execution-proof-contradiction-detector.js';
import { runFounderTestLaunchReadiness } from '../founder-test-launch-readiness/index.js';
import { runFullProductReadinessSimulation } from '../founder-test-product-readiness/index.js';
import type {
  AssessFounderTestConsistencyAuditInput,
  ConsistencyVerdict,
  FounderTestConsistencyAuditInputSnapshot,
} from './founder-test-consistency-audit-types.js';
import {
  PARTIAL_SCORE_THRESHOLD,
  PROVEN_SCORE_THRESHOLD,
} from './founder-test-consistency-audit-registry.js';
import {
  resolveConsistencyAuthoritativeEvidence,
  type ConsistencyAuthoritativeEvidence,
} from './resolve-consistency-authoritative-evidence.js';

export interface CollectedConsistencyEvidence {
  readOnly: true;
  input: {
    rootDir: string;
    founderTestAssessment: NonNullable<AssessFounderTestConsistencyAuditInput['founderTestAssessment']>;
    chatIntelligenceReality: NonNullable<AssessFounderTestConsistencyAuditInput['chatIntelligenceReality']>;
    promiseRealityEngine: AssessFounderTestConsistencyAuditInput['promiseRealityEngine'];
    founderExecutionProof: NonNullable<AssessFounderTestConsistencyAuditInput['founderExecutionProof']>;
    launchReadiness: NonNullable<AssessFounderTestConsistencyAuditInput['launchReadiness']>;
    productReadiness: AssessFounderTestConsistencyAuditInput['productReadiness'];
    chatStressSimulation: AssessFounderTestConsistencyAuditInput['chatStressSimulation'];
    autonomousBuildExecutionProof: NonNullable<AssessFounderTestConsistencyAuditInput['autonomousBuildExecutionProof']>;
    executionChainTruth: NonNullable<AssessFounderTestConsistencyAuditInput['executionChainTruth']>;
    capabilityTruthRegistry: NonNullable<AssessFounderTestConsistencyAuditInput['capabilityTruthRegistry']>;
    executionProofSync: NonNullable<AssessFounderTestConsistencyAuditInput['executionProofSync']>;
    authoritative: ConsistencyAuthoritativeEvidence;
  };
  snapshot: FounderTestConsistencyAuditInputSnapshot;
}

export function scoreToConsistencyVerdict(
  score: number | null | undefined,
  provenThreshold = PROVEN_SCORE_THRESHOLD,
  partialThreshold = PARTIAL_SCORE_THRESHOLD,
): ConsistencyVerdict {
  if (score == null || Number.isNaN(score)) return 'UNKNOWN';
  if (score >= provenThreshold) return 'PROVEN';
  if (score >= partialThreshold) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function booleanToConsistencyVerdict(
  proven: boolean | null | undefined,
  partial?: boolean,
): ConsistencyVerdict {
  if (proven == null) return 'UNKNOWN';
  if (proven) return 'PROVEN';
  if (partial) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export async function collectConsistencyAuditEvidence(
  input: AssessFounderTestConsistencyAuditInput = {},
): Promise<CollectedConsistencyEvidence> {
  const rootDir = input.rootDir ?? process.cwd();

  const founderTestAssessment =
    input.founderTestAssessment ?? assessFounderTestIntegration({ rootDir });

  const executionChainTruth =
    input.executionChainTruth ??
    founderTestAssessment.run.executionChainTruth ??
    resolveConnectedExecutionChainTruth(
      founderTestAssessment.run.executionChainStageContext ??
        resolveExecutionChainStageContext(rootDir),
    );

  const capabilityTruthRegistry =
    input.capabilityTruthRegistry ?? buildCapabilityTruthRegistry(rootDir, executionChainTruth);

  const chatIntelligenceReality =
    input.chatIntelligenceReality ??
    assessChatIntelligenceReality({ rootDir });

  const founderExecutionProof =
    input.founderExecutionProof ??
    assessFounderExecutionProof({
      rootDir,
      founderTestAssessment,
    });

  const executionProofSync =
    input.executionProofSync ??
    founderTestAssessment.run.executionProofSynchronization ??
    detectExecutionProofContradictions(
      executionChainTruth,
      founderTestAssessment.run.authorityResults,
    );

  const launchReadiness =
    input.launchReadiness ??
    runFounderTestLaunchReadiness({
      rootDir,
      founderTestAssessment,
      skipProductReadinessSimulation: Boolean(input.productReadiness),
      productReadinessSimulation: input.productReadiness ?? null,
      chatStressSimulation: input.chatStressSimulation ?? null,
    });

  let productReadiness = input.productReadiness ?? launchReadiness.report.productReadinessSimulation;
  if (!productReadiness && !input.productReadiness) {
    try {
      const product = await runFullProductReadinessSimulation({
        rootDir,
        founderTestAssessment,
        founderTestContext: true,
        skipChatStressSimulation: Boolean(input.chatStressSimulation),
        chatStressSimulation: input.chatStressSimulation ?? null,
      });
      productReadiness = product.report;
    } catch {
      productReadiness = null;
    }
  }

  const chatStressSimulation =
    input.chatStressSimulation ?? productReadiness?.chatStressSimulation ?? null;

  const autonomousBuildExecutionProof =
    input.autonomousBuildExecutionProof ??
    assessAutonomousBuildExecutionProof({ rootDir }).report;

  const authoritative =
    input.authoritativeEvidence ??
    resolveConsistencyAuthoritativeEvidence({
      rootDir,
      runId: founderTestAssessment.run.runId ?? null,
      executionChainTruth,
      skipBridgeAssessment: input.skipAuthoritativeBridgeAssessment ?? false,
    });

  const snapshot: FounderTestConsistencyAuditInputSnapshot = {
    readOnly: true,
    founderTestAvailable: Boolean(founderTestAssessment),
    chatIntelligenceAvailable: Boolean(chatIntelligenceReality),
    promiseRealityAvailable: Boolean(input.promiseRealityEngine),
    executionProofAvailable: Boolean(founderExecutionProof),
    launchReadinessAvailable: Boolean(launchReadiness),
    productReadinessAvailable: Boolean(productReadiness),
    chatStressAvailable: Boolean(chatStressSimulation),
    autonomousBuildProofAvailable: Boolean(autonomousBuildExecutionProof),
    executionChainTruthAvailable: Boolean(executionChainTruth),
  };

  return {
    readOnly: true,
    input: {
      rootDir,
      founderTestAssessment,
      chatIntelligenceReality,
      promiseRealityEngine: input.promiseRealityEngine ?? null,
      founderExecutionProof,
      launchReadiness,
      productReadiness,
      chatStressSimulation,
      autonomousBuildExecutionProof,
      executionChainTruth,
      capabilityTruthRegistry,
      executionProofSync,
      authoritative,
    },
    snapshot,
  };
}
