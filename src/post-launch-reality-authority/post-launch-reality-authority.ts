/**
 * Post-Launch Reality Authority — read-only post-launch evidence orchestrator.
 */

import { createHash } from 'node:crypto';
import { assessFounderLaunchDecision } from '../founder-launch-decision-authority/index.js';
import { analyzeBusinessOutcome } from './business-outcome-analyzer.js';
import { analyzeEngagementEvidence } from './engagement-evidence-analyzer.js';
import { analyzeErrorReality } from './error-reality-analyzer.js';
import { analyzeRetentionEvidence } from './retention-evidence-analyzer.js';
import { analyzeTrafficEvidence } from './traffic-evidence-analyzer.js';
import { recordPostLaunchRealityAssessment } from './post-launch-reality-history.js';
import { buildPostLaunchRealityReportMarkdown } from './post-launch-reality-report-builder.js';
import {
  POST_LAUNCH_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN,
} from './post-launch-reality-registry.js';
import { computePostLaunchVerdict } from './post-launch-verdict-engine.js';
import type {
  AssessPostLaunchRealityInput,
  PostLaunchEvidenceBundle,
  PostLaunchRealityArtifacts,
  PostLaunchRealityAssessment,
  PostLaunchRealityReport,
} from './post-launch-reality-types.js';

let assessmentCounter = 0;

