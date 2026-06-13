/**
 * Connected Autonomous Build Execution Foundation — plan-to-build-output bridge authority.
 * Read-only orchestration — consumes existing authorities only.
 */

import { createHash } from 'node:crypto';
import {
  assessAutonomousBuilderExecutionPlanner,
  resetAutonomousBuilderExecutionPlannerModuleForTests,
} from '../autonomous-builder-execution-planner/index.js';
import type { ExecutionPlannerAssessment } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import { resetAutonomousRepairLoopModuleForTests } from '../autonomous-repair-loop/index.js';
import type { AutonomousRepairLoopAssessment } from '../autonomous-repair-loop/autonomous-repair-loop-types.js';
import {
  assessWorld2DryRunExecutionComposer,
  resetWorld2DryRunExecutionComposerModuleForTests,
} from '../world2-dry-run-execution-composer/index.js';
import type { World2DryRunExecutionComposerAssessment } from '../world2-dry-run-execution-composer/world2-dry-run-execution-composer-types.js';
import {
  recordConnectedBuildExecutionAssessment,
  resetConnectedBuildExecutionHistoryForTests,
} from './connected-build-execution-history.js';
import { buildConnectedBuildExecutionReportMarkdown } from './connected-build-execution-report-builder.js';
import {
  CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
  CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS_TOKEN,
  MAX_MANIFEST_ENTRIES,
  MAX_MISSING_COMPONENTS,
  MAX_RECOMMENDED_ACTIONS,
} from './connected-build-execution-registry.js';
import type {
  AssessConnectedBuildExecutionInput,
  BuildOutputArtifactEntry,
  BuildOutputManifest,
  BuildOutputManifestEntry,
  BuildOutputQuestionAnswers,
  BuildOutputState,
  ConnectedBuildExecutionArtifacts,
  ConnectedBuildExecutionAssessment,
  ConnectedBuildExecutionInputSnapshot,
  ConnectedBuildExecutionReport,
} from './connected-build-execution-types.js';

let connectionCounter = 0;

export function resetConnectedBuildExecutionCounterForTests(): void {
  connectionCounter = 0;
}

function nextConnectionId(): string {
  connectionCounter += 1;
  return `connected-build-execution-${connectionCounter}`;
}

