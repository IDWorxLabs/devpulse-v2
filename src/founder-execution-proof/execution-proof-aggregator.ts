/**
 * Founder Execution Proof — read-only evidence aggregation.
 * Derives scores from real execution assessment contracts only.
 */

import type {
  AssessFounderExecutionProofInput,
  ExecutionChainEvidenceSummary,
  ExecutionCompletenessBreakdown,
  FounderExecutionProofBundle,
  FounderExecutionProofInputSnapshot,
  FounderExecutionProofQuestionAnswers,
  LaunchEvidenceSummary,
  ProofArtifactEntry,
  StageExecutionEvidence,
} from './founder-execution-proof-types.js';
import {
  MAX_PROOF_ARTIFACTS,
  MAX_PROOF_BLOCKERS,
  MAX_PROOF_WARNINGS,
} from './founder-execution-proof-registry.js';
import type { ConnectedLivePreviewExecutionAssessment } from '../connected-live-preview-execution/connected-live-preview-execution-types.js';
import type { ConnectedRuntimeExecutionAssessment } from '../connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedVerificationExecutionAssessment } from '../connected-verification-execution/connected-verification-execution-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../connected-workspace-creation/connected-workspace-creation-types.js';
import type { FounderExecutionChainAssessment } from '../founder-test-execution-chain-integration/founder-test-execution-chain-integration-types.js';
import type { FounderTestLaunchReadinessAssessment } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import {
  buildFounderExecutionProofBundleRecursionFallback,
  runWithAuthorityGuard,
} from '../authority-recursion-guard/index.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
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

function hasWarningsState(state: string): boolean {
  return state.includes('_WITH_WARNINGS') || state.includes('PARTIALLY');
}

function resolveWorkspaceAssessment(
  input: AssessFounderExecutionProofInput,
  runtime: ConnectedRuntimeExecutionAssessment | null,
  preview: ConnectedLivePreviewExecutionAssessment | null,
  verification: ConnectedVerificationExecutionAssessment | null,
): ConnectedWorkspaceCreationAssessment | null {
  if (input.connectedWorkspaceCreationAssessment) {
    return input.connectedWorkspaceCreationAssessment;
  }
  return (
    verification?.report.inputSnapshot.connectedWorkspaceCreationAssessment ??
    preview?.report.inputSnapshot.connectedWorkspaceCreationAssessment ??
    runtime?.report.inputSnapshot.connectedWorkspaceCreationAssessment ??
    null
  );
}

function resolveRuntimeAssessment(
  input: AssessFounderExecutionProofInput,
  preview: ConnectedLivePreviewExecutionAssessment | null,
  verification: ConnectedVerificationExecutionAssessment | null,
): ConnectedRuntimeExecutionAssessment | null {
  if (input.connectedRuntimeExecutionAssessment) {
    return input.connectedRuntimeExecutionAssessment;
  }
  return (
    verification?.report.inputSnapshot.connectedRuntimeExecutionAssessment ??
    preview?.report.inputSnapshot.connectedRuntimeExecutionAssessment ??
    null
  );
}

function resolvePreviewAssessment(
  input: AssessFounderExecutionProofInput,
  verification: ConnectedVerificationExecutionAssessment | null,
): ConnectedLivePreviewExecutionAssessment | null {
  if (input.connectedLivePreviewExecutionAssessment) {
    return input.connectedLivePreviewExecutionAssessment;
  }
  return verification?.report.inputSnapshot.connectedLivePreviewExecutionAssessment ?? null;
}

