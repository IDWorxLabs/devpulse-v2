/**
 * Live Idea-To-Launch Execution Runner — read-only lifecycle authority.
 */

import { createHash } from 'node:crypto';
import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessConnectedLaunchReadinessProof } from '../connected-launch-readiness-proof/index.js';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import { assessConnectedVerificationExecutionProof } from '../connected-verification-execution-proof/index.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import { runFounderTestLaunchReadiness } from '../founder-test-launch-readiness/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  EXECUTION_PROOF_REFERENCE_PROMPT,
} from '../requirements-to-plan-execution-contract/index.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import { analyzeIdeaStage } from './idea-stage-analyzer.js';
import { analyzeLaunchStage } from './launch-stage-analyzer.js';
import { analyzePlanningStage } from './planning-stage-analyzer.js';
import { analyzeBuildStage } from './execution-stage-analyzer.js';
import { analyzeValidationStage } from './validation-stage-analyzer.js';
import { analyzeRuntimeStage } from './runtime-stage-analyzer.js';
import {
  deriveExecutionState,
  deriveExecutionVerdict,
  deriveOverallScore,
  deriveRiskAssessment,
  verifyExecutionChain,
} from './execution-chain-verifier.js';
import { recordLiveExecutionRunnerAssessment } from './live-idea-to-launch-execution-runner-history.js';
import { buildLiveIdeaToLaunchExecutionRunnerReportMarkdown } from './live-idea-to-launch-execution-runner-report-builder.js';
import {
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_CACHE_KEY_PREFIX,
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN,
} from './live-idea-to-launch-execution-runner-registry.js';
import type {
  AssessLiveIdeaToLaunchExecutionRunnerInput,
  LiveIdeaToLaunchExecutionRunnerArtifacts,
  LiveIdeaToLaunchExecutionRunnerAssessment,
  LiveIdeaToLaunchExecutionRunnerReport,
} from './live-idea-to-launch-execution-runner-types.js';

let runCounter = 0;

export function resetLiveExecutionRunnerCounterForTests(): void {
  runCounter = 0;
}

function nextRunId(): string {
  runCounter += 1;
  return `live-idea-to-launch-execution-runner-${runCounter}`;
}