function stableCacheKey(connectionId: string, state: BuildOutputState, score: number): string {
  const digest = createHash('sha256')
    .update([CONNECTED_BUILD_EXECUTION_FOUNDATION_PASS_TOKEN, connectionId, state, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX}:${digest}`;
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

function manifestEntry(path: string, sourceAuthority: string, purpose: string): BuildOutputManifestEntry {
  return { readOnly: true, path, sourceAuthority, purpose };
}

function artifactEntry(
  name: string,
  path: string | null,
  category: string,
  sourceAuthority: string,
): BuildOutputArtifactEntry {
  return { readOnly: true, name, path, category, sourceAuthority };
}

function extractExecutionPlannerFromDryRun(
  dryRunComposerAssessment: World2DryRunExecutionComposerAssessment,
): ExecutionPlannerAssessment | null {
  const materializer = dryRunComposerAssessment.inputSnapshot.changeSetMaterializerAssessment;
  const population = materializer.inputSnapshot.materializationAssessment.inputSnapshot.populationAssessment;
  const changeSet = population.inputSnapshot.changeSetAssessment;
  const disposable = changeSet.inputSnapshot.disposableWorkspaceAssessment;
  const engine = disposable.inputSnapshot.engineAssessment;
  const runtime = engine.inputSnapshot.runtimeAssessment;
  return runtime.inputSnapshot.sandboxAssessment.inputSnapshot.executionPlannerAssessment;
}

function resolveAssessments(input: AssessConnectedBuildExecutionInput): {
  repairLoopAssessment: AutonomousRepairLoopAssessment;
  executionPlannerAssessment: ExecutionPlannerAssessment;
  dryRunComposerAssessment: World2DryRunExecutionComposerAssessment;
} {
  const dryRunComposerAssessment =
    input.dryRunComposerAssessment ??
    assessWorld2DryRunExecutionComposer({
      rootDir: input.rootDir ?? process.cwd(),
    });

  const executionPlannerAssessment =
    input.executionPlannerAssessment ??
    extractExecutionPlannerFromDryRun(dryRunComposerAssessment) ??
    assessAutonomousBuilderExecutionPlanner({ rootDir: input.rootDir ?? process.cwd() });

  const repairLoopAssessment =
    input.repairLoopAssessment ?? executionPlannerAssessment.inputSnapshot.repairLoopAssessment;

  return { repairLoopAssessment, executionPlannerAssessment, dryRunComposerAssessment };
}

export function buildBuildOutputManifest(
  snapshot: ConnectedBuildExecutionInputSnapshot,
): BuildOutputManifest {
  const plan = snapshot.executionPlannerAssessment.plan;
  const materializer = snapshot.changeSetMaterializerAssessment.materializationOperation;
  const blueprint = snapshot.workspaceMaterializationAssessment.blueprint;
  const contract = snapshot.workspaceMaterializationAssessment.materializationContract;
  const dryRunPackage = snapshot.dryRunComposerAssessment.executionPackage;
  const workspaceId =
    snapshot.dryRunComposerAssessment.workspaceId ??
    snapshot.changeSetMaterializerAssessment.workspaceId ??
    'world2-build-output';

  const filesToCreate: BuildOutputManifestEntry[] = [];
  const filesToModify: BuildOutputManifestEntry[] = [];
  const directoriesToCreate: BuildOutputManifestEntry[] = [];
  const expectedArtifacts: BuildOutputArtifactEntry[] = [];
  const verificationArtifacts: BuildOutputArtifactEntry[] = [];
  const rollbackArtifacts: BuildOutputArtifactEntry[] = [];
  const proofArtifacts: BuildOutputArtifactEntry[] = [];

  if (materializer) {
    for (const path of materializer.plannedFileCreates) {
      filesToCreate.push(
        manifestEntry(path, 'world2-change-set-materializer', 'Planned file create from change materialization'),
      );
    }
    for (const path of materializer.plannedFileModifies) {
      filesToModify.push(
        manifestEntry(path, 'world2-change-set-materializer', 'Planned file modify from change materialization'),
      );
    }
    for (const path of materializer.plannedDirectoryCreates) {
      directoriesToCreate.push(
        manifestEntry(path, 'world2-change-set-materializer', 'Planned directory create from change materialization'),
      );
    }
    for (const entry of materializer.rollbackMap) {
      rollbackArtifacts.push(
        artifactEntry(entry.operationId, entry.targetPath, 'rollback', 'world2-change-set-materializer'),
      );
    }
  }

  if (blueprint) {
    for (const file of blueprint.files) {
      filesToCreate.push(
        manifestEntry(file.path, 'world2-workspace-materialization', file.purpose),
      );
    }
    for (const dir of blueprint.directories) {
      directoriesToCreate.push(
        manifestEntry(dir.path, 'world2-workspace-materialization', dir.purpose),
      );
    }
    for (const artifact of blueprint.artifacts) {
      expectedArtifacts.push(
        artifactEntry(artifact.name, artifact.path, artifact.category, 'world2-workspace-materialization'),
      );
    }
    for (const asset of blueprint.validationAssets) {
      verificationArtifacts.push(
        artifactEntry(asset, null, 'validation', 'world2-workspace-materialization'),
      );
    }
    for (const asset of blueprint.rollbackAssets) {
      rollbackArtifacts.push(
        artifactEntry(asset, null, 'rollback', 'world2-workspace-materialization'),
      );
    }
  }

  if (contract) {
    for (const artifact of contract.plannedArtifacts) {
      expectedArtifacts.push(
        artifactEntry(artifact, null, 'planned', 'world2-workspace-materialization'),
      );
    }
  }

  for (const artifact of snapshot.workspacePopulationAssessment.requiredArtifacts) {
    expectedArtifacts.push(
      artifactEntry(artifact.name, artifact.path, artifact.category, 'world2-workspace-population'),
    );
  }

  const snapshotScope = snapshot.repositorySnapshotAssessment.snapshotScope;
  if (snapshotScope?.snapshotManifest) {
    for (const included of snapshotScope.includedPaths.slice(0, 8)) {
      proofArtifacts.push(
        artifactEntry(included, included, 'snapshot-included', 'world2-repository-snapshot'),
      );
    }
  }

  if (plan) {
    for (const step of plan.steps) {
      proofArtifacts.push(
        artifactEntry(step.title, null, 'execution-plan-step', 'autonomous-builder-execution-planner'),
      );
    }
    proofArtifacts.push(
      artifactEntry(plan.planType, null, 'execution-plan-type', 'autonomous-builder-execution-planner'),
    );
  }

  if (dryRunPackage) {
    for (const step of dryRunPackage.validationSteps) {
      verificationArtifacts.push(
        artifactEntry(step.validationId, null, 'dry-run-validation', 'world2-dry-run-execution-composer'),
      );
    }
    for (const step of dryRunPackage.rollbackSteps) {
      rollbackArtifacts.push(
        artifactEntry(step.rollbackId, step.targetScope, 'dry-run-rollback', 'world2-dry-run-execution-composer'),
      );
    }
    for (const step of dryRunPackage.orderedSteps) {
      proofArtifacts.push(
        artifactEntry(step.label, null, 'dry-run-step', 'world2-dry-run-execution-composer'),
      );
    }
  }

  return {
    readOnly: true,
    manifestId: `build-output-manifest-${workspaceId}`,
    workspaceId,
    planId: plan?.planId ?? null,
    filesToCreate: filesToCreate.slice(0, MAX_MANIFEST_ENTRIES),
    filesToModify: filesToModify.slice(0, MAX_MANIFEST_ENTRIES),
    directoriesToCreate: dedupeStrings(directoriesToCreate.map((entry) => entry.path))
      .map((path) =>
        directoriesToCreate.find((entry) => entry.path === path)!,
      )
      .slice(0, MAX_MANIFEST_ENTRIES),
    expectedArtifacts: expectedArtifacts.slice(0, MAX_MANIFEST_ENTRIES),
    verificationArtifacts: verificationArtifacts.slice(0, MAX_MANIFEST_ENTRIES),
    rollbackArtifacts: rollbackArtifacts.slice(0, MAX_MANIFEST_ENTRIES),
    proofArtifacts: proofArtifacts.slice(0, MAX_MANIFEST_ENTRIES),
    realFileMutationPerformed: false,
  };
}

export function deriveBuildOutputQuestionAnswers(
  snapshot: ConnectedBuildExecutionInputSnapshot,
  manifest: BuildOutputManifest,
): BuildOutputQuestionAnswers {
  const plan = snapshot.executionPlannerAssessment.plan;
  const changeSet = snapshot.changeSetAssessment.changeSet;
  const blueprint = snapshot.workspaceMaterializationAssessment.blueprint;
  const blueprintValid = snapshot.workspaceMaterializationAssessment.blueprintValidation?.valid ?? false;
  const packageReady =
    snapshot.dryRunComposerAssessment.packageState === 'DRY_RUN_PACKAGE_READY' ||
    snapshot.dryRunComposerAssessment.packageState === 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS';

  const executionPlanExists = plan !== null && snapshot.executionPlannerAssessment.planExecutable;
  const validChangeSetExists =
    changeSet !== null &&
    (snapshot.changeSetAssessment.eligibilityState === 'READY' ||
      snapshot.changeSetAssessment.eligibilityState === 'READY_WITH_WARNINGS');
  const validWorkspaceBlueprintExists = blueprint !== null && blueprintValid;
  const validArtifactManifestExists =
    manifest.expectedArtifacts.length > 0 ||
    manifest.filesToCreate.length > 0 ||
    manifest.directoriesToCreate.length > 0;
  const outputsTraceable = manifest.planId !== null && manifest.proofArtifacts.length > 0;
  const outputsVerifiable =
    manifest.verificationArtifacts.length > 0 ||
    (snapshot.dryRunComposerAssessment.executionPackage?.validationSteps.length ?? 0) > 0;
  const outputsReproducible =
    snapshot.changeSetMaterializerAssessment.materializationOperation?.mode === 'DRY_RUN' ||
    snapshot.changeSetMaterializerAssessment.materializationOperation?.mode ===
      'SIMULATED_CHANGE_MATERIALIZATION';
  const founderInspectable =
    manifest.filesToCreate.length + manifest.expectedArtifacts.length >= 1 &&
    snapshot.executionPlannerAssessment.plan !== null;
  const buildChainComplete =
    executionPlanExists &&
    validChangeSetExists &&
    validWorkspaceBlueprintExists &&
    packageReady &&
    snapshot.missingAuthorities.length === 0;

  const buildOutputProven =
    buildChainComplete &&
    outputsTraceable &&
    outputsVerifiable &&
    snapshot.dryRunComposerAssessment.packageState === 'DRY_RUN_PACKAGE_READY';

  return {
    executionPlanExists,
    validChangeSetExists,
    validWorkspaceBlueprintExists,
    validArtifactManifestExists,
    outputsTraceable,
    outputsVerifiable,
    outputsReproducible,
    founderInspectable,
    buildChainComplete,
    buildOutputProven,
  };
}

export function deriveBuildOutputScore(answers: BuildOutputQuestionAnswers): number {
  const values = Object.values(answers);
  const yesCount = values.filter(Boolean).length;
  return Math.round((yesCount / values.length) * 100);
}

export function deriveOutputCompleteness(manifest: BuildOutputManifest): number {
  const components = [
    manifest.filesToCreate.length > 0,
    manifest.filesToModify.length > 0 || manifest.filesToCreate.length > 0,
    manifest.directoriesToCreate.length > 0,
    manifest.expectedArtifacts.length > 0,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveProofCompleteness(manifest: BuildOutputManifest): number {
  const components = [
    manifest.proofArtifacts.length > 0,
    manifest.verificationArtifacts.length > 0,
    manifest.rollbackArtifacts.length > 0,
    manifest.planId !== null,
  ];
  return Math.round((components.filter(Boolean).length / components.length) * 100);
}

export function deriveBuildOutputState(
  snapshot: ConnectedBuildExecutionInputSnapshot,
  answers: BuildOutputQuestionAnswers,
): BuildOutputState {
  if (snapshot.missingAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    snapshot.repairLoopAssessment.decision.loopState === 'STOPPED' ||
    snapshot.repairLoopAssessment.decision.recommendedAction === 'STOP' ||
    snapshot.changeSetAssessment.eligibilityState === 'BLOCKED' ||
    snapshot.workspaceMaterializationAssessment.materializationState === 'BLOCKED' ||
    snapshot.dryRunComposerAssessment.packageState === 'DRY_RUN_PACKAGE_BLOCKED' ||
    snapshot.repositorySnapshotAssessment.snapshotState === 'SNAPSHOT_BLOCKED'
  ) {
    return 'BUILD_OUTPUT_BLOCKED';
  }

  if (
    snapshot.dryRunComposerAssessment.packageState === 'INSUFFICIENT_EVIDENCE' ||
    snapshot.changeSetMaterializerAssessment.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    snapshot.workspacePopulationAssessment.readinessState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (answers.buildOutputProven) {
    return 'BUILD_OUTPUT_PROVEN';
  }

  if (
    answers.buildChainComplete &&
    (snapshot.dryRunComposerAssessment.packageState === 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS' ||
      snapshot.workspaceMaterializationAssessment.materializationState === 'READY_WITH_WARNINGS')
  ) {
    return 'BUILD_OUTPUT_PARTIALLY_PROVEN';
  }

  return 'BUILD_OUTPUT_NOT_PROVEN';
}

function buildMissingComponents(
  snapshot: ConnectedBuildExecutionInputSnapshot,
  answers: BuildOutputQuestionAnswers,
): string[] {
  const missing: string[] = [];
  if (!answers.executionPlanExists) missing.push('Approved execution plan');
  if (!answers.validChangeSetExists) missing.push('Valid change set');
  if (!answers.validWorkspaceBlueprintExists) missing.push('Valid workspace blueprint');
  if (!answers.validArtifactManifestExists) missing.push('Artifact manifest entries');
  if (!answers.outputsTraceable) missing.push('Traceable plan-to-output linkage');
  if (!answers.outputsVerifiable) missing.push('Verification artifact coverage');
  if (!answers.outputsReproducible) missing.push('Reproducible dry-run materialization mode');
  if (!answers.founderInspectable) missing.push('Founder-inspectable expected outputs');
  if (!answers.buildChainComplete) missing.push('Complete plan-to-build chain');
  for (const authority of snapshot.missingAuthorities) {
    missing.push(`Missing authority: ${authority}`);
  }
  for (const artifact of snapshot.workspacePopulationAssessment.missingArtifacts) {
    missing.push(`Missing population artifact: ${artifact.name}`);
  }
  for (const gap of snapshot.workspaceMaterializationAssessment.blueprintValidation?.missingCriticalAssets ??
    []) {
    missing.push(`Blueprint gap: ${gap}`);
  }
  return dedupeStrings(missing).slice(0, MAX_MISSING_COMPONENTS);
}

function buildRecommendedActions(
  snapshot: ConnectedBuildExecutionInputSnapshot,
  state: BuildOutputState,
): string[] {
  const actions: string[] = [];
  if (state === 'BUILD_OUTPUT_PROVEN') {
    actions.push('Maintain plan-to-build traceability before any real execution phase.');
  }
  if (state === 'BUILD_OUTPUT_PARTIALLY_PROVEN') {
    actions.push('Resolve warning-level gaps in workspace materialization and dry-run package.');
  }
  if (state === 'BUILD_OUTPUT_NOT_PROVEN') {
    actions.push('Complete execution plan, change set, blueprint, and dry-run package chain.');
  }
  if (state === 'BUILD_OUTPUT_BLOCKED') {
    actions.push('Clear blockers in repair loop, change set, or snapshot authorities.');
  }
  if (state === 'INSUFFICIENT_EVIDENCE') {
    actions.push('Restore missing upstream authority outputs before claiming build output proof.');
  }
  actions.push(...snapshot.executionPlannerAssessment.plan?.successCriteria ?? []);
  const escalationGuidance = snapshot.repairLoopAssessment.decision.escalationGuidance;
  if (escalationGuidance) {
    actions.push(escalationGuidance.whyEscalationHappened, escalationGuidance.whyLoopStopped);
    actions.push(...escalationGuidance.missingCapabilitySuggestions);
    actions.push(...escalationGuidance.missingEvidenceSuggestions);
    actions.push(...escalationGuidance.diagnosticRecommendations);
  }
  actions.push(...snapshot.dryRunComposerAssessment.blockingReasons.map((reason) => `Resolve: ${reason}`));
  return dedupeStrings(actions).slice(0, MAX_RECOMMENDED_ACTIONS);
}

function buildInputSnapshot(
  repairLoopAssessment: AutonomousRepairLoopAssessment,
  executionPlannerAssessment: ExecutionPlannerAssessment,
  dryRunComposerAssessment: World2DryRunExecutionComposerAssessment,
): ConnectedBuildExecutionInputSnapshot {
  const changeSetMaterializerAssessment = dryRunComposerAssessment.inputSnapshot.changeSetMaterializerAssessment;
  const materializerSnapshot = changeSetMaterializerAssessment.inputSnapshot;
  const snapshotMaterializerSnapshot = materializerSnapshot.snapshotMaterializerAssessment.inputSnapshot;

  const missingAuthorities = dedupeStrings([
    ...dryRunComposerAssessment.inputSnapshot.missingAuthorities,
    ...changeSetMaterializerAssessment.inputSnapshot.missingAuthorities,
    ...materializerSnapshot.materializationAssessment.inputSnapshot.missingAuthorities,
  ]);

  return {
    readOnly: true,
    repairLoopAssessment,
    executionPlannerAssessment,
    executionEngineAssessment: dryRunComposerAssessment.inputSnapshot.engineAssessment,
    changeSetAssessment: materializerSnapshot.changeSetAssessment,
    workspacePopulationAssessment: materializerSnapshot.materializationAssessment.inputSnapshot.populationAssessment,
    workspaceMaterializationAssessment: materializerSnapshot.materializationAssessment,
    repositorySnapshotAssessment: snapshotMaterializerSnapshot.repositorySnapshotAssessment,
    changeSetMaterializerAssessment,
    dryRunComposerAssessment,
    missingAuthorities,
  };
}

export function assessConnectedAutonomousBuildExecution(
  input: AssessConnectedBuildExecutionInput = {},
): ConnectedBuildExecutionAssessment {
  const { repairLoopAssessment, executionPlannerAssessment, dryRunComposerAssessment } =
    resolveAssessments(input);

  const inputSnapshot = buildInputSnapshot(
    repairLoopAssessment,
    executionPlannerAssessment,
    dryRunComposerAssessment,
  );
  const buildOutputManifest = buildBuildOutputManifest(inputSnapshot);
  const questionAnswers = deriveBuildOutputQuestionAnswers(inputSnapshot, buildOutputManifest);
  const buildOutputScore = deriveBuildOutputScore(questionAnswers);
  const buildOutputState = deriveBuildOutputState(inputSnapshot, questionAnswers);
  const connectionId = nextConnectionId();

  const blockingReasons = dedupeStrings([
    ...inputSnapshot.dryRunComposerAssessment.blockingReasons,
    ...inputSnapshot.changeSetMaterializerAssessment.blockingReasons,
    ...inputSnapshot.changeSetAssessment.blockingReasons,
    ...inputSnapshot.workspaceMaterializationAssessment.blockingReasons,
    ...inputSnapshot.repositorySnapshotAssessment.blockingReasons,
  ]);

  const warningReasons = dedupeStrings([
    ...inputSnapshot.dryRunComposerAssessment.warningReasons,
    ...inputSnapshot.changeSetMaterializerAssessment.warningReasons,
    ...inputSnapshot.workspaceMaterializationAssessment.warningReasons,
    ...inputSnapshot.workspacePopulationAssessment.warningReasons,
  ]);

  const report: ConnectedBuildExecutionReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
    connectionId,
    generatedAt: new Date().toISOString(),
    buildOutputScore,
    buildOutputState,
    outputCompleteness: deriveOutputCompleteness(buildOutputManifest),
    proofCompleteness: deriveProofCompleteness(buildOutputManifest),
    missingBuildComponents: buildMissingComponents(inputSnapshot, questionAnswers),
    expectedGeneratedFiles: dedupeStrings([
      ...buildOutputManifest.filesToCreate.map((entry) => entry.path),
      ...buildOutputManifest.filesToModify.map((entry) => entry.path),
    ]).slice(0, MAX_MANIFEST_ENTRIES),
    expectedGeneratedArtifacts: buildOutputManifest.expectedArtifacts.map((entry) => entry.name).slice(0, MAX_MANIFEST_ENTRIES),
    recommendedNextActions: buildRecommendedActions(inputSnapshot, buildOutputState),
    questionAnswers,
    buildOutputManifest,
    inputSnapshot,
    blockingReasons,
    warningReasons,
    cacheKey: stableCacheKey(connectionId, buildOutputState, buildOutputScore),
  };

  const assessment: ConnectedBuildExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'BUILD_OUTPUT_COMPLETE',
    report,
  };

  recordConnectedBuildExecutionAssessment(assessment);
  return assessment;
}

export function buildConnectedBuildExecutionArtifacts(
  input: AssessConnectedBuildExecutionInput = {},
): ConnectedBuildExecutionArtifacts {
  const connectedBuildExecutionAssessment = assessConnectedAutonomousBuildExecution(input);
  return {
    connectedBuildExecutionAssessment,
    connectedBuildExecutionReportMarkdown: buildConnectedBuildExecutionReportMarkdown(
      connectedBuildExecutionAssessment.report,
    ),
  };
}

export function resetConnectedBuildExecutionModuleForTests(): void {
  resetConnectedBuildExecutionHistoryForTests();
  resetConnectedBuildExecutionCounterForTests();
  resetAutonomousRepairLoopModuleForTests();
  resetAutonomousBuilderExecutionPlannerModuleForTests();
  resetWorld2DryRunExecutionComposerModuleForTests();
}
