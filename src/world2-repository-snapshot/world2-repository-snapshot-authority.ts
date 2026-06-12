/**
 * World 2 Repository Snapshot — snapshot eligibility and scope authority.
 * Defines snapshot scope only — never copies repositories or reads live files.
 */

import { createHash } from 'node:crypto';
import { DEFAULT_SOURCE_PROJECT_ID } from '../world2-disposable-workspace/world2-disposable-workspace-registry.js';
import {
  assessWorld2DisposableWorkspaceInstantiator,
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests,
} from '../world2-disposable-workspace-instantiator/index.js';
import {
  MAX_SNAPSHOT_ATTEMPTS,
  MAX_SNAPSHOT_DIRECTORIES,
  MAX_SNAPSHOT_ESTIMATED_SIZE,
  MAX_SNAPSHOT_FILES,
  MAX_SNAPSHOT_REASONS,
  MAX_SNAPSHOT_SENSITIVE_MATCHES,
  WORLD2_BUILD_OUTPUT_EXCLUSIONS,
  WORLD2_CACHE_DIRECTORY_EXCLUSIONS,
  WORLD2_GIT_INTERNALS_EXCLUSIONS,
  WORLD2_GIT_METADATA_ONLY_PATHS,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_NODE_MODULES_EXCLUSION,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  WORLD2_REPOSITORY_SNAPSHOT_OWNER_MODULE,
  WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN,
  WORLD2_REPOSITORY_SNAPSHOT_PHASE,
  WORLD2_SECRETS_PATH_PATTERNS,
  WORLD2_SNAPSHOT_CACHE_KEY_PREFIX,
  WORLD2_SNAPSHOT_CORE_QUESTION,
  WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS,
  isGitMetadataOnlyPath,
  isUnboundedRootCopyPath,
  pathMatchesAnyExclusion,
  pathMatchesPatterns,
} from './world2-repository-snapshot-registry.js';
import {
  recordWorld2RepositorySnapshotAssessment,
  resetWorld2RepositorySnapshotHistoryForTests,
} from './world2-repository-snapshot-history.js';
import { buildWorld2RepositorySnapshotReportMarkdown } from './world2-repository-snapshot-report-builder.js';
import type {
  AssessWorld2RepositorySnapshotInput,
  SnapshotStateContext,
  World2RepositorySnapshotAssessment,
  World2RepositorySnapshotInputSnapshot,
  World2RepositorySnapshotReport,
  World2RepositorySnapshotScope,
  World2SnapshotBounds,
  World2SnapshotManifest,
  World2SnapshotManifestEntry,
  World2SnapshotSafetyCheck,
  World2SnapshotState,
} from './world2-repository-snapshot-types.js';

let snapshotCounter = 0;
let manifestCounter = 0;

export function resetWorld2RepositorySnapshotCounterForTests(): void {
  snapshotCounter = 0;
  manifestCounter = 0;
}

function nextSnapshotAssessmentId(): string {
  snapshotCounter += 1;
  return `world2-snapshot-assessment-${snapshotCounter}`;
}

function nextSnapshotId(): string {
  snapshotCounter += 1;
  return `world2-repository-snapshot-${snapshotCounter}`;
}

function nextManifestId(): string {
  manifestCounter += 1;
  return `world2-snapshot-manifest-${manifestCounter}`;
}

