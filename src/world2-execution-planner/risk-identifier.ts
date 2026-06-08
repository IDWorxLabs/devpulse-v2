/**
 * Risk identifier — identifies planning risks from input and stages.
 * Planning only. No execution.
 */

import type { ExecutionStage, PlannerInput, PlannerRiskLevel, RiskItem } from './types.js';
import { analyzeProjectGoal } from './project-goal-analyzer.js';

let riskCounter = 0;

export function resetRiskCounterForTests(): void {
  riskCounter = 0;
}

function createRiskId(): string {
  riskCounter += 1;
  return `world2-risk-${riskCounter.toString().padStart(4, '0')}`;
}

function constraintRiskLevel(index: number, total: number): PlannerRiskLevel {
  if (total >= 5) return index === 0 ? 'CRITICAL' : 'HIGH';
  if (total >= 3) return index === 0 ? 'HIGH' : 'MEDIUM';
  return index === 0 ? 'MEDIUM' : 'LOW';
}

export function identifyRisks(input: PlannerInput, stages: ExecutionStage[]): RiskItem[] {
  const analysis = analyzeProjectGoal(input);
  const risks: RiskItem[] = [];

  risks.push({
    riskId: createRiskId(),
    riskLevel: analysis.complexityScore >= 5 ? 'HIGH' : 'MEDIUM',
    description: `Project complexity for ${analysis.normalizedType} type`,
    mitigation: 'Follow staged execution plan with governance checkpoints',
  });

  input.constraints.forEach((constraint, index) => {
    risks.push({
      riskId: createRiskId(),
      riskLevel: constraintRiskLevel(index, input.constraints.length),
      description: `Constraint: ${constraint}`,
      mitigation: 'Validate constraint at verification point before proceeding',
    });
  });

  if (stages.some((s) => s.stageType === 'IMPLEMENTATION')) {
    risks.push({
      riskId: createRiskId(),
      riskLevel: 'LOW',
      description: 'Implementation scope creep without verification gates',
      mitigation: 'Enforce verification points before stabilization',
    });
  }

  if (input.requirements.length === 0) {
    risks.push({
      riskId: createRiskId(),
      riskLevel: 'CRITICAL',
      description: 'No requirements defined — plan may be incomplete',
      mitigation: 'Complete discovery phase before architecture',
    });
  }

  return risks;
}

export function riskOutputKey(risks: RiskItem[]): string {
  return risks.map((r) => `${r.riskId}|${r.riskLevel}|${r.description.length}`).join(';');
}
