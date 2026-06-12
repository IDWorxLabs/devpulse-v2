/**
 * World 2 Disposable Workspace Creator — creation plan and safety audit authority.
 * Models creation requests only — never creates workspaces, directories, or files.
 */

import { createHash } from 'node:crypto';
import { DEFAULT_SOURCE_PROJECT_ID } from '../world2-disposable-workspace/world2-disposable-workspace-registry.js';
import {
  assessWorld2InstantiationGovernance,
  resetWorld2InstantiationGovernanceModuleForTests,
} from '../world2-workspace-instantiation-governance/index.js';
import type { World2InstantiationGovernanceAssessment } from '../world2-workspace-instantiation-governance/world2-workspace-instantiation-governance-types.js';
import {
  MAX_CREATION_ARTIFACTS,
  MAX_CREATION_ATTEMPTS,
  MAX_CREATION_DIRECTORIES,
  MAX_CREATION_FILES,
  MAX_CREATION_TTL_MS,
  MAX_CREATOR_REASONS,
  MAX_ESTIMATED_SIZE_LABEL,
  WORLD2_CREATOR_CACHE_KEY_PREFIX,
  WORLD2_CREATOR_CORE_QUESTION,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_OWNER_MODULE,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PHASE,
  WORLD2_LIVE_PATH_PATTERNS,
  WORLD2_PRODUCTION_PATH_PATTERNS,
  resolvePlannedRoot,
} from './world2-disposable-workspace-creator-registry.js';
import {
  recordWorld2DisposableWorkspaceCreatorAssessment,
  resetWorld2DisposableWorkspaceCreatorHistoryForTests,
} from './world2-disposable-workspace-creator-history.js';
import { buildWorld2DisposableWorkspaceCreatorReportMarkdown } from './world2-disposable-workspace-creator-report-builder.js';
import type {
  AssessWorld2DisposableWorkspaceCreatorInput,
  CreationStateContext,
  World2CreationSafetyAudit,
  World2CreationState,
  World2CreatorInputSnapshot,
  World2DisposableWorkspaceCreationPlan,
  World2DisposableWorkspaceCreatorAssessment,
  World2DisposableWorkspaceCreatorReport,
  World2DisposalPolicy,
} from './world2-disposable-workspace-creator-types.js';

let creatorCounter = 0;
let planCounter = 0;

export function resetWorld2DisposableWorkspaceCreatorCounterForTests(): void {
  creatorCounter = 0;
  planCounter = 0;
}

function nextCreatorAssessmentId(): string {
  creatorCounter += 1;
  return `world2-creator-assessment-${creatorCounter}`;
}

function nextCreationPlanId(): string {
  planCounter += 1;
  return `world2-creation-plan-${planCounter}`;
}

