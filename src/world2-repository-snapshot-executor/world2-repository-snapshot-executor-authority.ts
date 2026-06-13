/**
 * World 2 Repository Snapshot Executor — execution request authority.
 * Models snapshot execution requests only — never copies repositories or reads live files.
 */

import { createHash } from 'node:crypto';
import {
  assessWorld2RepositorySnapshot,
  resetWorld2RepositorySnapshotModuleForTests,
} from '../world2-repository-snapshot/index.js';
import {
  DEFAULT_SNAPSHOT_EXECUTION_MODE,
  MAX_EXECUTION_ATTEMPTS,
  MAX_EXECUTION_DIRECTORIES,
  MAX_EXECUTION_ESTIMATED_SIZE,
  MAX_EXECUTION_FILES,
  MAX_SNAPSHOT_EXECUTION_TTL_MS,
  MAX_SNAPSHOT_EXECUTOR_REASONS,
  WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_OWNER_MODULE,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PHASE,
  WORLD2_SNAPSHOT_EXECUTOR_CACHE_KEY_PREFIX,
  WORLD2_SNAPSHOT_EXECUTOR_CORE_QUESTION,
  isUnboundedRootCopyPath,
  pathMatchesPatterns,
  pathMatchesSecrets,
} from './world2-repository-snapshot-executor-registry.js';
import {
  recordWorld2RepositorySnapshotExecutorAssessment,
  resetWorld2RepositorySnapshotExecutorHistoryForTests,
} from './world2-repository-snapshot-executor-history.js';
import { buildWorld2RepositorySnapshotExecutorReportMarkdown } from './world2-repository-snapshot-executor-report-builder.js';
import type {
  AssessWorld2RepositorySnapshotExecutorInput,
  SnapshotExecutionModeContext,
  World2RepositorySnapshotExecutorAssessment,
  World2RepositorySnapshotExecutorReport,
  World2SnapshotDryRunExecutionResult,
  World2SnapshotExecutionBounds,
  World2SnapshotExecutionMode,
  World2SnapshotExecutionOverride,
  World2SnapshotExecutionRequest,
  World2SnapshotExecutionSafetyCheck,
  World2SnapshotExecutionState,
  World2SnapshotExecutorInputSnapshot,
} from './world2-repository-snapshot-executor-types.js';

let executorCounter = 0;
let requestCounter = 0;
let resultCounter = 0;

export function resetWorld2RepositorySnapshotExecutorCounterForTests(): void {
  executorCounter = 0;
  requestCounter = 0;
  resultCounter = 0;
}

function nextExecutorAssessmentId(): string {
  executorCounter += 1;
  return `world2-snapshot-executor-assessment-${executorCounter}`;
}

function nextRequestId(): string {
  requestCounter += 1;
  return `world2-snapshot-execution-request-${requestCounter}`;
}

function nextDryRunResultId(): string {
  resultCounter += 1;
  return `world2-snapshot-dry-run-result-${resultCounter}`;
}

