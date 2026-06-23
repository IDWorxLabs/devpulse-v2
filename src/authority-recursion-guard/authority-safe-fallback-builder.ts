/**
 * Phase 26.93 — Authority safe fallback builder (V1).
 */

import type {
  ExecutionCompletenessBreakdown,
  FounderExecutionProofBundle,
  FounderExecutionProofInputSnapshot,
  FounderExecutionProofQuestionAnswers,
  StageExecutionEvidence,
} from '../founder-execution-proof/founder-execution-proof-types.js';
import type { AssessFounderExecutionProofInput } from '../founder-execution-proof/founder-execution-proof-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import { CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE } from '../founder-test-integration/connected-execution-chain-truth.js';
import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import { AUTHORITY_RECURSION_RECOMMENDED_FIX } from './authority-recursion-guard-registry.js';
import type {
  AuthorityRecursionDetection,
  AuthoritySafeFallbackEvidence,
} from './authority-recursion-guard-types.js';

export function buildAuthoritySafeFallbackEvidence(
  detection: AuthorityRecursionDetection,
): AuthoritySafeFallbackEvidence {
  return {
    readOnly: true,
    proofLevel: 'PARTIAL',
    verdict: 'PARTIAL',
    recursionDetected: true,
    skippedHeavyOrchestration: true,
    reason: detection.reason,
    callerStack: detection.callerStack,
    launchImpact: detection.launchImpact,
    recommendedFix: detection.recommendedFix,
    ruleId: detection.ruleId,
    authorityName: detection.authorityName,
  };
}

function emptyStage(stage: StageExecutionEvidence['stage']): StageExecutionEvidence {
  return {
    readOnly: true,
    stage,
    proven: false,
    state: 'INSUFFICIENT_EVIDENCE',
    score: 0,
    proofPercent: 0,
    sourceAuthority: 'authority-recursion-guard',
    evidenceSummary: 'Recursion guard fallback — precomputed evidence required',
    artifactPaths: [],
  };
}

export function buildFounderExecutionProofBundleRecursionFallback(input: {
  detection: AuthorityRecursionDetection;
  proofBundleId: string;
  assessInput: AssessFounderExecutionProofInput;
}): {
  bundle: FounderExecutionProofBundle;
  completeness: ExecutionCompletenessBreakdown;
  questionAnswers: FounderExecutionProofQuestionAnswers;
  proofWarnings: string[];
  proofBlockers: string[];
  inputSnapshot: FounderExecutionProofInputSnapshot;
  safeFallback: AuthoritySafeFallbackEvidence;
} {
  const fallback = buildAuthoritySafeFallbackEvidence(input.detection);
  const workspaceEvidence = emptyStage('WORKSPACE');
  const buildEvidence = emptyStage('BUILD');
  const runtimeEvidence = emptyStage('RUNTIME');
  const previewEvidence = emptyStage('PREVIEW');
  const verificationEvidence = emptyStage('VERIFICATION');

  const executionChainEvidence = {
    readOnly: true as const,
    connected: false,
    state: 'INSUFFICIENT_EVIDENCE',
    score: 0,
    proofPercent: 0,
    sourceAuthority: 'authority-recursion-guard',
    evidenceSummary: fallback.reason,
  };

  const launchEvidence = {
    readOnly: true as const,
    launchReadinessProven: false,
    launchCouncilVerdict: 'UNKNOWN',
    founderAcceptanceState: 'UNKNOWN',
    proofPercent: 0,
    sourceAuthority: 'authority-recursion-guard',
    evidenceSummary: fallback.reason,
  };

  const proofWarnings = [
    `Recursion guard: ${fallback.reason}`,
    AUTHORITY_RECURSION_RECOMMENDED_FIX,
  ];

  const proofBlockers = [
    `TESTING_INFRASTRUCTURE_DEFECT: ${fallback.ruleId} at ${fallback.authorityName}`,
  ];

  const completeness: ExecutionCompletenessBreakdown = {
    readOnly: true,
    workspaceProofPercent: 0,
    buildProofPercent: 0,
    runtimeProofPercent: 0,
    previewProofPercent: 0,
    verificationProofPercent: 0,
    executionChainPercent: 0,
    launchReadinessPercent: 0,
    overallFounderProofPercent: 0,
  };

  const inputSnapshot: FounderExecutionProofInputSnapshot = {
    readOnly: true,
    connectedWorkspaceCreationAssessment: input.assessInput.connectedWorkspaceCreationAssessment ?? null,
    connectedRuntimeExecutionAssessment: input.assessInput.connectedRuntimeExecutionAssessment ?? null,
    connectedLivePreviewExecutionAssessment: input.assessInput.connectedLivePreviewExecutionAssessment ?? null,
    connectedVerificationExecutionAssessment: input.assessInput.connectedVerificationExecutionAssessment ?? null,
    endToEndExecutionProofAssessment: input.assessInput.endToEndExecutionProofAssessment ?? null,
    founderTestExecutionChainAssessment: input.assessInput.founderTestExecutionChainAssessment ?? null,
    founderTestLaunchReadinessAssessment: input.assessInput.founderTestLaunchReadinessAssessment ?? null,
    executionProofAssessment: input.assessInput.executionProofAssessment ?? null,
    founderAcceptanceAssessment: input.assessInput.founderAcceptanceAssessment ?? null,
    launchCouncilAssessment: null,
    missingAuthorities: ['authority-recursion-guard-fallback'],
  };

  const questionAnswers: FounderExecutionProofQuestionAnswers = {
    workspaceActuallyCreated: false,
    buildActuallyExecuted: false,
    runtimeActuallyActivated: false,
    previewActuallyActivated: false,
    verificationActuallyExecuted: false,
    executionChainConnected: false,
    founderCanInspectEvidence: false,
    blockersPresent: true,
    launchReadinessProven: false,
    founderExecutionProven: false,
  };

  const bundle: FounderExecutionProofBundle = {
    readOnly: true,
    proofBundleId: input.proofBundleId,
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
    executionChainEvidence,
    launchEvidence,
    proofArtifacts: [],
    proofWarnings,
    proofBlockers,
  };

  return {
    bundle,
    completeness,
    questionAnswers,
    proofWarnings,
    proofBlockers,
    inputSnapshot,
    safeFallback: fallback,
  };
}

