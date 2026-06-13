/**
 * Connected Runtime Activation Foundation — build-output-to-runtime bridge authority.
 * Read-only orchestration — consumes existing authorities only.
 */

import { createHash } from 'node:crypto';
import {
  assessConnectedAutonomousBuildExecution,
  resetConnectedBuildExecutionModuleForTests,
} from '../connected-build-execution-foundation/index.js';
import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import {
  buildExecutionPackageRuntimeReport,
  getDevPulseV2ExecutionPackageRuntime,
} from '../execution-runtime/index.js';
import {
  buildExecutionVerificationReport,
  getDevPulseV2ExecutionVerificationLoop,
} from '../execution-verification/index.js';
import {
  assessWorld2DryRunExecutionVerifier,
  resetWorld2DryRunExecutionVerifierModuleForTests,
} from '../world2-dry-run-execution-verifier/index.js';
import type { World2DryRunExecutionVerificationAssessment } from '../world2-dry-run-execution-verifier/world2-dry-run-execution-verifier-types.js';
import {
  recordConnectedRuntimeActivationAssessment,
  resetConnectedRuntimeActivationHistoryForTests,
} from './connected-runtime-activation-history.js';
import { buildConnectedRuntimeActivationReportMarkdown } from './connected-runtime-activation-report-builder.js';
import {
  CONNECTED_RUNTIME_ACTIVATION_CACHE_KEY_PREFIX,
  CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
  CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN,
  MAX_ACTIVATION_ENTRIES,
  MAX_MISSING_COMPONENTS,
  MAX_RECOMMENDED_ACTIONS,
} from './connected-runtime-activation-registry.js';
import type {
  AssessConnectedRuntimeActivationInput,
  ConnectedRuntimeActivationArtifacts,
  ConnectedRuntimeActivationAssessment,
  ConnectedRuntimeActivationInputSnapshot,
  ConnectedRuntimeActivationReport,
  RuntimeActivationArtifactEntry,
  RuntimeActivationCandidate,
  RuntimeActivationContract,
  RuntimeActivationEntry,
  RuntimeActivationQuestionAnswers,
  RuntimeState,
} from './connected-runtime-activation-types.js';

let activationCounter = 0;

export function resetConnectedRuntimeActivationCounterForTests(): void {
  activationCounter = 0;
}

function nextActivationId(): string {
  activationCounter += 1;
  return `connected-runtime-activation-${activationCounter}`;
}

