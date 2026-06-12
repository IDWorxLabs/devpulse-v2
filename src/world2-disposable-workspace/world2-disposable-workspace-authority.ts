/**
 * World 2 Disposable Workspace — boundary and lifecycle authority.
 * Defines workspace eligibility only — never creates or mutates workspaces.
 */

import { createHash } from 'node:crypto';
import {
  assessWorld2ExecutionEngine,
  resetWorld2ExecutionEngineModuleForTests,
} from '../world2-execution-engine/index.js';
import type { World2ExecutionEngineAssessment } from '../world2-execution-engine/world2-execution-engine-types.js';
import type { World2ExecutionState } from '../world2-controlled-execution-runtime/world2-controlled-execution-runtime-types.js';
import type { World2ExecutionMode } from '../world2-execution-engine/world2-execution-engine-types.js';
import {
  evaluateDisposableWorkspaceFoundationBoundaries,
  WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER,
} from './world2-workspace-foundation-bridge.js';
import {
  DEFAULT_SOURCE_PROJECT_ID,
  MAX_DISPOSABLE_WORKSPACE_REASONS,
  WORLD2_ALLOWED_OPERATIONS,
  WORLD2_DISPOSABLE_CACHE_KEY_PREFIX,
  WORLD2_DISPOSABLE_CORE_QUESTION,
  WORLD2_DISPOSABLE_WORKSPACE_OWNER_MODULE,
  WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN,
  WORLD2_DISPOSABLE_WORKSPACE_PHASE,
  WORLD2_FORBIDDEN_OPERATIONS,
  WORLD2_FORBIDDEN_PATHS,
  resolveAllowedPaths,
} from './world2-disposable-workspace-registry.js';
import {
  recordWorld2DisposableWorkspaceAssessment,
  resetWorld2DisposableWorkspaceHistoryForTests,
} from './world2-disposable-workspace-history.js';
import { buildWorld2DisposableWorkspaceReportMarkdown } from './world2-disposable-workspace-report-builder.js';
import type {
  AssessWorld2DisposableWorkspaceInput,
  World2DisposableWorkspaceAssessment,
  World2DisposableWorkspaceContract,
  World2DisposableWorkspaceInputSnapshot,
  World2DisposableWorkspaceReport,
  World2IsolationMode,
  World2WorkspaceLifecycleAssessment,
  World2WorkspaceLifecycleDecision,
  World2WorkspaceState,
} from './world2-disposable-workspace-types.js';

let assessmentCounter = 0;

export function resetWorld2DisposableWorkspaceCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `world2-disposable-assessment-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, state: World2WorkspaceState): string {
  const digest = createHash('sha256')
    .update([WORLD2_DISPOSABLE_WORKSPACE_OWNER_MODULE, assessmentId, state].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${WORLD2_DISPOSABLE_CACHE_KEY_PREFIX}:${digest}`;
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
  input: AssessWorld2DisposableWorkspaceInput,
): World2DisposableWorkspaceInputSnapshot {
  const engineAssessment =
    input.engineAssessment ?? assessWorld2ExecutionEngine(input);

  const runtimeAssessment = engineAssessment.inputSnapshot.runtimeAssessment;
  const sandboxAssessment = engineAssessment.inputSnapshot.sandboxAssessment;

  const missingAuthorities: string[] = dedupe([
    ...engineAssessment.inputSnapshot.missingAuthorities,
    ...runtimeAssessment.inputSnapshot.missingAuthorities,
  ]);

  if (!runtimeAssessment.executionContract && runtimeAssessment.executionState === 'READY_FOR_WORLD2') {
    missingAuthorities.push('world2-execution-contract');
  }

  return {
    runtimeAssessment,
    engineAssessment,
    sandboxAssessment,
    missingAuthorities: dedupe(missingAuthorities),
  };
}

export interface World2WorkspaceEligibilityContext {
  runtimeState: World2ExecutionState;
  engineMode: World2ExecutionMode;
  missingAuthorities: string[];
  runtimeBlocked: boolean;
  engineBlocked: boolean;
  forbiddenPathsPresent: boolean;
  disposalRequired: boolean;
  validationRequired: boolean;
  liveMutationAllowed: boolean;
  foundationIsolationPassed: boolean;
  foundationOwnedBy: typeof WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER;
}

