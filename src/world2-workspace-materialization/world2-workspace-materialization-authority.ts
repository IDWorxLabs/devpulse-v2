/**
 * World 2 Workspace Materialization — virtual blueprint authority.
 * Defines workspace blueprints only — never creates directories, files, or copies repos.
 */

import { createHash } from 'node:crypto';
import { WORLD2_FORBIDDEN_PATHS } from '../world2-disposable-workspace/world2-disposable-workspace-registry.js';
import {
  assessWorld2WorkspacePopulation,
  resetWorld2WorkspacePopulationModuleForTests,
} from '../world2-workspace-population/index.js';
import type { WorkspacePopulationAssessment } from '../world2-workspace-population/world2-workspace-population-types.js';
import {
  MAX_BLUEPRINT_ENTRIES,
  MAX_MATERIALIZATION_REASONS,
  WORLD2_FORBIDDEN_BLUEPRINT_PATTERNS,
  WORLD2_MATERIALIZATION_CACHE_KEY_PREFIX,
  WORLD2_MATERIALIZATION_CORE_QUESTION,
  WORLD2_WORKSPACE_MATERIALIZATION_OWNER_MODULE,
  WORLD2_WORKSPACE_MATERIALIZATION_PASS_TOKEN,
  WORLD2_WORKSPACE_MATERIALIZATION_PHASE,
  computeWorkspaceSizeEstimate,
} from './world2-workspace-materialization-registry.js';
import {
  recordWorld2WorkspaceMaterializationAssessment,
  resetWorld2WorkspaceMaterializationHistoryForTests,
} from './world2-workspace-materialization-history.js';
import { buildWorld2WorkspaceMaterializationReportMarkdown } from './world2-workspace-materialization-report-builder.js';
import type {
  AssessWorld2WorkspaceMaterializationInput,
  World2BlueprintArtifactEntry,
  World2BlueprintDirectoryEntry,
  World2BlueprintFileEntry,
  World2BlueprintValidationResult,
  World2MaterializationContract,
  World2MaterializationInputSnapshot,
  World2MaterializationState,
  World2WorkspaceBlueprint,
  World2WorkspaceMaterializationAssessment,
  World2WorkspaceMaterializationReport,
  World2WorkspaceSizeEstimate,
} from './world2-workspace-materialization-types.js';

let materializationCounter = 0;

export function resetWorld2WorkspaceMaterializationCounterForTests(): void {
  materializationCounter = 0;
}

function nextMaterializationId(): string {
  materializationCounter += 1;
  return `world2-materialization-${materializationCounter}`;
}

function nextBlueprintId(): string {
  return `world2-blueprint-${materializationCounter}`;
}

