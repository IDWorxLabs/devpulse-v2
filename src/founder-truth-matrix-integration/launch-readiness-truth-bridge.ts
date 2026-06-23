/**
 * Phase 26.71 — Sync bridge from launch readiness context to consistency audit evidence.
 */

import { buildCapabilityTruthRegistry } from '../chat-operational-self-knowledge/index.js';
import type { ChatIntelligenceRealityAssessment } from '../chat-intelligence-reality/chat-intelligence-reality-types.js';
import { assessFounderExecutionProof } from '../founder-execution-proof/index.js';
import type { FounderExecutionProofAssessment } from '../founder-execution-proof/founder-execution-proof-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import { resolveConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { resolveExecutionChainStageContext } from '../founder-test-integration/connected-execution-chain-stage-resolver.js';
import { detectExecutionProofContradictions } from '../founder-test-integration/execution-proof-contradiction-detector.js';
import type { CollectedConsistencyEvidence } from '../founder-test-consistency-audit/claim-evidence-collector.js';
import { resolveConsistencyAuthoritativeEvidence } from '../founder-test-consistency-audit/resolve-consistency-authoritative-evidence.js';
import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type {
  FounderTestLaunchReadinessAssessment,
  LaunchReadinessVerdict,
} from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { BuildMaterializationTruthBridgeAssessment } from '../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js';
import type { RuntimeMaterializationTruthBridgeAssessment } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';
import type { ChatCapabilityAnswerQualityAssessment } from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import { deriveChatIntelligenceFromRegisteredSources } from '../chat-intelligence-scenario-consumption-audit/chat-intelligence-consumption-bridge.js';

export interface LaunchReadinessTruthBridgeInput {
  rootDir: string;
  founderTestAssessment: FounderTestAssessment;
  preReconciliationVerdict: LaunchReadinessVerdict;
  founderReadinessScore: number;
  topBlockers: FounderTestLaunchReadinessAssessment['report']['topBlockers'];
  chatStressSimulation: ChatStressSimulationReport | null;
  productReadinessSimulation: ProductReadinessReport | null;
  autonomousBuildExecutionProof: AutonomousBuildExecutionProofReport | null;
  runId: string;
  /** Avoid live chat scenario execution — reuse injected or derived read-only evidence. */
  chatIntelligenceReality?: ChatIntelligenceRealityAssessment;
  founderExecutionProof?: FounderExecutionProofAssessment;
  /** Phase 26.75 — filesystem-authoritative BUILD truth reconciliation. */
  buildMaterializationTruthBridge?: BuildMaterializationTruthBridgeAssessment;
  /** Phase 26.76 — runtime-authoritative APPLICATION truth reconciliation. */
  runtimeMaterializationTruthBridge?: RuntimeMaterializationTruthBridgeAssessment;
  /** Phase 26.95 — capability answer quality assessment for chat score consumption. */
  chatCapabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment;
}