export function deriveWorld2IsolationMode(
  runtimeState: World2ExecutionState,
  engineMode: World2ExecutionMode,
): World2IsolationMode {
  if (runtimeState === 'READY_FOR_WORLD2' && engineMode === 'SANDBOX_EXECUTION_ELIGIBLE') {
    return 'DISPOSABLE_COPY_ELIGIBLE';
  }
  if (runtimeState === 'READY_WITH_RESTRICTIONS' && engineMode === 'SIMULATED_EXECUTION') {
    return 'SIMULATED_WORKSPACE';
  }
  if (engineMode === 'DRY_RUN') {
    return 'DRY_RUN_ONLY';
  }
  return 'BLOCKED';
}

export function deriveWorld2WorkspaceState(context: World2WorkspaceEligibilityContext): World2WorkspaceState {
  if (
    context.missingAuthorities.includes('execution-proof-evolution') ||
    context.missingAuthorities.includes('founder-acceptance-gate')
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  const boundaryInvalid =
    !context.forbiddenPathsPresent ||
    context.liveMutationAllowed ||
    !context.disposalRequired ||
    !context.validationRequired ||
    !context.foundationIsolationPassed;

  if (context.runtimeBlocked || context.engineBlocked || boundaryInvalid) {
    return 'BLOCKED';
  }

  if (
    context.runtimeState === 'READY_FOR_WORLD2' &&
    context.engineMode === 'SANDBOX_EXECUTION_ELIGIBLE'
  ) {
    return 'READY';
  }

  if (
    context.runtimeState === 'READY_WITH_RESTRICTIONS' &&
    context.engineMode === 'SIMULATED_EXECUTION'
  ) {
    return 'READY_WITH_WARNINGS';
  }

  if (context.engineMode === 'DRY_RUN') {
    return 'NOT_CREATED';
  }

  return 'BLOCKED';
}

export function deriveWorld2WorkspaceLifecycleDecision(
  workspaceState: World2WorkspaceState,
  snapshot: World2DisposableWorkspaceInputSnapshot,
): World2WorkspaceLifecycleAssessment {
  const reasons: string[] = [];
  const runtime = snapshot.runtimeAssessment;
  const engine = snapshot.engineAssessment;

  let decision: World2WorkspaceLifecycleDecision = 'DO_NOT_CREATE';

  if (workspaceState === 'READY') {
    decision = 'CREATE_ALLOWED';
    reasons.push('Runtime READY_FOR_WORLD2 and engine SANDBOX_EXECUTION_ELIGIBLE.');
    reasons.push('Disposable workspace boundary validated with disposal and validation required.');
  } else if (workspaceState === 'READY_WITH_WARNINGS') {
    decision = 'CREATE_WITH_RESTRICTIONS';
    reasons.push('Runtime READY_WITH_RESTRICTIONS — simulated workspace only.');
    reasons.push('Elevated monitoring required before any copy eligibility.');
  } else if (workspaceState === 'INSUFFICIENT_EVIDENCE') {
    decision = 'ESCALATE';
    reasons.push('Missing required upstream authority outputs.');
  } else if (workspaceState === 'BLOCKED') {
    decision = 'DO_NOT_CREATE';
    reasons.push('Workspace boundary blocked — do not create disposable workspace.');
  } else if (workspaceState === 'NOT_CREATED') {
    decision = 'DO_NOT_CREATE';
    reasons.push('Dry-run only — workspace not yet eligible for creation.');
  }

  if (runtime.terminationAssessment.decision === 'ESCALATE') {
    decision = 'ESCALATE';
    reasons.push('Runtime termination authority recommends ESCALATE.');
  }

  if (
    workspaceState === 'READY' ||
    workspaceState === 'READY_WITH_WARNINGS' ||
    engine.executionMode === 'SANDBOX_EXECUTION_ELIGIBLE' ||
    engine.executionMode === 'SIMULATED_EXECUTION'
  ) {
    reasons.push('Disposal required after World 2 session completes.');
  }

  if (decision === 'CREATE_ALLOWED' || decision === 'CREATE_WITH_RESTRICTIONS') {
    // disposal is always required for eligible workspaces
  }

  if (workspaceState === 'DISPOSED') {
    decision = 'DISPOSE_REQUIRED';
    reasons.push('Workspace lifecycle complete — disposal confirmed.');
  }

  return {
    readOnly: true,
    decision,
    reasons: dedupe(reasons).slice(0, MAX_DISPOSABLE_WORKSPACE_REASONS),
  };
}

function buildWorkspaceContract(
  workspaceId: string,
  workspaceState: World2WorkspaceState,
  isolationMode: World2IsolationMode,
  snapshot: World2DisposableWorkspaceInputSnapshot,
): World2DisposableWorkspaceContract | null {
  const contractEligible =
    workspaceState === 'READY' || workspaceState === 'READY_WITH_WARNINGS';

  if (!contractEligible) {
    return null;
  }

  const plan = snapshot.runtimeAssessment.inputSnapshot.plan;
  const rollbackReference =
    plan?.rollbackPlan.rollbackMethod ??
    snapshot.runtimeAssessment.executionContract?.rollbackRequirements[0] ??
    null;

  return {
    readOnly: true,
    workspaceId,
    sourceProjectId: DEFAULT_SOURCE_PROJECT_ID,
    isolationMode,
    allowedPaths: resolveAllowedPaths(workspaceId),
    forbiddenPaths: [...WORLD2_FORBIDDEN_PATHS],
    allowedOperations: [...WORLD2_ALLOWED_OPERATIONS],
    forbiddenOperations: [...WORLD2_FORBIDDEN_OPERATIONS],
    lifecycleState: workspaceState,
    disposalRequired: true,
    validationRequired: true,
    rollbackReference,
  };
}

function buildReasons(
  snapshot: World2DisposableWorkspaceInputSnapshot,
  workspaceState: World2WorkspaceState,
): { blockingReasons: string[]; warningReasons: string[] } {
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];
  const runtime = snapshot.runtimeAssessment;
  const engine = snapshot.engineAssessment;

  if (snapshot.missingAuthorities.length > 0) {
    blockingReasons.push('Missing required upstream authority outputs.');
    for (const missing of snapshot.missingAuthorities) {
      blockingReasons.push(`Missing authority: ${missing}`);
    }
  }

  blockingReasons.push(...runtime.blockingReasons);
  blockingReasons.push(...engine.blockers);
  warningReasons.push(...runtime.warningReasons);
  warningReasons.push(...engine.warnings);

  if (WORLD2_FORBIDDEN_PATHS.length === 0) {
    blockingReasons.push('Forbidden paths missing — workspace boundary invalid.');
  }

  if (workspaceState === 'READY') {
    warningReasons.push('Disposable workspace READY — World 1 live workspace remains protected.');
  }

  if (workspaceState === 'READY_WITH_WARNINGS') {
    warningReasons.push('Simulated workspace only — not disposable-copy eligible.');
  }

  if (workspaceState === 'BLOCKED') {
    blockingReasons.push('Disposable workspace boundary BLOCKED.');
  }

  return {
    blockingReasons: dedupe(blockingReasons).slice(0, MAX_DISPOSABLE_WORKSPACE_REASONS),
    warningReasons: dedupe(warningReasons).slice(0, MAX_DISPOSABLE_WORKSPACE_REASONS),
  };
}