export function resetPostLaunchRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetPostLaunchRealityAuthorityModuleForTests(): void {
  resetPostLaunchRealityCounterForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `post-launch-reality-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: string, score: number): string {
  const digest = createHash('sha256')
    .update([POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN, assessmentId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${POST_LAUNCH_REALITY_AUTHORITY_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveInput<T>(input: AssessPostLaunchRealityInput, key: keyof AssessPostLaunchRealityInput, factory: () => T): T | null {
  if (key in input) {
    const value = input[key];
    return (value ?? null) as T | null;
  }
  return factory();
}

function buildEvidenceBundle(input: AssessPostLaunchRealityInput): PostLaunchEvidenceBundle {
  const fixture = input.postLaunchEvidenceFixture;
  const base = input.postLaunchEvidence ?? {
    readOnly: true as const,
    traffic: null,
    engagement: null,
    retention: null,
    errors: null,
    business: null,
  };

  if (!fixture) return base;

  return {
    readOnly: true,
    traffic: fixture.traffic !== undefined ? fixture.traffic ?? null : base.traffic,
    engagement: fixture.engagement !== undefined ? fixture.engagement ?? null : base.engagement,
    retention: fixture.retention !== undefined ? fixture.retention ?? null : base.retention,
    errors: fixture.errors !== undefined ? fixture.errors ?? null : base.errors,
    business: fixture.business !== undefined ? fixture.business ?? null : base.business,
  };
}

function deriveLaunchObserved(
  founderLaunchDecision: AssessPostLaunchRealityInput['founderLaunchDecision'],
  input: AssessPostLaunchRealityInput,
): boolean {
  if (input.launchReadinessOnlyFixture) return false;
  if (founderLaunchDecision?.founderLaunchDecision === 'LAUNCH' && founderLaunchDecision.canLaunchNow) {
    return true;
  }
  if (founderLaunchDecision?.founderLaunchDecision === 'LAUNCH') return true;
  return Boolean(input.postLaunchEvidenceFixture?.traffic || input.postLaunchEvidence?.traffic);
}

export function assessPostLaunchReality(
  input: AssessPostLaunchRealityInput = {},
): PostLaunchRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const rejectFabricated = Boolean(input.fabricatedMetricsFixture);

  const founderLaunchDecision = resolveInput(input, 'founderLaunchDecision', () =>
    input.launchReadinessOnlyFixture || input.runtimeProofOnlyFixture
      ? null
      : assessFounderLaunchDecision({
          rootDir,
          rawPrompt: input.rawPrompt,
          requirementsToPlanContract: input.requirementsToPlanContract,
          observedBuildEvidence: input.observedBuildEvidence,
          runtimeSessionEvidence: input.runtimeSessionEvidence,
          previewSessionEvidence: input.previewSessionEvidence,
          verificationEvidenceFixture: input.verificationEvidenceFixture,
          launchReadinessFixture: input.launchReadinessFixture,
          skipRealitySweep: true,
          skipHistoryRecording: true,
        }).report,
  );

  const liveExecutionRunner = resolveInput(input, 'liveExecutionRunner', () =>
    founderLaunchDecision?.inputSnapshot.liveExecutionRunner ?? null,
  );
  const runtimeActivationProof = resolveInput(input, 'runtimeActivationProof', () =>
    founderLaunchDecision?.inputSnapshot.runtimeActivationProof ??
    liveExecutionRunner?.inputSnapshot.connectedRuntimeActivationProof ??
    null,
  );
  const launchReadinessProof = resolveInput(input, 'launchReadinessProof', () =>
    founderLaunchDecision?.inputSnapshot.launchReadinessProof ??
    liveExecutionRunner?.inputSnapshot.connectedLaunchReadinessProof ??
    null,
  );
  const launchCouncil = resolveInput(input, 'launchCouncil', () =>
    founderLaunchDecision?.inputSnapshot.launchCouncil ?? null,
  );

  const postLaunchEvidence = buildEvidenceBundle(input);
  const launchObserved = deriveLaunchObserved(founderLaunchDecision, input);

  const traffic = analyzeTrafficEvidence({
    evidence: postLaunchEvidence.traffic,
    launchObserved,
    runtimeProofOnly: input.runtimeProofOnlyFixture,
    launchReadinessOnly: input.launchReadinessOnlyFixture,
    rejectFabricated,
  });

  const engagement = analyzeEngagementEvidence({
    evidence: postLaunchEvidence.engagement,
    trafficObserved: traffic.trafficObserved,
    runtimeProofOnly: input.runtimeProofOnlyFixture,
    launchReadinessOnly: input.launchReadinessOnlyFixture,
    rejectFabricated,
  });

  const retention = analyzeRetentionEvidence({
    evidence: postLaunchEvidence.retention,
    trafficObserved: traffic.trafficObserved,
    engagementObserved: engagement.activeUsage,
    rejectFabricated,
  });

  const reliability = analyzeErrorReality({
    evidence: postLaunchEvidence.errors,
    launchObserved,
    rejectFabricated,
  });

  const activityObserved = traffic.trafficObserved && (traffic.sessionsObserved ?? 0) > 0;
  const retentionObserved =
    retention.repeatUsers && retention.retentionSignals && traffic.trafficObserved;

  const businessOutcome = analyzeBusinessOutcome({
    evidence: postLaunchEvidence.business,
    activityObserved,
    retentionObserved,
    rejectFabricated,
  });

  const overallPostLaunchScore = Math.round(
    traffic.trafficScore * 0.25 +
      engagement.engagementScore * 0.2 +
      retention.retentionScore * 0.2 +
      reliability.reliabilityScore * 0.15 +
      businessOutcome.businessOutcomeScore * 0.2,
  );

  const verdict = computePostLaunchVerdict({
    launchObserved,
    traffic,
    engagement,
    retention,
    reliability,
    businessOutcome,
    overallPostLaunchScore,
    rejectFabricated,
  });

  const inputSnapshot = {
    readOnly: true as const,
    founderLaunchDecision,
    liveExecutionRunner,
    runtimeActivationProof,
    launchReadinessProof,
    launchCouncil,
    postLaunchEvidence,
    launchObserved,
  };

  const report: PostLaunchRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    postLaunchRealityState: verdict.postLaunchRealityState,
    overallPostLaunchScore: verdict.overallPostLaunchScore,
    confidence: verdict.confidence,
    activityObserved: verdict.activityObserved,
    retentionObserved: verdict.retentionObserved,
    businessValueObserved: verdict.businessValueObserved,
    trafficScore: traffic.trafficScore,
    engagementScore: engagement.engagementScore,
    retentionScore: retention.retentionScore,
    reliabilityScore: reliability.reliabilityScore,
    businessOutcomeScore: businessOutcome.businessOutcomeScore,
    traffic,
    engagement,
    retention,
    reliability,
    businessOutcome,
    riskSignals: verdict.riskSignals,
    missingEvidence: verdict.missingEvidence,
    keyFindings: verdict.keyFindings,
    recommendedActions: verdict.recommendedActions,
    finalVerdict: verdict.finalVerdict,
    verdict,
    inputSnapshot,
    cacheKey: stableCacheKey(assessmentId, verdict.postLaunchRealityState, verdict.overallPostLaunchScore),
  };

  const assessment: PostLaunchRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'POST_LAUNCH_REALITY_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordPostLaunchRealityAssessment(assessment);
  }

  return assessment;
}

export function buildPostLaunchRealityArtifacts(
  input: AssessPostLaunchRealityInput = {},
): PostLaunchRealityArtifacts {
  const assessment = assessPostLaunchReality(input);
  return {
    postLaunchRealityAssessment: assessment,
    postLaunchRealityReportMarkdown: buildPostLaunchRealityReportMarkdown(assessment.report),
  };
}