function stableCacheKey(materializationId: string, state: World2MaterializationState): string {
  const digest = createHash('sha256')
    .update([WORLD2_WORKSPACE_MATERIALIZATION_OWNER_MODULE, materializationId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_MATERIALIZATION_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2WorkspaceMaterializationInput,
): World2MaterializationInputSnapshot {
  const populationAssessment =
    input.populationAssessment ?? assessWorld2WorkspacePopulation(input);

  const disposableWorkspaceAssessment =
    populationAssessment.inputSnapshot.disposableWorkspaceAssessment;
  const changeSetAssessment = populationAssessment.inputSnapshot.changeSetAssessment;

  const missingAuthorities: string[] = dedupe([
    ...populationAssessment.inputSnapshot.missingAuthorities,
    ...changeSetAssessment.inputSnapshot.missingAuthorities,
  ]);

  if (!populationAssessment.populationContract) {
    if (
      populationAssessment.readinessState === 'READY' ||
      populationAssessment.readinessState === 'READY_WITH_WARNINGS'
    ) {
      missingAuthorities.push('world2-population-contract');
    }
  }

  return {
    populationAssessment,
    disposableWorkspaceAssessment,
    changeSetAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function detectForbiddenPaths(paths: string[]): string[] {
  const detected: string[] = [];
  for (const path of paths) {
    for (const pattern of WORLD2_FORBIDDEN_BLUEPRINT_PATTERNS) {
      if (pattern.test(path)) {
        detected.push(path);
        break;
      }
    }
    for (const forbidden of WORLD2_FORBIDDEN_PATHS) {
      if (path.startsWith(forbidden) || path.includes(forbidden)) {
        detected.push(path);
        break;
      }
    }
    if (!path.startsWith('/world2/') && path.startsWith('/')) {
      detected.push(path);
    }
  }
  return dedupe(detected);
}

function buildWorkspaceBlueprint(
  snapshot: World2MaterializationInputSnapshot,
): World2WorkspaceBlueprint | null {
  const population = snapshot.populationAssessment;
  const contract = population.populationContract;
  const changeSet = snapshot.changeSetAssessment.changeSet;
  const workspaceId = population.workspaceId;

  if (!contract) {
    return null;
  }

  const directories: World2BlueprintDirectoryEntry[] = dedupe(contract.requiredDirectories).map(
    (path) => ({
      readOnly: true as const,
      path,
      purpose: 'Required population directory scaffold',
    }),
  );

  const filesFromContract: World2BlueprintFileEntry[] = dedupe(contract.requiredFiles).map(
    (path) => ({
      readOnly: true as const,
      path,
      purpose: 'Required population file placeholder',
      source: 'population-contract',
    }),
  );

  const filesFromChangeSet: World2BlueprintFileEntry[] =
    changeSet?.operations
      .filter((op) => op.targetPath && op.operationType !== 'NO_CHANGE')
      .map((op) => ({
        readOnly: true as const,
        path: op.targetPath,
        purpose: op.reason,
        source: `change-set:${op.operationType}`,
      })) ?? [];

  const filePaths = dedupe([...filesFromContract, ...filesFromChangeSet].map((f) => f.path));
  const files: World2BlueprintFileEntry[] = filePaths.slice(0, MAX_BLUEPRINT_ENTRIES).map((path) => {
    return (
      filesFromChangeSet.find((f) => f.path === path) ??
      filesFromContract.find((f) => f.path === path) ?? {
        readOnly: true as const,
        path,
        purpose: 'Planned blueprint file',
        source: 'blueprint',
      }
    );
  });

  const artifacts: World2BlueprintArtifactEntry[] = population.requiredArtifacts
    .slice(0, MAX_BLUEPRINT_ENTRIES)
    .map((artifact) => ({
      readOnly: true as const,
      name: artifact.name,
      path: artifact.path,
      category: artifact.category,
    }));

  const sizeEstimate = computeWorkspaceSizeEstimate({
    directoryCount: directories.length,
    fileCount: files.length,
    artifactCount: artifacts.length,
  });

  return {
    readOnly: true,
    blueprintId: nextBlueprintId(),
    workspaceId,
    directories: directories.slice(0, MAX_BLUEPRINT_ENTRIES),
    files,
    artifacts,
    validationAssets: dedupe(contract.requiredValidationAssets),
    rollbackAssets: dedupe(contract.requiredRollbackAssets),
    metadataAssets: dedupe(contract.requiredMetadata),
    estimatedWorkspaceSize: sizeEstimate,
  };
}

export function validateWorld2WorkspaceBlueprint(
  blueprint: World2WorkspaceBlueprint,
  population: WorkspacePopulationAssessment,
): World2BlueprintValidationResult {
  const contract = population.populationContract;
  const allPaths = dedupe([
    ...blueprint.directories.map((d) => d.path),
    ...blueprint.files.map((f) => f.path),
    ...blueprint.artifacts.map((a) => a.path).filter((p): p is string => p !== null),
  ]);

  const forbiddenPathsDetected = detectForbiddenPaths(allPaths);

  const requiredDirectoriesPresent =
    (contract?.requiredDirectories.length ?? 0) === 0 ||
    (contract?.requiredDirectories.every((dir) =>
      blueprint.directories.some((d) => d.path === dir || d.path.startsWith(dir)),
    ) ??
      false);

  const requiredFilesPresent =
    (contract?.requiredFiles.length ?? 0) === 0 ||
    (contract?.requiredFiles.every((file) => blueprint.files.some((f) => f.path === file)) ??
      false);

  const requiredValidationAssetsPresent = blueprint.validationAssets.length > 0;
  const requiredRollbackAssetsPresent = blueprint.rollbackAssets.length > 0;

  const missingCriticalAssets: string[] = [];
  if (!requiredDirectoriesPresent) missingCriticalAssets.push('Required directories missing');
  if (!requiredFilesPresent) missingCriticalAssets.push('Required files missing');
  if (!requiredValidationAssetsPresent) missingCriticalAssets.push('Validation assets missing');
  if (!requiredRollbackAssetsPresent) missingCriticalAssets.push('Rollback assets missing');

  const warningGaps: string[] = [];
  for (const missing of population.missingArtifacts.filter((a) => !a.required)) {
    warningGaps.push(`Optional artifact gap: ${missing.name}`);
  }

  const valid =
    forbiddenPathsDetected.length === 0 &&
    missingCriticalAssets.length === 0 &&
    blueprint.directories.length > 0;

  return {
    readOnly: true,
    valid,
    requiredDirectoriesPresent,
    requiredFilesPresent,
    requiredValidationAssetsPresent,
    requiredRollbackAssetsPresent,
    forbiddenPathsDetected,
    missingCriticalAssets,
    warningGaps,
  };
}

export interface MaterializationStateContext {
  missingAuthorities: string[];
  populationState: WorkspacePopulationAssessment['readinessState'];
  blueprintValidation: World2BlueprintValidationResult;
  hasBlueprint: boolean;
  hasPopulationContract: boolean;
  warningGapCount: number;
}

export function deriveMaterializationState(
  context: MaterializationStateContext,
): World2MaterializationState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (context.populationState === 'INSUFFICIENT_EVIDENCE') {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    !context.hasBlueprint ||
    !context.hasPopulationContract ||
    !context.blueprintValidation.valid ||
    context.blueprintValidation.forbiddenPathsDetected.length > 0 ||
    context.blueprintValidation.missingCriticalAssets.length > 0 ||
    context.populationState === 'BLOCKED'
  ) {
    return 'BLOCKED';
  }

  if (context.populationState === 'READY_WITH_WARNINGS' || context.warningGapCount > 0) {
    return 'READY_WITH_WARNINGS';
  }

  if (context.populationState === 'READY' && context.blueprintValidation.valid) {
    return 'READY';
  }

  return 'NOT_READY';
}

function buildMaterializationContract(
  blueprint: World2WorkspaceBlueprint,
  forbiddenPaths: string[],
): World2MaterializationContract {
  return {
    readOnly: true,
    contractId: `world2-materialization-contract-${blueprint.workspaceId}`,
    workspaceId: blueprint.workspaceId,
    plannedDirectories: blueprint.directories.map((d) => d.path),
    plannedFiles: blueprint.files.map((f) => f.path),
    plannedArtifacts: blueprint.artifacts.map((a) => a.name),
    plannedValidationAssets: blueprint.validationAssets,
    plannedRollbackAssets: blueprint.rollbackAssets,
    forbiddenPaths,
  };
}

function buildReasons(
  state: World2MaterializationState,
  validation: World2BlueprintValidationResult,
  snapshot: World2MaterializationInputSnapshot,
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.populationAssessment.blockingReasons);
  warningReasons.push(...snapshot.populationAssessment.warningReasons);

  for (const missing of validation.missingCriticalAssets) {
    blockingReasons.push(missing);
  }

  for (const forbidden of validation.forbiddenPathsDetected) {
    blockingReasons.push(`Forbidden path in blueprint: ${forbidden}`);
  }

  for (const gap of validation.warningGaps) {
    warningReasons.push(gap);
  }

  if (state === 'BLOCKED') {
    blockingReasons.push('Workspace materialization BLOCKED — invalid or incomplete blueprint.');
  }

  if (state === 'NOT_READY') {
    blockingReasons.push('Population contract not ready — blueprint not materializable.');
  }

  if (state === 'READY_WITH_WARNINGS') {
    warningReasons.push('Blueprint ready with warnings — review gaps before physical creation.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_MATERIALIZATION_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_MATERIALIZATION_REASONS),
  };
}

export function assessWorld2WorkspaceMaterialization(
  input: AssessWorld2WorkspaceMaterializationInput = {},
): World2WorkspaceMaterializationAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const population = inputSnapshot.populationAssessment;
  const blueprint = buildWorkspaceBlueprint(inputSnapshot);

  const blueprintValidation = blueprint
    ? validateWorld2WorkspaceBlueprint(blueprint, population)
    : {
        readOnly: true as const,
        valid: false,
        requiredDirectoriesPresent: false,
        requiredFilesPresent: false,
        requiredValidationAssetsPresent: false,
        requiredRollbackAssetsPresent: false,
        forbiddenPathsDetected: [] as string[],
        missingCriticalAssets: ['Blueprint could not be constructed'] as string[],
        warningGaps: [] as string[],
      };

  const forbiddenPathAnalysis = blueprint
    ? dedupe([
        ...blueprintValidation.forbiddenPathsDetected,
        ...detectForbiddenPaths(
          blueprint
            ? [...blueprint.directories.map((d) => d.path), ...blueprint.files.map((f) => f.path)]
            : [],
        ),
      ])
    : [];

  const materializationState = deriveMaterializationState({
    missingAuthorities: inputSnapshot.missingAuthorities,
    populationState: population.readinessState,
    blueprintValidation,
    hasBlueprint: blueprint !== null,
    hasPopulationContract: population.populationContract !== null,
    warningGapCount: blueprintValidation.warningGaps.length,
  });

  const reasons = buildReasons(materializationState, blueprintValidation, inputSnapshot);
  const materializationId = nextMaterializationId();

  const contractEligible =
    materializationState === 'READY' || materializationState === 'READY_WITH_WARNINGS';

  const sizeEstimate: World2WorkspaceSizeEstimate =
    blueprint?.estimatedWorkspaceSize ??
    computeWorkspaceSizeEstimate({ directoryCount: 0, fileCount: 0, artifactCount: 0 });

  const assessment: World2WorkspaceMaterializationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_MATERIALIZATION_CORE_QUESTION,
    materializationId,
    workspaceId: population.workspaceId,
    materializationState,
    inputSnapshot,
    blueprint,
    blueprintValidation,
    materializationContract:
      contractEligible && blueprint
        ? buildMaterializationContract(blueprint, forbiddenPathAnalysis)
        : null,
    sizeEstimate,
    forbiddenPathAnalysis,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(materializationId, materializationState),
  };

  recordWorld2WorkspaceMaterializationAssessment(assessment);
  return assessment;
}

export function buildWorld2WorkspaceMaterializationReport(
  assessment: World2WorkspaceMaterializationAssessment,
  generatedAt = new Date().toISOString(),
): World2WorkspaceMaterializationReport {
  return {
    generatedAt,
    phaseName: WORLD2_WORKSPACE_MATERIALIZATION_PHASE,
    purpose:
      'Convert a Workspace Population Contract into a fully defined disposable workspace blueprint — virtual model only.',
    assessment,
    passToken: WORLD2_WORKSPACE_MATERIALIZATION_PASS_TOKEN,
  };
}

export function buildWorld2WorkspaceMaterializationArtifacts(
  input: AssessWorld2WorkspaceMaterializationInput = {},
): {
  world2WorkspaceMaterializationAssessment: World2WorkspaceMaterializationAssessment;
  world2WorkspaceMaterializationReportMarkdown: string;
} {
  const world2WorkspaceMaterializationAssessment = assessWorld2WorkspaceMaterialization(input);
  const report = buildWorld2WorkspaceMaterializationReport(world2WorkspaceMaterializationAssessment);
  return {
    world2WorkspaceMaterializationAssessment,
    world2WorkspaceMaterializationReportMarkdown:
      buildWorld2WorkspaceMaterializationReportMarkdown(report),
  };
}

export function resetWorld2WorkspaceMaterializationModuleForTests(): void {
  resetWorld2WorkspaceMaterializationHistoryForTests();
  resetWorld2WorkspaceMaterializationCounterForTests();
  resetWorld2WorkspacePopulationModuleForTests();
}