function stableCacheKey(creatorAssessmentId: string, state: World2CreationState): string {
  const digest = createHash('sha256')
    .update([WORLD2_DISPOSABLE_WORKSPACE_CREATOR_OWNER_MODULE, creatorAssessmentId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_CREATOR_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2DisposableWorkspaceCreatorInput,
): World2CreatorInputSnapshot {
  const instantiationGovernanceAssessment =
    input.instantiationGovernanceAssessment ?? assessWorld2InstantiationGovernance(input);

  const materializationAssessment =
    instantiationGovernanceAssessment.inputSnapshot.materializationAssessment;
  const disposableWorkspaceAssessment =
    instantiationGovernanceAssessment.inputSnapshot.disposableWorkspaceAssessment;
  const populationAssessment = materializationAssessment.inputSnapshot.populationAssessment;

  const missingAuthorities: string[] = dedupe([
    ...instantiationGovernanceAssessment.inputSnapshot.missingAuthorities,
    ...materializationAssessment.inputSnapshot.missingAuthorities,
    ...populationAssessment.inputSnapshot.missingAuthorities,
  ]);

  if (
    !instantiationGovernanceAssessment.governanceApproval &&
    (instantiationGovernanceAssessment.approvalState === 'APPROVED' ||
      instantiationGovernanceAssessment.approvalState === 'APPROVED_WITH_RESTRICTIONS')
  ) {
    missingAuthorities.push('world2-instantiation-governance-approval');
  }

  return {
    instantiationGovernanceAssessment,
    materializationAssessment,
    disposableWorkspaceAssessment,
    populationAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

function pathMatchesPatterns(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

function allPaths(snapshot: World2CreatorInputSnapshot): string[] {
  const blueprint = snapshot.materializationAssessment.blueprint;
  const contract = snapshot.populationAssessment.populationContract;
  return dedupe([
    ...(blueprint?.directories.map((d) => d.path) ?? []),
    ...(blueprint?.files.map((f) => f.path) ?? []),
    ...(blueprint?.artifacts.map((a) => a.path).filter((p): p is string => p !== null) ?? []),
    ...(contract?.requiredDirectories ?? []),
    ...(contract?.requiredFiles ?? []),
  ]);
}

export function performWorld2CreationSafetyAudit(
  snapshot: World2CreatorInputSnapshot,
): World2CreationSafetyAudit {
  const governance = snapshot.instantiationGovernanceAssessment;
  const materialization = snapshot.materializationAssessment;
  const disposable = snapshot.disposableWorkspaceAssessment;
  const population = snapshot.populationAssessment;
  const blueprint = materialization.blueprint;
  const paths = allPaths(snapshot);

  const failures: string[] = [];
  const warnings: string[] = [];

  const instantiationApproved =
    governance.approvalState === 'APPROVED' ||
    governance.approvalState === 'APPROVED_WITH_RESTRICTIONS';

  if (!instantiationApproved) {
    failures.push('Instantiation not approved.');
  }

  const livePaths = paths.filter((p) => pathMatchesPatterns(p, WORLD2_LIVE_PATH_PATTERNS));
  const productionPaths = paths.filter((p) => pathMatchesPatterns(p, WORLD2_PRODUCTION_PATH_PATTERNS));
  const disposableWorkspaceOnly = paths.every(
    (p) => p.startsWith('/world2/') || p.startsWith('world2/'),
  );

  if (livePaths.length > 0) {
    failures.push(`Live workspace path detected: ${livePaths[0]}`);
  }
  if (productionPaths.length > 0) {
    failures.push(`Production path detected: ${productionPaths[0]}`);
  }
  if (!disposableWorkspaceOnly && paths.length > 0) {
    failures.push('Non-disposable workspace path detected.');
  }

  const rollbackAssetsPresent =
    (blueprint?.rollbackAssets.length ?? 0) > 0 ||
    (population.requiredRollbackAssets.length ?? 0) > 0;
  const validationAssetsPresent =
    (blueprint?.validationAssets.length ?? 0) > 0 ||
    (population.requiredValidationAssets.length ?? 0) > 0;

  if (!rollbackAssetsPresent) failures.push('Rollback assets missing.');
  if (!validationAssetsPresent) failures.push('Validation assets missing.');

  const disposalPolicyPresent =
    disposable.workspaceContract?.disposalRequired === true &&
    population.populationContract !== null;

  if (!disposalPolicyPresent) failures.push('Disposal policy missing.');

  const expirationPolicyPresent =
    governance.governanceApproval?.expirationPolicy.maxApprovalDurationMs !== undefined &&
    governance.governanceApproval.expirationPolicy.maxInstantiationAttempts > 0;

  if (!expirationPolicyPresent) {
    failures.push('Expiration policy missing.');
  }

  if (materialization.forbiddenPathAnalysis.length > 0) {
    for (const path of materialization.forbiddenPathAnalysis.slice(0, 3)) {
      failures.push(`Forbidden path in materialization: ${path}`);
    }
  }

  if (governance.approvalState === 'APPROVED_WITH_RESTRICTIONS') {
    warnings.push('Instantiation approved with restrictions.');
  }
  if (materialization.materializationState === 'READY_WITH_WARNINGS') {
    warnings.push('Materialization ready with warnings.');
  }

  const passed = failures.length === 0;

  return {
    readOnly: true,
    passed,
    instantiationApproved,
    disposableWorkspaceOnly: disposableWorkspaceOnly || paths.length === 0,
    noLiveWorkspacePath: livePaths.length === 0,
    noProductionPath: productionPaths.length === 0,
    rollbackAssetsPresent,
    validationAssetsPresent,
    disposalPolicyPresent,
    expirationPolicyPresent,
    failures: dedupe(failures).slice(0, MAX_CREATOR_REASONS),
    warnings: dedupe(warnings).slice(0, MAX_CREATOR_REASONS),
  };
}

export function deriveCreationState(context: CreationStateContext): World2CreationState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration') ||
    context.missingAuthorities.includes('world2-instantiation-governance-approval')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.instantiationState === 'INSUFFICIENT_EVIDENCE' ||
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.disposableWorkspaceState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.instantiationState === 'BLOCKED' ||
    context.materializationState === 'BLOCKED' ||
    context.disposableWorkspaceState === 'BLOCKED' ||
    !context.safetyAuditPassed ||
    context.criticalSafetyFailures > 0
  ) {
    return 'CREATION_BLOCKED';
  }

  if (
    context.instantiationState === 'APPROVED' &&
    context.materializationState === 'READY' &&
    context.disposableWorkspaceState === 'READY' &&
    context.safetyAuditPassed &&
    context.hasGovernanceApproval &&
    context.hasBlueprint
  ) {
    return 'CREATION_READY';
  }

  if (
    (context.instantiationState === 'APPROVED_WITH_RESTRICTIONS' ||
      context.materializationState === 'READY_WITH_WARNINGS') &&
    context.safetyAuditPassed &&
    context.criticalSafetyFailures === 0
  ) {
    return 'CREATION_READY_WITH_RESTRICTIONS';
  }

  if (
    context.instantiationState === 'NOT_READY' ||
    context.materializationState === 'NOT_READY' ||
    context.disposableWorkspaceState === 'NOT_CREATED' ||
    !context.hasBlueprint ||
    !context.hasGovernanceApproval
  ) {
    return 'NOT_READY';
  }

  return 'CREATION_BLOCKED';
}

function buildDisposalPolicy(snapshot: World2CreatorInputSnapshot): World2DisposalPolicy {
  const contract = snapshot.disposableWorkspaceAssessment.workspaceContract;
  const plan = snapshot.populationAssessment.inputSnapshot.plan;

  return {
    readOnly: true,
    disposalRequired: contract?.disposalRequired === true,
    disposalTrigger: plan?.rollbackPlan.rollbackTrigger ?? 'Session complete or rollback invoked',
    disposalMethod: 'Remove disposable workspace root and invalidate creation plan',
    disposalSuccessCriteria:
      'No residual World 2 paths remain and live workspace boundary unchanged',
  };
}

function buildCreationBounds(
  snapshot: World2CreatorInputSnapshot,
  generatedAt: string,
): World2CreationBounds {
  const blueprint = snapshot.materializationAssessment.blueprint;
  const governance = snapshot.instantiationGovernanceAssessment.governanceApproval;
  const expirationTtlMs =
    governance?.expirationPolicy.maxApprovalDurationMs ?? MAX_CREATION_TTL_MS;
  const expirationTimestamp = new Date(Date.parse(generatedAt) + expirationTtlMs).toISOString();

  return {
    readOnly: true,
    maxDirectories: MAX_CREATION_DIRECTORIES,
    maxFiles: MAX_CREATION_FILES,
    maxArtifacts: MAX_CREATION_ARTIFACTS,
    maxEstimatedSize: blueprint?.estimatedWorkspaceSize ?? MAX_ESTIMATED_SIZE_LABEL,
    maxCreationAttempts:
      governance?.expirationPolicy.maxInstantiationAttempts ?? MAX_CREATION_ATTEMPTS,
    expirationTtlMs,
    expirationTimestamp,
  };
}

function buildCreationPlan(
  snapshot: World2CreatorInputSnapshot,
  creationState: World2CreationState,
  safetyAudit: World2CreationSafetyAudit,
): World2DisposableWorkspaceCreationPlan | null {
  const planEligible =
    creationState === 'CREATION_READY' || creationState === 'CREATION_READY_WITH_RESTRICTIONS';

  if (!planEligible) {
    return null;
  }

  const materialization = snapshot.materializationAssessment;
  const population = snapshot.populationAssessment;
  const blueprint = materialization.blueprint;
  const workspaceId = materialization.workspaceId;

  const plannedDirectories = dedupe([
    ...(blueprint?.directories.map((d) => d.path) ?? []),
    ...(population.populationContract?.requiredDirectories ?? []),
  ]).slice(0, MAX_CREATION_DIRECTORIES);

  const plannedFiles = dedupe([
    ...(blueprint?.files.map((f) => f.path) ?? []),
    ...(population.populationContract?.requiredFiles ?? []),
  ]).slice(0, MAX_CREATION_FILES);

  const plannedArtifacts = dedupe([
    ...(blueprint?.artifacts.map((a) => a.path).filter((p): p is string => p !== null) ?? []),
    ...(population.populationContract?.requiredArtifacts ?? []),
  ]).slice(0, MAX_CREATION_ARTIFACTS);

  const validationAssets = dedupe([
    ...(blueprint?.validationAssets ?? []),
    ...population.requiredValidationAssets,
  ]).slice(0, MAX_CREATOR_REASONS);

  const rollbackAssets = dedupe([
    ...(blueprint?.rollbackAssets ?? []),
    ...population.requiredRollbackAssets,
  ]).slice(0, MAX_CREATOR_REASONS);

  const generatedAt = new Date().toISOString();

  return {
    readOnly: true,
    creationPlanId: nextCreationPlanId(),
    workspaceId,
    blueprintId: blueprint?.blueprintId ?? null,
    sourceProjectId:
      snapshot.disposableWorkspaceAssessment.workspaceContract?.sourceProjectId ??
      DEFAULT_SOURCE_PROJECT_ID,
    plannedRoot: resolvePlannedRoot(workspaceId),
    plannedDirectories,
    plannedFiles,
    plannedArtifacts,
    validationAssets,
    rollbackAssets,
    disposalPolicy: buildDisposalPolicy(snapshot),
    creationBounds: buildCreationBounds(snapshot, generatedAt),
    safetyAudit,
  };
}

function buildCreationReasons(
  snapshot: World2CreatorInputSnapshot,
  creationState: World2CreationState,
  safetyAudit: World2CreationSafetyAudit,
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  const governance = snapshot.instantiationGovernanceAssessment;

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...governance.inputSnapshot.materializationAssessment.blockingReasons);
  blockingReasons.push(...governance.warningReasons);
  warningReasons.push(...snapshot.materializationAssessment.warningReasons);
  warningReasons.push(...snapshot.disposableWorkspaceAssessment.warningReasons);
  warningReasons.push(...snapshot.populationAssessment.warningReasons);
  warningReasons.push(...safetyAudit.warnings);

  blockingReasons.push(...safetyAudit.failures);

  if (creationState === 'CREATION_BLOCKED') {
    blockingReasons.push('Disposable workspace creation BLOCKED — approval is not creation.');
  }

  if (creationState === 'CREATION_READY_WITH_RESTRICTIONS') {
    warningReasons.push('Creation plan allowed with restrictions — elevated monitoring required.');
  }

  if (creationState === 'NOT_READY') {
    blockingReasons.push('Upstream chain not ready for disposable workspace creation planning.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_CREATOR_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_CREATOR_REASONS),
  };
}

export function assessWorld2DisposableWorkspaceCreator(
  input: AssessWorld2DisposableWorkspaceCreatorInput = {},
): World2DisposableWorkspaceCreatorAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const governance = inputSnapshot.instantiationGovernanceAssessment;
  const materialization = inputSnapshot.materializationAssessment;
  const disposable = inputSnapshot.disposableWorkspaceAssessment;
  const safetyAudit = performWorld2CreationSafetyAudit(inputSnapshot);

  const criticalSafetyFailures = safetyAudit.failures.length;

  const creationContext: CreationStateContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    instantiationState: governance.approvalState,
    materializationState: materialization.materializationState,
    disposableWorkspaceState: disposable.workspaceState,
    safetyAuditPassed: safetyAudit.passed,
    criticalSafetyFailures,
    hasGovernanceApproval: governance.governanceApproval !== null,
    hasBlueprint: materialization.blueprint !== null,
  };

  const creationState = deriveCreationState(creationContext);
  const reasons = buildCreationReasons(inputSnapshot, creationState, safetyAudit);
  const creatorAssessmentId = nextCreatorAssessmentId();

  const assessment: World2DisposableWorkspaceCreatorAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_CREATOR_CORE_QUESTION,
    creatorAssessmentId,
    workspaceId: materialization.workspaceId,
    creationState,
    inputSnapshot,
    creationPlan: buildCreationPlan(inputSnapshot, creationState, safetyAudit),
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(creatorAssessmentId, creationState),
  };

  recordWorld2DisposableWorkspaceCreatorAssessment(assessment);
  return assessment;
}

