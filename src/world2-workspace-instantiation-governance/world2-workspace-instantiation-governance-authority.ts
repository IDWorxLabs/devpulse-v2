/**
 * World 2 Workspace Instantiation Governance — permission gate authority.
 * Authorizes or blocks instantiation only — never creates workspaces or files.
 */

import { createHash } from 'node:crypto';
import {
  assessWorld2WorkspaceMaterialization,
  resetWorld2WorkspaceMaterializationModuleForTests,
} from '../world2-workspace-materialization/index.js';
import type { World2WorkspaceMaterializationAssessment } from '../world2-workspace-materialization/world2-workspace-materialization-types.js';
import {
  MAX_INSTANTIATION_GOVERNANCE_REASONS,
  WORLD2_INSTANTIATION_CACHE_KEY_PREFIX,
  WORLD2_INSTANTIATION_CORE_QUESTION,
  WORLD2_INSTANTIATION_SAFETY_GUARANTEES,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_OWNER_MODULE,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN,
  WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PHASE,
  buildInstantiationExpirationPolicy,
} from './world2-workspace-instantiation-governance-registry.js';
import {
  recordWorld2InstantiationGovernanceAssessment,
  resetWorld2InstantiationGovernanceHistoryForTests,
} from './world2-workspace-instantiation-governance-history.js';
import { buildWorld2InstantiationGovernanceReportMarkdown } from './world2-workspace-instantiation-governance-report-builder.js';
import type {
  AssessWorld2InstantiationGovernanceInput,
  InstantiationApprovalContext,
  World2InstantiationApprovalState,
  World2InstantiationGovernanceApproval,
  World2InstantiationGovernanceAssessment,
  World2InstantiationGovernanceReport,
  World2InstantiationInputSnapshot,
} from './world2-workspace-instantiation-governance-types.js';

let governanceCounter = 0;
let approvalCounter = 0;

export function resetWorld2InstantiationGovernanceCounterForTests(): void {
  governanceCounter = 0;
  approvalCounter = 0;
}

function nextGovernanceId(): string {
  governanceCounter += 1;
  return `world2-instantiation-governance-${governanceCounter}`;
}

function nextApprovalId(): string {
  approvalCounter += 1;
  return `world2-instantiation-approval-${approvalCounter}`;
}

