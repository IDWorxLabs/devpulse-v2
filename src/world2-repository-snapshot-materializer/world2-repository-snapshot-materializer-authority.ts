/**
 * World 2 Repository Snapshot Materializer — materialization operation authority.
 * Models materialization operations only — never copies repositories or reads live files.
 */

import { createHash } from 'node:crypto';
import {
  assessWorld2RepositorySnapshotExecutor,
  resetWorld2RepositorySnapshotExecutorModuleForTests,
} from '../world2-repository-snapshot-executor/index.js';
import {
  DEFAULT_MATERIALIZATION_MODE,
  MAX_SNAPSHOT_MATERIALIZER_REASONS,
  WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_MATERIALIZATION_POSTCONDITIONS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_OWNER_MODULE,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PHASE,
  WORLD2_SNAPSHOT_MATERIALIZER_CACHE_KEY_PREFIX,
  WORLD2_SNAPSHOT_MATERIALIZER_CORE_QUESTION,
  isDisposableOnlyTargetRoot,
  isUnboundedRootCopyPath,
  pathMatchesAnyExclusion,
  pathMatchesPatterns,
  pathMatchesSecrets,
  resolveTargetWorkspaceRoot,
} from './world2-repository-snapshot-materializer-registry.js';
import {
  recordWorld2RepositorySnapshotMaterializerAssessment,
  resetWorld2RepositorySnapshotMaterializerHistoryForTests,
} from './world2-repository-snapshot-materializer-history.js';
import { buildWorld2RepositorySnapshotMaterializerReportMarkdown } from './world2-repository-snapshot-materializer-report-builder.js';
import type {
  AssessWorld2RepositorySnapshotMaterializerInput,
  SnapshotMaterializationModeContext,
  World2RepositorySnapshotMaterializerAssessment,
  World2RepositorySnapshotMaterializerReport,
  World2SnapshotDryRunMaterializationResult,
  World2SnapshotMaterializationMode,
  World2SnapshotMaterializationOperation,
  World2SnapshotMaterializationOverride,
  World2SnapshotMaterializationSafetyCheck,
  World2SnapshotMaterializationState,
  World2SnapshotMaterializerInputSnapshot,
} from './world2-repository-snapshot-materializer-types.js';
import type { World2SnapshotExecutionMode } from '../world2-repository-snapshot-executor/world2-repository-snapshot-executor-types.js';

let materializerCounter = 0;
let operationCounter = 0;
let resultCounter = 0;

export function resetWorld2RepositorySnapshotMaterializerCounterForTests(): void {
  materializerCounter = 0;
  operationCounter = 0;
  resultCounter = 0;
}

function nextMaterializerAssessmentId(): string {
  materializerCounter += 1;
  return `world2-snapshot-materializer-assessment-${materializerCounter}`;
}

function nextOperationId(): string {
  operationCounter += 1;
  return `world2-snapshot-materialization-operation-${operationCounter}`;
}

function nextDryRunResultId(): string {
  resultCounter += 1;
  return `world2-snapshot-dry-run-materialization-${resultCounter}`;
}