export function extractWorkspaceEvidence(
  workspace: ConnectedWorkspaceCreationAssessment | null,
): StageExecutionEvidence {
  if (!workspace) {
    return {
      readOnly: true,
      stage: 'WORKSPACE',
      proven: false,
      state: 'INSUFFICIENT_EVIDENCE',
      score: 0,
      proofPercent: 0,
      sourceAuthority: 'connected-workspace-creation',
      evidenceSummary: 'No workspace creation assessment consumed',
      artifactPaths: [],
    };
  }

  const report = workspace.report;
  const contract = report.creationContract;
  const realMutation = contract?.realFileMutationPerformed === true;
  const fsSuccess = contract?.filesystemEvidence.creationSuccessful === true;
  const proven =
    report.questionAnswers.workspaceCreationProven === true &&
    realMutation &&
    fsSuccess &&
    (report.workspaceState === 'WORKSPACE_CREATED' ||
      report.workspaceState === 'WORKSPACE_CREATED_WITH_WARNINGS');

  const proofPercent = proven ? report.workspaceCreationScore : realMutation && fsSuccess ? 50 : 0;

  return {
    readOnly: true,
    stage: 'WORKSPACE',
    proven,
    state: report.workspaceState,
    score: report.workspaceCreationScore,
    proofPercent: clamp(proofPercent),
    sourceAuthority: 'connected-workspace-creation',
    evidenceSummary: contract
      ? `Workspace ${contract.workspaceId}: real mutation=${realMutation}, fs success=${fsSuccess}`
      : 'Workspace creation contract missing',
    artifactPaths: (contract?.createdArtifacts ?? []).map((a) => a.path).slice(0, 8),
  };
}

export function extractBuildEvidence(
  runtime: ConnectedRuntimeExecutionAssessment | null,
): StageExecutionEvidence {
  const buildContract = runtime?.report.inputSnapshot.connectedBuildExecutionContract ?? null;

  if (!buildContract) {
    return {
      readOnly: true,
      stage: 'BUILD',
      proven: false,
      state: 'INSUFFICIENT_EVIDENCE',
      score: 0,
      proofPercent: 0,
      sourceAuthority: 'connected-build-execution',
      evidenceSummary: 'No connected build execution contract consumed',
      artifactPaths: [],
    };
  }

  const proven = buildContract.realBuildPerformed === true && buildContract.buildSuccessful === true;
  const proofPercent = proven ? 100 : buildContract.realBuildPerformed ? 40 : 0;

  return {
    readOnly: true,
    stage: 'BUILD',
    proven,
    state: proven
      ? 'BUILD_EXECUTED'
      : buildContract.realBuildPerformed
        ? 'BUILD_EXECUTION_FAILED'
        : 'INSUFFICIENT_EVIDENCE',
    score: proofPercent,
    proofPercent: clamp(proofPercent),
    sourceAuthority: 'connected-build-execution',
    evidenceSummary: `Build real=${buildContract.realBuildPerformed}, successful=${buildContract.buildSuccessful}, artifacts=${buildContract.buildArtifacts.length}`,
    artifactPaths: buildContract.buildArtifacts.slice(0, 8),
  };
}

export function extractRuntimeEvidence(
  runtime: ConnectedRuntimeExecutionAssessment | null,
): StageExecutionEvidence {
  if (!runtime) {
    return {
      readOnly: true,
      stage: 'RUNTIME',
      proven: false,
      state: 'INSUFFICIENT_EVIDENCE',
      score: 0,
      proofPercent: 0,
      sourceAuthority: 'connected-runtime-execution',
      evidenceSummary: 'No runtime execution assessment consumed',
      artifactPaths: [],
    };
  }

  const report = runtime.report;
  const contract = report.activationContract;
  const realLaunch = contract?.realRuntimeLaunchPerformed === true;
  const startupOk = contract?.activationEvidence.startupSucceeded === true;
  const proven =
    report.questionAnswers.runtimeActivationProven === true &&
    realLaunch &&
    startupOk &&
    (report.runtimeState === 'RUNTIME_ACTIVATED' ||
      report.runtimeState === 'RUNTIME_ACTIVATED_WITH_WARNINGS');

  const proofPercent = proven ? report.runtimeScore : realLaunch && startupOk ? 60 : realLaunch ? 30 : 0;

  return {
    readOnly: true,
    stage: 'RUNTIME',
    proven,
    state: report.runtimeState,
    score: report.runtimeScore,
    proofPercent: clamp(proofPercent),
    sourceAuthority: 'connected-runtime-execution',
    evidenceSummary: contract
      ? `Runtime real launch=${realLaunch}, startup=${startupOk}, endpoint=${contract.activationEvidence.runtimeEndpointAvailable}`
      : 'Runtime activation contract missing',
    artifactPaths: (contract?.runtimeArtifacts ?? []).map((a) => a.path).slice(0, 8),
  };
}

