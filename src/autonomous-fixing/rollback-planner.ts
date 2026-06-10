/**
 * Autonomous Fixing — rollback planning (no execution).
 */

import type { FailureCategory, FixPlanInput, RollbackPlan } from './autonomous-fixing-types.js';
import type { RootCauseAnalysis } from './autonomous-fixing-types.js';

export function buildRollbackPlan(
  input: FixPlanInput,
  category: FailureCategory,
  rootCause: RootCauseAnalysis,
  riskScore: number,
): RollbackPlan {
  const reasoning: string[] = [];

  if (riskScore < 50 && !input.criticalSubsystem && category !== 'WORLD2') {
    return {
      rollbackRequired: false,
      scope: 'NONE',
      confidence: 80,
      risk: 10,
      reasoning: ['Risk acceptable — rollback not required'],
    };
  }

  if (category === 'WORLD2' || input.world2Active) {
    reasoning.push('World 2 workspace rollback may be required');
    return {
      rollbackRequired: true,
      scope: 'WORLD2_WORKSPACE',
      confidence: 65,
      risk: 35,
      reasoning,
    };
  }

  if (input.blastRadius === 'PLATFORM' || rootCause.blastRadius === 'PLATFORM') {
    reasoning.push('Platform blast radius suggests release rollback');
    return {
      rollbackRequired: true,
      scope: 'RELEASE',
      confidence: 70,
      risk: 40,
      reasoning,
    };
  }

  if (input.criticalSubsystem || riskScore >= 75) {
    reasoning.push('Critical subsystem or high risk requires subsystem rollback');
    return {
      rollbackRequired: true,
      scope: 'SUBSYSTEM',
      confidence: 72,
      risk: 30,
      reasoning,
    };
  }

  reasoning.push('Localized rollback sufficient for contained failure');
  return {
    rollbackRequired: riskScore >= 55,
    scope: 'LOCALIZED',
    confidence: 68,
    risk: 20,
    reasoning,
  };
}
