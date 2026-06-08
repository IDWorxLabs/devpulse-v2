/**
 * Verification point builder — creates verification checkpoints for execution plans.
 * Planning only. No execution.
 */

import type { ExecutionStage, PlannerInput, VerificationPoint, VerificationPointType } from './types.js';

let pointCounter = 0;

export function resetVerificationCounterForTests(): void {
  pointCounter = 0;
}

function createPointId(): string {
  pointCounter += 1;
  return `world2-verify-${pointCounter.toString().padStart(4, '0')}`;
}

const STAGE_VERIFICATION_MAP: Partial<Record<ExecutionStage['stageType'], VerificationPointType>> = {
  DISCOVERY: 'requirementsSatisfied',
  ARCHITECTURE: 'dependencyValidated',
  IMPLEMENTATION: 'phaseComplete',
  VERIFICATION: 'governanceApproved',
};

export function buildVerificationPoints(
  input: PlannerInput,
  stages: ExecutionStage[],
): VerificationPoint[] {
  const points: VerificationPoint[] = [];

  for (const stage of stages) {
    const pointType = STAGE_VERIFICATION_MAP[stage.stageType];
    if (pointType) {
      points.push({
        pointId: createPointId(),
        pointType,
        stageType: stage.stageType,
        description: `Verify ${pointType} at ${stage.stageName} for ${input.projectId}`,
      });
    }
  }

  if (input.requirements.length > 0) {
    points.push({
      pointId: createPointId(),
      pointType: 'requirementsSatisfied',
      stageType: 'COMPLETION',
      description: `All ${input.requirements.length} requirements satisfied for ${input.projectId}`,
    });
  }

  points.push({
    pointId: createPointId(),
    pointType: 'governanceApproved',
    stageType: 'COMPLETION',
    description: 'Phase 6 governance stack approval required before any future execution',
  });

  return points;
}

export function verificationOutputKey(points: VerificationPoint[]): string {
  return points.map((p) => `${p.pointType}|${p.stageType}`).join(';');
}