export function extractPreviewEvidence(
  preview: ConnectedLivePreviewExecutionAssessment | null,
): StageExecutionEvidence {
  if (!preview) {
    return {
      readOnly: true,
      stage: 'PREVIEW',
      proven: false,
      state: 'INSUFFICIENT_EVIDENCE',
      score: 0,
      proofPercent: 0,
      sourceAuthority: 'connected-live-preview-execution',
      evidenceSummary: 'No live preview execution assessment consumed',
      artifactPaths: [],
    };
  }

  const report = preview.report;
  const contract = report.activationContract;
  const realLaunch = contract?.realPreviewLaunchPerformed === true;
  const previewOk = contract?.activationEvidence.previewEndpointAvailable === true;
  const proven =
    report.questionAnswers.previewActivationProven === true &&
    realLaunch &&
    previewOk &&
    (report.previewState === 'PREVIEW_ACTIVATED' ||
      report.previewState === 'PREVIEW_ACTIVATED_WITH_WARNINGS');

  const proofPercent = proven ? report.previewScore : realLaunch && previewOk ? 60 : realLaunch ? 30 : 0;

  return {
    readOnly: true,
    stage: 'PREVIEW',
    proven,
    state: report.previewState,
    score: report.previewScore,
    proofPercent: clamp(proofPercent),
    sourceAuthority: 'connected-live-preview-execution',
    evidenceSummary: contract
      ? `Preview real launch=${realLaunch}, url=${contract.previewUrl}, reachable=${previewOk}`
      : 'Preview activation contract missing',
    artifactPaths: (contract?.previewArtifacts ?? []).map((a) => a.path).slice(0, 8),
  };
}

export function extractVerificationEvidence(
  verification: ConnectedVerificationExecutionAssessment | null,
): StageExecutionEvidence {
  if (!verification) {
    return {
      readOnly: true,
      stage: 'VERIFICATION',
      proven: false,
      state: 'INSUFFICIENT_EVIDENCE',
      score: 0,
      proofPercent: 0,
      sourceAuthority: 'connected-verification-execution',
      evidenceSummary: 'No verification execution assessment consumed',
      artifactPaths: [],
    };
  }

  const report = verification.report;
  const contract = report.executionContract;
  const realExec = contract?.realVerificationExecutionPerformed === true;
  const verificationOk = contract?.executionEvidence.verificationSucceeded === true;
  const executedWithWarnings = report.verificationState === 'VERIFICATION_EXECUTED_WITH_WARNINGS';
  const executedClean = report.verificationState === 'VERIFICATION_EXECUTED';
  const proven =
    realExec &&
    verificationOk &&
    (executedClean || executedWithWarnings);

  const proofPercent = proven ? report.verificationScore : realExec && verificationOk ? 60 : realExec ? 30 : 0;

  return {
    readOnly: true,
    stage: 'VERIFICATION',
    proven,
    state: report.verificationState,
    score: report.verificationScore,
    proofPercent: clamp(proofPercent),
    sourceAuthority: 'connected-verification-execution',
    evidenceSummary: contract
      ? `Verification real=${realExec}, checks=${contract.executionEvidence.verificationChecksExecuted}, succeeded=${verificationOk}`
      : 'Verification execution contract missing',
    artifactPaths: (contract?.verificationArtifacts ?? []).map((a) => a.path).slice(0, 8),
  };
}