export function assessWorld2DisposableWorkspace(
  input: AssessWorld2DisposableWorkspaceInput = {},
): World2DisposableWorkspaceAssessment {
  const inputSnapshot = resolveInputSnapshot(input);
  const runtime = inputSnapshot.runtimeAssessment;
  const engine = inputSnapshot.engineAssessment;

  const forbiddenPathsPresent = WORLD2_FORBIDDEN_PATHS.some((p) =>
    /live-devpulse|world1-project|production/i.test(p),
  );
  const liveMutationAllowed = !WORLD2_FORBIDDEN_OPERATIONS.some((op) =>
    /modify live DevPulse workspace|modify World 1 live project/i.test(op),
  );

  const disposalRequired = true;
  const validationRequired = true;

  const runtimeBlocked =
    runtime.executionState === 'BLOCKED' || runtime.executionState === 'INSUFFICIENT_EVIDENCE';
  const engineBlocked = engine.executionMode === 'BLOCKED';

  const isolationMode = deriveWorld2IsolationMode(runtime.executionState, engine.executionMode);

  const workspaceId = runtime.workspaceId ?? `world2-disposable-pending`;
  const foundationBoundaries = evaluateDisposableWorkspaceFoundationBoundaries(
    workspaceId,
    workspaceId,
  );

  const eligibilityContext: World2WorkspaceEligibilityContext = {
    runtimeState: runtime.executionState,
    engineMode: engine.executionMode,
    missingAuthorities: inputSnapshot.missingAuthorities,
    runtimeBlocked,
    engineBlocked,
    forbiddenPathsPresent,
    disposalRequired,
    validationRequired,
    liveMutationAllowed,
    foundationIsolationPassed: foundationBoundaries.isolated,
    foundationOwnedBy: WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER,
  };

  const workspaceState = deriveWorld2WorkspaceState(eligibilityContext);
  const lifecycleAssessment = deriveWorld2WorkspaceLifecycleDecision(workspaceState, inputSnapshot);
  const reasons = buildReasons(inputSnapshot, workspaceState);
  const assessmentId = nextAssessmentId();
  const resolvedWorkspaceId = runtime.workspaceId ?? `world2-disposable-${assessmentId}`;

  if (!foundationBoundaries.isolated) {
    reasons.blockingReasons.unshift(
      `Workspace isolation delegated to ${WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER} — boundary check failed.`,
    );
    for (const domain of foundationBoundaries.world1ViolationDomains.slice(0, 3)) {
      reasons.blockingReasons.push(`World 1 protected domain violation: ${domain}`);
    }
  }

  const assessment: World2DisposableWorkspaceAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: WORLD2_DISPOSABLE_CORE_QUESTION,
    assessmentId,
    workspaceState,
    isolationMode,
    inputSnapshot,
    workspaceContract: buildWorkspaceContract(
      resolvedWorkspaceId,
      workspaceState,
      isolationMode,
      inputSnapshot,
    ),
    lifecycleAssessment,
    blockingReasons: reasons.blockingReasons,
    warningReasons: reasons.warningReasons,
    cacheKey: stableCacheKey(assessmentId, workspaceState),
  };

  recordWorld2DisposableWorkspaceAssessment(assessment);
  return assessment;
}

