/**
 * Connected Live Preview Foundation — runtime-to-preview bridge authority.
 * Read-only orchestration — consumes existing authorities only.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedRuntimeActivation,
  resetConnectedRuntimeActivationModuleForTests,
} from '../connected-runtime-activation-foundation/index.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import {
  buildExecutionPackageRuntimeReport,
  getDevPulseV2ExecutionPackageRuntime,
} from '../execution-runtime/index.js';
import {
  buildExecutionVerificationReport,
  getDevPulseV2ExecutionVerificationLoop,
} from '../execution-verification/index.js';
import {
  assessLivePreviewReality,
  assessLivePreviewRealityAuthority,
  buildPreviewWorkspaceSignalsFromLegacy,
  detectPreviewModulePresenceEvidence,
  resetLivePreviewRealityAuthorityCounterForTests,
  resetLivePreviewRealityHistoryForTests,
  resetLivePreviewRealityRegistryForTests,
} from '../live-preview-reality/index.js';
import type {
  LivePreviewRealityAuthorityAssessment,
  LivePreviewRealityInput,
} from '../live-preview-reality/live-preview-reality-types.js';
import {
  recordConnectedLivePreviewAssessment,
  resetConnectedLivePreviewHistoryForTests,
} from './connected-live-preview-history.js';
import { buildConnectedLivePreviewReportMarkdown } from './connected-live-preview-report-builder.js';
import {
  CONNECTED_LIVE_PREVIEW_CACHE_KEY_PREFIX,
  CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
  CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  MAX_MISSING_COMPONENTS,
  MAX_PREVIEW_ENTRIES,
  MAX_RECOMMENDED_ACTIONS,
} from './connected-live-preview-registry.js';
import type {
  AssessConnectedLivePreviewInput,
  ConnectedLivePreviewArtifacts,
  ConnectedLivePreviewAssessment,
  ConnectedLivePreviewInputSnapshot,
  ConnectedLivePreviewReport,
  PreviewCandidate,
  PreviewReadinessArtifactEntry,
  PreviewReadinessContract,
  PreviewReadinessEntry,
  PreviewReadinessQuestionAnswers,
  PreviewState,
} from './connected-live-preview-types.js';

let previewConnectionCounter = 0;

export function resetConnectedLivePreviewCounterForTests(): void {
  previewConnectionCounter = 0;
}

function nextPreviewConnectionId(): string {
  previewConnectionCounter += 1;
  return `connected-live-preview-${previewConnectionCounter}`;
}

function stableCacheKey(connectionId: string, state: PreviewState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN, connectionId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_LIVE_PREVIEW_CACHE_KEY_PREFIX}:${digest}`;
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

function previewEntry(
  entryId: string,
  label: string,
  sourceAuthority: string,
  detail: string,
): PreviewReadinessEntry {
  return { readOnly: true, entryId, label, sourceAuthority, detail };
}

function artifactEntry(
  name: string,
  path: string | null,
  category: string,
  sourceAuthority: string,
): PreviewReadinessArtifactEntry {
  return { readOnly: true, name, path, category, sourceAuthority };
}

function inferPreviewType(
  snapshot: ConnectedLivePreviewInputSnapshot,
  candidate: PreviewCandidate,
): string {
  const runtimeType = snapshot.connectedRuntimeActivationAssessment.report.runtimeActivationContract.runtimeType;
  const moduleEvidence = snapshot.livePreviewRealityAssessment.analyzers;

  if (runtimeType.includes('REACT') && moduleEvidence.previewInfrastructure !== 'PREVIEW_INFRASTRUCTURE_MISSING') {
    return 'FOUNDER_REACT_PREVIEW';
  }
  if (moduleEvidence.previewInfrastructure === 'PREVIEW_INFRASTRUCTURE_PRESENT') {
    return 'FOUNDER_PANEL_PREVIEW';
  }
  if (candidate.previewActivationPath) {
    return 'MODELED_APPLICATION_PREVIEW';
  }
  return 'GENERIC_PREVIEW';
}

function inferPreviewActivationPath(snapshot: ConnectedLivePreviewInputSnapshot): string | null {
  const runtimeContract = snapshot.connectedRuntimeActivationAssessment.report.runtimeActivationContract;
  const startupPath = snapshot.connectedRuntimeActivationAssessment.report.runtimeActivationCandidate.startupPath;

  if (startupPath) {
    return `${startupPath} → founder preview surface (modeled — not launched)`;
  }

  const previewStep = runtimeContract.activationSteps.find((step) =>
    /preview|view|render|display|founder/i.test(step.label),
  );
  if (previewStep) {
    return `${previewStep.label} (modeled — not launched)`;
  }

  if (snapshot.livePreviewRealityAssessment.analyzers.previewInfrastructure !== 'PREVIEW_INFRASTRUCTURE_MISSING') {
    return 'Runtime activation → live preview runtime binding (modeled — not launched)';
  }

  return null;
}

function buildModeledLivePreviewRealityAssessment(
  rootDir: string,
  runtimeAssessment: ConnectedRuntimeActivationAssessment,
): LivePreviewRealityAuthorityAssessment {
  const moduleEvidence = detectPreviewModulePresenceEvidence(rootDir);
  const runtimeReport = runtimeAssessment.report;
  const runtimeReady =
    runtimeReport.runtimeState === 'RUNTIME_READY' ||
    runtimeReport.runtimeState === 'RUNTIME_READY_WITH_WARNINGS';

  const legacyInput: LivePreviewRealityInput = {
    uiSurfacePresent: moduleEvidence.hasFounderRealityUi,
    connected: runtimeReady,
    previewUrl: null,
    activeSession: null,
    sessions: [],
    diagnostics: {
      previewRuntimeActive: moduleEvidence.hasLivePreviewRuntime && runtimeReady,
      previewSessionCount: 0,
      registeredTargetCount: moduleEvidence.hasLivePreviewRuntime ? 1 : 0,
      readyPreviewCount: runtimeReady && moduleEvidence.hasLivePreviewRuntime ? 1 : 0,
      blockedPreviewCount: runtimeReport.runtimeState === 'RUNTIME_BLOCKED' ? 1 : 0,
    },
    latestProjectId: runtimeReport.runtimeActivationCandidate.workspaceId,
    projectCount: 1,
    generatedAt: Date.now(),
    clientLoadError: false,
  };

  const legacyAssessment = assessLivePreviewReality(legacyInput);
  const workspace = buildPreviewWorkspaceSignalsFromLegacy(
    legacyInput,
    runtimeReady,
    {
      validationReady: legacyAssessment.validationReady,
      loadReality: legacyAssessment.loadReality,
      interactivity: legacyAssessment.interactivity,
      state: legacyAssessment.state,
    },
  );

  return assessLivePreviewRealityAuthority({ workspace, moduleEvidence, legacyInput });
}

function resolveAssessments(input: AssessConnectedLivePreviewInput): {
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment;
  livePreviewRealityAssessment: LivePreviewRealityAuthorityAssessment;
} {
  const rootDir = input.rootDir ?? process.cwd();
  const connectedRuntimeActivationAssessment =
    input.connectedRuntimeActivationAssessment ??
    assessConnectedRuntimeActivation({ rootDir });

  const livePreviewRealityAssessment =
    input.livePreviewRealityAssessment ??
    buildModeledLivePreviewRealityAssessment(rootDir, connectedRuntimeActivationAssessment);

  return { connectedRuntimeActivationAssessment, livePreviewRealityAssessment };
}

function readExecutionPackageRuntimeReport() {
  const runtime = getDevPulseV2ExecutionPackageRuntime();
  return buildExecutionPackageRuntimeReport(runtime.getRuntimeState(), runtime.getRecords());
}

function readExecutionVerificationReport() {
  const loop = getDevPulseV2ExecutionVerificationLoop();
  return buildExecutionVerificationReport(loop.getLoopState(), loop.getResults());
}

function buildInputSnapshot(
  connectedRuntimeActivationAssessment: ConnectedRuntimeActivationAssessment,
  livePreviewRealityAssessment: LivePreviewRealityAuthorityAssessment,
): ConnectedLivePreviewInputSnapshot {
  const runtimeSnapshot = connectedRuntimeActivationAssessment.report.inputSnapshot;
  const buildSnapshot = runtimeSnapshot.connectedBuildExecutionAssessment.report.inputSnapshot;
  const verifierSnapshot = runtimeSnapshot.dryRunVerifierAssessment.inputSnapshot;

  const missingAuthorities = dedupeStrings([
    ...runtimeSnapshot.missingAuthorities,
    ...buildSnapshot.missingAuthorities,
    ...verifierSnapshot.missingAuthorities,
  ]);

  return {
    readOnly: true,
    connectedRuntimeActivationAssessment,
    connectedBuildExecutionAssessment: runtimeSnapshot.connectedBuildExecutionAssessment,
    livePreviewRealityAssessment,
    executionEngineAssessment: runtimeSnapshot.executionEngineAssessment,
    repositorySnapshotMaterializerAssessment: runtimeSnapshot.repositorySnapshotMaterializerAssessment,
    changeSetMaterializerAssessment: verifierSnapshot.changeSetMaterializerAssessment,
    dryRunVerifierAssessment: runtimeSnapshot.dryRunVerifierAssessment,
    executionPackageRuntimeReport: runtimeSnapshot.executionPackageRuntimeReport,
    executionVerificationReport: runtimeSnapshot.executionVerificationReport,
    missingAuthorities,
  };
}

export function buildPreviewCandidate(snapshot: ConnectedLivePreviewInputSnapshot): PreviewCandidate {
  const runtimeReport = snapshot.connectedRuntimeActivationAssessment.report;
  const workspaceId = runtimeReport.runtimeActivationCandidate.workspaceId;

  const candidate: PreviewCandidate = {
    readOnly: true,
    candidateId: `preview-candidate-${workspaceId}`,
    workspaceId,
    runtimeActivationContractId: runtimeReport.runtimeActivationContract.contractId,
    previewType: 'GENERIC_PREVIEW',
    previewActivationPath: null,
    modeledOnly: true,
    realPreviewLaunchPerformed: false,
  };

  return {
    ...candidate,
    previewType: inferPreviewType(snapshot, candidate),
    previewActivationPath: inferPreviewActivationPath(snapshot),
  };
}

export function buildPreviewReadinessContract(
  snapshot: ConnectedLivePreviewInputSnapshot,
  candidate: PreviewCandidate,
): PreviewReadinessContract {
  const runtimeReport = snapshot.connectedRuntimeActivationAssessment.report;
  const runtimeContract = runtimeReport.runtimeActivationContract;
  const buildManifest = snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest;
  const livePreview = snapshot.livePreviewRealityAssessment;
  const verifier = snapshot.dryRunVerifierAssessment;

  const previewRequirements: PreviewReadinessEntry[] = [];
  const previewArtifacts: PreviewReadinessArtifactEntry[] = [];
  const previewDependencies: PreviewReadinessEntry[] = [];
  const previewActivationSteps: PreviewReadinessEntry[] = [];
  const verificationRequirements: PreviewReadinessEntry[] = [];
  const rollbackRequirements: PreviewReadinessEntry[] = [];
  const proofArtifacts: PreviewReadinessArtifactEntry[] = [];

  previewRequirements.push(
    previewEntry(
      'runtime-readiness',
      'Runtime readiness prerequisite',
      'connected-runtime-activation-foundation',
      `Runtime state: ${runtimeReport.runtimeState}`,
    ),
  );

  for (const req of runtimeContract.startupRequirements) {
    previewRequirements.push(
      previewEntry(req.entryId, req.label, req.sourceAuthority, req.detail),
    );
  }

  if (candidate.previewActivationPath) {
    previewRequirements.push(
      previewEntry(
        'preview-activation-path',
        'Modeled preview activation path',
        'connected-live-preview-foundation',
        candidate.previewActivationPath,
      ),
    );
  }

  for (const artifact of runtimeContract.startupArtifacts) {
    previewArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const artifact of buildManifest.expectedArtifacts) {
    previewArtifacts.push(
      artifactEntry(artifact.name, artifact.path, `preview-${artifact.category}`, artifact.sourceAuthority),
    );
  }

  for (const evidence of livePreview.evidence) {
    previewArtifacts.push(
      artifactEntry(evidence.description, null, evidence.level, evidence.source),
    );
  }

  for (const dep of runtimeContract.runtimeDependencies) {
    previewDependencies.push(
      previewEntry(dep.entryId, dep.label, dep.sourceAuthority, dep.detail),
    );
  }

  previewDependencies.push(
    previewEntry(
      'live-preview-infrastructure',
      'Live preview infrastructure modules',
      'live-preview-reality',
      livePreview.analyzers.previewInfrastructure,
    ),
  );

  previewActivationSteps.push(
    previewEntry(
      'step-runtime-activation',
      'Complete runtime activation (modeled)',
      'connected-runtime-activation-foundation',
      runtimeContract.contractId,
    ),
  );

  for (const step of runtimeContract.activationSteps) {
    previewActivationSteps.push(
      previewEntry(step.entryId, step.label, step.sourceAuthority, step.detail),
    );
  }

  previewActivationSteps.push(
    previewEntry(
      'step-founder-surface',
      'Bind to founder preview surface (modeled)',
      'live-preview-reality',
      livePreview.founderConclusion,
    ),
  );

  for (const req of runtimeContract.verificationRequirements) {
    verificationRequirements.push(
      previewEntry(req.entryId, req.label, req.sourceAuthority, req.detail),
    );
  }

  for (const check of verifier.safetyChecks) {
    verificationRequirements.push(
      previewEntry(check.checkId, check.label, 'world2-dry-run-execution-verifier', check.detail),
    );
  }

  verificationRequirements.push(
    previewEntry(
      'live-preview-reality-score',
      'Live preview reality assessment',
      'live-preview-reality',
      `Score: ${livePreview.livePreviewRealityScore}/100`,
    ),
  );

  for (const req of runtimeContract.rollbackRequirements) {
    rollbackRequirements.push(
      previewEntry(req.entryId, req.label, req.sourceAuthority, req.detail),
    );
  }

  for (const artifact of runtimeContract.proofArtifacts) {
    proofArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const found of livePreview.evidenceFound.slice(0, 8)) {
    proofArtifacts.push(
      artifactEntry(found, null, 'live-preview-evidence', 'live-preview-reality'),
    );
  }

  return {
    readOnly: true,
    contractId: `preview-readiness-contract-${candidate.workspaceId}`,
    workspaceId: candidate.workspaceId,
    previewType: candidate.previewType,
    previewRequirements: previewRequirements.slice(0, MAX_PREVIEW_ENTRIES),
    previewArtifacts: previewArtifacts.slice(0, MAX_PREVIEW_ENTRIES),
    previewDependencies: previewDependencies.slice(0, MAX_PREVIEW_ENTRIES),
    previewActivationSteps: previewActivationSteps.slice(0, MAX_PREVIEW_ENTRIES),
    verificationRequirements: verificationRequirements.slice(0, MAX_PREVIEW_ENTRIES),
    rollbackRequirements: rollbackRequirements.slice(0, MAX_PREVIEW_ENTRIES),
    proofArtifacts: proofArtifacts.slice(0, MAX_PREVIEW_ENTRIES),
    realPreviewLaunchPerformed: false,
  };
}

export function derivePreviewReadinessQuestionAnswers(
  snapshot: ConnectedLivePreviewInputSnapshot,
  candidate: PreviewCandidate,
  contract: PreviewReadinessContract,
): PreviewReadinessQuestionAnswers {
  const runtimeReport = snapshot.connectedRuntimeActivationAssessment.report;
  const runtimeAnswers = runtimeReport.questionAnswers;
  const livePreview = snapshot.livePreviewRealityAssessment;
  const moduleInfra = livePreview.analyzers.previewInfrastructure;

  const runtimeReadinessExists =
    runtimeAnswers.runtimeReadinessProven ||
    ((runtimeReport.runtimeState === 'RUNTIME_READY' ||
      runtimeReport.runtimeState === 'RUNTIME_READY_WITH_WARNINGS') &&
      runtimeReport.runtimeActivationContract.contractId.length > 0);

  const previewCandidateExists = candidate.candidateId.length > 0 && candidate.workspaceId.length > 0;

  const previewActivationPathExists =
    candidate.previewActivationPath !== null || contract.previewActivationSteps.length > 0;

  const previewDependenciesKnown =
    contract.previewDependencies.length > 0 ||
    contract.previewArtifacts.length > 0 ||
    moduleInfra !== 'PREVIEW_INFRASTRUCTURE_MISSING';

  const previewActivationDescribable =
    contract.previewType !== 'GENERIC_PREVIEW' || contract.previewActivationSteps.length > 0;

  const previewActivationReproducible =
    runtimeAnswers.runtimeActivationReproducible &&
    moduleInfra !== 'PREVIEW_INFRASTRUCTURE_MISSING' &&
    snapshot.dryRunVerifierAssessment.verificationState !== 'FAILED';

  const previewActivationVerifiable =
    contract.verificationRequirements.length > 0 &&
    (snapshot.dryRunVerifierAssessment.verificationState === 'VERIFIED' ||
      snapshot.dryRunVerifierAssessment.verificationState === 'VERIFIED_WITH_WARNINGS' ||
      livePreview.evidence.length > 0);

  const founderInspectable =
    runtimeAnswers.founderInspectable &&
    contract.previewArtifacts.length + contract.proofArtifacts.length >= 1 &&
    livePreview.legacyAssessment.validationReadyReason.length > 0;

  const previewReadinessTraceable =
    runtimeAnswers.runtimeActivationTraceable &&
    candidate.runtimeActivationContractId.length > 0 &&
    contract.proofArtifacts.length > 0;

  const previewReadinessProven =
    runtimeReadinessExists &&
    previewCandidateExists &&
    previewActivationPathExists &&
    previewDependenciesKnown &&
    previewActivationDescribable &&
    previewActivationReproducible &&
    previewActivationVerifiable &&
    founderInspectable &&
    previewReadinessTraceable &&
    runtimeReport.runtimeState === 'RUNTIME_READY' &&
    snapshot.dryRunVerifierAssessment.verificationState === 'VERIFIED' &&
    moduleInfra === 'PREVIEW_INFRASTRUCTURE_PRESENT';

  return {
    runtimeReadinessExists,
    previewCandidateExists,
    previewActivationPathExists,
    previewDependenciesKnown,
    previewActivationDescribable,
    previewActivationReproducible,
    previewActivationVerifiable,
    founderInspectable,
    previewReadinessTraceable,
    previewReadinessProven,
  };
}

export function derivePreviewReadinessScore(answers: PreviewReadinessQuestionAnswers): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

export function derivePreviewCompleteness(contract: PreviewReadinessContract): number {
  const components = [
    contract.previewActivationSteps.length > 0,
    contract.previewRequirements.length > 0,
    contract.previewArtifacts.length > 0,
    contract.previewType.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function derivePreviewDependencyCompleteness(contract: PreviewReadinessContract): number {
  const components = [
    contract.previewDependencies.length > 0,
    contract.previewArtifacts.length > 0,
    contract.previewRequirements.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function derivePreviewProofCompleteness(contract: PreviewReadinessContract): number {
  const components = [
    contract.proofArtifacts.length > 0,
    contract.verificationRequirements.length > 0,
    contract.rollbackRequirements.length > 0,
    contract.previewActivationSteps.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function derivePreviewState(
  snapshot: ConnectedLivePreviewInputSnapshot,
  answers: PreviewReadinessQuestionAnswers,
): PreviewState {
  const runtimeState = snapshot.connectedRuntimeActivationAssessment.report.runtimeState;
  const verifierState = snapshot.dryRunVerifierAssessment.verificationState;

  if (snapshot.missingAuthorities.length > 0 || runtimeState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    runtimeState === 'RUNTIME_BLOCKED' ||
    verifierState === 'FAILED' ||
    snapshot.connectedBuildExecutionAssessment.report.buildOutputState === 'BUILD_OUTPUT_BLOCKED'
  ) {
    return 'PREVIEW_BLOCKED';
  }

  if (answers.previewReadinessProven) {
    return 'PREVIEW_READY';
  }

  if (
    answers.runtimeReadinessExists &&
    answers.previewCandidateExists &&
    (runtimeState === 'RUNTIME_READY_WITH_WARNINGS' ||
      verifierState === 'VERIFIED_WITH_WARNINGS' ||
      snapshot.dryRunVerifierAssessment.warningReasons.length > 0 ||
      snapshot.livePreviewRealityAssessment.analyzers.previewInfrastructure ===
        'PREVIEW_INFRASTRUCTURE_PARTIAL')
  ) {
    return 'PREVIEW_READY_WITH_WARNINGS';
  }

  return 'PREVIEW_NOT_READY';
}

function buildMissingComponents(
  snapshot: ConnectedLivePreviewInputSnapshot,
  answers: PreviewReadinessQuestionAnswers,
): string[] {
  const missing: string[] = [];
  if (!answers.runtimeReadinessExists) missing.push('Proven runtime readiness');
  if (!answers.previewCandidateExists) missing.push('Preview candidate');
  if (!answers.previewActivationPathExists) missing.push('Modeled preview activation path');
  if (!answers.previewDependenciesKnown) missing.push('Known preview dependencies');
  if (!answers.previewActivationDescribable) missing.push('Describable preview activation plan');
  if (!answers.previewActivationReproducible) missing.push('Reproducible preview activation chain');
  if (!answers.previewActivationVerifiable) missing.push('Verifiable preview requirements');
  if (!answers.founderInspectable) missing.push('Founder-inspectable preview readiness');
  if (!answers.previewReadinessTraceable) missing.push('Traceable runtime-to-preview linkage');
  for (const authority of snapshot.missingAuthorities) {
    missing.push(`Missing authority: ${authority}`);
  }
  for (const gap of snapshot.livePreviewRealityAssessment.missingEvidence) {
    missing.push(`Live preview gap: ${gap}`);
  }
  return dedupeStrings(missing).slice(0, MAX_MISSING_COMPONENTS);
}

function buildPreviewActivationPath(
  snapshot: ConnectedLivePreviewInputSnapshot,
  candidate: PreviewCandidate,
): string[] {
  const runtimeReport = snapshot.connectedRuntimeActivationAssessment.report;
  return [
    `Build Output Manifest (${runtimeReport.inputSnapshot.connectedBuildExecutionAssessment.report.buildOutputManifest.manifestId})`,
    `Runtime Activation Contract (${runtimeReport.runtimeActivationContract.contractId})`,
    `Preview Candidate (${candidate.candidateId})`,
    `Preview Readiness Contract (${candidate.previewType})`,
    'Preview Readiness Assessment',
  ];
}

function buildRecommendedActions(
  snapshot: ConnectedLivePreviewInputSnapshot,
  state: PreviewState,
): string[] {
  const actions: string[] = [];
  if (state === 'PREVIEW_READY') {
    actions.push('Maintain runtime-to-preview traceability before any real preview launch phase.');
  }
  if (state === 'PREVIEW_READY_WITH_WARNINGS') {
    actions.push('Resolve warning-level gaps in live preview infrastructure and runtime chain.');
  }
  if (state === 'PREVIEW_NOT_READY') {
    actions.push('Complete runtime readiness and live preview module linkage before claiming preview readiness.');
  }
  if (state === 'PREVIEW_BLOCKED') {
    actions.push('Clear blockers in runtime activation or build execution authorities.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before claiming preview readiness proof.');
  }
  actions.push(...snapshot.connectedRuntimeActivationAssessment.report.recommendedNextActions);
  actions.push(...snapshot.livePreviewRealityAssessment.previewBlockers.map((b) => `Resolve: ${b}`));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export function assessConnectedLivePreview(
  input: AssessConnectedLivePreviewInput = {},
): ConnectedLivePreviewAssessment {
  const { connectedRuntimeActivationAssessment, livePreviewRealityAssessment } = resolveAssessments(input);
  const inputSnapshot = buildInputSnapshot(connectedRuntimeActivationAssessment, livePreviewRealityAssessment);
  const previewCandidate = buildPreviewCandidate(inputSnapshot);
  const previewReadinessContract = buildPreviewReadinessContract(inputSnapshot, previewCandidate);
  const questionAnswers = derivePreviewReadinessQuestionAnswers(
    inputSnapshot,
    previewCandidate,
    previewReadinessContract,
  );
  const previewReadinessScore = derivePreviewReadinessScore(questionAnswers);
  const previewState = derivePreviewState(inputSnapshot, questionAnswers);
  const previewConnectionId = nextPreviewConnectionId();

  const blockingReasons = dedupeStrings([
    ...inputSnapshot.connectedRuntimeActivationAssessment.report.blockingReasons,
    ...inputSnapshot.dryRunVerifierAssessment.blockingReasons,
    ...inputSnapshot.livePreviewRealityAssessment.previewBlockers,
  ]);

  const warningReasons = dedupeStrings([
    ...inputSnapshot.connectedRuntimeActivationAssessment.report.warningReasons,
    ...inputSnapshot.dryRunVerifierAssessment.warningReasons,
    ...inputSnapshot.livePreviewRealityAssessment.legacyAssessment.problems,
  ]);

  const report: ConnectedLivePreviewReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_LIVE_PREVIEW_CORE_QUESTION,
    previewConnectionId,
    generatedAt: new Date().toISOString(),
    previewReadinessScore,
    previewState,
    previewCompleteness: derivePreviewCompleteness(previewReadinessContract),
    dependencyCompleteness: derivePreviewDependencyCompleteness(previewReadinessContract),
    proofCompleteness: derivePreviewProofCompleteness(previewReadinessContract),
    missingPreviewComponents: buildMissingComponents(inputSnapshot, questionAnswers),
    previewActivationPath: buildPreviewActivationPath(inputSnapshot, previewCandidate),
    recommendedNextActions: buildRecommendedActions(inputSnapshot, previewState),
    questionAnswers,
    previewCandidate,
    previewReadinessContract,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(previewConnectionId, previewState, previewReadinessScore),
  };

  const assessment: ConnectedLivePreviewAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'PREVIEW_READINESS_COMPLETE',
    report,
  };

  recordConnectedLivePreviewAssessment(assessment);
  return assessment;
}

export function buildConnectedLivePreviewArtifacts(
  input: AssessConnectedLivePreviewInput = {},
): ConnectedLivePreviewArtifacts {
  const connectedLivePreviewAssessment = assessConnectedLivePreview(input);
  return {
    connectedLivePreviewAssessment,
    connectedLivePreviewReportMarkdown: buildConnectedLivePreviewReportMarkdown(
      connectedLivePreviewAssessment.report,
    ),
  };
}

export function resetConnectedLivePreviewModuleForTests(): void {
  resetConnectedLivePreviewHistoryForTests();
  resetConnectedLivePreviewCounterForTests();
  resetConnectedRuntimeActivationModuleForTests();
  resetLivePreviewRealityAuthorityCounterForTests();
  resetLivePreviewRealityHistoryForTests();
  resetLivePreviewRealityRegistryForTests();
}