export function extractExecutionChainEvidence(
  chainAssessment: FounderExecutionChainAssessment | null,
  stages: StageExecutionEvidence[],
): ExecutionChainEvidenceSummary {
  const allRealProven = stages.every((s) => s.proven);
  const anyBlocked = stages.some((s) => s.state.includes('BLOCKED'));

  if (chainAssessment) {
    const report = chainAssessment.report;
    return {
      readOnly: true,
      connected: report.executionChainConnected || allRealProven,
      state: report.executionChainState,
      score: report.executionChainScore,
      proofPercent: clamp(allRealProven ? 100 : report.executionChainCompleteness),
      sourceAuthority: 'founder-test-execution-chain-integration',
      evidenceSummary: allRealProven
        ? 'All real execution stages proven and chain connected'
        : report.launchImpact,
    };
  }

  const connectedCount = stages.filter((s) => s.proven).length;
  const proofPercent = clamp((connectedCount / stages.length) * 100);

  return {
    readOnly: true,
    connected: allRealProven,
    state: anyBlocked
      ? 'EXECUTION_CHAIN_BLOCKED'
      : allRealProven
        ? 'EXECUTION_CHAIN_CONNECTED'
        : connectedCount > 0
          ? 'EXECUTION_CHAIN_PARTIALLY_CONNECTED'
          : 'INSUFFICIENT_EVIDENCE',
    score: proofPercent,
    proofPercent,
    sourceAuthority: 'founder-execution-proof-aggregator',
    evidenceSummary: `${connectedCount}/${stages.length} real execution stages proven`,
  };
}

export function extractLaunchEvidence(
  launchReadiness: FounderTestLaunchReadinessAssessment | null,
  founderTest: AssessFounderExecutionProofInput['founderTestAssessment'],
  acceptance: AssessFounderExecutionProofInput['founderAcceptanceAssessment'],
): LaunchEvidenceSummary {
  if (launchReadiness) {
    const report = launchReadiness.report;
    const proven =
      report.launchReadinessVerdict === 'LAUNCH_READY' ||
      report.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS';
    return {
      readOnly: true,
      launchReadinessProven: proven,
      launchCouncilVerdict: report.launchCouncilSummary,
      founderAcceptanceState: report.founderAcceptanceState,
      proofPercent: clamp(report.founderReadinessScore),
      sourceAuthority: 'founder-test-launch-readiness',
      evidenceSummary: `${report.launchReadinessVerdict} (${report.confidenceLevel} confidence)`,
    };
  }

  if (founderTest) {
    const proven =
      founderTest.verdict === 'FOUNDER_READY' ||
      founderTest.verdict === 'FOUNDER_READY_WITH_WARNINGS';
    return {
      readOnly: true,
      launchReadinessProven: proven,
      launchCouncilVerdict: founderTest.verdict,
      founderAcceptanceState: acceptance?.acceptanceState ?? 'UNKNOWN',
      proofPercent: clamp(founderTest.score.overall),
      sourceAuthority: 'founder-test-integration',
      evidenceSummary: `Founder test ${founderTest.verdict} at ${founderTest.score.overall}/100`,
    };
  }

  return {
    readOnly: true,
    launchReadinessProven: false,
    launchCouncilVerdict: 'UNKNOWN',
    founderAcceptanceState: acceptance?.acceptanceState ?? 'UNKNOWN',
    proofPercent: 0,
    sourceAuthority: 'founder-test-launch-readiness',
    evidenceSummary: 'No launch readiness assessment consumed',
  };
}

export function collectProofArtifacts(
  workspace: StageExecutionEvidence,
  build: StageExecutionEvidence,
  runtime: StageExecutionEvidence,
  preview: StageExecutionEvidence,
  verification: StageExecutionEvidence,
): ProofArtifactEntry[] {
  const entries: ProofArtifactEntry[] = [];
  const pushStage = (stage: StageExecutionEvidence) => {
    for (const path of stage.artifactPaths) {
      entries.push({
        readOnly: true,
        path,
        category: 'execution-artifact',
        stage: stage.stage,
        sourceAuthority: stage.sourceAuthority,
      });
    }
  };
  pushStage(workspace);
  pushStage(build);
  pushStage(runtime);
  pushStage(preview);
  pushStage(verification);
  return entries.slice(0, MAX_PROOF_ARTIFACTS);
}