export function buildWorld2DisposableWorkspaceReport(
  assessment: World2DisposableWorkspaceAssessment,
  generatedAt = new Date().toISOString(),
): World2DisposableWorkspaceReport {
  return {
    generatedAt,
    phaseName: WORLD2_DISPOSABLE_WORKSPACE_PHASE,
    purpose:
      'Define, validate, and govern disposable World 2 workspace boundaries before any real execution.',
    assessment,
    passToken: WORLD2_DISPOSABLE_WORKSPACE_PASS_TOKEN,
  };
}

export function buildWorld2DisposableWorkspaceArtifacts(
  input: AssessWorld2DisposableWorkspaceInput = {},
): {
  world2DisposableWorkspaceAssessment: World2DisposableWorkspaceAssessment;
  world2DisposableWorkspaceReportMarkdown: string;
} {
  const world2DisposableWorkspaceAssessment = assessWorld2DisposableWorkspace(input);
  const report = buildWorld2DisposableWorkspaceReport(world2DisposableWorkspaceAssessment);
  return {
    world2DisposableWorkspaceAssessment,
    world2DisposableWorkspaceReportMarkdown: buildWorld2DisposableWorkspaceReportMarkdown(report),
  };
}

export function resetWorld2DisposableWorkspaceModuleForTests(): void {
  resetWorld2DisposableWorkspaceHistoryForTests();
  resetWorld2DisposableWorkspaceCounterForTests();
  resetWorld2ExecutionEngineModuleForTests();
}
