/**
 * End-to-End Execution Proof Chain — connected execution proof authority.
 * Read-only orchestration — consumes foundation chain authorities only.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedVerification,
  resetConnectedVerificationModuleForTests,
} from '../connected-verification-foundation/index.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import { resetConnectedLivePreviewModuleForTests } from '../connected-live-preview-foundation/index.js';
import { resetConnectedRuntimeActivationModuleForTests } from '../connected-runtime-activation-foundation/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../connected-build-execution-foundation/index.js';
import { resetFounderTestLaunchReadinessModuleForTests } from '../founder-test-launch-readiness/index.js';
import type { ExecutionProofAssessment } from '../execution-proof-evolution/execution-proof-types.js';
import {
  recordEndToEndExecutionProofAssessment,
  resetEndToEndExecutionProofHistoryForTests,
} from './end-to-end-execution-proof-history.js';
import { buildEndToEndExecutionProofReportMarkdown } from './end-to-end-execution-proof-report-builder.js';
import {
  END_TO_END_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
  END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN,
  MAX_CHAIN_GAPS,
  MAX_CONFIDENCE_FACTORS,
  MAX_PROOF_ARTIFACTS,
  MAX_RECOMMENDED_ACTIONS,
} from './end-to-end-execution-proof-registry.js';
import type {
  AssessEndToEndExecutionProofInput,
  ChainGapEntry,
  ConfidenceFactorEntry,
  EndToEndExecutionProofArtifacts,
  EndToEndExecutionProofAssessment,
  EndToEndExecutionProofBundle,
  EndToEndExecutionProofInputSnapshot,
  EndToEndExecutionProofReport,
  EndToEndProofQuestionAnswers,
  EndToEndProofState,
  ProofArtifactEntry,
  StageProofSummary,
} from './end-to-end-execution-proof-types.js';

let proofChainCounter = 0;

export function resetEndToEndExecutionProofCounterForTests(): void {
  proofChainCounter = 0;
}

function nextProofChainId(): string {
  proofChainCounter += 1;
  return `end-to-end-execution-proof-${proofChainCounter}`;
}

function stableCacheKey(proofChainId: string, state: EndToEndProofState, score: number): string {
  const digest = createHash('sha256')
    .update([END_TO_END_EXECUTION_PROOF_CHAIN_PASS_TOKEN, proofChainId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${END_TO_END_EXECUTION_PROOF_CACHE_KEY_PREFIX}:${digest}`;
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

function resolveExecutionProof(
  snapshot: EndToEndExecutionProofInputSnapshot,
  injected: ExecutionProofAssessment | null | undefined,
): ExecutionProofAssessment | null {
  if (injected !== undefined) return injected;
  return (
    snapshot.connectedBuildExecutionAssessment.report.inputSnapshot.executionPlannerAssessment
      .inputSnapshot.executionProofAssessment ?? null
  );
}

function resolveAssessments(input: AssessEndToEndExecutionProofInput): {
  connectedVerificationAssessment: ConnectedVerificationAssessment;
} {
  const connectedVerificationAssessment =
    input.connectedVerificationAssessment ??
    assessConnectedVerification({
      rootDir: input.rootDir ?? process.cwd(),
      founderTestAssessment: input.founderTestAssessment,
    });

  return { connectedVerificationAssessment };
}

function buildInputSnapshot(
  connectedVerificationAssessment: ConnectedVerificationAssessment,
  executionProofAssessment: ExecutionProofAssessment | null | undefined,
): EndToEndExecutionProofInputSnapshot {
  const verificationSnapshot = connectedVerificationAssessment.report.inputSnapshot;
  const previewSnapshot = verificationSnapshot.connectedLivePreviewAssessment.report.inputSnapshot;
  const runtimeSnapshot = previewSnapshot.connectedRuntimeActivationAssessment.report.inputSnapshot;
  const launchSnapshot =
    verificationSnapshot.founderTestLaunchReadinessAssessment.report.inputSnapshot;

  const missingAuthorities = dedupeStrings([
    ...verificationSnapshot.missingAuthorities,
    ...previewSnapshot.missingAuthorities,
    ...runtimeSnapshot.missingAuthorities,
    ...runtimeSnapshot.connectedBuildExecutionAssessment.report.inputSnapshot.missingAuthorities,
  ]);

  const snapshot: EndToEndExecutionProofInputSnapshot = {
    readOnly: true,
    connectedBuildExecutionAssessment: runtimeSnapshot.connectedBuildExecutionAssessment,
    connectedRuntimeActivationAssessment: previewSnapshot.connectedRuntimeActivationAssessment,
    connectedLivePreviewAssessment: verificationSnapshot.connectedLivePreviewAssessment,
    connectedVerificationAssessment,
    executionProofAssessment: null,
    founderTestLaunchReadinessAssessment: verificationSnapshot.founderTestLaunchReadinessAssessment,
    founderAcceptanceAssessment: launchSnapshot.founderAcceptanceAssessment,
    launchCouncilAssessment: launchSnapshot.launchCouncilAssessment,
    missingAuthorities,
  };

  snapshot.executionProofAssessment = resolveExecutionProof(snapshot, executionProofAssessment);
  return snapshot;
}

function buildStageProof(
  stage: StageProofSummary['stage'],
  state: string,
  score: number,
  proven: boolean,
  connectionId: string,
  sourceAuthority: string,
): StageProofSummary {
  return { readOnly: true, stage, state, score, proven, connectionId, sourceAuthority };
}

function buildChainGaps(snapshot: EndToEndExecutionProofInputSnapshot): ChainGapEntry[] {
  const gaps: ChainGapEntry[] = [];
  const buildReport = snapshot.connectedBuildExecutionAssessment.report;
  const runtimeReport = snapshot.connectedRuntimeActivationAssessment.report;
  const previewReport = snapshot.connectedLivePreviewAssessment.report;
  const verificationReport = snapshot.connectedVerificationAssessment.report;

  const buildManifestId = buildReport.buildOutputManifest.manifestId;
  const runtimeManifestId = runtimeReport.runtimeActivationCandidate.buildOutputManifestId;
  if (buildManifestId !== runtimeManifestId) {
    gaps.push({
      readOnly: true,
      gapId: 'gap-build-runtime',
      fromStage: 'BUILD',
      toStage: 'RUNTIME',
      detail: `Manifest linkage mismatch: ${buildManifestId} → ${runtimeManifestId}`,
    });
  }

  const runtimeContractId = runtimeReport.runtimeActivationContract.contractId;
  const previewRuntimeContractId = previewReport.previewCandidate.runtimeActivationContractId;
  if (runtimeContractId !== previewRuntimeContractId) {
    gaps.push({
      readOnly: true,
      gapId: 'gap-runtime-preview',
      fromStage: 'RUNTIME',
      toStage: 'PREVIEW',
      detail: `Contract linkage mismatch: ${runtimeContractId} → ${previewRuntimeContractId}`,
    });
  }

  const previewContractId = previewReport.previewReadinessContract.contractId;
  const verificationPreviewContractId =
    verificationReport.verificationCandidate.previewReadinessContractId;
  if (previewContractId !== verificationPreviewContractId) {
    gaps.push({
      readOnly: true,
      gapId: 'gap-preview-verification',
      fromStage: 'PREVIEW',
      toStage: 'VERIFICATION',
      detail: `Contract linkage mismatch: ${previewContractId} → ${verificationPreviewContractId}`,
    });
  }

  const workspaceIds = [
    buildReport.buildOutputManifest.workspaceId,
    runtimeReport.runtimeActivationCandidate.workspaceId,
    previewReport.previewCandidate.workspaceId,
    verificationReport.verificationCandidate.workspaceId,
  ];
  const uniqueWorkspaceIds = new Set(workspaceIds);
  if (uniqueWorkspaceIds.size > 1) {
    gaps.push({
      readOnly: true,
      gapId: 'gap-workspace-id',
      fromStage: 'BUILD',
      toStage: 'VERIFICATION',
      detail: `Workspace ID mismatch across chain: ${workspaceIds.join(' → ')}`,
    });
  }

  return gaps.slice(0, MAX_CHAIN_GAPS);
}

export function buildEndToEndExecutionProofBundle(
  snapshot: EndToEndExecutionProofInputSnapshot,
): EndToEndExecutionProofBundle {
  const buildReport = snapshot.connectedBuildExecutionAssessment.report;
  const runtimeReport = snapshot.connectedRuntimeActivationAssessment.report;
  const previewReport = snapshot.connectedLivePreviewAssessment.report;
  const verificationReport = snapshot.connectedVerificationAssessment.report;

  const buildProof = buildStageProof(
    'BUILD',
    buildReport.buildOutputState,
    buildReport.buildOutputScore,
    buildReport.buildOutputState === 'BUILD_OUTPUT_PROVEN',
    buildReport.connectionId,
    'connected-build-execution-foundation',
  );

  const runtimeProof = buildStageProof(
    'RUNTIME',
    runtimeReport.runtimeState,
    runtimeReport.runtimeReadinessScore,
    runtimeReport.runtimeState === 'RUNTIME_READY',
    runtimeReport.activationId,
    'connected-runtime-activation-foundation',
  );

  const previewProof = buildStageProof(
    'PREVIEW',
    previewReport.previewState,
    previewReport.previewReadinessScore,
    previewReport.previewState === 'PREVIEW_READY',
    previewReport.previewConnectionId,
    'connected-live-preview-foundation',
  );

  const verificationProof = buildStageProof(
    'VERIFICATION',
    verificationReport.verificationState,
    verificationReport.verificationReadinessScore,
    verificationReport.verificationState === 'VERIFICATION_READY',
    verificationReport.verificationConnectionId,
    'connected-verification-foundation',
  );

  const chainGaps = buildChainGaps(snapshot);
  const chainLinks = 3;
  const connectedLinks = Math.max(0, chainLinks - chainGaps.length);
  const chainCompleteness = Math.round((connectedLinks / chainLinks) * 100);

  const blockingStages: string[] = [];
  const warningStages: string[] = [];

  if (buildReport.buildOutputState === 'BUILD_OUTPUT_BLOCKED') blockingStages.push('BUILD');
  if (runtimeReport.runtimeState === 'RUNTIME_BLOCKED') blockingStages.push('RUNTIME');
  if (previewReport.previewState === 'PREVIEW_BLOCKED') blockingStages.push('PREVIEW');
  if (verificationReport.verificationState === 'VERIFICATION_BLOCKED') blockingStages.push('VERIFICATION');

  if (buildReport.buildOutputState === 'BUILD_OUTPUT_PARTIALLY_PROVEN') warningStages.push('BUILD');
  if (runtimeReport.runtimeState === 'RUNTIME_READY_WITH_WARNINGS') warningStages.push('RUNTIME');
  if (previewReport.previewState === 'PREVIEW_READY_WITH_WARNINGS') warningStages.push('PREVIEW');
  if (verificationReport.verificationState === 'VERIFICATION_READY_WITH_WARNINGS') {
    warningStages.push('VERIFICATION');
  }

  const proofArtifacts: ProofArtifactEntry[] = [];
  for (const artifact of buildReport.buildOutputManifest.proofArtifacts.slice(0, 6)) {
    proofArtifacts.push({
      readOnly: true,
      name: artifact.name,
      category: artifact.category,
      sourceAuthority: artifact.sourceAuthority,
      stage: 'BUILD',
    });
  }
  for (const artifact of runtimeReport.runtimeActivationContract.proofArtifacts.slice(0, 6)) {
    proofArtifacts.push({
      readOnly: true,
      name: artifact.name,
      category: artifact.category,
      sourceAuthority: artifact.sourceAuthority,
      stage: 'RUNTIME',
    });
  }
  for (const artifact of previewReport.previewReadinessContract.proofArtifacts.slice(0, 6)) {
    proofArtifacts.push({
      readOnly: true,
      name: artifact.name,
      category: artifact.category,
      sourceAuthority: artifact.sourceAuthority,
      stage: 'PREVIEW',
    });
  }
  for (const artifact of verificationReport.verificationReadinessContract.proofArtifacts.slice(0, 6)) {
    proofArtifacts.push({
      readOnly: true,
      name: artifact.name,
      category: artifact.category,
      sourceAuthority: artifact.sourceAuthority,
      stage: 'VERIFICATION',
    });
  }

  const confidenceFactors: ConfidenceFactorEntry[] = [
    {
      readOnly: true,
      factorId: 'build-score',
      label: 'Build output score',
      weight: 0.25,
      detail: `${buildReport.buildOutputScore}/100`,
      sourceAuthority: 'connected-build-execution-foundation',
    },
    {
      readOnly: true,
      factorId: 'runtime-score',
      label: 'Runtime readiness score',
      weight: 0.25,
      detail: `${runtimeReport.runtimeReadinessScore}/100`,
      sourceAuthority: 'connected-runtime-activation-foundation',
    },
    {
      readOnly: true,
      factorId: 'preview-score',
      label: 'Preview readiness score',
      weight: 0.25,
      detail: `${previewReport.previewReadinessScore}/100`,
      sourceAuthority: 'connected-live-preview-foundation',
    },
    {
      readOnly: true,
      factorId: 'verification-score',
      label: 'Verification readiness score',
      weight: 0.25,
      detail: `${verificationReport.verificationReadinessScore}/100`,
      sourceAuthority: 'connected-verification-foundation',
    },
  ];

  if (snapshot.executionProofAssessment) {
    confidenceFactors.push({
      readOnly: true,
      factorId: 'execution-proof',
      label: 'Execution proof evolution',
      weight: 0.15,
      detail: `${snapshot.executionProofAssessment.verdict} (${snapshot.executionProofAssessment.executionProofScore}/100)`,
      sourceAuthority: 'execution-proof-evolution',
    });
  }

  confidenceFactors.push({
    readOnly: true,
    factorId: 'founder-acceptance',
    label: 'Founder acceptance gate',
    weight: 0.1,
    detail: snapshot.founderAcceptanceAssessment.acceptanceState,
    sourceAuthority: 'founder-acceptance-gate',
  });

  confidenceFactors.push({
    readOnly: true,
    factorId: 'launch-council',
    label: 'Launch council verdict',
    weight: 0.1,
    detail: snapshot.launchCouncilAssessment.readinessState,
    sourceAuthority: 'launch-council',
  });

  return {
    readOnly: true,
    buildProof,
    runtimeProof,
    previewProof,
    verificationProof,
    chainCompleteness,
    chainGaps,
    blockingStages,
    warningStages,
    proofArtifacts: proofArtifacts.slice(0, MAX_PROOF_ARTIFACTS),
    confidenceFactors: confidenceFactors.slice(0, MAX_CONFIDENCE_FACTORS),
    realExecutionPerformed: false,
  };
}

export function deriveEndToEndProofQuestionAnswers(
  snapshot: EndToEndExecutionProofInputSnapshot,
  bundle: EndToEndExecutionProofBundle,
): EndToEndProofQuestionAnswers {
  const buildAnswers = snapshot.connectedBuildExecutionAssessment.report.questionAnswers;
  const runtimeAnswers = snapshot.connectedRuntimeActivationAssessment.report.questionAnswers;
  const previewAnswers = snapshot.connectedLivePreviewAssessment.report.questionAnswers;
  const verificationAnswers = snapshot.connectedVerificationAssessment.report.questionAnswers;

  const buildOutputProven = bundle.buildProof.proven;
  const runtimeReadinessProven = bundle.runtimeProof.proven;
  const previewReadinessProven = bundle.previewProof.proven;
  const verificationReadinessProven = bundle.verificationProof.proven;

  const allStagesConnected =
    bundle.chainGaps.length === 0 &&
    bundle.buildProof.connectionId.length > 0 &&
    bundle.runtimeProof.connectionId.length > 0 &&
    bundle.previewProof.connectionId.length > 0 &&
    bundle.verificationProof.connectionId.length > 0;

  const allStagesTraceable =
    buildAnswers.outputsTraceable &&
    runtimeAnswers.runtimeActivationTraceable &&
    previewAnswers.previewReadinessTraceable &&
    verificationAnswers.verificationTraceable;

  const allStagesReproducible =
    buildAnswers.outputsReproducible &&
    runtimeAnswers.runtimeActivationReproducible &&
    previewAnswers.previewActivationReproducible &&
    verificationAnswers.verificationReproducible;

  const founderInspectable =
    buildAnswers.founderInspectable &&
    runtimeAnswers.founderInspectable &&
    previewAnswers.founderInspectable &&
    verificationAnswers.founderInspectable;

  const executionConfidenceMeasurable =
    bundle.confidenceFactors.length >= 4 &&
    bundle.chainCompleteness >= 0 &&
    snapshot.founderTestLaunchReadinessAssessment.report.founderReadinessScore >= 0;

  const connectedExecutionProven =
    buildOutputProven &&
    runtimeReadinessProven &&
    previewReadinessProven &&
    verificationReadinessProven &&
    allStagesConnected &&
    allStagesTraceable &&
    allStagesReproducible &&
    founderInspectable &&
    executionConfidenceMeasurable &&
    snapshot.connectedBuildExecutionAssessment.report.buildOutputState === 'BUILD_OUTPUT_PROVEN' &&
    snapshot.connectedRuntimeActivationAssessment.report.runtimeState === 'RUNTIME_READY' &&
    snapshot.connectedLivePreviewAssessment.report.previewState === 'PREVIEW_READY' &&
    snapshot.connectedVerificationAssessment.report.verificationState === 'VERIFICATION_READY';

  return {
    buildOutputProven,
    runtimeReadinessProven,
    previewReadinessProven,
    verificationReadinessProven,
    allStagesConnected,
    allStagesTraceable,
    allStagesReproducible,
    founderInspectable,
    executionConfidenceMeasurable,
    connectedExecutionProven,
  };
}

export function deriveConnectedExecutionScore(answers: EndToEndProofQuestionAnswers): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

export function deriveExecutionConfidence(bundle: EndToEndExecutionProofBundle): number {
  const stageScores = [
    bundle.buildProof.score,
    bundle.runtimeProof.score,
    bundle.previewProof.score,
    bundle.verificationProof.score,
  ];
  const avgStage = stageScores.reduce((sum, score) => sum + score, 0) / stageScores.length;
  const chainWeight = bundle.chainCompleteness / 100;
  return Math.round(avgStage * 0.85 + chainWeight * 15);
}

export function deriveEndToEndProofState(
  snapshot: EndToEndExecutionProofInputSnapshot,
  answers: EndToEndProofQuestionAnswers,
  bundle: EndToEndExecutionProofBundle,
): EndToEndProofState {
  if (snapshot.missingAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    bundle.blockingStages.length > 0 ||
    snapshot.connectedBuildExecutionAssessment.report.buildOutputState === 'BUILD_OUTPUT_BLOCKED' ||
    snapshot.connectedRuntimeActivationAssessment.report.runtimeState === 'RUNTIME_BLOCKED' ||
    snapshot.connectedLivePreviewAssessment.report.previewState === 'PREVIEW_BLOCKED' ||
    snapshot.connectedVerificationAssessment.report.verificationState === 'VERIFICATION_BLOCKED'
  ) {
    return 'END_TO_END_BLOCKED';
  }

  if (
    snapshot.connectedBuildExecutionAssessment.report.buildOutputState === 'INSUFFICIENT_EVIDENCE' ||
    snapshot.executionProofAssessment?.verdict === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (answers.connectedExecutionProven) {
    return 'END_TO_END_PROVEN';
  }

  const verificationState = snapshot.connectedVerificationAssessment.report.verificationState;
  const buildState = snapshot.connectedBuildExecutionAssessment.report.buildOutputState;

  const hasWarningSignals =
    bundle.warningStages.length > 0 ||
    verificationState === 'VERIFICATION_READY_WITH_WARNINGS';

  const hasConnectedProgress =
    buildState === 'BUILD_OUTPUT_PROVEN' || buildState === 'BUILD_OUTPUT_PARTIALLY_PROVEN';

  const hasVerificationProgress =
    verificationState === 'VERIFICATION_READY' ||
    verificationState === 'VERIFICATION_READY_WITH_WARNINGS';

  if (hasWarningSignals && hasConnectedProgress && hasVerificationProgress) {
    return 'END_TO_END_PARTIALLY_PROVEN';
  }

  return 'END_TO_END_NOT_PROVEN';
}

function buildMissingChainLinks(
  snapshot: EndToEndExecutionProofInputSnapshot,
  bundle: EndToEndExecutionProofBundle,
  answers: EndToEndProofQuestionAnswers,
): string[] {
  const missing: string[] = [];
  if (!answers.buildOutputProven) missing.push('Build output proof');
  if (!answers.runtimeReadinessProven) missing.push('Runtime readiness proof');
  if (!answers.previewReadinessProven) missing.push('Preview readiness proof');
  if (!answers.verificationReadinessProven) missing.push('Verification readiness proof');
  if (!answers.allStagesConnected) missing.push('Connected stage linkage');
  if (!answers.allStagesTraceable) missing.push('Traceable chain across stages');
  if (!answers.allStagesReproducible) missing.push('Reproducible chain across stages');
  for (const gap of bundle.chainGaps) {
    missing.push(`${gap.fromStage}→${gap.toStage}: ${gap.detail}`);
  }
  for (const authority of snapshot.missingAuthorities) {
    missing.push(`Missing authority: ${authority}`);
  }
  return dedupeStrings(missing).slice(0, MAX_CHAIN_GAPS);
}

function buildRecommendedActions(
  snapshot: EndToEndExecutionProofInputSnapshot,
  state: EndToEndProofState,
): string[] {
  const actions: string[] = [];
  if (state === 'END_TO_END_PROVEN') {
    actions.push('Maintain end-to-end chain traceability before any real execution phase.');
  }
  if (state === 'END_TO_END_PARTIALLY_PROVEN') {
    actions.push('Resolve warning-level gaps across build, runtime, preview, and verification stages.');
  }
  if (state === 'END_TO_END_NOT_PROVEN') {
    actions.push('Complete all four connected foundation stages before claiming end-to-end proof.');
  }
  if (state === 'END_TO_END_BLOCKED') {
    actions.push('Clear blockers in the earliest blocked stage of the execution proof chain.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before claiming connected execution proof.');
  }
  actions.push(...snapshot.connectedVerificationAssessment.report.recommendedNextActions);
  actions.push(...snapshot.launchCouncilAssessment.recommendations.slice(0, 3));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export function assessEndToEndExecutionProofChain(
  input: AssessEndToEndExecutionProofInput = {},
): EndToEndExecutionProofAssessment {
  const { connectedVerificationAssessment } = resolveAssessments(input);
  const inputSnapshot = buildInputSnapshot(
    connectedVerificationAssessment,
    input.executionProofAssessment,
  );
  const proofBundle = buildEndToEndExecutionProofBundle(inputSnapshot);
  const questionAnswers = deriveEndToEndProofQuestionAnswers(inputSnapshot, proofBundle);
  const connectedExecutionScore = deriveConnectedExecutionScore(questionAnswers);
  const proofState = deriveEndToEndProofState(inputSnapshot, questionAnswers, proofBundle);
  const proofChainId = nextProofChainId();

  const blockingReasons = dedupeStrings([
    ...inputSnapshot.connectedVerificationAssessment.report.blockingReasons,
    ...proofBundle.blockingStages.map((stage) => `Blocked stage: ${stage}`),
    ...inputSnapshot.founderAcceptanceAssessment.reasons.blockingReasons,
  ]);

  const warningReasons = dedupeStrings([
    ...inputSnapshot.connectedVerificationAssessment.report.warningReasons,
    ...proofBundle.warningStages.map((stage) => `Warning stage: ${stage}`),
    ...inputSnapshot.founderAcceptanceAssessment.reasons.warningReasons,
  ]);

  const report: EndToEndExecutionProofReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: END_TO_END_EXECUTION_PROOF_CORE_QUESTION,
    proofChainId,
    generatedAt: new Date().toISOString(),
    connectedExecutionScore,
    proofState,
    chainCompletenessPercent: proofBundle.chainCompleteness,
    executionConfidence: deriveExecutionConfidence(proofBundle),
    missingChainLinks: buildMissingChainLinks(inputSnapshot, proofBundle, questionAnswers),
    blockingStages: [...proofBundle.blockingStages],
    warningStages: [...proofBundle.warningStages],
    recommendedNextActions: buildRecommendedActions(inputSnapshot, proofState),
    questionAnswers,
    proofBundle,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(proofChainId, proofState, connectedExecutionScore),
  };

  const assessment: EndToEndExecutionProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'END_TO_END_PROOF_COMPLETE',
    report,
  };

  recordEndToEndExecutionProofAssessment(assessment);
  return assessment;
}

export function buildEndToEndExecutionProofArtifacts(
  input: AssessEndToEndExecutionProofInput = {},
): EndToEndExecutionProofArtifacts {
  const endToEndExecutionProofAssessment = assessEndToEndExecutionProofChain(input);
  return {
    endToEndExecutionProofAssessment,
    endToEndExecutionProofReportMarkdown: buildEndToEndExecutionProofReportMarkdown(
      endToEndExecutionProofAssessment.report,
    ),
  };
}

export function resetEndToEndExecutionProofModuleForTests(): void {
  resetEndToEndExecutionProofHistoryForTests();
  resetEndToEndExecutionProofCounterForTests();
  resetConnectedVerificationModuleForTests();
  resetConnectedLivePreviewModuleForTests();
  resetConnectedRuntimeActivationModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetFounderTestLaunchReadinessModuleForTests();
}
