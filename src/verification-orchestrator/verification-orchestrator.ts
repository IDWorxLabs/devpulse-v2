/**
 * Verification Orchestrator — Phase 16.9.
 * Coordinates verification execution planning — no provider execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { prepareVerificationRegistry, listVerificationOwners } from '../verification-registry/index.js';
import { publishVerificationOrchestratorFeedStages } from '../operator-feed/verification-orchestrator-feed-bridge.js';
import { resolveVerificationDependencies } from './verification-dependency-resolver.js';
import { scheduleVerificationExecution } from './verification-scheduler.js';
import { evaluateVerificationReadiness } from './verification-readiness-evaluator.js';
import { identifyParallelGroups } from './verification-parallelization-engine.js';
import { analyzeVerificationBlockers } from './verification-blocker-analyzer.js';
import { buildVerificationExecutionPlans } from './verification-plan-builder.js';
import {
  evaluateOrchestratorGates,
  validateVerificationOrchestration,
} from './verification-orchestrator-validator.js';
import {
  buildVerificationOrchestrationReport,
  composeVerificationOrchestrationResponse,
  deriveOrchestrationState,
  primaryPlanId,
} from './verification-orchestrator-report.js';
import {
  getVerificationOrchestratorDiagnostics,
  updateVerificationOrchestratorDiagnostics,
} from './verification-orchestrator-diagnostics.js';
import {
  isDuplicateVerificationOrchestratorQuestion,
  type PrepareVerificationOrchestrationInput,
  type PrepareVerificationOrchestrationResult,
  type VerificationOrchestrationReport,
} from './types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareVerificationOrchestrationInput> = {},
): PrepareVerificationOrchestrationInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('verification_orchestrator');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_verification_orchestrator',
    ...overrides,
  };
}

function blockedResult(
  query: string,
  reason: string,
  partial: Partial<VerificationOrchestrationReport> = {},
): PrepareVerificationOrchestrationResult {
  const report = buildVerificationOrchestrationReport({
    verificationPlanId: 'vplan-0000',
    orchestrationState: 'BLOCKED',
    verificationTargets: [],
    executionOrder: [],
    parallelGroups: [],
    blockedTargets: [],
    waitingTargets: [],
    readyTargets: [],
    warnings: [],
    blockedReasons: [reason],
    ...partial,
  });
  updateVerificationOrchestratorDiagnostics(query, 'BLOCKED', report.orchestrationId, 0, 0, 0, 0);
  publishVerificationOrchestratorFeedStages(query, false);
  return {
    orchestrationReport: report,
    diagnostics: getVerificationOrchestratorDiagnostics(),
    executionPlan: [],
    parallelGroups: [],
    blockedTargets: [],
    responseText: composeVerificationOrchestrationResponse(query, report),
  };
}

export function prepareVerificationOrchestration(
  input: PrepareVerificationOrchestrationInput,
): PrepareVerificationOrchestrationResult {
  const query = input.query ?? 'What should run first?';

  if (isDuplicateVerificationOrchestratorQuestion(query)) {
    return blockedResult(
      query,
      'Duplicate engine rejected — use verification_orchestrator extension only',
    );
  }

  const registry = prepareVerificationRegistry({
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: input.suppressRuntimeBootstrap,
  });

  const targets = registry.verificationTargets;
  const dependencies = registry.verificationDependencies;
  const owners = listVerificationOwners();

  const resolution = resolveVerificationDependencies(targets, dependencies);
  const schedule = scheduleVerificationExecution(targets, resolution);
  const satisfied = new Set(schedule.executionOrder.filter((_, i) => i < 3));
  const readiness = evaluateVerificationReadiness(
    targets.map((t) => t.verificationTargetId),
    resolution,
    satisfied,
  );
  const blockerAnalysis = analyzeVerificationBlockers(targets, owners, resolution, readiness);
  const parallelGroups = identifyParallelGroups(
    targets.map((t) => t.verificationTargetId),
    resolution,
    schedule.executionOrder,
  );
  const executionPlan = buildVerificationExecutionPlans(
    targets,
    dependencies,
    schedule.executionOrder,
    readiness.stateMap,
  );

  const gateReport = evaluateOrchestratorGates(input, {
    targetCount: targets.length,
    planCount: executionPlan.length,
    hasCycle: resolution.hasCycle,
  });

  const validation = validateVerificationOrchestration({
    gateReport,
    blockerAnalysis,
    resolution,
  });

  const valid = validation.valid && !resolution.hasCycle;
  const orchestrationState = deriveOrchestrationState(
    !valid,
    readiness.waitingTargets.length,
    readiness.readyTargets.length,
  );

  const report = buildVerificationOrchestrationReport({
    verificationPlanId: primaryPlanId(executionPlan),
    orchestrationState,
    verificationTargets: targets.map((t) => t.verificationTargetId),
    executionOrder: schedule.executionOrder,
    parallelGroups,
    blockedTargets: blockerAnalysis.blockedTargets,
    waitingTargets: blockerAnalysis.waitingTargets,
    readyTargets: readiness.readyTargets,
    warnings: validation.warnings,
    blockedReasons: valid ? [] : validation.blockers,
  });

  publishVerificationOrchestratorFeedStages(query, valid);
  updateVerificationOrchestratorDiagnostics(
    query,
    orchestrationState,
    report.orchestrationId,
    executionPlan.length,
    readiness.readyTargets.length,
    blockerAnalysis.blockedTargets.length,
    blockerAnalysis.waitingTargets.length,
  );

  return {
    orchestrationReport: report,
    diagnostics: getVerificationOrchestratorDiagnostics(),
    executionPlan,
    parallelGroups,
    blockedTargets: blockerAnalysis.blockedTargets,
    responseText: composeVerificationOrchestrationResponse(query, report),
  };
}

export function processVerificationOrchestratorRequest(
  query: string,
): PrepareVerificationOrchestrationResult {
  return prepareVerificationOrchestration(resolveInputFromQuery(query));
}

export function getVerificationOrchestratorContext(
  query: string,
): PrepareVerificationOrchestrationResult {
  return processVerificationOrchestratorRequest(query);
}