function stableCacheKey(snapshotAssessmentId: string, state: World2SnapshotState): string {
  const digest = createHash('sha256')
    .update([WORLD2_REPOSITORY_SNAPSHOT_OWNER_MODULE, snapshotAssessmentId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_SNAPSHOT_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2RepositorySnapshotInput,
): World2RepositorySnapshotInputSnapshot {
  const instantiatorAssessment =
    input.instantiatorAssessment ?? assessWorld2DisposableWorkspaceInstantiator(input);

  const creator = instantiatorAssessment.inputSnapshot.creatorAssessment;
  const materializationAssessment = instantiatorAssessment.inputSnapshot.materializationAssessment;
  const populationAssessment = creator.inputSnapshot.populationAssessment;
  const disposableWorkspaceAssessment = creator.inputSnapshot.disposableWorkspaceAssessment;

  const missingAuthorities: string[] = dedupe([
    ...instantiatorAssessment.inputSnapshot.creatorAssessment.inputSnapshot.missingAuthorities,
    ...(instantiatorAssessment.instantiationOperation === null &&
    instantiatorAssessment.resultState === 'INSTANTIATION_READY'
      ? ['world2-disposable-workspace-instantiation-operation']
      : []),
  ]);

  return {
    instantiatorAssessment,
    materializationAssessment,
    populationAssessment,
    disposableWorkspaceAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function collectCandidateIncludedPaths(snapshot: World2RepositorySnapshotInputSnapshot): string[] {
  const blueprint = snapshot.materializationAssessment.blueprint;
  const contract = snapshot.populationAssessment.populationContract;
  const operation = snapshot.instantiatorAssessment.instantiationOperation;

  return dedupe([
    ...(blueprint?.directories.map((d) => d.path) ?? []),
    ...(blueprint?.files.map((f) => f.path) ?? []),
    ...(contract?.requiredDirectories ?? []),
    ...(contract?.requiredFiles ?? []),
    ...(operation?.directoriesToCreate ?? []),
    ...(operation?.filesToPrepare ?? []),
  ]).slice(0, MAX_SNAPSHOT_FILES + MAX_SNAPSHOT_DIRECTORIES);
}

function detectSensitivePaths(paths: string[]): string[] {
  return paths.filter(
    (path) =>
      pathMatchesPatterns(path, WORLD2_SECRETS_PATH_PATTERNS) ||
      pathMatchesPatterns(path, WORLD2_LIVE_PATH_PATTERNS) ||
      pathMatchesPatterns(path, WORLD2_PRODUCTION_PATH_PATTERNS) ||
      path.includes('node_modules') ||
      (path.includes('.git/') && !isGitMetadataOnlyPath(path)),
  );
}

export function performWorld2SnapshotSafetyChecks(
  snapshot: World2RepositorySnapshotInputSnapshot,
  includedPaths: string[],
  excludedPaths: string[],
): World2SnapshotSafetyCheck[] {
  const liveMatches = includedPaths.filter((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS));
  const productionMatches = includedPaths.filter((p) =>
    pathMatchesPatterns(p, WORLD2_PRODUCTION_PATH_PATTERNS),
  );
  const secretMatches = includedPaths.filter((p) => pathMatchesPatterns(p, WORLD2_SECRETS_PATH_PATTERNS));
  const nodeModulesIncluded = includedPaths.some((p) => p.includes('node_modules'));
  const gitInternalsIncluded = includedPaths.some(
    (p) => p.includes('.git/') && !isGitMetadataOnlyPath(p),
  );
  const buildOutputsIncluded = includedPaths.some((p) =>
    pathMatchesAnyExclusion(p, WORLD2_BUILD_OUTPUT_EXCLUSIONS),
  );
  const cacheIncluded = includedPaths.some((p) =>
    pathMatchesAnyExclusion(p, WORLD2_CACHE_DIRECTORY_EXCLUSIONS),
  );
  const unboundedRoot = includedPaths.some((p) => isUnboundedRootCopyPath(p));
  const exclusionsPresent =
    excludedPaths.includes(WORLD2_NODE_MODULES_EXCLUSION) &&
    WORLD2_GIT_INTERNALS_EXCLUSIONS.every((rule) => excludedPaths.includes(rule));

  return [
    {
      readOnly: true,
      checkId: 'no-live-mutation-paths',
      label: 'No live mutation paths included',
      passed: liveMatches.length === 0,
      detail:
        liveMatches.length === 0
          ? 'No live mutation paths in snapshot scope.'
          : `Live path included: ${liveMatches[0]}`,
    },
    {
      readOnly: true,
      checkId: 'no-production-paths',
      label: 'No production paths included',
      passed: productionMatches.length === 0,
      detail:
        productionMatches.length === 0
          ? 'No production paths in snapshot scope.'
          : `Production path included: ${productionMatches[0]}`,
    },
    {
      readOnly: true,
      checkId: 'no-secrets-included',
      label: 'No secrets or env files included',
      passed: secretMatches.length === 0,
      detail:
        secretMatches.length === 0
          ? 'No secrets or env files in snapshot scope.'
          : `Secret path included: ${secretMatches[0]}`,
    },
    {
      readOnly: true,
      checkId: 'node-modules-excluded',
      label: 'node_modules excluded',
      passed: !nodeModulesIncluded && excludedPaths.includes(WORLD2_NODE_MODULES_EXCLUSION),
      detail: nodeModulesIncluded
        ? 'node_modules path included in snapshot scope.'
        : 'node_modules excluded from snapshot scope.',
    },
    {
      readOnly: true,
      checkId: 'git-internals-excluded',
      label: '.git internals excluded (metadata-only allowed)',
      passed: !gitInternalsIncluded,
      detail: gitInternalsIncluded
        ? '.git internals included without metadata-only marking.'
        : '.git internals excluded; metadata-only paths allowed.',
    },
    {
      readOnly: true,
      checkId: 'build-outputs-excluded',
      label: 'Build outputs excluded',
      passed: !buildOutputsIncluded,
      detail: buildOutputsIncluded
        ? 'Build output path included in snapshot scope.'
        : 'Build outputs excluded from snapshot scope.',
    },
    {
      readOnly: true,
      checkId: 'cache-directories-excluded',
      label: 'Cache directories excluded',
      passed: !cacheIncluded,
      detail: cacheIncluded
        ? 'Cache directory included in snapshot scope.'
        : 'Cache directories excluded from snapshot scope.',
    },
    {
      readOnly: true,
      checkId: 'no-unbounded-root-copy',
      label: 'No unbounded root copy',
      passed: !unboundedRoot,
      detail: unboundedRoot
        ? 'Unbounded root copy detected in snapshot scope.'
        : 'Snapshot scope is bounded — no unbounded root copy.',
    },
    {
      readOnly: true,
      checkId: 'no-external-network-copy',
      label: 'No external network copy',
      passed: true,
      detail: 'External network copy not performed — snapshot authority is scope-only.',
    },
    {
      readOnly: true,
      checkId: 'required-exclusions-present',
      label: 'Required exclusions present',
      passed: exclusionsPresent,
      detail: exclusionsPresent
        ? 'Standard snapshot exclusions present.'
        : 'Required snapshot exclusions missing.',
    },
  ];
}

export function deriveSnapshotState(context: SnapshotStateContext): World2SnapshotState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.instantiatorResultState === 'INSUFFICIENT_EVIDENCE' ||
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.populationState === 'INSUFFICIENT_EVIDENCE' ||
    context.disposableWorkspaceState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  const blockedBySafety =
    context.instantiatorResultState === 'INSTANTIATION_BLOCKED' ||
    context.materializationState === 'BLOCKED' ||
    context.populationState === 'BLOCKED' ||
    context.disposableWorkspaceState === 'BLOCKED' ||
    !context.hasInstantiationOperation ||
    !context.exclusionsPresent ||
    context.unboundedRootCopyDetected ||
    !context.safetyChecksPassed ||
    context.criticalSafetyFailures > 0;

  if (blockedBySafety) {
    return 'SNAPSHOT_BLOCKED';
  }

  if (
    context.instantiatorResultState === 'INSTANTIATION_READY' &&
    context.materializationState === 'READY' &&
    context.populationState === 'READY' &&
    context.disposableWorkspaceState === 'READY' &&
    context.safetyChecksPassed &&
    context.criticalSafetyFailures === 0
  ) {
    if (context.upstreamWarningStates || context.sensitivePathExcluded) {
      return 'SNAPSHOT_READY_WITH_RESTRICTIONS';
    }
    return 'SNAPSHOT_READY';
  }

  if (
    (context.instantiatorResultState === 'INSTANTIATION_SIMULATED' ||
      context.materializationState === 'READY_WITH_WARNINGS' ||
      context.populationState === 'READY_WITH_WARNINGS' ||
      context.disposableWorkspaceState === 'READY_WITH_WARNINGS') &&
    context.safetyChecksPassed &&
    context.criticalSafetyFailures === 0 &&
    context.hasInstantiationOperation
  ) {
    return 'SNAPSHOT_READY_WITH_RESTRICTIONS';
  }

  if (
    context.instantiatorResultState === 'NOT_READY' ||
    context.materializationState === 'NOT_READY' ||
    context.populationState === 'BLOCKED' ||
    context.disposableWorkspaceState === 'NOT_CREATED' ||
    !context.hasInstantiationOperation
  ) {
    return 'NOT_READY';
  }

  return 'SNAPSHOT_BLOCKED';
}

function buildSnapshotBounds(): World2SnapshotBounds {
  return {
    readOnly: true,
    maxFiles: MAX_SNAPSHOT_FILES,
    maxDirectories: MAX_SNAPSHOT_DIRECTORIES,
    maxEstimatedSize: MAX_SNAPSHOT_ESTIMATED_SIZE,
    maxSensitiveMatches: MAX_SNAPSHOT_SENSITIVE_MATCHES,
    maxSnapshotAttempts: MAX_SNAPSHOT_ATTEMPTS,
  };
}

function buildSnapshotManifest(
  snapshot: World2RepositorySnapshotInputSnapshot,
  includedPaths: string[],
  excludedPaths: string[],
): World2SnapshotManifest {
  const workspaceId = snapshot.instantiatorAssessment.workspaceId;
  const sourceProjectId =
    snapshot.disposableWorkspaceAssessment.workspaceContract?.sourceProjectId ??
    DEFAULT_SOURCE_PROJECT_ID;

  const entries: World2SnapshotManifestEntry[] = [];

  for (const path of includedPaths.slice(0, MAX_SNAPSHOT_FILES)) {
    entries.push({
      readOnly: true,
      path,
      kind: path.endsWith('/') ? 'DIRECTORY' : 'FILE',
      included: true,
      reason: 'Included in bounded snapshot scope',
    });
  }

  for (const path of excludedPaths.slice(0, MAX_SNAPSHOT_REASONS)) {
    entries.push({
      readOnly: true,
      path,
      kind: path.endsWith('/**') ? 'DIRECTORY' : 'FILE',
      included: false,
      reason: 'Standard snapshot exclusion',
    });
  }

  for (const meta of WORLD2_GIT_METADATA_ONLY_PATHS) {
    entries.push({
      readOnly: true,
      path: meta,
      kind: 'METADATA',
      included: false,
      reason: 'Git metadata-only path — not copied in this phase',
    });
  }

  return {
    readOnly: true,
    manifestId: nextManifestId(),
    workspaceId,
    sourceProjectId,
    entries,
    exclusionCount: excludedPaths.length,
    inclusionCount: includedPaths.length,
    repositoryCopyPerformed: false,
  };
}

function buildSnapshotScope(
  snapshot: World2RepositorySnapshotInputSnapshot,
  snapshotState: World2SnapshotState,
  safetyChecks: World2SnapshotSafetyCheck[],
): World2RepositorySnapshotScope | null {
  const scopeEligible =
    snapshotState === 'SNAPSHOT_READY' || snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS';

  if (!scopeEligible) {
    return null;
  }

  const blueprint = snapshot.materializationAssessment.blueprint;
  const contract = snapshot.populationAssessment.populationContract;
  const includedPaths = collectCandidateIncludedPaths(snapshot).filter(
    (path) => !detectSensitivePaths([path]).length && !isUnboundedRootCopyPath(path),
  );
  const excludedPaths = dedupe([...WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS]);

  const requiredDirectories = dedupe([
    ...(blueprint?.directories.map((d) => d.path) ?? []),
    ...(contract?.requiredDirectories ?? []),
  ]).slice(0, MAX_SNAPSHOT_DIRECTORIES);

  const requiredFiles = dedupe([
    ...(blueprint?.files.map((f) => f.path) ?? []),
    ...(contract?.requiredFiles ?? []),
  ]).slice(0, MAX_SNAPSHOT_FILES);

  const manifest = buildSnapshotManifest(snapshot, includedPaths, excludedPaths);

  return {
    readOnly: true,
    snapshotId: nextSnapshotId(),
    workspaceId: snapshot.instantiatorAssessment.workspaceId,
    sourceProjectId:
      snapshot.disposableWorkspaceAssessment.workspaceContract?.sourceProjectId ??
      DEFAULT_SOURCE_PROJECT_ID,
    includedPaths,
    excludedPaths,
    requiredFiles,
    requiredDirectories,
    snapshotManifest: manifest,
    snapshotBounds: buildSnapshotBounds(),
    safetyChecks,
  };
}

function buildSnapshotReasons(
  snapshot: World2RepositorySnapshotInputSnapshot,
  snapshotState: World2SnapshotState,
  safetyChecks: World2SnapshotSafetyCheck[],
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...snapshot.instantiatorAssessment.blockingReasons);
  warningReasons.push(...snapshot.instantiatorAssessment.warningReasons);
  warningReasons.push(...snapshot.materializationAssessment.warningReasons);
  warningReasons.push(...snapshot.populationAssessment.warningReasons);
  warningReasons.push(...snapshot.disposableWorkspaceAssessment.warningReasons);

  for (const check of safetyChecks) {
    if (!check.passed) {
      blockingReasons.push(`${check.label}: ${check.detail}`);
    }
  }

  if (snapshotState === 'SNAPSHOT_BLOCKED') {
    blockingReasons.push('Repository snapshot BLOCKED — instantiation eligibility is not copy permission.');
  }

  if (snapshotState === 'SNAPSHOT_READY_WITH_RESTRICTIONS') {
    warningReasons.push('Snapshot allowed with restrictions — sensitive paths excluded.');
  }

  if (snapshotState === 'SNAPSHOT_READY') {
    warningReasons.push('Snapshot scope defined only — no repository copy performed.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_SNAPSHOT_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_SNAPSHOT_REASONS),
  };
}

export function assessWorld2RepositorySnapshot(
  input: AssessWorld2RepositorySnapshotInput = {},
): World2RepositorySnapshotAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const includedPaths = collectCandidateIncludedPaths(inputSnapshot);
  const excludedPaths = dedupe([...WORLD2_STANDARD_SNAPSHOT_EXCLUSIONS]);
  const safetyChecks = performWorld2SnapshotSafetyChecks(
    inputSnapshot,
    includedPaths,
    excludedPaths,
  );
  const safetyChecksPassed = safetyChecks.every((check) => check.passed);
  const criticalSafetyFailures = safetyChecks.filter((check) => !check.passed).length;
  const sensitivePaths = detectSensitivePaths(includedPaths);
  const unboundedRootCopyDetected = includedPaths.some((p) => isUnboundedRootCopyPath(p));

  const upstreamWarningStates =
    inputSnapshot.instantiatorAssessment.resultState === 'INSTANTIATION_SIMULATED' ||
    inputSnapshot.materializationAssessment.materializationState === 'READY_WITH_WARNINGS' ||
    inputSnapshot.populationAssessment.readinessState === 'READY_WITH_WARNINGS' ||
    inputSnapshot.disposableWorkspaceAssessment.workspaceState === 'READY_WITH_WARNINGS';

  const stateContext: SnapshotStateContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    instantiatorResultState: inputSnapshot.instantiatorAssessment.resultState,
    materializationState: inputSnapshot.materializationAssessment.materializationState,
    populationState: inputSnapshot.populationAssessment.readinessState,
    disposableWorkspaceState: inputSnapshot.disposableWorkspaceAssessment.workspaceState,
    safetyChecksPassed,
    criticalSafetyFailures,
    hasInstantiationOperation: inputSnapshot.instantiatorAssessment.instantiationOperation !== null,
    upstreamWarningStates,
    sensitivePathExcluded: sensitivePaths.length > 0,
    exclusionsPresent:
      excludedPaths.includes(WORLD2_NODE_MODULES_EXCLUSION) &&
      WORLD2_GIT_INTERNALS_EXCLUSIONS.every((rule) => excludedPaths.includes(rule)),
    unboundedRootCopyDetected,
  };

  const snapshotState = deriveSnapshotState(stateContext);
  const reasons = buildSnapshotReasons(inputSnapshot, snapshotState, safetyChecks);
  const snapshotAssessmentId = nextSnapshotAssessmentId();

  const assessment: World2RepositorySnapshotAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_SNAPSHOT_CORE_QUESTION,
    snapshotAssessmentId,
    workspaceId: inputSnapshot.instantiatorAssessment.workspaceId,
    snapshotState,
    inputSnapshot,
    snapshotScope: buildSnapshotScope(inputSnapshot, snapshotState, safetyChecks),
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(snapshotAssessmentId, snapshotState),
  };

  recordWorld2RepositorySnapshotAssessment(assessment);
  return assessment;
}