function stableCacheKey(
  materializerAssessmentId: string,
  state: World2SnapshotMaterializationState,
): string {
  const digest = createHash('sha256')
    .update(
      [
        WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_OWNER_MODULE,
        materializerAssessmentId,
        state,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_SNAPSHOT_MATERIALIZER_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2RepositorySnapshotMaterializerInput,
): World2SnapshotMaterializerInputSnapshot {
  const snapshotExecutorAssessment =
    input.snapshotExecutorAssessment ?? assessWorld2RepositorySnapshotExecutor(input);

  const repositorySnapshotAssessment =
    snapshotExecutorAssessment.inputSnapshot.repositorySnapshotAssessment;
  const instantiatorAssessment = snapshotExecutorAssessment.inputSnapshot.instantiatorAssessment;

  const missingAuthorities: string[] = dedupe([
    ...snapshotExecutorAssessment.inputSnapshot.missingAuthorities,
    ...(snapshotExecutorAssessment.executionRequest === null &&
    (snapshotExecutorAssessment.executionState === 'SNAPSHOT_EXECUTION_READY' ||
      snapshotExecutorAssessment.executionState === 'SNAPSHOT_EXECUTION_SIMULATED')
      ? ['world2-repository-snapshot-execution-request']
      : []),
  ]);

  return {
    snapshotExecutorAssessment,
    repositorySnapshotAssessment,
    instantiatorAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function resolveTargetRoot(snapshot: World2SnapshotMaterializerInputSnapshot): string {
  const operation = snapshot.instantiatorAssessment.instantiationOperation;
  const creationPlan = snapshot.snapshotExecutorAssessment.inputSnapshot.creatorAssessment.creationPlan;
  return (
    operation?.plannedRoot ??
    creationPlan?.plannedRoot ??
    resolveTargetWorkspaceRoot(snapshot.snapshotExecutorAssessment.workspaceId)
  );
}

export function performWorld2SnapshotMaterializationSafetyChecks(
  snapshot: World2SnapshotMaterializerInputSnapshot,
): World2SnapshotMaterializationSafetyCheck[] {
  const executor = snapshot.snapshotExecutorAssessment;
  const request = executor.executionRequest;
  const includedPaths = request?.includedPaths ?? [];
  const excludedPaths = request?.excludedPaths ?? [];
  const targetRoot = resolveTargetRoot(snapshot);

  const executorStateEligible =
    executor.executionState === 'SNAPSHOT_EXECUTION_READY' ||
    executor.executionState === 'SNAPSHOT_EXECUTION_SIMULATED';

  const secretsIncluded = includedPaths.some((p) => pathMatchesSecrets(p));
  const nodeModulesIncluded = includedPaths.some((p) => p.includes('node_modules'));
  const gitInternalsIncluded = includedPaths.some(
    (p) => p.includes('.git/') && !p.endsWith('.git/HEAD') && !p.endsWith('.git/config'),
  );
  const buildOutputsIncluded = includedPaths.some((p) =>
    pathMatchesAnyExclusion(p, WORLD2_BUILD_OUTPUT_EXCLUSIONS),
  );
  const cacheIncluded = includedPaths.some((p) =>
    pathMatchesAnyExclusion(p, WORLD2_CACHE_DIRECTORY_EXCLUSIONS),
  );
  const livePathIncluded = includedPaths.some((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS));
  const productionPathIncluded = includedPaths.some((p) =>
    pathMatchesPatterns(p, WORLD2_PRODUCTION_PATH_PATTERNS),
  );
  const unboundedRootCopy = includedPaths.some((p) => isUnboundedRootCopyPath(p));
  const instantiatorNotBlocked =
    snapshot.instantiatorAssessment.resultState !== 'INSTANTIATION_BLOCKED';

  return [
    {
      readOnly: true,
      checkId: 'executor-state-eligible',
      label: 'Snapshot executor state is SNAPSHOT_EXECUTION_READY or SNAPSHOT_EXECUTION_SIMULATED',
      passed: executorStateEligible,
      detail: executorStateEligible
        ? `Executor state ${executor.executionState} eligible.`
        : `Executor state ${executor.executionState} not eligible.`,
    },
    {
      readOnly: true,
      checkId: 'repository-copy-not-performed',
      label: 'repositoryCopyPerformed is false',
      passed: request?.repositoryCopyPerformed === false || request === null,
      detail: 'Repository copy not performed — materializer is operation-only.',
    },
    {
      readOnly: true,
      checkId: 'live-file-read-not-performed',
      label: 'liveFileReadPerformed is false',
      passed: true,
      detail: 'Live file read not performed — materializer is operation-only.',
    },
    {
      readOnly: true,
      checkId: 'secrets-excluded',
      label: 'Secrets excluded',
      passed: !secretsIncluded,
      detail: secretsIncluded
        ? 'Secrets path included in materialization scope.'
        : 'No secrets in materialization scope.',
    },
    {
      readOnly: true,
      checkId: 'node-modules-excluded',
      label: 'node_modules excluded',
      passed: !nodeModulesIncluded,
      detail: nodeModulesIncluded
        ? 'node_modules included in materialization scope.'
        : 'node_modules excluded from materialization scope.',
    },
    {
      readOnly: true,
      checkId: 'git-internals-excluded',
      label: '.git internals excluded',
      passed: !gitInternalsIncluded,
      detail: gitInternalsIncluded
        ? '.git internals included in materialization scope.'
        : '.git internals excluded from materialization scope.',
    },
    {
      readOnly: true,
      checkId: 'build-cache-excluded',
      label: 'Build and cache outputs excluded',
      passed: !buildOutputsIncluded && !cacheIncluded,
      detail:
        buildOutputsIncluded || cacheIncluded
          ? 'Build or cache output included in materialization scope.'
          : 'Build and cache outputs excluded.',
    },
    {
      readOnly: true,
      checkId: 'no-unbounded-root-copy',
      label: 'No unbounded root copy',
      passed: !unboundedRootCopy,
      detail: unboundedRootCopy
        ? 'Unbounded root copy detected.'
        : 'Materialization scope is bounded.',
    },
    {
      readOnly: true,
      checkId: 'no-live-workspace-path',
      label: 'No live workspace path',
      passed: !livePathIncluded,
      detail: livePathIncluded
        ? 'Live workspace path included in materialization scope.'
        : 'No live workspace path in materialization scope.',
    },
    {
      readOnly: true,
      checkId: 'no-production-path',
      label: 'No production path',
      passed: !productionPathIncluded,
      detail: productionPathIncluded
        ? 'Production path included in materialization scope.'
        : 'No production path in materialization scope.',
    },
    {
      readOnly: true,
      checkId: 'instantiator-not-blocked',
      label: 'Instantiator not blocked',
      passed: instantiatorNotBlocked,
      detail: instantiatorNotBlocked
        ? `Instantiator state ${snapshot.instantiatorAssessment.resultState}.`
        : 'Instantiator blocked — materialization not allowed.',
    },
    {
      readOnly: true,
      checkId: 'target-root-disposable-only',
      label: 'Target workspace root is disposable-only',
      passed: isDisposableOnlyTargetRoot(targetRoot),
      detail: isDisposableOnlyTargetRoot(targetRoot)
        ? `Target root ${targetRoot} is disposable-only.`
        : `Target root ${targetRoot} is not disposable-only.`,
    },
  ];
}

export function deriveSnapshotMaterializationEligibilityMode(
  context: SnapshotMaterializationModeContext,
): World2SnapshotMaterializationMode {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'BLOCKED';
  }

  if (
    context.executorState === 'INSUFFICIENT_EVIDENCE' ||
    context.snapshotState === 'INSUFFICIENT_EVIDENCE' ||
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'BLOCKED';
  }

  const blockedBySafety =
    context.executorState === 'SNAPSHOT_EXECUTION_BLOCKED' ||
    context.snapshotState === 'SNAPSHOT_BLOCKED' ||
    context.instantiatorResultState === 'INSTANTIATION_BLOCKED' ||
    !context.hasExecutionRequest ||
    !context.targetRootDisposableOnly ||
    context.secretsIncluded ||
    context.livePathIncluded ||
    context.productionPathIncluded ||
    context.unboundedRootCopy ||
    context.repositoryCopyPerformed ||
    context.liveFileReadPerformed ||
    !context.safetyChecksPassed ||
    context.criticalSafetyFailures > 0;

  if (blockedBySafety) {
    return 'BLOCKED';
  }

  if (
    context.executorState === 'SNAPSHOT_EXECUTION_READY' &&
    context.executorEligibilityMode === 'REAL_SNAPSHOT_ELIGIBLE' &&
    context.safetyChecksPassed &&
    context.criticalSafetyFailures === 0
  ) {
    return 'REAL_MATERIALIZATION_ELIGIBLE';
  }

  if (
    context.executorState === 'SNAPSHOT_EXECUTION_SIMULATED' ||
    context.snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS'
  ) {
    if (context.criticalSafetyFailures === 0) {
      return 'SIMULATED_MATERIALIZATION';
    }
  }

  if (
    context.executorState === 'SNAPSHOT_EXECUTION_READY' &&
    context.hasExecutionRequest &&
    context.criticalSafetyFailures === 0
  ) {
    return DEFAULT_MATERIALIZATION_MODE;
  }

  if (
    context.executorState === 'NOT_READY' ||
    context.snapshotState === 'NOT_READY' ||
    context.instantiatorResultState === 'NOT_READY' ||
    !context.hasExecutionRequest
  ) {
    return 'BLOCKED';
  }

  return DEFAULT_MATERIALIZATION_MODE;
}

function resolveMaterializationMode(
  eligibilityMode: World2SnapshotMaterializationMode,
  override: World2SnapshotMaterializationOverride | undefined,
  executorMode: World2SnapshotExecutionMode | null,
): World2SnapshotMaterializationMode {
  if (eligibilityMode === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (!override) {
    return DEFAULT_MATERIALIZATION_MODE;
  }

  if (
    override === 'REAL_MATERIALIZATION_ELIGIBLE' &&
    eligibilityMode === 'REAL_MATERIALIZATION_ELIGIBLE' &&
    executorMode === 'REAL_SNAPSHOT_ELIGIBLE'
  ) {
    return 'REAL_MATERIALIZATION_ELIGIBLE';
  }

  if (
    override === 'SIMULATED_MATERIALIZATION' &&
    (eligibilityMode === 'SIMULATED_MATERIALIZATION' ||
      eligibilityMode === 'REAL_MATERIALIZATION_ELIGIBLE')
  ) {
    return 'SIMULATED_MATERIALIZATION';
  }

  return DEFAULT_MATERIALIZATION_MODE;
}

export function deriveSnapshotMaterializationState(
  eligibilityMode: World2SnapshotMaterializationMode,
  materializationMode: World2SnapshotMaterializationMode,
  context: SnapshotMaterializationModeContext,
): World2SnapshotMaterializationState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.executorState === 'INSUFFICIENT_EVIDENCE' ||
    context.snapshotState === 'INSUFFICIENT_EVIDENCE' ||
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    eligibilityMode === 'BLOCKED' ||
    materializationMode === 'BLOCKED' ||
    context.executorState === 'SNAPSHOT_EXECUTION_BLOCKED'
  ) {
    return 'MATERIALIZATION_BLOCKED';
  }

  if (
    context.executorState === 'NOT_READY' ||
    context.snapshotState === 'NOT_READY' ||
    context.instantiatorResultState === 'NOT_READY' ||
    !context.hasExecutionRequest
  ) {
    return 'NOT_READY';
  }

  if (
    materializationMode === 'SIMULATED_MATERIALIZATION' ||
    eligibilityMode === 'SIMULATED_MATERIALIZATION'
  ) {
    return 'MATERIALIZATION_SIMULATED';
  }

  if (
    materializationMode === 'DRY_RUN' ||
    materializationMode === 'REAL_MATERIALIZATION_ELIGIBLE' ||
    eligibilityMode === 'REAL_MATERIALIZATION_ELIGIBLE'
  ) {
    return 'MATERIALIZATION_READY';
  }

  return 'MATERIALIZATION_BLOCKED';
}

function buildPlannedWritesAndSkips(
  targetRoot: string,
  includedPaths: string[],
  excludedPaths: string[],
): { plannedWrites: string[]; plannedSkips: string[] } {
  const plannedWrites = includedPaths
    .slice(0, MAX_SNAPSHOT_MATERIALIZER_REASONS)
    .map((path) => `${targetRoot}/${path.replace(/^\//, '')}`);
  const plannedSkips = dedupe([...excludedPaths]).slice(0, MAX_SNAPSHOT_MATERIALIZER_REASONS);
  return { plannedWrites, plannedSkips };
}

function buildMaterializationOperation(
  snapshot: World2SnapshotMaterializerInputSnapshot,
  eligibilityMode: World2SnapshotMaterializationMode,
  materializationMode: World2SnapshotMaterializationMode,
  materializationState: World2SnapshotMaterializationState,
  safetyChecks: World2SnapshotMaterializationSafetyCheck[],
): World2SnapshotMaterializationOperation | null {
  const operationEligible =
    materializationState === 'MATERIALIZATION_READY' ||
    materializationState === 'MATERIALIZATION_SIMULATED';

  const request = snapshot.snapshotExecutorAssessment.executionRequest;
  if (!operationEligible || !request) {
    return null;
  }

  const targetWorkspaceRoot = resolveTargetRoot(snapshot);
  const { plannedWrites, plannedSkips } = buildPlannedWritesAndSkips(
    targetWorkspaceRoot,
    request.includedPaths,
    request.excludedPaths,
  );

  return {
    readOnly: true,
    operationId: nextOperationId(),
    requestId: request.requestId,
    snapshotId: request.snapshotId,
    workspaceId: request.workspaceId,
    sourceProjectId: request.sourceProjectId,
    targetWorkspaceRoot,
    manifestEntries: [...request.manifestEntries],
    includedPaths: [...request.includedPaths],
    excludedPaths: [...request.excludedPaths],
    plannedWrites,
    plannedSkips,
    safetyChecks,
    postconditions: [...WORLD2_MATERIALIZATION_POSTCONDITIONS],
    mode: materializationMode,
    materializationState,
    eligibilityMode,
    repositoryCopyPerformed: false,
    liveFileReadPerformed: false,
  };
}

function buildDryRunMaterializationResult(
  operation: World2SnapshotMaterializationOperation | null,
): World2SnapshotDryRunMaterializationResult | null {
  if (!operation) {
    return null;
  }

  return {
    readOnly: true,
    resultId: nextDryRunResultId(),
    operationId: operation.operationId,
    mode: operation.mode,
    simulatedWriteCount: operation.plannedWrites.length,
    simulatedSkipCount: operation.plannedSkips.length,
    repositoryCopyPerformed: false,
    liveFileReadPerformed: false,
    completedAt: new Date().toISOString(),
  };
}

function buildMaterializerReasons(
  snapshot: World2SnapshotMaterializerInputSnapshot,
  materializationState: World2SnapshotMaterializationState,
  safetyChecks: World2SnapshotMaterializationSafetyCheck[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.snapshotExecutorAssessment.blockingReasons);
  warningReasons.push(...snapshot.snapshotExecutorAssessment.warningReasons);
  warningReasons.push(...snapshot.repositorySnapshotAssessment.warningReasons);
  warningReasons.push(...snapshot.instantiatorAssessment.warningReasons);

  for (const check of safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  if (materializationState === 'MATERIALIZATION_BLOCKED') {
    blockingReasons.push(
      'Snapshot materialization BLOCKED — execution request is not materialization permission.',
    );
  }

  if (materializationState === 'MATERIALIZATION_SIMULATED') {
    warningReasons.push('Materialization simulated only — no repository copy or live file read.');
  }

  if (materializationState === 'MATERIALIZATION_READY') {
    warningReasons.push('Default dry-run mode — no repository copy or live file read performed.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_SNAPSHOT_MATERIALIZER_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_SNAPSHOT_MATERIALIZER_REASONS),
  };
}

export function assessWorld2RepositorySnapshotMaterializer(
  input: AssessWorld2RepositorySnapshotMaterializerInput = {},
): World2RepositorySnapshotMaterializerAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const request = inputSnapshot.snapshotExecutorAssessment.executionRequest;
  const includedPaths = request?.includedPaths ?? [];
  const targetRoot = resolveTargetRoot(inputSnapshot);

  const safetyChecks = performWorld2SnapshotMaterializationSafetyChecks(inputSnapshot);
  const safetyChecksPassed = safetyChecks.every((check) => check.passed);
  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;

  const modeContext: SnapshotMaterializationModeContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    executorState: inputSnapshot.snapshotExecutorAssessment.executionState,
    executorMode: request?.mode ?? null,
    executorEligibilityMode: request?.eligibilityMode ?? null,
    snapshotState: inputSnapshot.repositorySnapshotAssessment.snapshotState,
    instantiatorResultState: inputSnapshot.instantiatorAssessment.resultState,
    safetyChecksPassed,
    criticalSafetyFailures,
    hasExecutionRequest: request !== null,
    targetRootDisposableOnly: isDisposableOnlyTargetRoot(targetRoot),
    secretsIncluded: includedPaths.some((p) => pathMatchesSecrets(p)),
    livePathIncluded: includedPaths.some((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS)),
    productionPathIncluded: includedPaths.some((p) =>
      pathMatchesPatterns(p, WORLD2_PRODUCTION_PATH_PATTERNS),
    ),
    unboundedRootCopy: includedPaths.some((p) => isUnboundedRootCopyPath(p)),
    repositoryCopyPerformed: (request?.repositoryCopyPerformed as boolean | undefined) === true,
    liveFileReadPerformed: false,
  };

  const eligibilityMode = deriveSnapshotMaterializationEligibilityMode(modeContext);
  const materializationMode = resolveMaterializationMode(
    eligibilityMode,
    input.materializationModeOverride,
    request?.mode ?? null,
  );
  const materializationState = deriveSnapshotMaterializationState(
    eligibilityMode,
    materializationMode,
    modeContext,
  );
  const reasons = buildMaterializerReasons(inputSnapshot, materializationState, safetyChecks);
  const materializerAssessmentId = nextMaterializerAssessmentId();

  const materializationOperation = buildMaterializationOperation(
    inputSnapshot,
    eligibilityMode,
    materializationMode,
    materializationState,
    safetyChecks,
  );

  const assessment: World2RepositorySnapshotMaterializerAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_SNAPSHOT_MATERIALIZER_CORE_QUESTION,
    materializerAssessmentId,
    workspaceId: inputSnapshot.snapshotExecutorAssessment.workspaceId,
    materializationState,
    inputSnapshot,
    materializationOperation,
    dryRunMaterializationResult: buildDryRunMaterializationResult(materializationOperation),
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(materializerAssessmentId, materializationState),
  };

  recordWorld2RepositorySnapshotMaterializerAssessment(assessment);
  return assessment;
}

export function buildWorld2RepositorySnapshotMaterializerReport(
  assessment: World2RepositorySnapshotMaterializerAssessment,
  generatedAt = new Date().toISOString(),
): World2RepositorySnapshotMaterializerReport {
  return {
    generatedAt,
    phaseName: WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PHASE,
    purpose:
      'Represent repository snapshot materialization operations after executor approval — no repository copy or live file reads.',
    assessment,
    passToken: WORLD2_REPOSITORY_SNAPSHOT_MATERIALIZER_PASS_TOKEN,
  };
}

export function buildWorld2RepositorySnapshotMaterializerArtifacts(
  input: AssessWorld2RepositorySnapshotMaterializerInput = {},
): {
  world2RepositorySnapshotMaterializerAssessment: World2RepositorySnapshotMaterializerAssessment;
  world2RepositorySnapshotMaterializerReportMarkdown: string;
} {
  const world2RepositorySnapshotMaterializerAssessment =
    assessWorld2RepositorySnapshotMaterializer(input);
  const report = buildWorld2RepositorySnapshotMaterializerReport(
    world2RepositorySnapshotMaterializerAssessment,
  );
  return {
    world2RepositorySnapshotMaterializerAssessment,
    world2RepositorySnapshotMaterializerReportMarkdown:
      buildWorld2RepositorySnapshotMaterializerReportMarkdown(report),
  };
}

export function resetWorld2RepositorySnapshotMaterializerModuleForTests(): void {
  resetWorld2RepositorySnapshotMaterializerHistoryForTests();
  resetWorld2RepositorySnapshotMaterializerCounterForTests();
  resetWorld2RepositorySnapshotExecutorModuleForTests();
}