function stableCacheKey(activationId: string, state: RuntimeState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_RUNTIME_ACTIVATION_FOUNDATION_PASS_TOKEN, activationId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_RUNTIME_ACTIVATION_CACHE_KEY_PREFIX}:${digest}`;
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

function activationEntry(
  entryId: string,
  label: string,
  sourceAuthority: string,
  detail: string,
): RuntimeActivationEntry {
  return { readOnly: true, entryId, label, sourceAuthority, detail };
}

function artifactEntry(
  name: string,
  path: string | null,
  category: string,
  sourceAuthority: string,
): RuntimeActivationArtifactEntry {
  return { readOnly: true, name, path, category, sourceAuthority };
}

function inferRuntimeType(snapshot: ConnectedRuntimeActivationInputSnapshot): string {
  const manifest = snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest;
  const engineMode = snapshot.executionEngineAssessment.executionMode;
  const paths = [
    ...manifest.filesToCreate.map((entry) => entry.path),
    ...manifest.filesToModify.map((entry) => entry.path),
    ...manifest.expectedArtifacts.map((entry) => entry.path ?? ''),
  ].join(' ').toLowerCase();

  if (paths.includes('package.json') && (paths.includes('react') || paths.includes('vite'))) {
    return 'REACT_WEB_APPLICATION';
  }
  if (paths.includes('package.json') && paths.includes('express')) {
    return 'NODE_EXPRESS_APPLICATION';
  }
  if (paths.includes('package.json')) {
    return 'NODE_APPLICATION';
  }
  if (engineMode === 'SANDBOX_EXECUTION_ELIGIBLE') {
    return 'SANDBOX_ELIGIBLE_APPLICATION';
  }
  if (engineMode === 'SIMULATED_EXECUTION') {
    return 'SIMULATED_APPLICATION';
  }
  if (engineMode === 'DRY_RUN') {
    return 'DRY_RUN_APPLICATION';
  }
  return 'GENERIC_APPLICATION';
}

function inferStartupPath(snapshot: ConnectedRuntimeActivationInputSnapshot): string | null {
  const manifest = snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest;
  const hasPackageJson =
    manifest.filesToCreate.some((entry) => entry.path.endsWith('package.json')) ||
    manifest.filesToModify.some((entry) => entry.path.endsWith('package.json')) ||
    manifest.expectedArtifacts.some((entry) => entry.name === 'package.json');

  if (hasPackageJson) {
    return 'npm run dev (modeled — not executed)';
  }

  const dryRunPackage =
    snapshot.connectedBuildExecutionAssessment.report.inputSnapshot.dryRunComposerAssessment.executionPackage;
  const startupStep = dryRunPackage?.orderedSteps.find((step) =>
    /start|launch|serve|dev|run/i.test(step.label),
  );
  if (startupStep) {
    return `${startupStep.label} (modeled — not executed)`;
  }

  return null;
}

function resolveAssessments(input: AssessConnectedRuntimeActivationInput): {
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment;
  dryRunVerifierAssessment: World2DryRunExecutionVerificationAssessment;
} {
  const connectedBuildExecutionAssessment =
    input.connectedBuildExecutionAssessment ??
    assessConnectedAutonomousBuildExecution({ rootDir: input.rootDir ?? process.cwd() });

  const dryRunVerifierAssessment =
    input.dryRunVerifierAssessment ??
    assessWorld2DryRunExecutionVerifier({
      composerAssessment:
        connectedBuildExecutionAssessment.report.inputSnapshot.dryRunComposerAssessment,
    });

  return { connectedBuildExecutionAssessment, dryRunVerifierAssessment };
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
  connectedBuildExecutionAssessment: ConnectedBuildExecutionAssessment,
  dryRunVerifierAssessment: World2DryRunExecutionVerificationAssessment,
): ConnectedRuntimeActivationInputSnapshot {
  const buildSnapshot = connectedBuildExecutionAssessment.report.inputSnapshot;
  const verifierSnapshot = dryRunVerifierAssessment.inputSnapshot;
  const repositorySnapshot = buildSnapshot.repositorySnapshotAssessment;
  const instantiatorAssessment = repositorySnapshot.inputSnapshot.instantiatorAssessment;
  const creatorAssessment = instantiatorAssessment.inputSnapshot.creatorAssessment;

  const missingAuthorities = dedupeStrings([
    ...buildSnapshot.missingAuthorities,
    ...verifierSnapshot.missingAuthorities,
    ...creatorAssessment.inputSnapshot.missingAuthorities,
    ...instantiatorAssessment.inputSnapshot.missingAuthorities,
  ]);

  return {
    readOnly: true,
    connectedBuildExecutionAssessment,
    dryRunVerifierAssessment,
    executionEngineAssessment: buildSnapshot.executionEngineAssessment,
    disposableWorkspaceCreatorAssessment: creatorAssessment,
    disposableWorkspaceInstantiatorAssessment: instantiatorAssessment,
    repositorySnapshotMaterializerAssessment: verifierSnapshot.snapshotMaterializerAssessment,
    executionPackageRuntimeReport: readExecutionPackageRuntimeReport(),
    executionVerificationReport: readExecutionVerificationReport(),
    missingAuthorities,
  };
}

export function buildRuntimeActivationCandidate(
  snapshot: ConnectedRuntimeActivationInputSnapshot,
): RuntimeActivationCandidate {
  const manifest = snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest;
  const workspaceId =
    manifest.workspaceId ??
    snapshot.disposableWorkspaceInstantiatorAssessment.workspaceId ??
    'world2-runtime-candidate';

  return {
    readOnly: true,
    candidateId: `runtime-candidate-${workspaceId}`,
    workspaceId,
    buildOutputManifestId: manifest.manifestId,
    candidateType: inferRuntimeType(snapshot),
    startupPath: inferStartupPath(snapshot),
    modeledOnly: true,
    realRuntimeLaunchPerformed: false,
  };
}

export function buildRuntimeActivationContract(
  snapshot: ConnectedRuntimeActivationInputSnapshot,
  candidate: RuntimeActivationCandidate,
): RuntimeActivationContract {
  const manifest = snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest;
  const buildReport = snapshot.connectedBuildExecutionAssessment.report;
  const dryRunPackage = buildReport.inputSnapshot.dryRunComposerAssessment.executionPackage;
  const engine = snapshot.executionEngineAssessment;
  const verifier = snapshot.dryRunVerifierAssessment;

  const startupRequirements: RuntimeActivationEntry[] = [];
  const startupArtifacts: RuntimeActivationArtifactEntry[] = [];
  const runtimeDependencies: RuntimeActivationEntry[] = [];
  const activationSteps: RuntimeActivationEntry[] = [];
  const verificationRequirements: RuntimeActivationEntry[] = [];
  const rollbackRequirements: RuntimeActivationEntry[] = [];
  const proofArtifacts: RuntimeActivationArtifactEntry[] = [];

  if (candidate.startupPath) {
    startupRequirements.push(
      activationEntry(
        'startup-path',
        'Modeled startup path',
        'connected-runtime-activation-foundation',
        candidate.startupPath,
      ),
    );
  }

  for (const validation of engine.nextRequiredValidation) {
    startupRequirements.push(
      activationEntry(
        `engine-validation-${validation}`,
        validation,
        'world2-execution-engine',
        'Required validation before runtime activation',
      ),
    );
  }

  for (const artifact of manifest.expectedArtifacts) {
    startupArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const file of manifest.filesToCreate) {
    if (file.path.endsWith('package.json') || file.path.includes('node_modules')) {
      runtimeDependencies.push(
        activationEntry(
          `dep-${file.path}`,
          file.path,
          file.sourceAuthority,
          'Runtime dependency artifact from build output manifest',
        ),
      );
    }
  }

  for (const artifact of snapshot.connectedBuildExecutionAssessment.report.inputSnapshot
    .workspacePopulationAssessment.requiredArtifacts) {
    runtimeDependencies.push(
      activationEntry(
        `pop-dep-${artifact.name}`,
        artifact.name,
        'world2-workspace-population',
        artifact.category,
      ),
    );
  }

  if (dryRunPackage) {
    for (const step of dryRunPackage.orderedSteps) {
      activationSteps.push(
        activationEntry(
          step.stepId,
          step.label,
          'world2-dry-run-execution-composer',
          `Order ${step.order}`,
        ),
      );
    }
  }

  for (const step of engine.steps) {
    activationSteps.push(
      activationEntry(
        step.stepId,
        step.description,
        'world2-execution-engine',
        step.actionType,
      ),
    );
  }

  for (const check of verifier.orderedStepChecks) {
    verificationRequirements.push(
      activationEntry(
        check.checkId,
        check.expectedStepId,
        'world2-dry-run-execution-verifier',
        check.detail,
      ),
    );
  }

  for (const check of verifier.safetyChecks) {
    verificationRequirements.push(
      activationEntry(
        check.checkId,
        check.label,
        'world2-dry-run-execution-verifier',
        check.detail,
      ),
    );
  }

  verificationRequirements.push(
    activationEntry(
      'execution-package-runtime',
      'Execution package runtime governance',
      'execution-package-runtime',
      snapshot.executionPackageRuntimeReport.recommendation,
    ),
  );

  verificationRequirements.push(
    activationEntry(
      'execution-verification-loop',
      'Execution verification loop evidence',
      'execution-verification-loop',
      snapshot.executionVerificationReport.recommendation,
    ),
  );

  for (const artifact of manifest.rollbackArtifacts) {
    rollbackRequirements.push(
      activationEntry(
        artifact.name,
        artifact.name,
        artifact.sourceAuthority,
        artifact.category,
      ),
    );
  }

  for (const artifact of manifest.proofArtifacts) {
    proofArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, artifact.sourceAuthority),
    );
  }

  for (const check of verifier.validationCoverageChecks.filter((item) => item.passed)) {
    proofArtifacts.push(
      artifactEntry(check.label, null, 'dry-run-validation-coverage', 'world2-dry-run-execution-verifier'),
    );
  }

  return {
    readOnly: true,
    contractId: `runtime-activation-contract-${candidate.workspaceId}`,
    workspaceId: candidate.workspaceId,
    runtimeType: candidate.candidateType,
    startupRequirements: startupRequirements.slice(0, MAX_ACTIVATION_ENTRIES),
    startupArtifacts: startupArtifacts.slice(0, MAX_ACTIVATION_ENTRIES),
    runtimeDependencies: runtimeDependencies.slice(0, MAX_ACTIVATION_ENTRIES),
    activationSteps: activationSteps.slice(0, MAX_ACTIVATION_ENTRIES),
    verificationRequirements: verificationRequirements.slice(0, MAX_ACTIVATION_ENTRIES),
    rollbackRequirements: rollbackRequirements.slice(0, MAX_ACTIVATION_ENTRIES),
    proofArtifacts: proofArtifacts.slice(0, MAX_ACTIVATION_ENTRIES),
    realRuntimeLaunchPerformed: false,
  };
}

export function deriveRuntimeActivationQuestionAnswers(
  snapshot: ConnectedRuntimeActivationInputSnapshot,
  candidate: RuntimeActivationCandidate,
  contract: RuntimeActivationContract,
): RuntimeActivationQuestionAnswers {
  const buildReport = snapshot.connectedBuildExecutionAssessment.report;
  const buildAnswers = buildReport.questionAnswers;
  const manifest = buildReport.buildOutputManifest;
  const verifier = snapshot.dryRunVerifierAssessment;

  const buildOutputExists =
    buildAnswers.validArtifactManifestExists &&
    buildReport.buildOutputState !== 'INSUFFICIENT_EVIDENCE' &&
    manifest.manifestId.length > 0;

  const runtimeCandidateExists = candidate.candidateId.length > 0 && candidate.workspaceId.length > 0;

  const startupPathExists = candidate.startupPath !== null || contract.activationSteps.length > 0;

  const runtimeDependenciesKnown =
    contract.runtimeDependencies.length > 0 ||
    contract.startupArtifacts.length > 0 ||
    snapshot.executionEngineAssessment.nextRequiredValidation.length > 0;

  const runtimeActivationDescribable =
    contract.runtimeType !== 'GENERIC_APPLICATION' || contract.activationSteps.length > 0;

  const runtimeActivationReproducible =
    buildAnswers.outputsReproducible &&
    (verifier.verificationState === 'VERIFIED' ||
      verifier.verificationState === 'VERIFIED_WITH_WARNINGS');

  const runtimeActivationVerifiable =
    contract.verificationRequirements.length > 0 &&
    (verifier.verificationState === 'VERIFIED' ||
      verifier.verificationState === 'VERIFIED_WITH_WARNINGS' ||
      verifier.readinessScore >= 60);

  const founderInspectable =
    buildAnswers.founderInspectable &&
    contract.startupArtifacts.length + contract.proofArtifacts.length >= 1;

  const runtimeActivationTraceable =
    buildAnswers.outputsTraceable &&
    manifest.planId !== null &&
    contract.proofArtifacts.length > 0;

  const runtimeReadinessProven =
    buildOutputExists &&
    runtimeCandidateExists &&
    startupPathExists &&
    runtimeDependenciesKnown &&
    runtimeActivationDescribable &&
    runtimeActivationReproducible &&
    runtimeActivationVerifiable &&
    founderInspectable &&
    runtimeActivationTraceable &&
    buildReport.buildOutputState === 'BUILD_OUTPUT_PROVEN' &&
    verifier.verificationState === 'VERIFIED';

  return {
    buildOutputExists,
    runtimeCandidateExists,
    startupPathExists,
    runtimeDependenciesKnown,
    runtimeActivationDescribable,
    runtimeActivationReproducible,
    runtimeActivationVerifiable,
    founderInspectable,
    runtimeActivationTraceable,
    runtimeReadinessProven,
  };
}

export function deriveRuntimeReadinessScore(answers: RuntimeActivationQuestionAnswers): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

export function deriveActivationCompleteness(contract: RuntimeActivationContract): number {
  const components = [
    contract.activationSteps.length > 0,
    contract.startupRequirements.length > 0,
    contract.startupArtifacts.length > 0,
    contract.runtimeType.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveDependencyCompleteness(contract: RuntimeActivationContract): number {
  const components = [
    contract.runtimeDependencies.length > 0,
    contract.startupArtifacts.length > 0,
    contract.startupRequirements.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveRuntimeProofCompleteness(contract: RuntimeActivationContract): number {
  const components = [
    contract.proofArtifacts.length > 0,
    contract.verificationRequirements.length > 0,
    contract.rollbackRequirements.length > 0,
    contract.activationSteps.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveRuntimeState(
  snapshot: ConnectedRuntimeActivationInputSnapshot,
  answers: RuntimeActivationQuestionAnswers,
): RuntimeState {
  const buildState = snapshot.connectedBuildExecutionAssessment.report.buildOutputState;
  const verifierState = snapshot.dryRunVerifierAssessment.verificationState;

  if (snapshot.missingAuthorities.length > 0 || buildState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    buildState === 'BUILD_OUTPUT_BLOCKED' ||
    verifierState === 'FAILED' ||
    snapshot.executionEngineAssessment.finalState === 'BLOCKED' ||
    snapshot.disposableWorkspaceInstantiatorAssessment.resultState === 'INSTANTIATION_BLOCKED' ||
    snapshot.repositorySnapshotMaterializerAssessment.materializationState === 'MATERIALIZATION_BLOCKED'
  ) {
    return 'RUNTIME_BLOCKED';
  }

  if (answers.runtimeReadinessProven) {
    return 'RUNTIME_READY';
  }

  if (
    answers.buildOutputExists &&
    answers.runtimeCandidateExists &&
    (verifierState === 'VERIFIED_WITH_WARNINGS' ||
      buildState === 'BUILD_OUTPUT_PARTIALLY_PROVEN' ||
      snapshot.dryRunVerifierAssessment.warningReasons.length > 0)
  ) {
    return 'RUNTIME_READY_WITH_WARNINGS';
  }

  return 'RUNTIME_NOT_READY';
}

function buildMissingComponents(
  snapshot: ConnectedRuntimeActivationInputSnapshot,
  answers: RuntimeActivationQuestionAnswers,
): string[] {
  const missing: string[] = [];
  if (!answers.buildOutputExists) missing.push('Proven build output manifest');
  if (!answers.runtimeCandidateExists) missing.push('Runtime activation candidate');
  if (!answers.startupPathExists) missing.push('Modeled startup path');
  if (!answers.runtimeDependenciesKnown) missing.push('Known runtime dependencies');
  if (!answers.runtimeActivationDescribable) missing.push('Describable runtime activation plan');
  if (!answers.runtimeActivationReproducible) missing.push('Reproducible activation chain');
  if (!answers.runtimeActivationVerifiable) missing.push('Verifiable activation requirements');
  if (!answers.founderInspectable) missing.push('Founder-inspectable runtime readiness');
  if (!answers.runtimeActivationTraceable) missing.push('Traceable build-to-runtime linkage');
  for (const authority of snapshot.missingAuthorities) {
    missing.push(`Missing authority: ${authority}`);
  }
  for (const gap of snapshot.dryRunVerifierAssessment.missingCoverage) {
    missing.push(`Dry-run verifier gap: ${gap}`);
  }
  return dedupeStrings(missing).slice(0, MAX_MISSING_COMPONENTS);
}

function buildRuntimeActivationPath(snapshot: ConnectedRuntimeActivationInputSnapshot): string[] {
  return [
    'Execution Plan',
    `Build Output Manifest (${snapshot.connectedBuildExecutionAssessment.report.buildOutputManifest.manifestId})`,
    `Runtime Candidate (${snapshot.disposableWorkspaceInstantiatorAssessment.workspaceId})`,
    `Runtime Contract (${snapshot.executionEngineAssessment.executionMode})`,
    'Runtime Readiness Assessment',
  ];
}

function buildRecommendedActions(
  snapshot: ConnectedRuntimeActivationInputSnapshot,
  state: RuntimeState,
): string[] {
  const actions: string[] = [];
  if (state === 'RUNTIME_READY') {
    actions.push('Maintain build-to-runtime traceability before any real launch phase.');
  }
  if (state === 'RUNTIME_READY_WITH_WARNINGS') {
    actions.push('Resolve warning-level gaps in dry-run verification and build output chain.');
  }
  if (state === 'RUNTIME_NOT_READY') {
    actions.push('Complete build output proof and dry-run verification before claiming runtime readiness.');
  }
  if (state === 'RUNTIME_BLOCKED') {
    actions.push('Clear blockers in build execution, snapshot, or verifier authorities.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before claiming runtime readiness proof.');
  }
  actions.push(...snapshot.connectedBuildExecutionAssessment.report.recommendedNextActions);
  actions.push(...snapshot.dryRunVerifierAssessment.blockingReasons.map((reason) => `Resolve: ${reason}`));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

export function assessConnectedRuntimeActivation(
  input: AssessConnectedRuntimeActivationInput = {},
): ConnectedRuntimeActivationAssessment {
  const { connectedBuildExecutionAssessment, dryRunVerifierAssessment } = resolveAssessments(input);
  const inputSnapshot = buildInputSnapshot(connectedBuildExecutionAssessment, dryRunVerifierAssessment);
  const runtimeActivationCandidate = buildRuntimeActivationCandidate(inputSnapshot);
  const runtimeActivationContract = buildRuntimeActivationContract(inputSnapshot, runtimeActivationCandidate);
  const questionAnswers = deriveRuntimeActivationQuestionAnswers(
    inputSnapshot,
    runtimeActivationCandidate,
    runtimeActivationContract,
  );
  const runtimeReadinessScore = deriveRuntimeReadinessScore(questionAnswers);
  const runtimeState = deriveRuntimeState(inputSnapshot, questionAnswers);
  const activationId = nextActivationId();

  const blockingReasons = dedupeStrings([
    ...inputSnapshot.connectedBuildExecutionAssessment.report.blockingReasons,
    ...inputSnapshot.dryRunVerifierAssessment.blockingReasons,
    ...inputSnapshot.disposableWorkspaceInstantiatorAssessment.blockingReasons,
    ...inputSnapshot.repositorySnapshotMaterializerAssessment.blockingReasons,
  ]);

  const warningReasons = dedupeStrings([
    ...inputSnapshot.connectedBuildExecutionAssessment.report.warningReasons,
    ...inputSnapshot.dryRunVerifierAssessment.warningReasons,
    ...inputSnapshot.disposableWorkspaceCreatorAssessment.warningReasons,
    ...inputSnapshot.disposableWorkspaceInstantiatorAssessment.warningReasons,
  ]);

  const report: ConnectedRuntimeActivationReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_RUNTIME_ACTIVATION_CORE_QUESTION,
    activationId,
    generatedAt: new Date().toISOString(),
    runtimeReadinessScore,
    runtimeState,
    activationCompleteness: deriveActivationCompleteness(runtimeActivationContract),
    dependencyCompleteness: deriveDependencyCompleteness(runtimeActivationContract),
    proofCompleteness: deriveRuntimeProofCompleteness(runtimeActivationContract),
    missingRuntimeComponents: buildMissingComponents(inputSnapshot, questionAnswers),
    runtimeActivationPath: buildRuntimeActivationPath(inputSnapshot),
    recommendedNextActions: buildRecommendedActions(inputSnapshot, runtimeState),
    questionAnswers,
    runtimeActivationCandidate,
    runtimeActivationContract,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(activationId, runtimeState, runtimeReadinessScore),
  };

  const assessment: ConnectedRuntimeActivationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_ACTIVATION_COMPLETE',
    report,
  };

  recordConnectedRuntimeActivationAssessment(assessment);
  return assessment;
}

export function buildConnectedRuntimeActivationArtifacts(
  input: AssessConnectedRuntimeActivationInput = {},
): ConnectedRuntimeActivationArtifacts {
  const connectedRuntimeActivationAssessment = assessConnectedRuntimeActivation(input);
  return {
    connectedRuntimeActivationAssessment,
    connectedRuntimeActivationReportMarkdown: buildConnectedRuntimeActivationReportMarkdown(
      connectedRuntimeActivationAssessment.report,
    ),
  };
}

export function resetConnectedRuntimeActivationModuleForTests(): void {
  resetConnectedRuntimeActivationHistoryForTests();
  resetConnectedRuntimeActivationCounterForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetWorld2DryRunExecutionVerifierModuleForTests();
}