export function buildFounderTestIntegrationRecursionFallback(
  detection: AuthorityRecursionDetection,
  rootDir = process.cwd(),
): FounderTestAssessment {
  const fallback = buildAuthoritySafeFallbackEvidence(detection);
  const generatedAt = new Date().toISOString();
  const runId = `recursion-guard-${Date.now()}`;

  return {
    readOnly: true,
    advisoryOnly: true,
    run: {
      readOnly: true,
      runId,
      startedAt: generatedAt,
      completedAt: generatedAt,
      rootDir,
      authorityResults: [],
      executionChainTruth: {
        readOnly: true,
        requirementsProven: false,
        planProven: false,
        buildProven: false,
        runtimeProven: false,
        previewProven: false,
        verificationProven: false,
        launchProven: false,
        chainConnected: false,
        firstBrokenStage: null,
        generatedAt,
        sourceAuthority: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
      },
    },
    score: {
      overall: 0,
      byAuthority: {} as FounderTestAssessment['score']['byAuthority'],
      weightedBreakdown: {} as FounderTestAssessment['score']['weightedBreakdown'],
    },
    summary: {
      participatingAuthorities: 0,
      availableAuthorities: 0,
      missingAuthorities: ['authority-recursion-guard-fallback'],
      criticalBlockerCount: 0,
      warningCount: 1,
      recommendationCount: 1,
      founderSimulationPassed: false,
      executionProofRegressionFree: true,
      requirementRealityAboveThreshold: false,
    },
    verdict: 'INSUFFICIENT_EVIDENCE',
    findings: [],
    blockers: [fallback.reason],
    warnings: [AUTHORITY_RECURSION_RECOMMENDED_FIX],
    recommendations: [fallback.recommendedFix],
    missingCapabilities: ['Pass precomputed founder test assessment into guarded path'],
    cacheKey: `recursion-guard:${runId}`,
    executionProofSummary: {
      readOnly: true,
      founderExecutionState: 'INSUFFICIENT_EVIDENCE',
      launchRecommendation: 'INSUFFICIENT_EVIDENCE',
      launchConfidence: 0,
      overallFounderProofPercent: 0,
      executionCompletenessPercent: 0,
      topBlockers: [fallback.reason],
      topEvidence: [],
    },
  };
}

export function buildAutonomousRepairLoopRecursionFallback(
  detection: AuthorityRecursionDetection,
): AutonomousRepairLoopAssessment {
  const fallback = buildAuthoritySafeFallbackEvidence(detection);
  return {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: 'Autonomous repair loop blocked by recursion guard',
    inputSnapshot: {
      finding: null,
      founderTestAssessment: null,
      adaptiveAutofixAssessment: null,
      executionProofAssessment: null,
      founderAcceptanceAssessment: null,
      executionProofVerdict: null,
      founderAcceptanceState: null,
      priorAttemptCount: 0,
      attemptBudget: 0,
      budgetExceeded: false,
      regressionPresent: false,
      loopRiskPresent: true,
    },
    decision: {
      recommendedAction: 'ESCALATE',
      loopState: 'ESCALATED',
      decisionReason: fallback.reason,
      escalationGuidance: {
        whyLoopStopped: fallback.reason,
        whyEscalationHappened: fallback.ruleId,
        missingCapabilitySuggestions: [fallback.recommendedFix],
        missingEvidenceSuggestions: ['Precomputed founder test and repair-loop assessments'],
        diagnosticRecommendations: [fallback.recommendedFix],
      },
    },
    attempts: [],
    cacheKey: `recursion-guard-repair-loop:${Date.now()}`,
  };
}
