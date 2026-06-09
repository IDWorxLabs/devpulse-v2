/**
 * Build task plan builder — assembles full planning artifact.
 */

import { buildExecutionRuntimePacket } from '../execution-runtime/execution-runtime.js';
import { parseBuildTaskRequest } from './build-task-request-parser.js';
import { resolveBuildTaskDependencies } from './build-task-dependency-resolver.js';
import { evaluateBuildTaskSafetyGates } from './build-task-safety-gates.js';
import { createBuildTaskVerificationPlan } from './build-task-verification-plan.js';
import { buildTaskSteps } from './build-task-step-model.js';
import type {
  BuildTaskConfidence,
  BuildTaskPlan,
  BuildTaskState,
} from './build-task-runtime-types.js';

let taskCounter = 0;

function nextTaskId(): string {
  taskCounter += 1;
  return `btask-${taskCounter.toString().padStart(4, '0')}`;
}

export function resetBuildTaskPlanCounterForTests(): void {
  taskCounter = 0;
}

function resolveBuildTaskState(
  blocked: boolean,
  gatesPassed: number,
  gatesRequired: number,
  readinessScore: number,
): BuildTaskState {
  if (blocked) return 'BLOCKED';
  if (gatesPassed < gatesRequired) return 'WAITING_APPROVAL';
  if (readinessScore >= 50 && !blocked) return 'READY_FOR_FUTURE_EXECUTION';
  return 'SIMULATION_ONLY';
}

function confidenceFromPlan(blocked: boolean, blockerCount: number, stepCount: number): BuildTaskConfidence {
  if (blocked || blockerCount > 6) return 'LOW';
  if (stepCount >= 5 && blockerCount <= 3) return 'HIGH';
  if (blockerCount <= 5) return 'MEDIUM';
  return 'LOW';
}

export function buildBuildTaskPlan(query: string): BuildTaskPlan {
  const request = parseBuildTaskRequest(query);
  const steps = buildTaskSteps(query);
  const dependencies = resolveBuildTaskDependencies(query);
  const safetyGates = evaluateBuildTaskSafetyGates(query);
  const verificationPlan = createBuildTaskVerificationPlan(query);
  const executionPacket = buildExecutionRuntimePacket(query);

  const executionReadiness = {
    ...executionPacket.readiness,
    executionAllowed: false as const,
  };
  executionPacket.readiness = executionReadiness;

  const blockers = [
    ...executionPacket.blockers,
    ...dependencies.filter((d) => !d.satisfied && d.required).map((d) => `Missing: ${d.name} — ${d.reason}`),
    ...safetyGates.filter((g) => g.required && !g.passed).map((g) => `Gate: ${g.name} — ${g.description}`),
    'Phase 14.2 Build Task Runtime — planning only, no execution',
  ];

  const blocked =
    blockers.length > 0 ||
    executionPacket.readiness.executionAllowed ||
    safetyGates.some((g) => g.name === 'gate-forbidden-pattern');

  const gatesPassed = safetyGates.filter((g) => g.passed).length;
  const gatesRequired = safetyGates.filter((g) => g.required).length;
  const state = resolveBuildTaskState(
    blocked,
    gatesPassed,
    gatesRequired,
    executionPacket.readiness.readinessScore,
  );

  const readinessLabel = `${executionPacket.readiness.readinessLevel} (${executionPacket.readiness.readinessScore}) — ${state}`;

  return {
    taskId: nextTaskId(),
    title: request.title,
    description: request.goal,
    goal: request.goal,
    sourceSystem: 'build_task_runtime',
    requestedOutcome: request.requestedOutcome,
    state,
    steps,
    dependencies,
    safetyGates,
    verificationPlan,
    executionPacketId: executionPacket.executionId,
    executionPacket,
    readiness: readinessLabel,
    blocked: blocked || state === 'BLOCKED',
    blockers,
    confidence: confidenceFromPlan(blocked, blockers.length, steps.length),
    rollbackConsiderations: verificationPlan.rollbackConsiderations,
    planningOnly: true,
  };
}
