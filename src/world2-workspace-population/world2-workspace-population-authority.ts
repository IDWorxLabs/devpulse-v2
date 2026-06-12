/**
 * World 2 Workspace Population — population requirements authority.
 * Defines workspace contents only — never creates workspaces or copies files.
 */

import { createHash } from 'node:crypto';
import type { ExecutionPlan } from '../autonomous-builder-execution-planner/autonomous-builder-execution-planner-types.js';
import {
  assessFounderTestIntegration,
  resetFounderTestIntegrationModuleForTests,
} from '../founder-test-integration/index.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import {
  assessWorld2ChangeSetAuthority,
  resetWorld2ChangeSetAuthorityModuleForTests,
} from '../world2-change-set-authority/index.js';
import type { World2ChangeSetAssessment } from '../world2-change-set-authority/world2-change-set-types.js';
import type { World2DisposableWorkspaceAssessment } from '../world2-disposable-workspace/world2-disposable-workspace-types.js';
import {
  BASE_REQUIRED_DIRECTORIES,
  MAX_POPULATION_ARTIFACTS,
  MAX_POPULATION_REASONS,
  WORLD2_POPULATION_CACHE_KEY_PREFIX,
  WORLD2_POPULATION_CORE_QUESTION,
  WORLD2_WORKSPACE_POPULATION_OWNER_MODULE,
  WORLD2_WORKSPACE_POPULATION_PASS_TOKEN,
  WORLD2_WORKSPACE_POPULATION_PHASE,
  clampPopulationReadinessPercent,
  resolveWorld2PopulationPath,
} from './world2-workspace-population-registry.js';
import {
  recordWorld2WorkspacePopulationAssessment,
  resetWorld2WorkspacePopulationHistoryForTests,
} from './world2-workspace-population-history.js';
import { buildWorld2WorkspacePopulationReportMarkdown } from './world2-workspace-population-report-builder.js';
import type {
  AssessWorld2WorkspacePopulationInput,
  World2PopulationArtifact,
  World2PopulationCategory,
  World2PopulationInputSnapshot,
  World2PopulationReadinessState,
  World2WorkspacePopulationContract,
  World2WorkspacePopulationReport,
  WorkspacePopulationAssessment,
} from './world2-workspace-population-types.js';

let populationCounter = 0;
let artifactCounter = 0;

export function resetWorld2WorkspacePopulationCounterForTests(): void {
  populationCounter = 0;
  artifactCounter = 0;
}

function nextPopulationId(): string {
  populationCounter += 1;
  return `world2-population-${populationCounter}`;
}

function nextArtifactId(): string {
  artifactCounter += 1;
  return `world2-artifact-${artifactCounter}`;
}

