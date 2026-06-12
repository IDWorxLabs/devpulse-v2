/**
 * Connected Verification Foundation — preview-to-verification bridge authority.
 * Read-only orchestration — consumes existing authorities only.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedLivePreview,
  resetConnectedLivePreviewModuleForTests,
} from '../connected-live-preview-foundation/index.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import {
  resetFounderTestLaunchReadinessModuleForTests,
  runFounderTestLaunchReadiness,
} from '../founder-test-launch-readiness/index.js';
import type {
  FounderTestLaunchReadinessAssessment,
  RunFounderTestLaunchReadinessInput,
} from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import {
  resetConnectedRuntimeActivationModuleForTests,
} from '../connected-runtime-activation-foundation/index.js';
import {
  assessVerificationReality,
  buildVerificationWorkspaceSignalsForValidation,
  detectVerificationModulePresenceEvidence,
  resetVerificationRealityCounterForTests,
  resetVerificationRealityHistoryForTests,
  resetVerificationRealityRegistryForTests,
} from '../verification-reality/index.js';
import type { VerificationRealityAssessment } from '../verification-reality/verification-reality-types.js';
import {
  recordConnectedVerificationAssessment,
  resetConnectedVerificationHistoryForTests,
} from './connected-verification-history.js';
import { buildConnectedVerificationReportMarkdown } from './connected-verification-report-builder.js';
import {
  CONNECTED_VERIFICATION_CACHE_KEY_PREFIX,
  CONNECTED_VERIFICATION_CORE_QUESTION,
  CONNECTED_VERIFICATION_FOUNDATION_PASS_TOKEN,
  MAX_MISSING_COMPONENTS,
  MAX_RECOMMENDED_ACTIONS,
  MAX_VERIFICATION_ENTRIES,
} from './connected-verification-registry.js';
import type {
  AssessConnectedVerificationInput,
  ConnectedVerificationArtifacts,
  ConnectedVerificationAssessment,
  ConnectedVerificationInputSnapshot,
  ConnectedVerificationReport,
  VerificationCandidate,
  VerificationReadinessArtifactEntry,
  VerificationReadinessContract,
  VerificationReadinessEntry,
  VerificationReadinessQuestionAnswers,
  VerificationState,
} from './connected-verification-types.js';

let verificationConnectionCounter = 0;

export function resetConnectedVerificationCounterForTests(): void {
  verificationConnectionCounter = 0;
}

function nextVerificationConnectionId(): string {
  verificationConnectionCounter += 1;
  return `connected-verification-${verificationConnectionCounter}`;
}

function stableCacheKey(connectionId: string, state: VerificationState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_VERIFICATION_FOUNDATION_PASS_TOKEN, connectionId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_VERIFICATION_CACHE_KEY_PREFIX}:${digest}`;
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

function verificationEntry(
  entryId: string,
  label: string,
  sourceAuthority: string,
  detail: string,
): VerificationReadinessEntry {
  return { readOnly: true, entryId, label, sourceAuthority, detail };
}

function artifactEntry(
  name: string,
  path: string | null,
  category: string,
  sourceAuthority: string,
): VerificationReadinessArtifactEntry {
  return { readOnly: true, name, path, category, sourceAuthority };
}

function inferVerificationType(
  snapshot: ConnectedVerificationInputSnapshot,
  candidate: VerificationCandidate,
): string {
  const previewType = snapshot.connectedLivePreviewAssessment.report.previewReadinessContract.previewType;
  const inventory = snapshot.verificationRealityAssessment.analyzers.validationInventory;

  if (inventory === 'VERIFICATION_PROVEN') return 'PROVEN_APPLICATION_VERIFICATION';
  if (previewType.includes('REACT')) return 'FOUNDER_REACT_VERIFICATION';
  if (snapshot.verificationRealityAssessment.analyzers.evidenceChain === 'EVIDENCE_CHAIN_PROVEN') {
    return 'EVIDENCE_CHAIN_VERIFICATION';
  }
  if (candidate.verificationPath) return 'MODELED_APPLICATION_VERIFICATION';
  return 'GENERIC_VERIFICATION';
}

function inferVerificationPath(snapshot: ConnectedVerificationInputSnapshot): string | null {
  const previewContract = snapshot.connectedLivePreviewAssessment.report.previewReadinessContract;
  const previewPath = snapshot.connectedLivePreviewAssessment.report.previewCandidate.previewActivationPath;

  if (previewPath) {
    return `${previewPath} → verification harness (modeled — not executed)`;
  }

  const verifyStep = previewContract.previewActivationSteps.find((step) =>
    /verif|valid|test|check|audit/i.test(step.label),
  );
  if (verifyStep) {
    return `${verifyStep.label} (modeled — not executed)`;
  }

  if (snapshot.verificationRealityAssessment.analyzers.validationInventory !== 'VERIFICATION_CLAIMED') {
    return 'Preview readiness → verification inventory → evidence chain (modeled — not executed)';
  }

  return null;
}

function buildModeledVerificationRealityAssessment(
  rootDir: string,
  previewAssessment: ConnectedLivePreviewAssessment,
): VerificationRealityAssessment {
  const moduleEvidence = detectVerificationModulePresenceEvidence(rootDir);
  const previewReport = previewAssessment.report;
  const previewReady =
    previewReport.previewState === 'PREVIEW_READY' ||
    previewReport.previewState === 'PREVIEW_READY_WITH_WARNINGS';

  const workspace = buildVerificationWorkspaceSignalsForValidation(moduleEvidence, {
    executionConnected: previewReady,
    previewValidationReady: previewReady,
    previewRealityState: previewReady ? 'PREVIEW_READY' : 'NO_PREVIEW',
    verificationReadiness: previewReady ? 'ready' : 'partial',
    world2FoundationComplete: previewReport.questionAnswers.previewReadinessProven,
    verificationSurfacePresent: moduleEvidence.hasVerificationRealityModule,
  });

  return assessVerificationReality({ workspace, moduleEvidence });
}

function resolveAssessments(input: AssessConnectedVerificationInput): {
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment;
  verificationRealityAssessment: VerificationRealityAssessment;
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment;
} {
  const rootDir = input.rootDir ?? process.cwd();
  const connectedLivePreviewAssessment =
    input.connectedLivePreviewAssessment ??
    assessConnectedLivePreview({ rootDir });

  const verificationRealityAssessment =
    input.verificationRealityAssessment ??
    buildModeledVerificationRealityAssessment(rootDir, connectedLivePreviewAssessment);

  const launchInput: RunFounderTestLaunchReadinessInput = {
    rootDir,
    founderTestAssessment: input.founderTestAssessment,
    workspaceId:
      connectedLivePreviewAssessment.report.previewCandidate.workspaceId,
  };

  const founderTestLaunchReadinessAssessment =
    input.founderTestLaunchReadinessAssessment ??
    runFounderTestLaunchReadiness(launchInput);

  return {
    connectedLivePreviewAssessment,
    verificationRealityAssessment,
    founderTestLaunchReadinessAssessment,
  };
}

function buildInputSnapshot(
  connectedLivePreviewAssessment: ConnectedLivePreviewAssessment,
  verificationRealityAssessment: VerificationRealityAssessment,
  founderTestLaunchReadinessAssessment: FounderTestLaunchReadinessAssessment,
): ConnectedVerificationInputSnapshot {
  const previewSnapshot = connectedLivePreviewAssessment.report.inputSnapshot;
  const runtimeSnapshot = previewSnapshot.connectedRuntimeActivationAssessment.report.inputSnapshot;
  const buildSnapshot = runtimeSnapshot.connectedBuildExecutionAssessment.report.inputSnapshot;
  const verifierSnapshot = runtimeSnapshot.dryRunVerifierAssessment.inputSnapshot;

  const missingAuthorities = dedupeStrings([
    ...previewSnapshot.missingAuthorities,
    ...runtimeSnapshot.missingAuthorities,
    ...buildSnapshot.missingAuthorities,
    ...verifierSnapshot.missingAuthorities,
  ]);

  return {
    readOnly: true,
    connectedLivePreviewAssessment,
    connectedRuntimeActivationAssessment: previewSnapshot.connectedRuntimeActivationAssessment,
    connectedBuildExecutionAssessment: runtimeSnapshot.connectedBuildExecutionAssessment,
    verificationRealityAssessment,
    founderTestLaunchReadinessAssessment,
    executionEngineAssessment: runtimeSnapshot.executionEngineAssessment,
    changeSetMaterializerAssessment: verifierSnapshot.changeSetMaterializerAssessment,
    dryRunVerifierAssessment: runtimeSnapshot.dryRunVerifierAssessment,
    executionPackageRuntimeReport: previewSnapshot.executionPackageRuntimeReport,
    executionVerificationReport: previewSnapshot.executionVerificationReport,
    missingAuthorities,
  };
}

export function buildVerificationCandidate(
  snapshot: ConnectedVerificationInputSnapshot,
): VerificationCandidate {
  const previewReport = snapshot.connectedLivePreviewAssessment.report;
  const workspaceId = previewReport.previewCandidate.workspaceId;

  const candidate: VerificationCandidate = {
    readOnly: true,
    candidateId: `verification-candidate-${workspaceId}`,
    workspaceId,
    previewReadinessContractId: previewReport.previewReadinessContract.contractId,
    verificationType: 'GENERIC_VERIFICATION',
    verificationPath: null,
    modeledOnly: true,
    realVerificationExecutionPerformed: false,
  };

  return {
    ...candidate,
    verificationType: inferVerificationType(snapshot, candidate),
    verificationPath: inferVerificationPath(snapshot),
  };
}

export function buildVerificationReadinessContract(
  snapshot: ConnectedVerificationInputSnapshot,
  candidate: VerificationCandidate,
): VerificationReadinessContract {
  const previewReport = snapshot.connectedLivePreviewAssessment.report;
  const previewContract = previewReport.previewReadinessContract;
  const runtimeContract =
    snapshot.connectedRuntimeActivationAssessment.report.runtimeActivationContract;
  const buildManifest = snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest;
  const verificationReality = snapshot.verificationRealityAssessment;
  const launchReadiness = snapshot.founderTestLaunchReadinessAssessment.report;
  const verifier = snapshot.dryRunVerifierAssessment;
  const execVerification = snapshot.executionVerificationReport;

  const verificationRequirements: VerificationReadinessEntry[] = [];
  const verificationArtifacts: VerificationReadinessArtifactEntry[] = [];
  const verificationDependencies: VerificationReadinessEntry[] = [];
  const verificationSteps: VerificationReadinessEntry[] = [];
  const verificationCoverage: VerificationReadinessEntry[] = [];
  const rollbackRequirements: VerificationReadinessEntry[] = [];
  const proofArtifacts: VerificationReadinessArtifactEntry[] = [];

  verificationRequirements.push(
    verificationEntry(
      'preview-readiness',
      'Preview readiness prerequisite',
      'connected-live-preview-foundation',
      `Preview state: ${previewReport.previewState}`,
    ),
  );

  for (const req of previewContract.previewRequirements) {
    verificationRequirements.push(
      verificationEntry(req.entryId, req.label, req.sourceAuthority, req.detail),
    );
  }

  if (candidate.verificationPath) {
    verificationRequirements.push(
      verificationEntry(
        'verification-path',
        'Modeled verification path',
        'connected-verification-foundation',
        candidate.verificationPath,
      ),
    );
  }

  for (const artifact of previewContract.previewArtifacts) {
    verificationArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const artifact of buildManifest.verificationArtifacts) {
    verificationArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const evidence of verificationReality.evidence) {
    verificationArtifacts.push(
      artifactEntry(evidence.description, null, evidence.level, evidence.source),
    );
  }

  for (const dep of previewContract.previewDependencies) {
    verificationDependencies.push(
      verificationEntry(dep.entryId, dep.label, dep.sourceAuthority, dep.detail),
    );
  }

  verificationDependencies.push(
    verificationEntry(
      'founder-test-launch-readiness',
      'Founder test launch readiness',
      'founder-test-launch-readiness',
      `Verdict: ${launchReadiness.launchReadinessVerdict}`,
    ),
  );

  verificationDependencies.push(
    verificationEntry(
      'execution-verification-loop',
      'Execution verification loop',
      'execution-verification-loop',
      execVerification.recommendation,
    ),
  );

  verificationSteps.push(
    verificationEntry(
      'step-preview-readiness',
      'Confirm preview readiness (modeled)',
      'connected-live-preview-foundation',
      previewContract.contractId,
    ),
  );

  for (const step of previewContract.previewActivationSteps) {
    verificationSteps.push(
      verificationEntry(step.entryId, step.label, step.sourceAuthority, step.detail),
    );
  }

  for (const step of runtimeContract.activationSteps.slice(0, 8)) {
    verificationSteps.push(
      verificationEntry(step.entryId, step.label, step.sourceAuthority, step.detail),
    );
  }

  verificationSteps.push(
    verificationEntry(
      'step-evidence-chain',
      'Attach verification evidence chain (modeled)',
      'verification-reality',
      verificationReality.founderConclusion,
    ),
  );

  for (const row of verificationReality.verificationRealityMatrix) {
    verificationCoverage.push(
      verificationEntry(
        `coverage-${row.area}`,
        row.area,
        'verification-reality',
        `claimed=${row.claimed} observed=${row.observed} proven=${row.proven}`,
      ),
    );
  }

  for (const check of verifier.validationCoverageChecks) {
    verificationCoverage.push(
      verificationEntry(
        check.checkId,
        check.label,
        'world2-dry-run-execution-verifier',
        check.detail,
      ),
    );
  }

  for (const check of verifier.auditCoverageChecks) {
    verificationCoverage.push(
      verificationEntry(
        check.checkId,
        check.label,
        'world2-dry-run-execution-verifier',
        check.detail,
      ),
    );
  }

  for (const req of previewContract.rollbackRequirements) {
    rollbackRequirements.push(
      verificationEntry(req.entryId, req.label, req.sourceAuthority, req.detail),
    );
  }

  for (const artifact of previewContract.proofArtifacts) {
    proofArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const found of verificationReality.evidenceFound.slice(0, 8)) {
    proofArtifacts.push(
      artifactEntry(found, null, 'verification-evidence', 'verification-reality'),
    );
  }

  for (const step of verifier.orderedStepChecks.filter((check) => check.passed)) {
    proofArtifacts.push(
      artifactEntry(step.expectedStepId, null, 'dry-run-step-check', 'world2-dry-run-execution-verifier'),
    );
  }

  return {
    readOnly: true,
    contractId: `verification-readiness-contract-${candidate.workspaceId}`,
    workspaceId: candidate.workspaceId,
    verificationType: candidate.verificationType,
    verificationRequirements: verificationRequirements.slice(0, MAX_VERIFICATION_ENTRIES),
    verificationArtifacts: verificationArtifacts.slice(0, MAX_VERIFICATION_ENTRIES),
    verificationDependencies: verificationDependencies.slice(0, MAX_VERIFICATION_ENTRIES),
    verificationSteps: verificationSteps.slice(0, MAX_VERIFICATION_ENTRIES),
    verificationCoverage: verificationCoverage.slice(0, MAX_VERIFICATION_ENTRIES),
    rollbackRequirements: rollbackRequirements.slice(0, MAX_VERIFICATION_ENTRIES),
    proofArtifacts: proofArtifacts.slice(0, MAX_VERIFICATION_ENTRIES),
    realVerificationExecutionPerformed: false,
  };
}

export function deriveVerificationReadinessQuestionAnswers(
  snapshot: ConnectedVerificationInputSnapshot,
  candidate: VerificationCandidate,
  contract: VerificationReadinessContract,
): VerificationReadinessQuestionAnswers {
  const previewReport = snapshot.connectedLivePreviewAssessment.report;
  const previewAnswers = previewReport.questionAnswers;
  const verificationReality = snapshot.verificationRealityAssessment;

  const previewReadinessExists =
    previewAnswers.previewReadinessProven ||
    ((previewReport.previewState === 'PREVIEW_READY' ||
      previewReport.previewState === 'PREVIEW_READY_WITH_WARNINGS') &&
      previewReport.previewReadinessContract.contractId.length > 0);

  const verificationCandidateExists =
    candidate.candidateId.length > 0 && candidate.workspaceId.length > 0;

  const verificationPathExists =
    candidate.verificationPath !== null || contract.verificationSteps.length > 0;

  const verificationDependenciesKnown =
    contract.verificationDependencies.length > 0 || contract.verificationArtifacts.length > 0;

  const verificationActivationDescribable =
    contract.verificationSteps.length > 0 && contract.verificationType.length > 0;

  const verificationReproducible =
    previewAnswers.previewActivationReproducible &&
    snapshot.dryRunVerifierAssessment.verificationState !== 'FAILED';

  const verificationTraceable =
    previewAnswers.previewReadinessTraceable &&
    candidate.previewReadinessContractId.length > 0 &&
    contract.proofArtifacts.length > 0;

  const founderInspectable =
    previewAnswers.founderInspectable &&
    contract.verificationArtifacts.length + contract.proofArtifacts.length >= 1;

  const verificationReadinessMeasurable =
    verificationReality.verificationRealityScore >= 0 && contract.verificationCoverage.length > 0;

  const verificationReadinessProven =
    previewReport.previewState === 'PREVIEW_READY' &&
    snapshot.connectedRuntimeActivationAssessment.report.runtimeState === 'RUNTIME_READY' &&
    snapshot.connectedBuildExecutionAssessment.report.buildOutputState === 'BUILD_OUTPUT_PROVEN' &&
    snapshot.dryRunVerifierAssessment.verificationState === 'VERIFIED' &&
    verificationCandidateExists &&
    verificationPathExists &&
    verificationDependenciesKnown &&
    verificationActivationDescribable &&
    verificationReproducible &&
    verificationTraceable &&
    founderInspectable &&
    verificationReadinessMeasurable;

  return {
    previewReadinessExists,
    verificationCandidateExists,
    verificationPathExists,
    verificationDependenciesKnown,
    verificationActivationDescribable,
    verificationReproducible,
    verificationTraceable,
    founderInspectable,
    verificationReadinessMeasurable,
    verificationReadinessProven,
  };
}

export function deriveVerificationReadinessScore(
  answers: VerificationReadinessQuestionAnswers,
): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

export function deriveVerificationCompleteness(contract: VerificationReadinessContract): number {
  const components = [
    contract.verificationSteps.length > 0,
    contract.verificationRequirements.length > 0,
    contract.verificationArtifacts.length > 0,
    contract.verificationType.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveCoverageCompleteness(contract: VerificationReadinessContract): number {
  const components = [
    contract.verificationCoverage.length > 0,
    contract.verificationDependencies.length > 0,
    contract.verificationArtifacts.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveVerificationProofCompleteness(contract: VerificationReadinessContract): number {
  const components = [
    contract.proofArtifacts.length > 0,
    contract.verificationCoverage.length > 0,
    contract.rollbackRequirements.length > 0,
    contract.verificationSteps.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveVerificationState(
  snapshot: ConnectedVerificationInputSnapshot,
  answers: VerificationReadinessQuestionAnswers,
): VerificationState {
  const previewState = snapshot.connectedLivePreviewAssessment.report.previewState;
  const runtimeState = snapshot.connectedRuntimeActivationAssessment.report.runtimeState;
  const verifierState = snapshot.dryRunVerifierAssessment.verificationState;

  if (snapshot.missingAuthorities.length > 0 || previewState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    previewState === 'PREVIEW_BLOCKED' ||
    runtimeState === 'RUNTIME_BLOCKED' ||
    verifierState === 'FAILED' ||
    snapshot.connectedBuildExecutionAssessment.report.buildOutputState === 'BUILD_OUTPUT_BLOCKED'
  ) {
    return 'VERIFICATION_BLOCKED';
  }

  if (answers.verificationReadinessProven) {
    return 'VERIFICATION_READY';
  }

  if (
    answers.previewReadinessExists &&
    answers.verificationCandidateExists &&
    (previewState === 'PREVIEW_READY_WITH_WARNINGS' ||
      runtimeState === 'RUNTIME_READY_WITH_WARNINGS' ||
      verifierState === 'VERIFIED_WITH_WARNINGS')
  ) {
    return 'VERIFICATION_READY_WITH_WARNINGS';
  }

  return 'VERIFICATION_NOT_READY';
}

function buildMissingComponents(
  snapshot: ConnectedVerificationInputSnapshot,
  answers: VerificationReadinessQuestionAnswers,
): string[] {
  const missing: string[] = [];
  if (!answers.previewReadinessExists) missing.push('Proven preview readiness');
  if (!answers.verificationCandidateExists) missing.push('Verification candidate');
  if (!answers.verificationPathExists) missing.push('Modeled verification path');
  if (!answers.verificationDependenciesKnown) missing.push('Known verification dependencies');
  if (!answers.verificationActivationDescribable) missing.push('Describable verification activation plan');
  if (!answers.verificationReproducible) missing.push('Reproducible verification chain');
  if (!answers.verificationTraceable) missing.push('Traceable preview-to-verification linkage');
  if (!answers.founderInspectable) missing.push('Founder-inspectable verification readiness');
  if (!answers.verificationReadinessMeasurable) missing.push('Measurable verification readiness signals');
  for (const authority of snapshot.missingAuthorities) {
    missing.push(`Missing authority: ${authority}`);
  }
  for (const gap of snapshot.verificationRealityAssessment.missingEvidence) {
    missing.push(`Verification reality gap: ${gap}`);
  }
  return dedupeStrings(missing).slice(0, MAX_MISSING_COMPONENTS);
}

function buildVerificationPath(
  snapshot: ConnectedVerificationInputSnapshot,
  candidate: VerificationCandidate,
): string[] {
  const previewReport = snapshot.connectedLivePreviewAssessment.report;
  return [
    `Preview Readiness Contract (${previewReport.previewReadinessContract.contractId})`,
    `Verification Candidate (${candidate.candidateId})`,
    `Verification Readiness Contract (${candidate.verificationType})`,
    'Verification Readiness Assessment',
  ];
}

function buildRecommendedActions(
  snapshot: ConnectedVerificationInputSnapshot,
  state: VerificationState,
): string[] {
  const actions: string[] = [];
  if (state === 'VERIFICATION_READY') {
    actions.push('Maintain preview-to-verification traceability before any real verification execution phase.');
  }
  if (state === 'VERIFICATION_READY_WITH_WARNINGS') {
    actions.push('Resolve warning-level gaps in verification reality and preview readiness chain.');
  }
  if (state === 'VERIFICATION_NOT_READY') {
    actions.push('Complete preview readiness and verification inventory before claiming verification readiness.');
  }
  if (state === 'VERIFICATION_BLOCKED') {
    actions.push('Clear blockers in preview, runtime, or build execution authorities.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before claiming verification readiness proof.');
  }
  actions.push(...snapshot.connectedLivePreviewAssessment.report.recommendedNextActions);
  actions.push(
    ...snapshot.verificationRealityAssessment.verificationBlockers.map((b) => `Resolve: ${b}`),
  );
  actions.push(...launchReadinessActions(snapshot));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

function launchReadinessActions(snapshot: ConnectedVerificationInputSnapshot): string[] {
  return snapshot.founderTestLaunchReadinessAssessment.report.topRecommendedActions.map(
    (action) => action.action,
  );
}

export function assessConnectedVerification(
  input: AssessConnectedVerificationInput = {},
): ConnectedVerificationAssessment {
  const {
    connectedLivePreviewAssessment,
    verificationRealityAssessment,
    founderTestLaunchReadinessAssessment,
  } = resolveAssessments(input);

  const inputSnapshot = buildInputSnapshot(
    connectedLivePreviewAssessment,
    verificationRealityAssessment,
    founderTestLaunchReadinessAssessment,
  );
  const verificationCandidate = buildVerificationCandidate(inputSnapshot);
  const verificationReadinessContract = buildVerificationReadinessContract(
    inputSnapshot,
    verificationCandidate,
  );
  const questionAnswers = deriveVerificationReadinessQuestionAnswers(
    inputSnapshot,
    verificationCandidate,
    verificationReadinessContract,
  );
  const verificationReadinessScore = deriveVerificationReadinessScore(questionAnswers);
  const verificationState = deriveVerificationState(inputSnapshot, questionAnswers);
  const verificationConnectionId = nextVerificationConnectionId();

  const blockingReasons = dedupeStrings([
    ...inputSnapshot.connectedLivePreviewAssessment.report.blockingReasons,
    ...inputSnapshot.dryRunVerifierAssessment.blockingReasons,
    ...inputSnapshot.verificationRealityAssessment.verificationBlockers,
    ...inputSnapshot.founderTestLaunchReadinessAssessment.report.topBlockers.map(
      (b) => b.explanation,
    ),
  ]);

  const warningReasons = dedupeStrings([
    ...inputSnapshot.connectedLivePreviewAssessment.report.warningReasons,
    ...inputSnapshot.dryRunVerifierAssessment.warningReasons,
    ...inputSnapshot.founderTestLaunchReadinessAssessment.report.topWarnings.map(
      (w) => w.explanation,
    ),
  ]);

  const report: ConnectedVerificationReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_VERIFICATION_CORE_QUESTION,
    verificationConnectionId,
    generatedAt: new Date().toISOString(),
    verificationReadinessScore,
    verificationState,
    verificationCompleteness: deriveVerificationCompleteness(verificationReadinessContract),
    coverageCompleteness: deriveCoverageCompleteness(verificationReadinessContract),
    proofCompleteness: deriveVerificationProofCompleteness(verificationReadinessContract),
    missingVerificationComponents: buildMissingComponents(inputSnapshot, questionAnswers),
    verificationPath: buildVerificationPath(inputSnapshot, verificationCandidate),
    recommendedNextActions: buildRecommendedActions(inputSnapshot, verificationState),
    questionAnswers,
    verificationCandidate,
    verificationReadinessContract,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(verificationConnectionId, verificationState, verificationReadinessScore),
  };

  const assessment: ConnectedVerificationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'VERIFICATION_READINESS_COMPLETE',
    report,
  };

  recordConnectedVerificationAssessment(assessment);
  return assessment;
}

export function buildConnectedVerificationArtifacts(
  input: AssessConnectedVerificationInput = {},
): ConnectedVerificationArtifacts {
  const connectedVerificationAssessment = assessConnectedVerification(input);
  return {
    connectedVerificationAssessment,
    connectedVerificationReportMarkdown: buildConnectedVerificationReportMarkdown(
      connectedVerificationAssessment.report,
    ),
  };
}

export function resetConnectedVerificationModuleForTests(): void {
  resetConnectedVerificationHistoryForTests();
  resetConnectedVerificationCounterForTests();
  resetConnectedLivePreviewModuleForTests();
  resetConnectedRuntimeActivationModuleForTests();
  resetVerificationRealityCounterForTests();
  resetVerificationRealityHistoryForTests();
  resetVerificationRealityRegistryForTests();
  resetFounderTestLaunchReadinessModuleForTests();
}