export function buildWorld2RepositorySnapshotReport(
  assessment: World2RepositorySnapshotAssessment,
  generatedAt = new Date().toISOString(),
): World2RepositorySnapshotReport {
  return {
    generatedAt,
    phaseName: WORLD2_REPOSITORY_SNAPSHOT_PHASE,
    purpose:
      'Govern whether a disposable World 2 workspace may receive a read-only repository snapshot — no copy performed.',
    assessment,
    passToken: WORLD2_REPOSITORY_SNAPSHOT_PASS_TOKEN,
  };
}

export function buildWorld2RepositorySnapshotArtifacts(
  input: AssessWorld2RepositorySnapshotInput = {},
): {
  world2RepositorySnapshotAssessment: World2RepositorySnapshotAssessment;
  world2RepositorySnapshotReportMarkdown: string;
} {
  const world2RepositorySnapshotAssessment = assessWorld2RepositorySnapshot(input);
  const report = buildWorld2RepositorySnapshotReport(world2RepositorySnapshotAssessment);
  return {
    world2RepositorySnapshotAssessment,
    world2RepositorySnapshotReportMarkdown: buildWorld2RepositorySnapshotReportMarkdown(report),
  };
}

export function resetWorld2RepositorySnapshotModuleForTests(): void {
  resetWorld2RepositorySnapshotHistoryForTests();
  resetWorld2RepositorySnapshotCounterForTests();
  resetWorld2DisposableWorkspaceInstantiatorModuleForTests();
}