function stableCacheKey(
  executorAssessmentId: string,
  state: World2SnapshotExecutionState,
): string {
  const digest = createHash('sha256')
    .update(
      [WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_OWNER_MODULE, executorAssessmentId, state].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_SNAPSHOT_EXECUTOR_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2RepositorySnapshotExecutorInput,
): World2SnapshotExecutorInputSnapshot {
  const repositorySnapshotAssessment =
    input.repositorySnapshotAssessment ??
    assessWorld2RepositorySnapshot(
      input as import('../world2-repository-snapshot/world2-repository-snapshot-types.js').AssessWorld2RepositorySnapshotInput,
    );

  const instantiatorAssessment = repositorySnapshotAssessment.inputSnapshot.instantiatorAssessment;
  const creatorAssessment = instantiatorAssessment.inputSnapshot.creatorAssessment;

  const missingAuthorities: string[] = dedupe([
    ...repositorySnapshotAssessment.inputSnapshot.missingAuthorities,
    ...(repositorySnapshotAssessment.snapshotScope === null &&
    (repositorySnapshotAssessment.snapshotState === 'SNAPSHOT_READY' ||
      repositorySnapshotAssessment.snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS')
      ? ['world2-repository-snapshot-scope']
      : []),
  ]);

  return {
    repositorySnapshotAssessment,
    instantiatorAssessment,
    creatorAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function pathMatchesAnyExclusion(path: string, exclusions: readonly string[]): boolean {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return exclusions.some((exclusion) => {
    const rule = exclusion.replace(/\\/g, '/').toLowerCase();
    if (rule.endsWith('/**')) {
      const prefix = rule.slice(0, -3);
      return normalized === prefix || normalized.startsWith(`${prefix}/`);
    }
    return normalized === rule || normalized.endsWith(`/${rule}`);
  });
}

export function performWorld2SnapshotExecutionSafetyChecks(
  snapshot: World2SnapshotExecutorInputSnapshot,
): World2SnapshotExecutionSafetyCheck[] {
  const scope = snapshot.repositorySnapshotAssessment.snapshotScope;
  const includedPaths = scope?.includedPaths ?? [];
  const excludedPaths = scope?.excludedPaths ?? [];

  const snapshotStateEligible =
    snapshot.repositorySnapshotAssessment.snapshotState === 'SNAPSHOT_READY' ||
    snapshot.repositorySnapshotAssessment.snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS';

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

  const nodeModulesExcluded =
    excludedPaths.includes(WORLD2_NODE_MODULES_EXCLUSION) && !nodeModulesIncluded;
  const gitInternalsExcluded =
    WORLD2_GIT_INTERNALS_EXCLUSIONS.every((rule) => excludedPaths.includes(rule)) &&
    !gitInternalsIncluded;

  const instantiatorNotBlocked =
    snapshot.instantiatorAssessment.resultState !== 'INSTANTIATION_BLOCKED';
  const creatorNotBlocked = snapshot.creatorAssessment.creationState !== 'CREATION_BLOCKED';

  return [
    {
      readOnly: true,
      checkId: 'snapshot-state-eligible',
      label: 'Snapshot state is SNAPSHOT_READY or SNAPSHOT_READY_WITH_RESTRICTIONS',
      passed: snapshotStateEligible,
      detail: snapshotStateEligible
        ? `Snapshot state ${snapshot.repositorySnapshotAssessment.snapshotState} eligible.`
        : `Snapshot state ${snapshot.repositorySnapshotAssessment.snapshotState} not eligible.`,
    },
    {
      readOnly: true,
      checkId: 'secrets-excluded',
      label: 'Secrets excluded from execution scope',
      passed: !secretsIncluded,
      detail: secretsIncluded
        ? 'Secrets path included in snapshot execution scope.'
        : 'No secrets in snapshot execution scope.',
    },
    {
      readOnly: true,
      checkId: 'node-modules-excluded',
      label: 'node_modules excluded',
      passed: nodeModulesExcluded,
      detail: nodeModulesExcluded
        ? 'node_modules excluded from execution scope.'
        : 'node_modules exclusion missing or path included.',
    },
    {
      readOnly: true,
      checkId: 'git-internals-excluded',
      label: '.git internals excluded',
      passed: gitInternalsExcluded,
      detail: gitInternalsExcluded
        ? '.git internals excluded from execution scope.'
        : '.git internals exclusion missing or path included.',
    },
    {
      readOnly: true,
      checkId: 'build-cache-excluded',
      label: 'Build and cache outputs excluded',
      passed: !buildOutputsIncluded && !cacheIncluded,
      detail:
        buildOutputsIncluded || cacheIncluded
          ? 'Build or cache output included in execution scope.'
          : 'Build and cache outputs excluded.',
    },
    {
      readOnly: true,
      checkId: 'no-unbounded-root-copy',
      label: 'No unbounded root copy',
      passed: !unboundedRootCopy,
      detail: unboundedRootCopy
        ? 'Unbounded root copy detected in execution scope.'
        : 'Execution scope is bounded.',
    },
    {
      readOnly: true,
      checkId: 'no-live-workspace-path',
      label: 'No live workspace path',
      passed: !livePathIncluded,
      detail: livePathIncluded
        ? `Live workspace path included: ${includedPaths.find((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS))}`
        : 'No live workspace path in execution scope.',
    },
    {
      readOnly: true,
      checkId: 'no-production-path',
      label: 'No production path',
      passed: !productionPathIncluded,
      detail: productionPathIncluded
        ? 'Production path included in execution scope.'
        : 'No production path in execution scope.',
    },
    {
      readOnly: true,
      checkId: 'instantiator-not-blocked',
      label: 'Instantiator not blocked',
      passed: instantiatorNotBlocked,
      detail: instantiatorNotBlocked
        ? `Instantiator state ${snapshot.instantiatorAssessment.resultState}.`
        : 'Instantiator blocked — snapshot execution not allowed.',
    },
    {
      readOnly: true,
      checkId: 'creator-not-blocked',
      label: 'Creator not blocked',
      passed: creatorNotBlocked,
      detail: creatorNotBlocked
        ? `Creator state ${snapshot.creatorAssessment.creationState}.`
        : 'Creator blocked — snapshot execution not allowed.',
    },
  ];
}

export function deriveSnapshotExecutionEligibilityMode(
  context: SnapshotExecutionModeContext,
): World2SnapshotExecutionMode {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'BLOCKED';
  }

  if (
    context.snapshotState === 'INSUFFICIENT_EVIDENCE' ||
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE' ||
    context.creatorState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'BLOCKED';
  }

  const blockedBySafety =
    context.snapshotState === 'SNAPSHOT_BLOCKED' ||
    context.instantiatorResultState === 'INSTANTIATION_BLOCKED' ||
    context.creatorState === 'CREATION_BLOCKED' ||
    !context.hasSnapshotScope ||
    context.secretsIncluded ||
    context.livePathIncluded ||
    context.productionPathIncluded ||
    context.unboundedRootCopy ||
    !context.safetyChecksPassed ||
    context.criticalSafetyFailures > 0;

  if (blockedBySafety) {
    return 'BLOCKED';
  }

  if (
    context.snapshotState === 'SNAPSHOT_READY' &&
    context.safetyChecksPassed &&
    context.criticalSafetyFailures === 0
  ) {
    return 'REAL_SNAPSHOT_ELIGIBLE';
  }

  if (
    context.snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS' &&
    context.criticalSafetyFailures === 0
  ) {
    return 'SIMULATED_SNAPSHOT';
  }

  if (
    context.snapshotState === 'NOT_READY' ||
    context.instantiatorResultState === 'NOT_READY' ||
    context.creatorState === 'NOT_READY' ||
    !context.hasSnapshotScope
  ) {
    return 'BLOCKED';
  }

  return DEFAULT_SNAPSHOT_EXECUTION_MODE;
}

function resolveExecutionMode(
  eligibilityMode: World2SnapshotExecutionMode,
  override: World2SnapshotExecutionOverride | undefined,
): World2SnapshotExecutionMode {
  if (eligibilityMode === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (!override) {
    return DEFAULT_SNAPSHOT_EXECUTION_MODE;
  }

  if (override === 'REAL_SNAPSHOT_ELIGIBLE' && eligibilityMode === 'REAL_SNAPSHOT_ELIGIBLE') {
    return 'REAL_SNAPSHOT_ELIGIBLE';
  }

  if (
    override === 'SIMULATED_SNAPSHOT' &&
    (eligibilityMode === 'SIMULATED_SNAPSHOT' || eligibilityMode === 'REAL_SNAPSHOT_ELIGIBLE')
  ) {
    return 'SIMULATED_SNAPSHOT';
  }

  return DEFAULT_SNAPSHOT_EXECUTION_MODE;
}

export function deriveSnapshotExecutionState(
  eligibilityMode: World2SnapshotExecutionMode,
  executionMode: World2SnapshotExecutionMode,
  context: SnapshotExecutionModeContext,
): World2SnapshotExecutionState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.snapshotState === 'INSUFFICIENT_EVIDENCE' ||
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE' ||
    context.creatorState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    eligibilityMode === 'BLOCKED' ||
    executionMode === 'BLOCKED' ||
    context.snapshotState === 'SNAPSHOT_BLOCKED'
  ) {
    return 'SNAPSHOT_EXECUTION_BLOCKED';
  }

  if (
    context.snapshotState === 'NOT_READY' ||
    context.instantiatorResultState === 'NOT_READY' ||
    context.creatorState === 'NOT_READY' ||
    !context.hasSnapshotScope
  ) {
    return 'NOT_READY';
  }

  if (
    executionMode === 'SIMULATED_SNAPSHOT' ||
    eligibilityMode === 'SIMULATED_SNAPSHOT'
  ) {
    return 'SNAPSHOT_EXECUTION_SIMULATED';
  }

  if (
    executionMode === 'DRY_RUN' ||
    executionMode === 'REAL_SNAPSHOT_ELIGIBLE' ||
    eligibilityMode === 'REAL_SNAPSHOT_ELIGIBLE'
  ) {
    return 'SNAPSHOT_EXECUTION_READY';
  }

  return 'SNAPSHOT_EXECUTION_BLOCKED';
}

function buildExecutionBounds(generatedAt: string): World2SnapshotExecutionBounds {
  return {
    readOnly: true,
    maxFiles: MAX_EXECUTION_FILES,
    maxDirectories: MAX_EXECUTION_DIRECTORIES,
    maxEstimatedSize: MAX_EXECUTION_ESTIMATED_SIZE,
    maxAttempts: MAX_EXECUTION_ATTEMPTS,
    expiresAt: new Date(Date.parse(generatedAt) + MAX_SNAPSHOT_EXECUTION_TTL_MS).toISOString(),
  };
}

function buildExecutionRequest(
  snapshot: World2SnapshotExecutorInputSnapshot,
  eligibilityMode: World2SnapshotExecutionMode,
  executionMode: World2SnapshotExecutionMode,
  executionState: World2SnapshotExecutionState,
  safetyChecks: World2SnapshotExecutionSafetyCheck[],
): World2SnapshotExecutionRequest | null {
  const requestEligible =
    executionState === 'SNAPSHOT_EXECUTION_READY' ||
    executionState === 'SNAPSHOT_EXECUTION_SIMULATED';

  const scope = snapshot.repositorySnapshotAssessment.snapshotScope;
  if (!requestEligible || !scope) {
    return null;
  }

  const generatedAt = new Date().toISOString();
  const requestId = nextRequestId();

  return {
    readOnly: true,
    requestId,
    snapshotId: scope.snapshotId,
    workspaceId: scope.workspaceId,
    sourceProjectId: scope.sourceProjectId,
    includedPaths: [...scope.includedPaths],
    excludedPaths: [...scope.excludedPaths],
    manifestEntries: [...scope.snapshotManifest.entries],
    executionBounds: buildExecutionBounds(generatedAt),
    safetyChecks,
    mode: executionMode,
    executionState,
    eligibilityMode,
    repositoryCopyPerformed: false,
  };
}

function buildDryRunExecutionResult(
  request: World2SnapshotExecutionRequest | null,
): World2SnapshotDryRunExecutionResult | null {
  if (!request) {
    return null;
  }

  const fileCount = request.includedPaths.filter((p) => !p.endsWith('/')).length;
  const directoryCount = request.includedPaths.filter((p) => p.endsWith('/')).length;

  return {
    readOnly: true,
    resultId: nextDryRunResultId(),
    requestId: request.requestId,
    mode: request.mode,
    simulatedFileCount: fileCount,
    simulatedDirectoryCount: directoryCount,
    repositoryCopyPerformed: false,
    completedAt: new Date().toISOString(),
  };
}

function buildExecutorReasons(
  snapshot: World2SnapshotExecutorInputSnapshot,
  executionState: World2SnapshotExecutionState,
  safetyChecks: World2SnapshotExecutionSafetyCheck[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.repositorySnapshotAssessment.blockingReasons);
  warningReasons.push(...snapshot.repositorySnapshotAssessment.warningReasons);
  warningReasons.push(...snapshot.instantiatorAssessment.warningReasons);
  warningReasons.push(...snapshot.creatorAssessment.warningReasons);

  for (const check of safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  if (executionState === 'SNAPSHOT_EXECUTION_BLOCKED') {
    blockingReasons.push('Snapshot execution BLOCKED — snapshot scope is not copy permission.');
  }

  if (executionState === 'SNAPSHOT_EXECUTION_SIMULATED') {
    warningReasons.push('Snapshot execution simulated only — no repository copy performed.');
  }

  if (executionState === 'SNAPSHOT_EXECUTION_READY') {
    warningReasons.push('Default dry-run mode — no repository copy performed.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_SNAPSHOT_EXECUTOR_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_SNAPSHOT_EXECUTOR_REASONS),
  };
}

export function assessWorld2RepositorySnapshotExecutor(
  input: AssessWorld2RepositorySnapshotExecutorInput = {},
): World2RepositorySnapshotExecutorAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const scope = inputSnapshot.repositorySnapshotAssessment.snapshotScope;
  const includedPaths = scope?.includedPaths ?? [];

  const safetyChecks = performWorld2SnapshotExecutionSafetyChecks(inputSnapshot);
  const safetyChecksPassed = safetyChecks.every((check) => check.passed);
  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;

  const modeContext: SnapshotExecutionModeContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    snapshotState: inputSnapshot.repositorySnapshotAssessment.snapshotState,
    instantiatorResultState: inputSnapshot.instantiatorAssessment.resultState,
    creatorState: inputSnapshot.creatorAssessment.creationState,
    safetyChecksPassed,
    criticalSafetyFailures,
    hasSnapshotScope: scope !== null,
    secretsIncluded: includedPaths.some((p) => pathMatchesSecrets(p)),
    livePathIncluded: includedPaths.some((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS)),
    productionPathIncluded: includedPaths.some((p) =>
      pathMatchesPatterns(p, WORLD2_PRODUCTION_PATH_PATTERNS),
    ),
    unboundedRootCopy: includedPaths.some((p) => isUnboundedRootCopyPath(p)),
  };

  const eligibilityMode = deriveSnapshotExecutionEligibilityMode(modeContext);
  const executionMode = resolveExecutionMode(eligibilityMode, input.executionModeOverride);
  const executionState = deriveSnapshotExecutionState(eligibilityMode, executionMode, modeContext);
  const reasons = buildExecutorReasons(inputSnapshot, executionState, safetyChecks);
  const executorAssessmentId = nextExecutorAssessmentId();

  const executionRequest = buildExecutionRequest(
    inputSnapshot,
    eligibilityMode,
    executionMode,
    executionState,
    safetyChecks,
  );

  const assessment: World2RepositorySnapshotExecutorAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_SNAPSHOT_EXECUTOR_CORE_QUESTION,
    executorAssessmentId,
    workspaceId: inputSnapshot.repositorySnapshotAssessment.workspaceId,
    executionState,
    inputSnapshot,
    executionRequest,
    dryRunExecutionResult: buildDryRunExecutionResult(executionRequest),
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(executorAssessmentId, executionState),
  };

  recordWorld2RepositorySnapshotExecutorAssessment(assessment);
  return assessment;
}

export function buildWorld2RepositorySnapshotExecutorReport(
  assessment: World2RepositorySnapshotExecutorAssessment,
  generatedAt = new Date().toISOString(),
): World2RepositorySnapshotExecutorReport {
  return {
    generatedAt,
    phaseName: WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PHASE,
    purpose:
      'Prepare repository snapshot execution requests after snapshot authority approval — no repository copy.',
    assessment,
    passToken: WORLD2_REPOSITORY_SNAPSHOT_EXECUTOR_PASS_TOKEN,
  };
}

export function buildWorld2RepositorySnapshotExecutorArtifacts(
  input: AssessWorld2RepositorySnapshotExecutorInput = {},
): {
  world2RepositorySnapshotExecutorAssessment: World2RepositorySnapshotExecutorAssessment;
  world2RepositorySnapshotExecutorReportMarkdown: string;
} {
  const world2RepositorySnapshotExecutorAssessment = assessWorld2RepositorySnapshotExecutor(input);
  const report = buildWorld2RepositorySnapshotExecutorReport(
    world2RepositorySnapshotExecutorAssessment,
  );
  return {
    world2RepositorySnapshotExecutorAssessment,
    world2RepositorySnapshotExecutorReportMarkdown:
      buildWorld2RepositorySnapshotExecutorReportMarkdown(report),
  };
}

export function resetWorld2RepositorySnapshotExecutorModuleForTests(): void {
  resetWorld2RepositorySnapshotExecutorHistoryForTests();
  resetWorld2RepositorySnapshotExecutorCounterForTests();
  resetWorld2RepositorySnapshotModuleForTests();
}