function stableCacheKey(governanceId: string, state: World2InstantiationApprovalState): string {
  const digest = createHash('sha256')
    .update([WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_OWNER_MODULE, governanceId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_INSTANTIATION_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2InstantiationGovernanceInput,
): World2InstantiationInputSnapshot {
  const materializationAssessment =
    input.materializationAssessment ?? assessWorld2WorkspaceMaterialization(input);

  const disposableWorkspaceAssessment =
    materializationAssessment.inputSnapshot.disposableWorkspaceAssessment;
  const changeSetAssessment = materializationAssessment.inputSnapshot.changeSetAssessment;
  const runtimeAssessment =
    changeSetAssessment.inputSnapshot.disposableWorkspaceAssessment.inputSnapshot
      .engineAssessment.inputSnapshot.runtimeAssessment;

  const missingAuthorities: string[] = dedupe([
    ...materializationAssessment.inputSnapshot.missingAuthorities,
    ...changeSetAssessment.inputSnapshot.missingAuthorities,
    ...runtimeAssessment.inputSnapshot.missingAuthorities,
  ]);

  if (!materializationAssessment.blueprint && materializationAssessment.materializationState === 'READY') {
    missingAuthorities.push('world2-workspace-blueprint');
  }

  return {
    materializationAssessment,
    disposableWorkspaceAssessment,
    changeSetAssessment,
    runtimeAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

export function deriveInstantiationApprovalState(
  context: InstantiationApprovalContext,
): World2InstantiationApprovalState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate') ||
    context.missingAuthorities.includes('founder-test-integration')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    context.materializationState === 'INSUFFICIENT_EVIDENCE' ||
    context.disposableWorkspaceState === 'INSUFFICIENT_EVIDENCE' ||
    context.changeSetState === 'INSUFFICIENT_EVIDENCE' ||
    context.runtimeState === 'INSUFFICIENT_EVIDENCE'
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  const blockedBySafety =
    context.forbiddenPathCount > 0 ||
    !context.validationAssetsPresent ||
    !context.rollbackAssetsPresent ||
    !context.disposalRequired ||
    context.criticalRisk ||
    context.materializationState === 'BLOCKED' ||
    context.disposableWorkspaceState === 'BLOCKED' ||
    context.changeSetState === 'BLOCKED' ||
    context.runtimeState === 'BLOCKED';

  if (blockedBySafety) {
    return 'BLOCKED';
  }

  if (
    context.materializationState === 'READY' &&
    context.disposableWorkspaceState === 'READY' &&
    context.changeSetState === 'READY' &&
    context.runtimeState === 'READY_FOR_WORLD2' &&
    context.hasBlueprint &&
    context.validationAssetsPresent &&
    context.rollbackAssetsPresent &&
    context.disposalRequired &&
    context.forbiddenPathCount === 0
  ) {
    return 'APPROVED';
  }

  if (
    context.materializationState === 'READY_WITH_WARNINGS' &&
    context.forbiddenPathCount === 0 &&
    context.validationAssetsPresent &&
    context.rollbackAssetsPresent
  ) {
    return 'APPROVED_WITH_RESTRICTIONS';
  }

  if (
    context.materializationState === 'NOT_READY' ||
    context.runtimeState === 'NOT_READY' ||
    !context.hasBlueprint
  ) {
    return 'NOT_READY';
  }

  return 'BLOCKED';
}

function buildGovernanceApproval(
  snapshot: World2InstantiationInputSnapshot,
  approvalState: World2InstantiationApprovalState,
  restrictions: string[],
  blockingReasons: string[],
): World2InstantiationGovernanceApproval | null {
  const approvalEligible =
    approvalState === 'APPROVED' || approvalState === 'APPROVED_WITH_RESTRICTIONS';

  if (!approvalEligible) {
    return null;
  }

  const blueprint = snapshot.materializationAssessment.blueprint;
  const workspaceId = snapshot.materializationAssessment.workspaceId;

  const requiredPreconditions = dedupe([
    'Blueprint must remain valid at instantiation time',
    'Disposable workspace boundary must remain active',
    'Change set must remain READY or restricted-eligible',
    'World 2 runtime must remain authorized',
    ...restrictions,
  ]).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS);

  const requiredPostconditions = dedupe([
    'Complete validation before marking workspace complete',
    'Execute rollback path on regression',
    'Dispose workspace after session per contract',
    'Record instantiation audit trail',
  ]).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS);

  return {
    readOnly: true,
    approvalId: nextApprovalId(),
    workspaceId,
    blueprintId: blueprint?.blueprintId ?? null,
    approvalState,
    restrictions: dedupe(restrictions).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS),
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS),
    requiredPreconditions,
    requiredPostconditions,
    safetyGuarantees: [...WORLD2_INSTANTIATION_SAFETY_GUARANTEES],
    expirationPolicy: {
      readOnly: true,
      ...buildInstantiationExpirationPolicy(),
    },
  };
}

function buildRestrictionsAndReasons(
  snapshot: World2InstantiationInputSnapshot,
  approvalState: World2InstantiationApprovalState,
): { restrictions: string[]; blockingReasons: string[]; warningReasons: string[] } {
  const restrictions: string[] = [];
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  const materialization = snapshot.materializationAssessment;
  const disposable = snapshot.disposableWorkspaceAssessment;
  const changeSet = snapshot.changeSetAssessment;
  const runtime = snapshot.runtimeAssessment;

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...materialization.blockingReasons);
  blockingReasons.push(...disposable.blockingReasons);
  blockingReasons.push(...changeSet.blockingReasons);
  blockingReasons.push(...runtime.blockingReasons);
  warningReasons.push(...materialization.warningReasons);
  warningReasons.push(...disposable.warningReasons);
  warningReasons.push(...changeSet.warningReasons);
  warningReasons.push(...runtime.warningReasons);

  if (materialization.forbiddenPathAnalysis.length > 0) {
    for (const path of materialization.forbiddenPathAnalysis) {
      blockingReasons.push(`Forbidden path blocks instantiation: ${path}`);
    }
  }

  const blueprint = materialization.blueprint;
  if (!blueprint || blueprint.validationAssets.length === 0) {
    blockingReasons.push('Validation assets missing from blueprint.');
  }
  if (!blueprint || blueprint.rollbackAssets.length === 0) {
    blockingReasons.push('Rollback assets missing from blueprint.');
  }

  const disposalRequired = disposable.workspaceContract?.disposalRequired === true;
  if (!disposalRequired) {
    blockingReasons.push('Disposal not required — instantiation blocked.');
  }

  if (approvalState === 'APPROVED_WITH_RESTRICTIONS') {
    restrictions.push('Elevated monitoring during workspace instantiation');
    restrictions.push('Simulated-only paths remain restricted until full validation');
    warningReasons.push('Instantiation approved with restrictions — not full sandbox eligibility.');
  }

  if (approvalState === 'APPROVED') {
    restrictions.push('Instantiation permitted only inside disposable World 2 boundary');
  }

  if (approvalState === 'BLOCKED') {
    blockingReasons.push('Workspace instantiation BLOCKED — blueprint is not permission to create.');
  }

  if (approvalState === 'NOT_READY') {
    blockingReasons.push('Blueprint or upstream chain not ready for instantiation governance.');
  }

  return {
    restrictions: dedupe(restrictions).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS),
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_INSTANTIATION_GOVERNANCE_REASONS),
  };
}