export function computeExecutionCompleteness(
  workspace: StageExecutionEvidence,
  build: StageExecutionEvidence,
  runtime: StageExecutionEvidence,
  preview: StageExecutionEvidence,
  verification: StageExecutionEvidence,
  chain: ExecutionChainEvidenceSummary,
  launch: LaunchEvidenceSummary,
): ExecutionCompletenessBreakdown {
  const stagePercents = [
    workspace.proofPercent,
    build.proofPercent,
    runtime.proofPercent,
    preview.proofPercent,
    verification.proofPercent,
    chain.proofPercent,
    launch.proofPercent,
  ];
  const overall = clamp(stagePercents.reduce((sum, v) => sum + v, 0) / stagePercents.length);

  return {
    readOnly: true,
    workspaceProofPercent: workspace.proofPercent,
    buildProofPercent: build.proofPercent,
    runtimeProofPercent: runtime.proofPercent,
    previewProofPercent: preview.proofPercent,
    verificationProofPercent: verification.proofPercent,
    executionChainPercent: chain.proofPercent,
    launchReadinessPercent: launch.proofPercent,
    overallFounderProofPercent: overall,
  };
}

export function buildInputSnapshot(
  input: AssessFounderExecutionProofInput,
  missingAuthorities: string[],
): FounderExecutionProofInputSnapshot {
  const verification = input.connectedVerificationExecutionAssessment ?? null;
  const preview = resolvePreviewAssessment(input, verification);
  const runtime = resolveRuntimeAssessment(input, preview, verification);
  const workspace = resolveWorkspaceAssessment(input, runtime, preview, verification);

  return {
    readOnly: true,
    connectedWorkspaceCreationAssessment: workspace,
    connectedRuntimeExecutionAssessment: runtime,
    connectedLivePreviewExecutionAssessment: preview,
    connectedVerificationExecutionAssessment: verification,
    endToEndExecutionProofAssessment: input.endToEndExecutionProofAssessment ?? null,
    founderTestExecutionChainAssessment: input.founderTestExecutionChainAssessment ?? null,
    founderTestLaunchReadinessAssessment: null,
    executionProofAssessment: input.executionProofAssessment ?? null,
    founderAcceptanceAssessment: input.founderAcceptanceAssessment ?? null,
    launchCouncilAssessment: null,
    missingAuthorities,
  };
}

export function aggregateProofWarnings(
  workspace: StageExecutionEvidence,
  build: StageExecutionEvidence,
  runtime: StageExecutionEvidence,
  preview: StageExecutionEvidence,
  verification: StageExecutionEvidence,
  chainAssessment: FounderExecutionChainAssessment | null,
): string[] {
  const warnings: string[] = [];
  for (const stage of [workspace, build, runtime, preview, verification]) {
    if (hasWarningsState(stage.state)) {
      warnings.push(`${stage.stage} completed with warnings (${stage.state})`);
    }
  }
  if (chainAssessment) {
    warnings.push(...chainAssessment.report.executionChainWarnings.map((w) => w.explanation));
    warnings.push(...chainAssessment.report.warningReasons);
  }
  return dedupeStrings(warnings).slice(0, MAX_PROOF_WARNINGS);
}

