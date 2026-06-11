/**
 * World 2 Execution Planner bridge — shared clarifying live gate.
 */

import type { ExecutionPlan, PlannerInput } from '../world2-execution-planner/types.js';
import { generateExecutionPlan } from '../world2-execution-planner/world2-execution-planner.js';
import { evaluateClarifyingLiveGate } from './clarifying-question-live-gate.js';
import type { ClarifyingLiveGateResult } from './clarifying-question-live-gate-types.js';

export interface World2PlanningGateResult {
  blocked: boolean;
  gate: ClarifyingLiveGateResult;
  plan?: ExecutionPlan;
}

export function evaluateWorld2PlanningGate(input: PlannerInput): ClarifyingLiveGateResult {
  return evaluateClarifyingLiveGate({
    userPrompt: [
      input.projectGoal,
      input.projectVision,
      input.projectType,
      ...input.requirements,
      ...input.constraints,
    ].join('\n'),
    projectId: input.projectId,
    requiresBuildIntent: true,
  });
}

export function generateExecutionPlanWithClarifyingGate(input: PlannerInput): World2PlanningGateResult {
  const gate = evaluateWorld2PlanningGate(input);
  if (gate.planningBlocked) {
    return { blocked: true, gate };
  }
  return { blocked: false, gate, plan: generateExecutionPlan(input) };
}