export function buildConsistencyEvidenceFromLaunchContext(
  input: LaunchReadinessTruthBridgeInput,
): CollectedConsistencyEvidence {
  const founderTestAssessment = input.founderTestAssessment;
  const executionChainTruth =
    founderTestAssessment.run.executionChainTruth ??
    resolveConnectedExecutionChainTruth(
      founderTestAssessment.run.executionChainStageContext ??
        resolveExecutionChainStageContext(input.rootDir),
    );
  const capabilityTruthRegistry = buildCapabilityTruthRegistry(input.rootDir, executionChainTruth);
  const chatIntelligenceReality =
    deriveChatIntelligenceFromRegisteredSources({
      rootDir: input.rootDir,
      chatIntelligenceReality: input.chatIntelligenceReality,
      chatStressSimulation: input.chatStressSimulation,
      chatCapabilityAnswerQuality: input.chatCapabilityAnswerQuality,
    });
  const founderExecutionProof =
    input.founderExecutionProof ??
    assessFounderExecutionProof({
      rootDir: input.rootDir,
      founderTestAssessment,
    });
  const executionProofSync =
    founderTestAssessment.run.executionProofSynchronization ??
    detectExecutionProofContradictions(
      executionChainTruth,
      founderTestAssessment.run.authorityResults,
    );

  const launchReadiness: FounderTestLaunchReadinessAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_TEST_COMPLETE',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'pre-reconciliation launch readiness',
      runId: input.runId,
      generatedAt: new Date().toISOString(),
      panelState: 'COMPLETE',
      founderReadinessScore: input.founderReadinessScore,
      founderAcceptanceState: 'ACCEPTED_WITH_WARNINGS',
      launchReadinessVerdict: input.preReconciliationVerdict,
      confidenceLevel: 'MEDIUM',
      executionProofSummary: '',
      founderExecutionProofSummary: '',
      runtimeProofHydrationSummary: '',
      runtimeProofHydration: { readOnly: true, hydrated: false, source: 'none', missing: [], warnings: [], executionConnectedSource: 'none' } as never,
      founderSimulationSummary: '',
      requirementRealitySummary: '',
      verificationRealitySummary: '',
      livePreviewSummary: '',
      mobileRuntimeSummary: '',
      launchCouncilSummary: '',
      orchestratorVerdict: founderTestAssessment.verdict,
      orchestratorScore: founderTestAssessment.score.overall,
      topBlockers: input.topBlockers,
      topWarnings: [],
      topRecommendedActions: [],
      topMissingCapabilities: [],
      chatStressSimulation: input.chatStressSimulation,
      chatStressSummary: null,
      chatBlocksLaunchReadiness: input.chatStressSimulation?.chatBlocksLaunchReadiness ?? false,
      productReadinessSimulation: input.productReadinessSimulation,
      productReadinessSummary: null,
      productReadinessScore: input.productReadinessSimulation?.readinessScore ?? null,
      autonomousBuildExecutionProof: input.autonomousBuildExecutionProof,
      autonomousBuildExecutionProofSummary: null,
      executionChainConnected: input.autonomousBuildExecutionProof?.chainConnected ?? false,
      executionChainBlocksLaunch: input.autonomousBuildExecutionProof?.launchBlockedByChain ?? false,
      firstBrokenExecutionStage: input.autonomousBuildExecutionProof?.firstBrokenStage ?? null,
      connectedBuildExecution: null,
      connectedBuildExecutionSummary: null,
      connectedRuntimeActivationProof: null,
      connectedRuntimeActivationProofSummary: null,
      connectedPreviewExperienceProof: null,
      connectedPreviewExperienceProofSummary: null,
      connectedVerificationExecutionProof: null,
      connectedVerificationExecutionProofSummary: null,
      connectedLaunchReadinessProof: null,
      connectedLaunchReadinessProofSummary: null,
      launchBlockersProduct: [],
      launchBlockersTesting: [],
      launchBlockersAuthorityDisagreement: [],
      preReconciliationVerdict: input.preReconciliationVerdict,
      truthMatrixReconciliation: null,
      founderTruthSummary: null,
      inputSnapshot: {} as never,
      cacheKey: 'pre-reconciliation',
    },
  };

  const autonomousBuildExecutionProof =
    input.autonomousBuildExecutionProof ??
    ({
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'stub',
      proofId: 'stub',
      generatedAt: new Date().toISOString(),
      chainConnected: false,
      firstBrokenStage: null,
      launchBlockedByChain: false,
      stageProofs: [],
      chainAnalysis: { readOnly: true, chainConnected: false, firstBrokenStage: null, chainLinks: [], missingLinks: [], downstreamBlockedFrom: null },
      founderQuestions: {
        readOnly: true,
        canActuallyBuildSoftware: false,
        canActuallyRunSoftware: false,
        canActuallyPreviewSoftware: false,
        canActuallyVerifySoftware: false,
        canFounderGoFromIdeaToLaunch: false,
        exactBreakStage: null,
        missingEvidenceSummary: [],
        mustBuildNext: [],
      },
      missingEvidence: [],
      launchImpact: '',
      recommendedFix: '',
      recommendedNextActions: [],
      inputSnapshot: {} as never,
      cacheKey: 'stub',
    } satisfies AutonomousBuildExecutionProofReport);

  return {
    readOnly: true,
    input: {
      rootDir: input.rootDir,
      founderTestAssessment,
      chatIntelligenceReality,
      promiseRealityEngine: null,
      founderExecutionProof,
      launchReadiness,
      productReadiness: input.productReadinessSimulation,
      chatStressSimulation: input.chatStressSimulation,
      autonomousBuildExecutionProof,
      executionChainTruth,
      capabilityTruthRegistry,
      executionProofSync,
      authoritative: resolveConsistencyAuthoritativeEvidence({
        rootDir: input.rootDir,
        runId: founderTestAssessment.run.runId ?? null,
        executionChainTruth,
      }),
    },
    snapshot: {
      readOnly: true,
      founderTestAvailable: true,
      chatIntelligenceAvailable: true,
      promiseRealityAvailable: false,
      executionProofAvailable: true,
      launchReadinessAvailable: true,
      productReadinessAvailable: Boolean(input.productReadinessSimulation),
      chatStressAvailable: Boolean(input.chatStressSimulation),
      autonomousBuildProofAvailable: Boolean(input.autonomousBuildExecutionProof),
      executionChainTruthAvailable: true,
    },
  };
}