function stableCacheKey(runId: string, score: number): string {
  const digest = createHash('sha256')
    .update([LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN, runId, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_CACHE_KEY_PREFIX}:${digest}`;
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

export function assessLiveIdeaToLaunchExecutionRunner(
  input: AssessLiveIdeaToLaunchExecutionRunnerInput = {},
): LiveIdeaToLaunchExecutionRunnerAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const runId = nextRunId();

  const requirementsToPlanContract =
    input.requirementsToPlanContract ??
    assessRequirementsToPlanExecutionContract({
      rawPrompt: input.rawPrompt ?? EXECUTION_PROOF_REFERENCE_PROMPT,
    }).report;

  const founderTestAssessment =
    input.founderTestAssessment ?? assessFounderTestIntegration({ rootDir });

  const connectedBuildExecution =
    input.connectedBuildExecution ??
    assessConnectedBuildExecution({
      rootDir,
      buildReadyContract: requirementsToPlanContract.buildReadyContract,
      observedEvidence: input.observedBuildEvidence,
    }).report;

  const connectedRuntimeActivationProof =
    input.connectedRuntimeActivationProof ??
    assessConnectedRuntimeActivationProof({
      rootDir,
      buildMaterializationReport: connectedBuildExecution,
      runtimeSessionEvidence: input.runtimeSessionEvidence,
    }).report;

  const connectedPreviewExperienceProof =
    input.connectedPreviewExperienceProof ??
    assessConnectedPreviewExperienceProof({
      rootDir,
      runtimeActivationProof: connectedRuntimeActivationProof,
      previewSessionEvidence: input.previewSessionEvidence,
    }).report;

  const connectedVerificationExecutionProof =
    input.connectedVerificationExecutionProof ??
    assessConnectedVerificationExecutionProof({
      rootDir,
      previewExperienceProof: connectedPreviewExperienceProof,
      verificationEvidenceFixture: input.verificationEvidenceFixture,
    }).report;

  const autonomousBuildExecutionProof =
    input.autonomousBuildExecutionProof ??
    assessAutonomousBuildExecutionProof({
      rootDir,
      requirementsToPlanContract,
      founderTestAssessment,
      connectedBuildMaterialization: connectedBuildExecution,
      connectedRuntimeActivationProof,
      connectedPreviewExperienceProof,
      connectedVerificationExecutionProof,
      observedBuildEvidence: input.observedBuildEvidence,
      runtimeSessionEvidence: input.runtimeSessionEvidence,
      previewSessionEvidence: input.previewSessionEvidence,
      verificationEvidenceFixture: input.verificationEvidenceFixture,
      launchReadinessFixture: input.launchReadinessFixture,
    }).report;

  const connectedLaunchReadinessProof =
    input.connectedLaunchReadinessProof ??
    autonomousBuildExecutionProof.inputSnapshot.connectedLaunchReadinessProof ??
    assessConnectedLaunchReadinessProof({
      rootDir,
      autonomousBuildExecutionProof,
      verificationExecutionProof: connectedVerificationExecutionProof,
      founderTestAssessment,
      coreChainConnected: autonomousBuildExecutionProof.chainConnected,
      launchReadinessFixture: input.launchReadinessFixture,
    }).report;

  const founderTestLaunchReadiness =
    input.founderTestLaunchReadiness ??
    runFounderTestLaunchReadiness({
      rootDir,
      founderTestAssessment,
      autonomousBuildExecutionProof,
      connectedBuildExecution,
      connectedRuntimeActivationProof,
      connectedPreviewExperienceProof,
      connectedVerificationExecutionProof,
      connectedLaunchReadinessProof,
      skipAutonomousBuildExecutionProof: true,
      skipConnectedBuildExecution: true,
      skipConnectedRuntimeActivationProof: true,
      skipConnectedPreviewExperienceProof: true,
      skipConnectedVerificationExecutionProof: true,
      skipConnectedLaunchReadinessProof: true,
      skipChatStressSimulation: true,
      skipProductReadinessSimulation: true,
      skipHistoryRecording: true,
    }).report;

  const idea = analyzeIdeaStage({
    contract: requirementsToPlanContract,
    founderTest: founderTestAssessment,
  });

  const planning = analyzePlanningStage({
    contract: requirementsToPlanContract,
    executionProof: autonomousBuildExecutionProof,
    ideaConfirmed: idea.confirmed,
  });

  const build = analyzeBuildStage({
    buildMaterialization: connectedBuildExecution,
    executionProof: autonomousBuildExecutionProof,
    planningConfirmed: planning.confirmed,
  });

  const validation = analyzeValidationStage({
    verificationProof: connectedVerificationExecutionProof,
    executionProof: autonomousBuildExecutionProof,
    founderTest: founderTestAssessment,
    launchReadiness: founderTestLaunchReadiness,
    buildConfirmed: build.confirmed,
  });

  const runtime = analyzeRuntimeStage({
    runtimeProof: connectedRuntimeActivationProof,
    previewProof: connectedPreviewExperienceProof,
    executionProof: autonomousBuildExecutionProof,
    validationConfirmed: validation.confirmed,
  });

  const launch = analyzeLaunchStage({
    launchReadinessProof: connectedLaunchReadinessProof,
    founderLaunchReadiness: founderTestLaunchReadiness,
    executionProof: autonomousBuildExecutionProof,
    runtimeConfirmed: runtime.confirmed,
  });

  const stageList = [idea, planning, build, validation, runtime, launch];
  const chain = verifyExecutionChain({
    idea,
    planning,
    build,
    validation,
    runtime,
    launch,
  });

  const executionState = deriveExecutionState({
    idea,
    planning,
    build,
    validation,
    runtime,
    launch,
  });

  const overallExecutionScore = deriveOverallScore(stageList);
  const executionVerdict = deriveExecutionVerdict({ chain, overallScore: overallExecutionScore });
  const risk = deriveRiskAssessment(chain, stageList);

  const recommendedFix =
    chain.nextRequiredStage
      ? stageList.find((s) => s.stage === chain.nextRequiredStage)?.recommendedFix ??
        `Prove ${chain.nextRequiredStage} with connected evidence.`
      : 'Maintain connected lifecycle evidence through launch.';

  const recommendedNextActions = dedupeStrings([
    recommendedFix,
    ...chain.executionGaps,
    ...stageList.filter((s) => !s.confirmed).map((s) => s.recommendedFix),
  ]).slice(0, 10);

  const vaultCount = getDevPulseV2ProjectVaultAuthority().listProjects().length;

  const report: LiveIdeaToLaunchExecutionRunnerReport = {
    readOnly: true,
    advisoryOnly: true,
    runId,
    generatedAt: new Date().toISOString(),
    executionState,
    overallExecutionScore,
    executionVerdict,
    idea,
    planning,
    build,
    validation,
    runtime,
    launch,
    chain,
    risk,
    missingEvidence: chain.missingEvidence,
    recommendedFix,
    recommendedNextActions,
    inputSnapshot: {
      readOnly: true,
      requirementsToPlanContract,
      founderTestAssessment,
      autonomousBuildExecutionProof,
      connectedBuildExecution,
      connectedVerificationExecutionProof,
      connectedRuntimeActivationProof,
      connectedPreviewExperienceProof,
      connectedLaunchReadinessProof,
      founderTestLaunchReadiness,
      projectVaultProjectCount: vaultCount,
    },
    cacheKey: stableCacheKey(runId, overallExecutionScore),
  };

  const assessment: LiveIdeaToLaunchExecutionRunnerAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'LIVE_EXECUTION_RUNNER_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordLiveExecutionRunnerAssessment(assessment);
  }

  return assessment;
}

export function buildLiveIdeaToLaunchExecutionRunnerArtifacts(
  input: AssessLiveIdeaToLaunchExecutionRunnerInput = {},
): LiveIdeaToLaunchExecutionRunnerArtifacts {
  const liveIdeaToLaunchExecutionRunnerAssessment = assessLiveIdeaToLaunchExecutionRunner(input);
  return {
    liveIdeaToLaunchExecutionRunnerAssessment,
    liveIdeaToLaunchExecutionRunnerReportMarkdown: buildLiveIdeaToLaunchExecutionRunnerReportMarkdown(
      liveIdeaToLaunchExecutionRunnerAssessment.report,
    ),
  };
}

export function resetLiveIdeaToLaunchExecutionRunnerModuleForTests(): void {
  resetLiveExecutionRunnerCounterForTests();
}