export function buildWorld2DisposableWorkspaceCreatorReport(
  assessment: World2DisposableWorkspaceCreatorAssessment,
  generatedAt = new Date().toISOString(),
): World2DisposableWorkspaceCreatorReport {
  return {
    generatedAt,
    phaseName: WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PHASE,
    purpose:
      'Represent and validate disposable workspace creation requests after instantiation governance approval — no real creation.',
    assessment,
    passToken: WORLD2_DISPOSABLE_WORKSPACE_CREATOR_PASS_TOKEN,
  };
}

export function buildWorld2DisposableWorkspaceCreatorArtifacts(
  input: AssessWorld2DisposableWorkspaceCreatorInput = {},
): {
  world2DisposableWorkspaceCreatorAssessment: World2DisposableWorkspaceCreatorAssessment;
  world2DisposableWorkspaceCreatorReportMarkdown: string;
} {
  const world2DisposableWorkspaceCreatorAssessment = assessWorld2DisposableWorkspaceCreator(input);
  const report = buildWorld2DisposableWorkspaceCreatorReport(
    world2DisposableWorkspaceCreatorAssessment,
  );
  return {
    world2DisposableWorkspaceCreatorAssessment,
    world2DisposableWorkspaceCreatorReportMarkdown:
      buildWorld2DisposableWorkspaceCreatorReportMarkdown(report),
  };
}

export function resetWorld2DisposableWorkspaceCreatorModuleForTests(): void {
  resetWorld2DisposableWorkspaceCreatorHistoryForTests();
  resetWorld2DisposableWorkspaceCreatorCounterForTests();
  resetWorld2InstantiationGovernanceModuleForTests();
}