function stableCacheKey(populationId: string, state: World2PopulationReadinessState): string {
  const digest = createHash('sha256')
    .update([WORLD2_WORKSPACE_POPULATION_OWNER_MODULE, populationId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_POPULATION_CACHE_KEY_PREFIX}:${digest}`;
}

function dedupe(items: string[]): string[] {
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

function resolveInputSnapshot(
  input: AssessWorld2WorkspacePopulationInput,
): World2PopulationInputSnapshot {
  const changeSetAssessment =
    input.changeSetAssessment ?? assessWorld2ChangeSetAuthority(input);

  const disposableWorkspaceAssessment =
    changeSetAssessment.inputSnapshot.disposableWorkspaceAssessment;
  const plan = changeSetAssessment.inputSnapshot.plan;

  let founderTestAssessment: FounderTestAssessment | null = input.founderTestAssessment ?? null;
  if (!founderTestAssessment && plan) {
    founderTestAssessment =
      changeSetAssessment.inputSnapshot.engineAssessment.inputSnapshot.runtimeAssessment
        .inputSnapshot.executionPlannerAssessment.inputSnapshot.founderTestAssessment;
  }
  if (!founderTestAssessment && input.rootDir) {
    founderTestAssessment = assessFounderTestIntegration({ rootDir: input.rootDir });
  }

  const missingAuthorities: string[] = dedupe([
    ...changeSetAssessment.inputSnapshot.missingAuthorities,
    ...disposableWorkspaceAssessment.inputSnapshot.missingAuthorities,
  ]);

  if (!founderTestAssessment) {
    missingAuthorities.push('founder-test-integration');
  }

  return {
    disposableWorkspaceAssessment,
    changeSetAssessment,
    founderTestAssessment,
    plan,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function artifact(
  category: World2PopulationCategory,
  name: string,
  path: string | null,
  required: boolean,
  present: boolean,
): World2PopulationArtifact {
  return {
    readOnly: true,
    artifactId: nextArtifactId(),
    category,
    name,
    path,
    required,
    present,
  };
}

export interface PopulationReadinessContext {
  missingAuthorities: string[];
  changeSetState: World2ChangeSetAssessment['eligibilityState'];
  workspaceState: World2DisposableWorkspaceAssessment['workspaceState'];
  founderTestVerdict: FounderTestAssessment['verdict'] | null;
  criticalMissingCount: number;
  minorMissingCount: number;
  hasValidationContext: boolean;
  hasRollbackContext: boolean;
  hasRequirementsContext: boolean;
  hasArchitectureContext: boolean;
}

export function derivePopulationReadinessState(
  context: PopulationReadinessContext,
): World2PopulationReadinessState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration') ||
    context.founderTestVerdict === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    !context.hasArchitectureContext ||
    !context.hasRequirementsContext ||
    !context.hasRollbackContext ||
    !context.hasValidationContext ||
    context.changeSetState === 'BLOCKED' ||
    context.workspaceState === 'BLOCKED' ||
    context.criticalMissingCount > 0
  ) {
    return 'BLOCKED';
  }

  if (
    context.minorMissingCount > 0 ||
    context.changeSetState === 'READY_WITH_WARNINGS' ||
    context.workspaceState === 'READY_WITH_WARNINGS' ||
    context.founderTestVerdict === 'FOUNDER_READY_WITH_WARNINGS'
  ) {
    return 'READY_WITH_WARNINGS';
  }

  if (
    context.changeSetState === 'READY' &&
    context.workspaceState === 'READY'
  ) {
    return 'READY';
  }

  return 'BLOCKED';
}

function buildPopulationArtifacts(
  snapshot: World2PopulationInputSnapshot,
  workspaceId: string,
): World2PopulationArtifact[] {
  const plan = snapshot.plan;
  const changeSet = snapshot.changeSetAssessment.changeSet;
  const founderTest = snapshot.founderTestAssessment;
  const workspace = snapshot.disposableWorkspaceAssessment;

  const hasPlan = plan !== null;
  const hasChangeSet = changeSet !== null;
  const hasFounderTest = founderTest !== null;
  const requirementSignal =
    hasFounderTest && founderTest.summary.requirementRealityAboveThreshold;
  const architectureSignal =
    hasPlan && plan.verificationPlan.validationStrategy.trim().length > 0;
  const validationSignal =
    hasChangeSet && changeSet.verificationRequirements.length > 0;
  const rollbackSignal =
    hasChangeSet && changeSet.rollbackRequirements.length > 0;
  const executionSignal = hasPlan && hasChangeSet;

  const artifacts: World2PopulationArtifact[] = [
    artifact(
      'PROJECT_STRUCTURE',
      'Disposable workspace root boundary',
      resolveWorld2PopulationPath(workspaceId, ''),
      true,
      workspace.workspaceContract !== null,
    ),
    ...BASE_REQUIRED_DIRECTORIES.map((dir) =>
      artifact(
        'PROJECT_STRUCTURE',
        `Directory scaffold: ${dir}`,
        resolveWorld2PopulationPath(workspaceId, dir),
        true,
        workspace.workspaceState === 'READY' || workspace.workspaceState === 'READY_WITH_WARNINGS',
      ),
    ),
    artifact(
      'PROJECT_FILES',
      'Change set manifest',
      resolveWorld2PopulationPath(workspaceId, 'audit/change-set-manifest.json'),
      true,
      hasChangeSet,
    ),
    ...(changeSet?.operations
      .filter((op) => op.operationType !== 'NO_CHANGE')
      .slice(0, 6)
      .map((op) =>
        artifact(
          'PROJECT_FILES',
          `Planned file: ${op.operationType}`,
          op.targetPath,
          true,
          op.allowed,
        ),
      ) ?? []),
    artifact(
      'REQUIREMENTS',
      'Founder requirement reality context',
      resolveWorld2PopulationPath(workspaceId, 'requirements/founder-requirements.json'),
      true,
      requirementSignal,
    ),
    artifact(
      'REQUIREMENTS',
      'Plan success criteria bundle',
      resolveWorld2PopulationPath(workspaceId, 'requirements/success-criteria.json'),
      true,
      hasPlan && (plan?.successCriteria.length ?? 0) > 0,
    ),
    artifact(
      'ARCHITECTURE',
      'Architecture validation context',
      resolveWorld2PopulationPath(workspaceId, 'architecture/population-context.md'),
      true,
      architectureSignal,
    ),
    artifact(
      'ARCHITECTURE',
      'Deep architecture trace (optional)',
      resolveWorld2PopulationPath(workspaceId, 'architecture/deep-trace.md'),
      false,
      hasFounderTest && founderTest.score.overall >= 80,
    ),
    artifact(
      'EXECUTION_CONTEXT',
      'Execution plan binding',
      resolveWorld2PopulationPath(workspaceId, 'execution/plan-binding.json'),
      true,
      executionSignal,
    ),
    artifact(
      'EXECUTION_CONTEXT',
      'Engine run reference',
      resolveWorld2PopulationPath(workspaceId, 'execution/engine-run.json'),
      true,
      snapshot.changeSetAssessment.inputSnapshot.engineAssessment.engineRunId.length > 0,
    ),
    artifact(
      'VALIDATION_CONTEXT',
      'Validation asset bundle',
      resolveWorld2PopulationPath(workspaceId, 'validation/validation-bundle.json'),
      true,
      validationSignal,
    ),
    artifact(
      'VALIDATION_CONTEXT',
      'Founder test validation snapshot',
      resolveWorld2PopulationPath(workspaceId, 'validation/founder-test.json'),
      true,
      hasFounderTest && founderTest.verdict !== 'INSUFFICIENT_EVIDENCE',
    ),
    artifact(
      'ROLLBACK_CONTEXT',
      'Rollback asset bundle',
      resolveWorld2PopulationPath(workspaceId, 'rollback/rollback-bundle.json'),
      true,
      rollbackSignal,
    ),
    artifact(
      'ROLLBACK_CONTEXT',
      'Rollback reference from workspace contract',
      resolveWorld2PopulationPath(workspaceId, 'rollback/contract-reference.json'),
      true,
      workspace.workspaceContract?.rollbackReference !== null &&
        workspace.workspaceContract?.rollbackReference !== undefined,
    ),
  ];

  return artifacts.slice(0, MAX_POPULATION_ARTIFACTS);
}

function computePopulationReadiness(artifacts: World2PopulationArtifact[]): number {
  const required = artifacts.filter((a) => a.required);
  if (required.length === 0) return 0;
  const present = required.filter((a) => a.present).length;
  return clampPopulationReadinessPercent((present / required.length) * 100);
}

function buildPopulationContract(
  workspaceId: string,
  artifacts: World2PopulationArtifact[],
  plan: ExecutionPlan | null,
  changeSet: World2ChangeSetAssessment['changeSet'],
): World2WorkspacePopulationContract {
  return {
    readOnly: true,
    contractId: `world2-population-contract-${workspaceId}`,
    workspaceId,
    requiredArtifacts: artifacts.filter((a) => a.required).map((a) => a.name),
    requiredDirectories: dedupe(
      artifacts
        .filter((a) => a.category === 'PROJECT_STRUCTURE' && a.path)
        .map((a) => a.path as string),
    ),
    requiredFiles: dedupe(
      artifacts
        .filter((a) => a.category === 'PROJECT_FILES' && a.path)
        .map((a) => a.path as string),
    ),
    requiredValidationAssets: dedupe([
      ...artifacts
        .filter((a) => a.category === 'VALIDATION_CONTEXT')
        .map((a) => a.name),
      ...(changeSet?.verificationRequirements ?? []),
    ]),
    requiredRollbackAssets: dedupe([
      ...artifacts.filter((a) => a.category === 'ROLLBACK_CONTEXT').map((a) => a.name),
      ...(changeSet?.rollbackRequirements ?? []),
    ]),
    requiredMetadata: dedupe([
      plan ? `planId:${plan.planId}` : 'planId:none',
      changeSet ? `changeSetId:${changeSet.changeSetId}` : 'changeSetId:none',
      'isolation:world2-disposable',
      'liveMutation:forbidden',
    ]),
  };
}

function buildReasons(
  readinessState: World2PopulationReadinessState,
  missingArtifacts: World2PopulationArtifact[],
  snapshot: World2PopulationInputSnapshot,
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.changeSetAssessment.blockingReasons);
  warningReasons.push(...snapshot.changeSetAssessment.warningReasons);
  blockingReasons.push(...snapshot.disposableWorkspaceAssessment.blockingReasons);
  warningReasons.push(...snapshot.disposableWorkspaceAssessment.warningReasons);

  for (const missing of missingArtifacts.filter((a) => a.required)) {
    blockingReasons.push(`Missing required artifact: ${missing.name} (${missing.category})`);
  }

  for (const missing of missingArtifacts.filter((a) => !a.required && !a.present)) {
    warningReasons.push(`Optional artifact not present: ${missing.name}`);
  }

  if (readinessState === 'BLOCKED') {
    blockingReasons.push('Workspace population BLOCKED — incomplete execution context.');
  }

  if (readinessState === 'READY_WITH_WARNINGS') {
    warningReasons.push('Population ready with warnings — minor gaps remain.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_POPULATION_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_POPULATION_REASONS),
  };
}

export function assessWorld2WorkspacePopulation(
  input: AssessWorld2WorkspacePopulationInput = {},
): WorkspacePopulationAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const workspaceId =
    inputSnapshot.disposableWorkspaceAssessment.workspaceContract?.workspaceId ??
    inputSnapshot.changeSetAssessment.changeSet?.workspaceId ??
    inputSnapshot.disposableWorkspaceAssessment.inputSnapshot.runtimeAssessment.workspaceId ??
    'world2-unassigned';

  const requiredArtifacts = buildPopulationArtifacts(inputSnapshot, workspaceId);
  const missingArtifacts = requiredArtifacts.filter((a) => a.required && !a.present);
  const minorMissing = requiredArtifacts.filter((a) => !a.required && !a.present);
  const criticalMissing = missingArtifacts.filter((a) =>
    ['ARCHITECTURE', 'REQUIREMENTS', 'VALIDATION_CONTEXT', 'ROLLBACK_CONTEXT'].includes(a.category),
  );

  const hasValidationContext = requiredArtifacts.some(
    (a) => a.category === 'VALIDATION_CONTEXT' && a.required && a.present,
  );
  const hasRollbackContext = requiredArtifacts.some(
    (a) => a.category === 'ROLLBACK_CONTEXT' && a.required && a.present,
  );
  const hasRequirementsContext = requiredArtifacts.some(
    (a) => a.category === 'REQUIREMENTS' && a.required && a.present,
  );
  const hasArchitectureContext = requiredArtifacts.some(
    (a) => a.category === 'ARCHITECTURE' && a.required && a.present,
  );

  const readinessState = derivePopulationReadinessState({
    missingAuthorities: inputSnapshot.missingAuthorities,
    changeSetState: inputSnapshot.changeSetAssessment.eligibilityState,
    workspaceState: inputSnapshot.disposableWorkspaceAssessment.workspaceState,
    founderTestVerdict: inputSnapshot.founderTestAssessment?.verdict ?? null,
    criticalMissingCount: criticalMissing.length,
    minorMissingCount: minorMissing.length,
    hasValidationContext,
    hasRollbackContext,
    hasRequirementsContext,
    hasArchitectureContext,
  });

  const populationReadiness = computePopulationReadiness(requiredArtifacts);
  const reasons = buildReasons(readinessState, missingArtifacts, inputSnapshot);
  const populationId = nextPopulationId();

  const contractEligible =
    readinessState === 'READY' || readinessState === 'READY_WITH_WARNINGS';

  const assessment: WorkspacePopulationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_POPULATION_CORE_QUESTION,
    populationId,
    workspaceId,
    readinessState,
    inputSnapshot,
    requiredArtifacts,
    requiredDirectories: dedupe(
      requiredArtifacts
        .filter((a) => a.category === 'PROJECT_STRUCTURE' && a.path)
        .map((a) => a.path as string),
    ),
    requiredFiles: dedupe(
      requiredArtifacts
        .filter((a) => a.category === 'PROJECT_FILES' && a.path)
        .map((a) => a.path as string),
    ),
    requiredRequirements: dedupe(
      requiredArtifacts.filter((a) => a.category === 'REQUIREMENTS').map((a) => a.name),
    ),
    requiredValidationAssets: dedupe([
      ...requiredArtifacts.filter((a) => a.category === 'VALIDATION_CONTEXT').map((a) => a.name),
      ...(inputSnapshot.changeSetAssessment.changeSet?.verificationRequirements ?? []),
    ]),
    requiredRollbackAssets: dedupe([
      ...requiredArtifacts.filter((a) => a.category === 'ROLLBACK_CONTEXT').map((a) => a.name),
      ...(inputSnapshot.changeSetAssessment.changeSet?.rollbackRequirements ?? []),
    ]),
    missingArtifacts,
    populationReadiness,
    populationContract: contractEligible
      ? buildPopulationContract(
          workspaceId,
          requiredArtifacts,
          inputSnapshot.plan,
          inputSnapshot.changeSetAssessment.changeSet,
        )
      : null,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(populationId, readinessState),
  };

  recordWorld2WorkspacePopulationAssessment(assessment);
  return assessment;
}

export function buildWorld2WorkspacePopulationReport(
  assessment: WorkspacePopulationAssessment,
  generatedAt = new Date().toISOString(),
): World2WorkspacePopulationReport {
  return {
    generatedAt,
    phaseName: WORLD2_WORKSPACE_POPULATION_PHASE,
    purpose:
      'Define exactly what artifacts, files, directories, and context must exist inside a disposable World 2 workspace before execution.',
    assessment,
    passToken: WORLD2_WORKSPACE_POPULATION_PASS_TOKEN,
  };
}

export function buildWorld2WorkspacePopulationArtifacts(
  input: AssessWorld2WorkspacePopulationInput = {},
): {
  workspacePopulationAssessment: WorkspacePopulationAssessment;
  world2WorkspacePopulationReportMarkdown: string;
} {
  const workspacePopulationAssessment = assessWorld2WorkspacePopulation(input);
  const report = buildWorld2WorkspacePopulationReport(workspacePopulationAssessment);
  return {
    workspacePopulationAssessment,
    world2WorkspacePopulationReportMarkdown: buildWorld2WorkspacePopulationReportMarkdown(report),
  };
}

export function resetWorld2WorkspacePopulationModuleForTests(): void {
  resetWorld2WorkspacePopulationHistoryForTests();
  resetWorld2WorkspacePopulationCounterForTests();
  resetWorld2ChangeSetAuthorityModuleForTests();
  resetFounderTestIntegrationModuleForTests();
}
