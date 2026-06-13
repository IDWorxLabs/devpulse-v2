/**
 * Founder Launch Decision Authority — read-only founder launch verdict orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessFounderTestRealitySweep } from '../founder-test-reality-sweep/index.js';
import { assessLiveIdeaToLaunchExecutionRunner } from '../live-idea-to-launch-execution-runner/index.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { analyzeBlockerPriority } from './blocker-priority-analyzer.js';
import { computeFounderDecisionVerdict } from './founder-decision-verdict-engine.js';
import { recordFounderLaunchDecisionAssessment } from './founder-launch-decision-history.js';
import { buildFounderLaunchDecisionReportMarkdown } from './founder-launch-decision-report-builder.js';
import {
  FOUNDER_LAUNCH_DECISION_AUTHORITY_CACHE_KEY_PREFIX,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN,
} from './founder-launch-decision-authority-registry.js';
import { analyzeProofChainSignals } from './proof-chain-signal-analyzer.js';
import { analyzeLaunchRisk } from './launch-risk-analyzer.js';
import type {
  AssessFounderLaunchDecisionInput,
  FounderLaunchDecisionArtifacts,
  FounderLaunchDecisionAssessment,
  FounderLaunchDecisionReport,
} from './founder-launch-decision-authority-types.js';

let decisionCounter = 0;

export function resetFounderLaunchDecisionCounterForTests(): void {
  decisionCounter = 0;
}

export function resetFounderLaunchDecisionAuthorityModuleForTests(): void {
  resetFounderLaunchDecisionCounterForTests();
}

function nextDecisionId(): string {
  decisionCounter += 1;
  return `founder-launch-decision-${decisionCounter}`;
}

function stableCacheKey(decisionId: string, decision: string, confidence: number): string {
  const digest = createHash('sha256')
    .update([FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN, decisionId, decision, confidence].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_LAUNCH_DECISION_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function resolveInput<T>(input: AssessFounderLaunchDecisionInput, key: keyof AssessFounderLaunchDecisionInput, factory: () => T): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

export function assessFounderLaunchDecision(
  input: AssessFounderLaunchDecisionInput = {},
): FounderLaunchDecisionAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const decisionId = nextDecisionId();

  const liveExecutionRunner = resolveInput(input, 'liveExecutionRunner', () =>
    assessLiveIdeaToLaunchExecutionRunner({
      rootDir,
      rawPrompt: input.rawPrompt,
      requirementsToPlanContract: input.requirementsToPlanContract,
      observedBuildEvidence: input.observedBuildEvidence,
      runtimeSessionEvidence: input.runtimeSessionEvidence,
      previewSessionEvidence: input.previewSessionEvidence,
      verificationEvidenceFixture: input.verificationEvidenceFixture,
      launchReadinessFixture: input.launchReadinessFixture,
      skipHistoryRecording: true,
    }).report,
  );

  const launchReadinessProof = resolveInput(input, 'launchReadinessProof', () =>
    liveExecutionRunner?.inputSnapshot.connectedLaunchReadinessProof ?? null,
  );
  const runtimeActivationProof = resolveInput(input, 'runtimeActivationProof', () =>
    liveExecutionRunner?.inputSnapshot.connectedRuntimeActivationProof ?? null,
  );
  const previewExperienceProof = resolveInput(input, 'previewExperienceProof', () =>
    liveExecutionRunner?.inputSnapshot.connectedPreviewExperienceProof ?? null,
  );
  const buildMaterialization = resolveInput(input, 'buildMaterialization', () =>
    liveExecutionRunner?.inputSnapshot.connectedBuildExecution ?? null,
  );
  const verificationExecutionProof = resolveInput(input, 'verificationExecutionProof', () =>
    liveExecutionRunner?.inputSnapshot.connectedVerificationExecutionProof ?? null,
  );
  const founderTestLaunchReadiness = resolveInput(input, 'founderTestLaunchReadiness', () =>
    liveExecutionRunner?.inputSnapshot.founderTestLaunchReadiness ?? null,
  );
  const requirementsToPlanContract = resolveInput(input, 'requirementsToPlanContract', () =>
    liveExecutionRunner?.inputSnapshot.requirementsToPlanContract ?? null,
  );
  const autonomousBuildExecutionProof = resolveInput(input, 'autonomousBuildExecutionProof', () =>
    liveExecutionRunner?.inputSnapshot.autonomousBuildExecutionProof ?? null,
  );
  const founderTestAssessment = resolveInput(input, 'founderTestAssessment', () =>
    liveExecutionRunner?.inputSnapshot.founderTestAssessment ?? null,
  );

  const founderTestRealitySweep = resolveInput(input, 'founderTestRealitySweep', () =>
    input.skipRealitySweep
      ? null
      : assessFounderTestRealitySweep({
          rootDir,
          founderTestAssessment: founderTestAssessment ?? undefined,
          founderTestLaunchReadinessAssessment: founderTestLaunchReadiness
            ? {
                readOnly: true,
                advisoryOnly: true,
                orchestrationState: 'FOUNDER_TEST_COMPLETE',
                report: founderTestLaunchReadiness,
              }
            : null,
        }).report,
  );

  const launchCouncil = resolveInput(input, 'launchCouncil', () =>
    founderTestRealitySweep?.inputSnapshot.launchCouncilAssessment ?? null,
  );

  const inputSnapshot = {
    readOnly: true as const,
    liveExecutionRunner,
    launchReadinessProof,
    runtimeActivationProof,
    previewExperienceProof,
    buildMaterialization,
    verificationExecutionProof,
    founderTestLaunchReadiness,
    founderTestRealitySweep,
    launchCouncil,
    requirementsToPlanContract,
    autonomousBuildExecutionProof,
    founderTestAssessment,
    projectVaultProjectCount: getDevPulseV2ProjectVaultAuthority().listProjects().length,
  };

  const proofSignals = analyzeProofChainSignals({
    snapshot: inputSnapshot,
    sourceCodeOnlyFixture: input.sourceCodeOnlyFixture,
  });

  const blockers = analyzeBlockerPriority({
    launchReadinessProof,
    founderTestLaunchReadiness,
    founderTestRealitySweep,
    liveExecutionRunner,
    launchCouncil,
  });

  const riskSignals = analyzeLaunchRisk({
    proofSignals,
    blockers,
    launchReadinessScore: launchReadinessProof?.readiness.readinessScore,
    runtimeConfidenceScore: runtimeActivationProof?.linkage.traceabilityScore,
  });

  const verdict = computeFounderDecisionVerdict({
    proofSignals,
    riskSignals,
    blockers,
    sourceCodeOnlyFixture: input.sourceCodeOnlyFixture,
  });

  const missingEvidence = dedupeStrings([
    ...proofSignals.missingEvidence,
    ...(liveExecutionRunner?.missingEvidence.slice(0, 4) ?? []),
    ...(launchReadinessProof?.missingEvidence.slice(0, 3) ?? []),
  ]).slice(0, 12);

  const founderDecisionConfidence = Math.round(
    (proofSignals.proofChainScore * 0.3 +
      riskSignals.launchReadinessScore * 0.25 +
      riskSignals.runtimeConfidenceScore * 0.25 +
      verdict.decisionConfidence * 0.2),
  );

  const report: FounderLaunchDecisionReport = {
    readOnly: true,
    advisoryOnly: true,
    decisionId,
    generatedAt: new Date().toISOString(),
    founderLaunchDecision: verdict.founderLaunchDecision,
    decisionConfidence: verdict.decisionConfidence,
    founderDecisionConfidence: Math.min(100, Math.max(0, founderDecisionConfidence)),
    canLaunchNow: verdict.canLaunchNow,
    reason: verdict.reason,
    blockingIssues: verdict.blockingIssues,
    recommendedNextActions: verdict.recommendedNextActions,
    proofChainScore: proofSignals.proofChainScore,
    launchReadinessScore: riskSignals.launchReadinessScore,
    runtimeConfidenceScore: riskSignals.runtimeConfidenceScore,
    riskScore: riskSignals.riskScore,
    proofSignals,
    riskSignals,
    blockers,
    verdict,
    missingEvidence,
    decisionSummary: verdict.decisionSummary,
    inputSnapshot,
    cacheKey: stableCacheKey(decisionId, verdict.founderLaunchDecision, verdict.decisionConfidence),
  };

  const assessment: FounderLaunchDecisionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_LAUNCH_DECISION_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordFounderLaunchDecisionAssessment(assessment);
  }

  return assessment;
}

export function buildFounderLaunchDecisionArtifacts(
  input: AssessFounderLaunchDecisionInput = {},
): FounderLaunchDecisionArtifacts {
  const assessment = assessFounderLaunchDecision(input);
  return {
    founderLaunchDecisionAssessment: assessment,
    founderLaunchDecisionReportMarkdown: buildFounderLaunchDecisionReportMarkdown(assessment.report),
  };
}
