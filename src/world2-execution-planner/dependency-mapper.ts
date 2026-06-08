/**
 * Dependency mapper — maps stage dependencies for execution plans.
 * Planning only. No execution.
 */

import type { ExecutionStage, PlannerInput, StageType } from './types.js';
import { STAGE_ORDER } from './types.js';
import { analyzeProjectGoal } from './project-goal-analyzer.js';

const STAGE_NAMES: Record<StageType, string> = {
  DISCOVERY: 'Discovery & Requirements',
  ARCHITECTURE: 'Architecture Design',
  IMPLEMENTATION: 'Implementation Planning',
  VERIFICATION: 'Verification Strategy',
  STABILIZATION: 'Stabilization & Hardening',
  COMPLETION: 'Completion & Handoff',
};

const STAGE_DESCRIPTIONS: Record<StageType, string> = {
  DISCOVERY: 'Analyze project goal, vision, requirements, and constraints',
  ARCHITECTURE: 'Define system architecture and component boundaries',
  IMPLEMENTATION: 'Plan implementation sequence without code generation',
  VERIFICATION: 'Define verification points and governance gates',
  STABILIZATION: 'Plan stabilization, rollback checkpoints, and risk mitigation',
  COMPLETION: 'Define completion criteria and workspace readiness',
};

function priorStages(stageType: StageType): StageType[] {
  const index = STAGE_ORDER.indexOf(stageType);
  return index <= 0 ? [] : STAGE_ORDER.slice(0, index);
}

export function mapExecutionStages(input: PlannerInput): ExecutionStage[] {
  const analysis = analyzeProjectGoal(input);

  return STAGE_ORDER.map((stageType, index) => ({
    stageOrder: index + 1,
    stageType,
    stageName: STAGE_NAMES[stageType],
    description: `${STAGE_DESCRIPTIONS[stageType]} (${analysis.normalizedType})`,
    dependsOn: priorStages(stageType),
  }));
}

export function dependencyMapKey(stages: ExecutionStage[]): string {
  return stages.map((s) => `${s.stageType}:${s.dependsOn.join('+')}`).join('|');
}

export function validateStageDependencies(stages: ExecutionStage[]): boolean {
  return stages.every((stage) =>
    stage.dependsOn.every((dep) => {
      const depStage = stages.find((s) => s.stageType === dep);
      return depStage !== undefined && depStage.stageOrder < stage.stageOrder;
    }),
  );
}