export function aggregateProofBlockers(
  workspace: StageExecutionEvidence,
  build: StageExecutionEvidence,
  runtime: StageExecutionEvidence,
  preview: StageExecutionEvidence,
  verification: StageExecutionEvidence,
  chainAssessment: FounderExecutionChainAssessment | null,
  acceptance: AssessFounderExecutionProofInput['founderAcceptanceAssessment'],
): string[] {
  const blockers: string[] = [];
  for (const stage of [workspace, build, runtime, preview, verification]) {
    if (stage.state.includes('BLOCKED') || stage.state.includes('FAILED')) {
      blockers.push(`${stage.stage} blocked or failed (${stage.state})`);
    }
    if (!stage.proven && stage.state === 'INSUFFICIENT_EVIDENCE') {
      blockers.push(`${stage.stage} evidence insufficient`);
    }
  }
  if (acceptance?.acceptanceState === 'BLOCKED') {
    blockers.push('Founder acceptance gate blocked');
  }
  const allRealStagesProven = [workspace, build, runtime, preview, verification].every((s) => s.proven);
  if (chainAssessment && !allRealStagesProven) {
    blockers.push(...chainAssessment.report.executionChainBlockers.map((b) => b.explanation));
    blockers.push(...chainAssessment.report.blockingReasons);
  }
  return dedupeStrings(blockers).slice(0, MAX_PROOF_BLOCKERS);
}

export function buildQuestionAnswers(
  workspace: StageExecutionEvidence,
  build: StageExecutionEvidence,
  runtime: StageExecutionEvidence,
  preview: StageExecutionEvidence,
  verification: StageExecutionEvidence,
  chain: ExecutionChainEvidenceSummary,
  launch: LaunchEvidenceSummary,
  blockers: string[],
  artifacts: ProofArtifactEntry[],
): FounderExecutionProofQuestionAnswers {
  const founderExecutionProven =
    workspace.proven &&
    build.proven &&
    runtime.proven &&
    preview.proven &&
    verification.proven &&
    chain.connected;

  return {
    workspaceActuallyCreated: workspace.proven,
    buildActuallyExecuted: build.proven,
    runtimeActuallyActivated: runtime.proven,
    previewActuallyActivated: preview.proven,
    verificationActuallyExecuted: verification.proven,
    executionChainConnected: chain.connected,
    founderCanInspectEvidence: artifacts.length > 0,
    blockersPresent: blockers.length > 0,
    launchReadinessProven: launch.launchReadinessProven,
    founderExecutionProven,
  };
}

export function aggregateFounderExecutionProofBundle(
  input: AssessFounderExecutionProofInput,
  proofBundleId: string,
  launchReadiness: FounderTestLaunchReadinessAssessment | null,
): {
  bundle: FounderExecutionProofBundle;
  completeness: ExecutionCompletenessBreakdown;
  questionAnswers: FounderExecutionProofQuestionAnswers;
  proofWarnings: string[];
  proofBlockers: string[];
  inputSnapshot: FounderExecutionProofInputSnapshot;
} {
  return runWithAuthorityGuard({
    authorityName: 'FOUNDER_EXECUTION_PROOF_BUNDLE',
    invoke: () => aggregateFounderExecutionProofBundleCore(input, proofBundleId, launchReadiness),
    onRecursion: (detection) => {
      const { safeFallback: _ignored, ...result } = buildFounderExecutionProofBundleRecursionFallback({
        detection,
        proofBundleId,
        assessInput: input,
      });
      return result;
    },
  });
}

