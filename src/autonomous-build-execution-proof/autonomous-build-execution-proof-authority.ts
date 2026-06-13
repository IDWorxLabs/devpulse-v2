/**
 * Autonomous Build Execution Proof — connected idea-to-launch proof authority.
 * Read-only — consumes existing authorities only. No fake passes.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { assessConnectedAutonomousBuildExecution } from '../connected-build-execution-foundation/index.js';
import type { ConnectedBuildExecutionAssessment as ConnectedBuildFoundationAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import { assessConnectedLivePreview } from '../connected-live-preview-foundation/index.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import { assessConnectedRuntimeActivation } from '../connected-runtime-activation-foundation/index.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import { assessConnectedVerificationExecutionProof } from '../connected-verification-execution-proof/index.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import { assessConnectedVerification } from '../connected-verification-foundation/index.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import {
  assessFounderTestIntegration,
  resetFounderTestIntegrationModuleForTests,
} from '../founder-test-integration/index.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import { hydrateRuntimeFounderExecutionProofInputSync } from '../founder-test-integration/runtime-founder-execution-proof-hydration.js';
import { runFounderTestLaunchReadiness } from '../founder-test-launch-readiness/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  EXECUTION_PROOF_REFERENCE_PROMPT,
} from '../requirements-to-plan-execution-contract/index.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { analyzeBuildStage } from './build-stage-analyzer.js';
import {
  analyzeExecutionChain,
  analyzePlanStage,
  analyzeRequirementsStage,
  applyDownstreamBlocking,
  buildChainLinks,
} from './execution-chain-analyzer.js';
import { recordAutonomousBuildExecutionProofAssessment } from './execution-proof-history.js';
import { buildAutonomousBuildExecutionProofReportMarkdown } from './execution-proof-report-builder.js';
import type {
  LaunchReadinessFixture,
  LaunchReadinessProofReport,
} from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import { assessConnectedLaunchReadinessProof } from '../connected-launch-readiness-proof/index.js';
import { analyzeLaunchStage } from './launch-stage-analyzer.js';
import { analyzePreviewStage } from './preview-stage-analyzer.js';
import { analyzeRuntimeStage } from './runtime-stage-analyzer.js';
import { analyzeVerificationStage } from './verification-stage-analyzer.js';
import {
  AUTONOMOUS_BUILD_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_CORE_QUESTION,
  AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN,
  CORE_CHAIN_STAGES,
  MAX_MISSING_EVIDENCE,
  MAX_RECOMMENDED_ACTIONS,
} from './autonomous-build-execution-proof-registry.js';
import type {
  AssessAutonomousBuildExecutionProofInput,
  AutonomousBuildExecutionProofArtifacts,
  AutonomousBuildExecutionProofAssessment,
  AutonomousBuildExecutionProofInputSnapshot,
  AutonomousBuildExecutionProofReport,
  FounderExecutionProofQuestions,
  StageExecutionProof,
} from './autonomous-build-execution-proof-types.js';

let proofCounter = 0;

export function resetAutonomousBuildExecutionProofCounterForTests(): void {
  proofCounter = 0;
}

function nextProofId(): string {
  proofCounter += 1;
  return `autonomous-build-execution-proof-${proofCounter}`;
}

function stableCacheKey(proofId: string, chainConnected: boolean): string {
  const digest = createHash('sha256')
    .update([AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN, proofId, chainConnected].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${AUTONOMOUS_BUILD_EXECUTION_PROOF_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveFounderTestAssessment(
  input: AssessAutonomousBuildExecutionProofInput,
  rootDir: string,
): FounderTestAssessment {
  if (input.founderTestAssessment) return input.founderTestAssessment;

  const hydrated = hydrateRuntimeFounderExecutionProofInputSync(rootDir, {});
  return assessFounderTestIntegration({
    rootDir,
    founderExecutionProofInput: hydrated.input,
  });
}

function resolveAssessments(input: AssessAutonomousBuildExecutionProofInput, rootDir: string): {
  founderTestAssessment: FounderTestAssessment;
  connectedBuildFoundationAssessment: ConnectedBuildFoundationAssessment;
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  connectedVerificationAssessment: ConnectedVerificationAssessment;
} {
  const founderTestAssessment = resolveFounderTestAssessment(input, rootDir);

  const connectedBuildFoundationAssessment =
    input.connectedBuildFoundationAssessment ??
    assessConnectedAutonomousBuildExecution({ rootDir });

  const connectedRuntimeActivationAssessment =
    input.connectedRuntimeActivationAssessment ??
    assessConnectedRuntimeActivation({
      rootDir,
      connectedBuildExecutionAssessment: connectedBuildFoundationAssessment,
    });

  const connectedLivePreviewAssessment =
    input.connectedLivePreviewAssessment ??
    assessConnectedLivePreview({
      rootDir,
      connectedRuntimeActivationAssessment,
    });

  const stubLaunchReadiness = runFounderTestLaunchReadiness({
    rootDir,
    founderTestAssessment,
    skipChatStressSimulation: true,
    skipProductReadinessSimulation: true,
    skipAutonomousBuildExecutionProof: true,
    skipHistoryRecording: true,
  });

  const connectedVerificationAssessment =
    input.connectedVerificationAssessment ??
    assessConnectedVerification({
      rootDir,
      connectedLivePreviewAssessment,
      founderTestAssessment,
      founderTestLaunchReadinessAssessment: stubLaunchReadiness,
    });

  return {
    founderTestAssessment,
    connectedBuildFoundationAssessment,
    connectedRuntimeActivationAssessment,
    connectedLivePreviewAssessment,
    connectedVerificationAssessment,
  };
}

function buildInputSnapshot(
  resolved: ReturnType<typeof resolveAssessments>,
  requirementsToPlanContract: RequirementsToPlanContractReport | null,
  connectedBuildMaterialization: ConnectedBuildExecutionReport | null,
  connectedRuntimeActivationProof: RuntimeActivationProofReport | null,
  connectedPreviewExperienceProof: PreviewExperienceProofReport | null,
  connectedVerificationExecutionProof: VerificationExecutionProofReport | null,
  connectedLaunchReadinessProof: LaunchReadinessProofReport | null,
): AutonomousBuildExecutionProofInputSnapshot {
  const missingAuthorities = dedupeStrings([
    ...resolved.connectedBuildFoundationAssessment.report.inputSnapshot.missingAuthorities,
    ...resolved.connectedRuntimeActivationAssessment.report.inputSnapshot.missingAuthorities,
    ...resolved.connectedLivePreviewAssessment.report.inputSnapshot.missingAuthorities,
    ...resolved.connectedVerificationAssessment.report.inputSnapshot.missingAuthorities,
  ]);

  return {
    readOnly: true,
    ...resolved,
    connectedBuildMaterialization,
    connectedRuntimeActivationProof,
    connectedPreviewExperienceProof,
    connectedVerificationExecutionProof,
    connectedLaunchReadinessProof,
    requirementsToPlanContract,
    missingAuthorities,
  };
}

function buildFounderQuestions(
  stageProofs: StageExecutionProof[],
  chainConnected: boolean,
  firstBrokenStage: AutonomousBuildExecutionProofReport['firstBrokenStage'],
): FounderExecutionProofQuestions {
  const byStage = new Map(stageProofs.map((s) => [s.stage, s]));
  const isProven = (stage: StageExecutionProof['stage']) =>
    byStage.get(stage)?.proofLevel === 'PROVEN';

  const missingEvidenceSummary = dedupeStrings(
    stageProofs.flatMap((s) => s.missingEvidence),
  ).slice(0, MAX_MISSING_EVIDENCE);

  const mustBuildNext = dedupeStrings([
    ...(firstBrokenStage
      ? [byStage.get(firstBrokenStage)?.recommendedFix ?? `Fix ${firstBrokenStage} stage proof`]
      : []),
    ...stageProofs
      .filter((s) => s.proofLevel === 'NOT_PROVEN')
      .map((s) => s.recommendedFix),
  ]).slice(0, MAX_RECOMMENDED_ACTIONS);

  return {
    readOnly: true,
    canActuallyBuildSoftware: isProven('BUILD'),
    canActuallyRunSoftware: isProven('RUNTIME'),
    canActuallyPreviewSoftware: isProven('PREVIEW'),
    canActuallyVerifySoftware: isProven('VERIFY'),
    canFounderGoFromIdeaToLaunch: chainConnected && isProven('LAUNCH'),
    exactBreakStage: firstBrokenStage,
    missingEvidenceSummary,
    mustBuildNext,
  };
}

export function assessAutonomousBuildExecutionProof(
  input: AssessAutonomousBuildExecutionProofInput = {},
): AutonomousBuildExecutionProofAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const resolved = resolveAssessments(input, rootDir);

  const requirementsToPlanContract =
    input.requirementsToPlanContract ??
    assessRequirementsToPlanExecutionContract({
      rawPrompt: input.rawPrompt ?? EXECUTION_PROOF_REFERENCE_PROMPT,
    }).report;

  const connectedBuildMaterialization =
    input.connectedBuildMaterialization ??
    assessConnectedBuildExecution({
      rootDir,
      buildReadyContract: requirementsToPlanContract.buildReadyContract,
      observedEvidence: input.observedBuildEvidence,
    }).report;

  const connectedRuntimeActivationProof =
    input.connectedRuntimeActivationProof ??
    assessConnectedRuntimeActivationProof({
      rootDir,
      buildMaterializationReport: connectedBuildMaterialization,
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

  const inputSnapshotBase = buildInputSnapshot(
    resolved,
    requirementsToPlanContract,
    connectedBuildMaterialization,
    connectedRuntimeActivationProof,
    connectedPreviewExperienceProof,
    connectedVerificationExecutionProof,
    null,
  );

  const requirements = analyzeRequirementsStage(
    requirementsToPlanContract,
    inputSnapshotBase.founderTestAssessment,
  );
  const plan = analyzePlanStage(
    requirementsToPlanContract,
    inputSnapshotBase.connectedBuildFoundationAssessment,
  );
  const build = analyzeBuildStage(inputSnapshotBase.connectedBuildMaterialization);
  const runtime = analyzeRuntimeStage(inputSnapshotBase.connectedRuntimeActivationProof);
  const preview = analyzePreviewStage(inputSnapshotBase.connectedPreviewExperienceProof);
  const verify = analyzeVerificationStage(inputSnapshotBase.connectedVerificationExecutionProof);

  const chainLinksCore = buildChainLinks({
    requirements,
    plan,
    build,
    runtime,
    preview,
    verify,
    buildAssessment: inputSnapshotBase.connectedBuildFoundationAssessment,
    runtimeAssessment: inputSnapshotBase.connectedRuntimeActivationAssessment,
    previewAssessment: inputSnapshotBase.connectedLivePreviewAssessment,
    verificationAssessment: inputSnapshotBase.connectedVerificationAssessment,
    contractReport: requirementsToPlanContract,
  });

  const coreChainAnalysis = analyzeExecutionChain({
    stageProofs: [requirements, plan, build, runtime, preview, verify],
    chainLinks: chainLinksCore,
    chainMode: 'core',
  });

  const coreChainConnected =
    CORE_CHAIN_STAGES.every(
      (stage) =>
        [requirements, plan, build, runtime, preview, verify].find((s) => s.stage === stage)
          ?.proofLevel === 'PROVEN',
    ) && chainLinksCore.every((l) => l.connected);

  const connectedLaunchReadinessProof =
    input.connectedLaunchReadinessProof ??
    assessConnectedLaunchReadinessProof({
      rootDir,
      verificationExecutionProof: connectedVerificationExecutionProof,
      founderTestAssessment: inputSnapshotBase.founderTestAssessment,
      coreStageProofs: [requirements, plan, build, runtime, preview, verify],
      coreChainConnected,
      coreFirstBrokenStage:
        coreChainAnalysis.firstBrokenStage === 'LAUNCH'
          ? null
          : coreChainAnalysis.firstBrokenStage,
      launchReadinessFixture: input.launchReadinessFixture,
    }).report;

  const launch = analyzeLaunchStage(connectedLaunchReadinessProof);

  const chainLinksFull = buildChainLinks({
    requirements,
    plan,
    build,
    runtime,
    preview,
    verify,
    launch,
    buildAssessment: inputSnapshotBase.connectedBuildFoundationAssessment,
    runtimeAssessment: inputSnapshotBase.connectedRuntimeActivationAssessment,
    previewAssessment: inputSnapshotBase.connectedLivePreviewAssessment,
    verificationAssessment: inputSnapshotBase.connectedVerificationAssessment,
    contractReport: requirementsToPlanContract,
  });

  const chainAnalysis = analyzeExecutionChain({
    stageProofs: [requirements, plan, build, runtime, preview, verify, launch],
    chainLinks: chainLinksFull,
    chainMode: 'full',
  });

  const inputSnapshot = buildInputSnapshot(
    resolved,
    requirementsToPlanContract,
    connectedBuildMaterialization,
    connectedRuntimeActivationProof,
    connectedPreviewExperienceProof,
    connectedVerificationExecutionProof,
    connectedLaunchReadinessProof,
  );

  const stageProofs = applyDownstreamBlocking([
    requirements,
    plan,
    build,
    runtime,
    preview,
    verify,
    launch,
  ]);

  const founderQuestions = buildFounderQuestions(
    stageProofs,
    chainAnalysis.chainConnected,
    chainAnalysis.firstBrokenStage,
  );

  const missingEvidence = dedupeStrings([
    ...chainAnalysis.missingLinks,
    ...founderQuestions.missingEvidenceSummary,
  ]).slice(0, MAX_MISSING_EVIDENCE);

  const launchBlockedByChain = !chainAnalysis.chainConnected;
  const launchImpact = launchBlockedByChain
    ? 'Launch readiness cannot exceed NOT_LAUNCH_READY — execution chain is not connected with proven evidence.'
    : 'Core execution chain connected — launch may proceed subject to other Founder Test gates.';

  const recommendedFix =
    chainAnalysis.firstBrokenStage !== null
      ? stageProofs.find((s) => s.stage === chainAnalysis.firstBrokenStage)?.recommendedFix ??
        `Prove ${chainAnalysis.firstBrokenStage} with connected evidence before launch claims.`
      : 'Maintain connected execution proof across all stages.';

  const recommendedNextActions = dedupeStrings([
    recommendedFix,
    ...founderQuestions.mustBuildNext,
    ...stageProofs.filter((s) => s.proofLevel !== 'PROVEN').map((s) => s.recommendedFix),
  ]).slice(0, MAX_RECOMMENDED_ACTIONS);

  const proofId = nextProofId();
  const report: AutonomousBuildExecutionProofReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: AUTONOMOUS_BUILD_EXECUTION_PROOF_CORE_QUESTION,
    proofId,
    generatedAt: new Date().toISOString(),
    chainConnected: chainAnalysis.chainConnected,
    firstBrokenStage: chainAnalysis.firstBrokenStage,
    launchBlockedByChain,
    stageProofs,
    chainAnalysis,
    founderQuestions,
    missingEvidence,
    launchImpact,
    recommendedFix,
    recommendedNextActions,
    inputSnapshot,
    cacheKey: stableCacheKey(proofId, chainAnalysis.chainConnected),
  };

  const assessment: AutonomousBuildExecutionProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'EXECUTION_PROOF_COMPLETE',
    report,
  };

  recordAutonomousBuildExecutionProofAssessment(assessment);
  return assessment;
}

export function buildAutonomousBuildExecutionProofArtifacts(
  input: AssessAutonomousBuildExecutionProofInput = {},
): AutonomousBuildExecutionProofArtifacts {
  const autonomousBuildExecutionProofAssessment = assessAutonomousBuildExecutionProof(input);
  return {
    autonomousBuildExecutionProofAssessment,
    autonomousBuildExecutionProofReportMarkdown: buildAutonomousBuildExecutionProofReportMarkdown(
      autonomousBuildExecutionProofAssessment.report,
    ),
  };
}

export function resetAutonomousBuildExecutionProofModuleForTests(): void {
  resetAutonomousBuildExecutionProofCounterForTests();
  resetFounderTestIntegrationModuleForTests();
}