export function assessWorld2InstantiationGovernance(
  input: AssessWorld2InstantiationGovernanceInput = {},
): World2InstantiationGovernanceAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const materialization = inputSnapshot.materializationAssessment;
  const disposable = inputSnapshot.disposableWorkspaceAssessment;
  const changeSet = inputSnapshot.changeSetAssessment;
  const runtime = inputSnapshot.runtimeAssessment;
  const blueprint = materialization.blueprint;

  const planRisk = changeSet.changeSet?.riskLevel ?? runtime.riskLevel;
  const criticalRisk = planRisk === 'CRITICAL';

  const approvalContext: InstantiationApprovalContext = {
    missingAuthorities: inputSnapshot.missingAuthorities,
    materializationState: materialization.materializationState,
    disposableWorkspaceState: disposable.workspaceState,
    changeSetState: changeSet.eligibilityState,
    runtimeState: runtime.executionState,
    forbiddenPathCount: materialization.forbiddenPathAnalysis.length,
    validationAssetsPresent: (blueprint?.validationAssets.length ?? 0) > 0,
    rollbackAssetsPresent: (blueprint?.rollbackAssets.length ?? 0) > 0,
    disposalRequired: disposable.workspaceContract?.disposalRequired === true,
    criticalRisk,
    hasBlueprint: blueprint !== null,
  };

  const approvalState = deriveInstantiationApprovalState(approvalContext);
  const reasons = buildRestrictionsAndReasons(inputSnapshot, approvalState);
  const governanceId = nextGovernanceId();

  const assessment: World2InstantiationGovernanceAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_INSTANTIATION_CORE_QUESTION,
    governanceId,
    workspaceId: materialization.workspaceId,
    approvalState,
    inputSnapshot,
    governanceApproval: buildGovernanceApproval(
      inputSnapshot,
      approvalState,
      reasons.restrictions,
      reasons.blockingReasons,
    ),
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(governanceId, approvalState),
  };

  recordWorld2InstantiationGovernanceAssessment(assessment);
  return assessment;
}

export function buildWorld2InstantiationGovernanceReport(
  assessment: World2InstantiationGovernanceAssessment,
  generatedAt = new Date().toISOString(),
): World2InstantiationGovernanceReport {
  return {
    generatedAt,
    phaseName: WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PHASE,
    purpose:
      'Determine whether a virtual World 2 workspace blueprint may be instantiated as a real disposable workspace.',
    assessment,
    passToken: WORLD2_WORKSPACE_INSTANTIATION_GOVERNANCE_PASS_TOKEN,
  };
}

export function buildWorld2InstantiationGovernanceArtifacts(
  input: AssessWorld2InstantiationGovernanceInput = {},
): {
  world2InstantiationGovernanceAssessment: World2InstantiationGovernanceAssessment;
  world2InstantiationGovernanceReportMarkdown: string;
} {
  const world2InstantiationGovernanceAssessment = assessWorld2InstantiationGovernance(input);
  const report = buildWorld2InstantiationGovernanceReport(world2InstantiationGovernanceAssessment);
  return {
    world2InstantiationGovernanceAssessment,
    world2InstantiationGovernanceReportMarkdown:
      buildWorld2InstantiationGovernanceReportMarkdown(report),
  };
}

export function resetWorld2InstantiationGovernanceModuleForTests(): void {
  resetWorld2InstantiationGovernanceHistoryForTests();
  resetWorld2InstantiationGovernanceCounterForTests();
  resetWorld2WorkspaceMaterializationModuleForTests();
}