function aggregateFounderExecutionProofBundleCore(
  input: AssessFounderExecutionProofInput,
  proofBundleId: string,
  launchReadiness: FounderTestLaunchReadinessAssessment | null,
): {
  bundle: FounderExecutionProofBundle;
  completeness: ExecutionCompletenessBreakdown;
  questionAnswers: FounderExecutionProofQuestionAnswers;
  proofWarnings: string[];
  proofBlockers: string[];
  inputSnapshot: FounderExecutionProofInputSnapshot;
} {
  const verification = input.connectedVerificationExecutionAssessment ?? null;
  const preview = resolvePreviewAssessment(input, verification);
  const runtime = resolveRuntimeAssessment(input, preview, verification);
  const workspace = resolveWorkspaceAssessment(input, runtime, preview, verification);
  const chainAssessment = input.founderTestExecutionChainAssessment ?? null;

  const workspaceEvidence = extractWorkspaceEvidence(workspace);
  const buildEvidence = extractBuildEvidence(runtime);
  const runtimeEvidence = extractRuntimeEvidence(runtime);
  const previewEvidence = extractPreviewEvidence(preview);
  const verificationEvidence = extractVerificationEvidence(verification);
  const stageList = [workspaceEvidence, buildEvidence, runtimeEvidence, previewEvidence, verificationEvidence];

  const executionChainEvidence = extractExecutionChainEvidence(chainAssessment, stageList);
  const launchEvidence = extractLaunchEvidence(
    launchReadiness,
    input.founderTestAssessment,
    input.founderAcceptanceAssessment,
  );

  const proofArtifacts = collectProofArtifacts(
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
  );

  let proofWarnings = aggregateProofWarnings(
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
    chainAssessment,
  );
  if (input.executionProofAssessment?.verdict === 'PARTIALLY_PROVEN') {
    proofWarnings = dedupeStrings([
      'Execution proof evolution verdict is PARTIALLY_PROVEN',
      ...proofWarnings,
    ]).slice(0, MAX_PROOF_WARNINGS);
  }

  const proofBlockers = aggregateProofBlockers(
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
    chainAssessment,
    input.founderAcceptanceAssessment,
  );

  const completeness = computeExecutionCompleteness(
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
    executionChainEvidence,
    launchEvidence,
  );

  const missingAuthorities: string[] = [];
  if (!workspace) missingAuthorities.push('connected-workspace-creation');
  if (!runtime?.report.inputSnapshot.connectedBuildExecutionContract) {
    missingAuthorities.push('connected-build-execution');
  }
  if (!runtime) missingAuthorities.push('connected-runtime-execution');
  if (!preview) missingAuthorities.push('connected-live-preview-execution');
  if (!verification) missingAuthorities.push('connected-verification-execution');

  const inputSnapshot = buildInputSnapshot(input, dedupeStrings(missingAuthorities));
  inputSnapshot.founderTestLaunchReadinessAssessment = launchReadiness;

  const questionAnswers = buildQuestionAnswers(
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
    executionChainEvidence,
    launchEvidence,
    proofBlockers,
    proofArtifacts,
  );

  const bundle: FounderExecutionProofBundle = {
    readOnly: true,
    proofBundleId,
    workspaceEvidence,
    buildEvidence,
    runtimeEvidence,
    previewEvidence,
    verificationEvidence,
    executionChainEvidence,
    launchEvidence,
    proofArtifacts,
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
  };
}

export function extractTopEvidence(bundle: FounderExecutionProofBundle): string[] {
  const items: string[] = [];
  for (const stage of [
    bundle.workspaceEvidence,
    bundle.buildEvidence,
    bundle.runtimeEvidence,
    bundle.previewEvidence,
    bundle.verificationEvidence,
  ]) {
    if (stage.proven) {
      items.push(`${stage.stage}: ${stage.evidenceSummary}`);
    }
  }
  if (bundle.executionChainEvidence.connected) {
    items.push(`Execution chain: ${bundle.executionChainEvidence.evidenceSummary}`);
  }
  if (bundle.launchEvidence.launchReadinessProven) {
    items.push(`Launch: ${bundle.launchEvidence.evidenceSummary}`);
  }
  return items.slice(0, 8);
}

export function extractMissingProofAreas(bundle: FounderExecutionProofBundle): string[] {
  const missing: string[] = [];
  for (const stage of [
    bundle.workspaceEvidence,
    bundle.buildEvidence,
    bundle.runtimeEvidence,
    bundle.previewEvidence,
    bundle.verificationEvidence,
  ]) {
    if (!stage.proven) {
      missing.push(stage.stage);
    }
  }
  if (!bundle.executionChainEvidence.connected) {
    missing.push('EXECUTION_CHAIN');
  }
  if (!bundle.launchEvidence.launchReadinessProven) {
    missing.push('LAUNCH_READINESS');
  }
  return missing;
}
